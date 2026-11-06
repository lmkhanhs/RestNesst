# -*- coding: utf-8 -*-
"""
BARTpho Fine-tune bằng PyTorch thuần (KHÔNG dùng HuggingFace Trainer)
Mỗi bước được code tay để hiểu rõ quy trình bên trong.
"""

# ============================================================
# BƯỚC 1: IMPORT THƯ VIỆN
# ============================================================
import json
import os
import numpy as np
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from torch.cuda.amp import GradScaler, autocast
from transformers import (
    MBartForConditionalGeneration,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)
from rouge_score import rouge_scorer
from underthesea import word_tokenize

# ============================================================
# BƯỚC 2: CẤU HÌNH
# ============================================================
DATA_DIR = "/content/drive/MyDrive/BartPhoModel(23)"
TRAIN_PATH = os.path.join(DATA_DIR, "train.jsonl")
VALID_PATH = os.path.join(DATA_DIR, "valid.jsonl")
OUTPUT_DIR = os.path.join(DATA_DIR, "bartpho-manual-model")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Hyperparameters
MAX_ARTICLE_LEN = 512
MAX_SUMMARY_LEN = 160
BATCH_SIZE = 4
GRADIENT_ACCUMULATION = 2
LEARNING_RATE = 1e-5
NUM_EPOCHS = 20
WARMUP_RATIO = 0.2
MAX_GRAD_NORM = 1.0
NUM_BEAMS = 4

# ReduceLROnPlateau: tự giảm LR khi eval_loss không cải thiện
LR_REDUCE_FACTOR = 0.5    # Giảm LR còn 50%
LR_PATIENCE = 1           # Sau 1 epoch không cải thiện thì giảm
MIN_LR = 1e-6             # LR tối thiểu

# Early Stopping: dừng train khi eval_loss không cải thiện
EARLY_STOPPING_PATIENCE = 3  # Dừng sau 3 epoch không cải thiện

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {DEVICE}")

# ============================================================
# BƯỚC 3: ĐỌC VÀ LỌC DỮ LIỆU
# ============================================================
def load_jsonl(file_path):
    data = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                item = json.loads(line.strip())
                data.append({
                    "article": item["article"],
                    "summary": item["chosen"]
                })
    print(f"Đọc {len(data)} mẫu từ {file_path}")
    return data

def word_segment(text):
    # return " ".join(word_tokenize(text))
    return word_tokenize(text, format="text")

def soft_filter(data, min_article_words=80, min_summary_words=20):
    """Lọc mềm: bỏ mẫu quá ngắn, giữ lại nhiều dữ liệu nhất."""
    filtered = []
    for item in data:
        if len(item["article"].split()) >= min_article_words and \
           len(item["summary"].split()) >= min_summary_words:
            filtered.append(item)
    print(f"  Lọc mềm: {len(data)} → {len(filtered)} mẫu")
    return filtered

def preprocess_data(data):
    """Word segmentation 1 LẦN DUY NHẤT trước khi train (không lặp mỗi epoch)."""
    processed = []
    for i, item in enumerate(data):
        if (i + 1) % 500 == 0:
            print(f"  Word segment: {i+1}/{len(data)}")
        processed.append({
            "article": word_segment(item["article"]),
            "summary": word_segment(item["summary"]),
        })
    print(f"  Xong: {len(processed)} mẫu đã segment")
    return processed

# Đọc → Lọc → Word segment (1 lần duy nhất)
train_data = soft_filter(load_jsonl(TRAIN_PATH))
valid_data = soft_filter(load_jsonl(VALID_PATH))

print("\n🔄 Word segmentation train set...")
train_data = preprocess_data(train_data)
print("🔄 Word segmentation valid set...")
valid_data = preprocess_data(valid_data)

# ============================================================
# BƯỚC 4: TẠO PYTORCH DATASET (code tay)
# ============================================================
# Thay vì dùng HuggingFace datasets.Dataset, ta tự viết class Dataset
# kế thừa torch.utils.data.Dataset.

class SummarizationDataset(Dataset):
    """
    Custom PyTorch Dataset cho bài toán tóm tắt.
    Dữ liệu đã được word segment TRƯỚC KHI truyền vào (không lặp mỗi epoch).
    """
    def __init__(self, data, tokenizer, max_input_len, max_output_len):
        self.data = data  # Đã word segment sẵn
        self.tokenizer = tokenizer
        self.max_input_len = max_input_len
        self.max_output_len = max_output_len

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]

        # Dữ liệu đã segment sẵn, chỉ cần tokenize
        source = self.tokenizer(
            item["article"],
            max_length=self.max_input_len,
            truncation=True,
            padding="max_length",
            return_tensors="pt",
        )

        target = self.tokenizer(
            item["summary"],
            max_length=self.max_output_len,
            truncation=True,
            padding="max_length",
            return_tensors="pt",
        )

        labels = target["input_ids"].squeeze()
        labels[labels == self.tokenizer.pad_token_id] = -100

        return {
            "input_ids": source["input_ids"].squeeze(),
            "attention_mask": source["attention_mask"].squeeze(),
            "labels": labels,
        }

# ============================================================
# BƯỚC 5: LOAD MODEL VÀ TOKENIZER
# ============================================================
print("Loading BARTpho-word...")
model_name = "vinai/bartpho-word"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = MBartForConditionalGeneration.from_pretrained(model_name)
model = model.to(DEVICE)
print(f"Model parameters: {model.num_parameters():,}")

# ============================================================
# BƯỚC 6: TẠO DATALOADER (code tay)
# ============================================================
# DataLoader tự động chia dữ liệu thành batch, shuffle, v.v.

train_dataset = SummarizationDataset(train_data, tokenizer, MAX_ARTICLE_LEN, MAX_SUMMARY_LEN)
valid_dataset = SummarizationDataset(valid_data, tokenizer, MAX_ARTICLE_LEN, MAX_SUMMARY_LEN)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
valid_loader = DataLoader(valid_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

print(f"Train batches: {len(train_loader)}")
print(f"Valid batches: {len(valid_loader)}")

# ============================================================
# BƯỚC 7: OPTIMIZER VÀ SCHEDULER (code tay)
# ============================================================
# AdamW: optimizer chuẩn cho Transformer
# Linear warmup + decay: learning rate tăng dần rồi giảm dần

optimizer = AdamW(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=0.05,
    betas=(0.9, 0.999),
    eps=1e-8,
)

total_steps = (len(train_loader) // GRADIENT_ACCUMULATION) * NUM_EPOCHS
warmup_steps = int(total_steps * WARMUP_RATIO)

# Warmup scheduler cho giai đoạn đầu
warmup_scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=warmup_steps,
    num_training_steps=total_steps,
)

# ReduceLROnPlateau: tự giảm LR khi eval_loss không giảm
# Hoạt động SAU warmup phase
from torch.optim.lr_scheduler import ReduceLROnPlateau
plateau_scheduler = ReduceLROnPlateau(
    optimizer,
    mode="min",              # Theo dõi eval_loss (càng nhỏ càng tốt)
    factor=LR_REDUCE_FACTOR, # Nhân LR với 0.5 khi không cải thiện
    patience=LR_PATIENCE,    # Chờ 1 epoch trước khi giảm
    min_lr=MIN_LR,           # Không giảm dưới 1e-6
)

# FP16 Mixed Precision để tiết kiệm VRAM
scaler = GradScaler(enabled=torch.cuda.is_available())

print(f"Total steps: {total_steps}")
print(f"Warmup steps: {warmup_steps}")

# ============================================================
# BƯỚC 8: HÀM TÍNH ROUGE
# ============================================================
def compute_rouge(predictions, references):
    scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=False)
    scores = {"rouge1": [], "rouge2": [], "rougeL": []}

    for pred, ref in zip(predictions, references):
        if pred and ref:
            score = scorer.score(pred, ref)
            scores["rouge1"].append(score["rouge1"].fmeasure)
            scores["rouge2"].append(score["rouge2"].fmeasure)
            scores["rougeL"].append(score["rougeL"].fmeasure)

    return {k: np.mean(v) if v else 0.0 for k, v in scores.items()}

# ============================================================
# BƯỚC 9: VÒNG LẶP TRAINING (code tay - thay thế Trainer)
# ============================================================
# Đây là phần QUAN TRỌNG NHẤT - thay thế hoàn toàn Seq2SeqTrainer

history = {
    "epoch": [],
    "train_loss": [],
    "eval_loss": [],
    "rouge1": [],
    "rouge2": [],
    "rougeL": [],
}

best_eval_loss = float("inf")
early_stop_counter = 0  # Đếm số epoch liên tiếp không cải thiện

for epoch in range(1, NUM_EPOCHS + 1):
    # ==========================================
    # PHASE 1: TRAINING
    # ==========================================
    model.train()
    total_train_loss = 0.0
    optimizer.zero_grad()

    for step, batch in enumerate(train_loader):
        # Chuyển dữ liệu lên GPU
        input_ids = batch["input_ids"].to(DEVICE)
        attention_mask = batch["attention_mask"].to(DEVICE)
        labels = batch["labels"].to(DEVICE)

        # Forward pass với mixed precision (FP16)
        with autocast(enabled=torch.cuda.is_available()):
            # Model tự tính CrossEntropyLoss bên trong khi truyền labels
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels,
            )
            loss = outputs.loss / GRADIENT_ACCUMULATION

        # Backward pass
        scaler.scale(loss).backward()
        total_train_loss += loss.item() * GRADIENT_ACCUMULATION

        # Gradient accumulation: cập nhật trọng số sau mỗi N mini-batch
        if (step + 1) % GRADIENT_ACCUMULATION == 0:
            # Gradient clipping để tránh exploding gradient
            scaler.unscale_(optimizer)
            nn.utils.clip_grad_norm_(model.parameters(), MAX_GRAD_NORM)

            # Optimizer step: cập nhật trọng số W = W - lr * gradient
            scaler.step(optimizer)
            scaler.update()
            warmup_scheduler.step()  # Cập nhật warmup/linear decay
            optimizer.zero_grad()

        if (step + 1) % 50 == 0:
            print(f"  Epoch {epoch} | Step {step+1}/{len(train_loader)} | Loss: {loss.item() * GRADIENT_ACCUMULATION:.4f}")

    avg_train_loss = total_train_loss / len(train_loader)

    # ==========================================
    # PHASE 2: EVALUATION
    # ==========================================
    model.eval()
    total_eval_loss = 0.0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in valid_loader:
            input_ids = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)
            labels = batch["labels"].to(DEVICE)

            # Tính eval loss
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels,
            )
            total_eval_loss += outputs.loss.item()

            # Generate tóm tắt (beam search)
            generated_ids = model.generate(
                input_ids=input_ids,
                attention_mask=attention_mask,
                max_length=MAX_SUMMARY_LEN,
                num_beams=NUM_BEAMS,
                early_stopping=True,
                no_repeat_ngram_size=3,
            )

            # Decode tokens → text
            preds = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)
            label_ids = labels.clone()
            label_ids[label_ids == -100] = tokenizer.pad_token_id
            refs = tokenizer.batch_decode(label_ids, skip_special_tokens=True)

            all_preds.extend(preds)
            all_labels.extend(refs)

    avg_eval_loss = total_eval_loss / len(valid_loader)
    rouge_scores = compute_rouge(all_preds, all_labels)

    # Lưu kết quả epoch
    history["epoch"].append(epoch)
    history["train_loss"].append(avg_train_loss)
    history["eval_loss"].append(avg_eval_loss)
    history["rouge1"].append(rouge_scores["rouge1"])
    history["rouge2"].append(rouge_scores["rouge2"])
    history["rougeL"].append(rouge_scores["rougeL"])

    print(f"\n{'='*60}")
    print(f"Epoch {epoch}/{NUM_EPOCHS}")
    print(f"  Train Loss: {avg_train_loss:.4f}")
    print(f"  Eval Loss:  {avg_eval_loss:.4f}")
    print(f"  ROUGE-1:    {rouge_scores['rouge1']:.4f}")
    print(f"  ROUGE-2:    {rouge_scores['rouge2']:.4f}")
    print(f"  ROUGE-L:    {rouge_scores['rougeL']:.4f}")
    current_lr = optimizer.param_groups[0]["lr"]
    print(f"  LR:         {current_lr:.8f}")
    print(f"{'='*60}\n")

    # ==========================================
    # PHASE 3: ReduceLROnPlateau — tự giảm LR
    # ==========================================
    # Truyền eval_loss vào để scheduler quyết định có giảm LR không
    plateau_scheduler.step(avg_eval_loss)

    # ==========================================
    # PHASE 4: LƯU BEST MODEL + EARLY STOPPING
    # ==========================================
    if avg_eval_loss < best_eval_loss:
        best_eval_loss = avg_eval_loss
        early_stop_counter = 0  # Reset counter
        best_model_path = os.path.join(OUTPUT_DIR, "best_model")
        os.makedirs(best_model_path, exist_ok=True)
        model.save_pretrained(best_model_path)
        tokenizer.save_pretrained(best_model_path)
        print(f"✅ Saved best model (eval_loss={avg_eval_loss:.4f})")
    else:
        early_stop_counter += 1
        print(f"⚠️ eval_loss không cải thiện ({early_stop_counter}/{EARLY_STOPPING_PATIENCE})")

    # Lưu log mỗi epoch (an toàn khi Colab disconnect)
    with open(os.path.join(OUTPUT_DIR, "training_log.json"), "w") as f:
        json.dump(history, f, indent=2)

    # Early Stopping: dừng nếu eval_loss không cải thiện sau N epoch
    if early_stop_counter >= EARLY_STOPPING_PATIENCE:
        print(f"\n🛑 EARLY STOPPING: eval_loss không cải thiện sau {EARLY_STOPPING_PATIENCE} epoch liên tiếp.")
        print(f"   Best eval_loss: {best_eval_loss:.4f}")
        break

# ============================================================
# BƯỚC 10: LƯU FINAL MODEL
# ============================================================
# Best model = checkpoint tốt nhất theo eval_loss
# Final model = trạng thái model ở cuối quá trình train
final_model_path = os.path.join(OUTPUT_DIR, "final_model")
os.makedirs(final_model_path, exist_ok=True)
model.save_pretrained(final_model_path)
tokenizer.save_pretrained(final_model_path)
print(f"💾 Saved final model: {final_model_path}")

# ============================================================
# BƯỚC 11: VẼ BIỂU ĐỒ THEO EPOCH
# ============================================================
epochs = history["epoch"]

# Biểu đồ Loss
plt.figure(figsize=(10, 6))
plt.plot(epochs, history["train_loss"], label="Train Loss", marker="o")
plt.plot(epochs, history["eval_loss"], label="Eval Loss", marker="s")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.title("Training / Evaluation Loss")
plt.legend()
plt.grid(True)
plt.savefig(os.path.join(OUTPUT_DIR, "loss_curve.png"), dpi=150)
plt.show()

# Biểu đồ ROUGE
plt.figure(figsize=(10, 6))
plt.plot(epochs, history["rouge1"], label="ROUGE-1", marker="o")
plt.plot(epochs, history["rouge2"], label="ROUGE-2", marker="s")
plt.plot(epochs, history["rougeL"], label="ROUGE-L", marker="^")
plt.xlabel("Epoch")
plt.ylabel("ROUGE Score")
plt.title("Evaluation ROUGE")
plt.legend()
plt.grid(True)
plt.savefig(os.path.join(OUTPUT_DIR, "rouge_curve.png"), dpi=150)
plt.show()

# ============================================================
# BƯỚC 12: DEMO INFERENCE
# ============================================================
def summarize(text, model, tokenizer, max_length=128):
    """Tóm tắt văn bản bất kỳ."""
    segmented = word_segment(text)
    inputs = tokenizer(
        segmented, max_length=MAX_ARTICLE_LEN, truncation=True, return_tensors="pt"
    )
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=max_length,
            min_length=20,
            num_beams=NUM_BEAMS,
            early_stopping=True,
            no_repeat_ngram_size=3,
        )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# Load best model để demo
best_path = os.path.join(OUTPUT_DIR, "best_model")
if os.path.exists(best_path):
    print("\n🔍 DEMO TÓM TẮT:")
    demo_model = MBartForConditionalGeneration.from_pretrained(best_path).to(DEVICE)
    demo_model.eval()
    demo_tokenizer = AutoTokenizer.from_pretrained(best_path)

    # Test với 1 mẫu validation
    if valid_data:
        sample = valid_data[0]
        print(f"Bài gốc: {sample['article'][:500]}...")
        print(f"Tóm tắt gốc: {sample['summary']}")
        print(f"Tóm tắt model: {summarize(sample['article'], demo_model, demo_tokenizer)}")

print("\n✅ HOÀN THÀNH!")
print(f"📁 Best model: {os.path.join(OUTPUT_DIR, 'best_model')}")
print(f"📁 Final model: {final_model_path}")
