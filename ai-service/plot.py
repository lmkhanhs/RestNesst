import json
from pathlib import Path

import matplotlib.pyplot as plt


def load_training_log(json_path="training_log.json"):
    """Đọc dữ liệu training log từ file JSON."""
    json_path = Path(json_path)

    with json_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def get_x_values(log, step_size=None):
    """
    Trả về giá trị trục X.

    Nếu step_size=None thì dùng epoch.
    Nếu step_size có giá trị, ví dụ 200, thì trục X sẽ là training step.
    """
    epochs = log["epoch"]

    if step_size is None:
        return epochs, "Epoch"

    steps = [epoch * step_size for epoch in epochs]
    return steps, "Training Step"


def plot_loss(log, x_values, x_label):
    """Vẽ biểu đồ Training Loss và Validation Loss."""
    plt.plot(x_values, log["train_loss"], marker="o", label="Training Loss")
    plt.plot(x_values, log["eval_loss"], marker="o", label="Validation Loss")

    plt.title("Training Loss and Validation Loss")
    plt.xlabel(x_label)
    plt.ylabel("Loss")
    plt.xticks(x_values)
    plt.grid(True)
    plt.legend()


def plot_rouge(log, x_values, x_label):
    """Vẽ biểu đồ ROUGE-1, ROUGE-2 và ROUGE-L."""
    plt.plot(x_values, log["rouge1"], marker="o", label="ROUGE-1")
    plt.plot(x_values, log["rouge2"], marker="o", label="ROUGE-2")
    plt.plot(x_values, log["rougeL"], marker="o", label="ROUGE-L")

    plt.title("ROUGE Scores during Training")
    plt.xlabel(x_label)
    plt.ylabel("Score")
    plt.xticks(x_values)
    plt.grid(True)
    plt.legend()


def find_best_rouge_index(log, metric="rougeL"):
    """Tìm vị trí có điểm ROUGE tốt nhất theo metric được chọn."""
    scores = log[metric]
    return max(range(len(scores)), key=lambda i: scores[i])


def plot_best_rouge(log, x_values, x_label, best_metric="rougeL"):
    """Vẽ biểu đồ cột các điểm ROUGE tốt nhất."""
    best_idx = find_best_rouge_index(log, best_metric)
    best_x = x_values[best_idx]

    rouge_names = ["ROUGE-1", "ROUGE-2", "ROUGE-L"]
    rouge_scores = [
        log["rouge1"][best_idx],
        log["rouge2"][best_idx],
        log["rougeL"][best_idx],
    ]

    plt.bar(rouge_names, rouge_scores)
    plt.title(f"Best ROUGE Scores at {x_label} {best_x}")
    plt.ylabel("Score")
    plt.ylim(0, 1)
    plt.grid(axis="y")

    for name, score in zip(rouge_names, rouge_scores):
        plt.text(name, score + 0.01, f"{score:.4f}", ha="center")


def save_current_figure(save_dir, file_name):
    """Lưu figure hiện tại nếu save_dir có giá trị."""
    if save_dir is not None:
        save_dir = Path(save_dir)
        save_dir.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_dir / file_name, dpi=300, bbox_inches="tight")


def plot_training_log(
    json_path="training_log.json",
    step_size=None,
    save_dir="plots",
    best_metric="rougeL",
):
    """
    Vẽ và xuất lần lượt 3 biểu đồ từ file training_log.json:
    1. Training Loss và Validation Loss
    2. ROUGE Scores during Training
    3. Best ROUGE Scores

    Args:
        json_path (str): Đường dẫn file JSON chứa log training.
        step_size (int | None): Nếu muốn vẽ theo Training Step thì truyền số step mỗi epoch.
                                Ví dụ: step_size=200.
                                Nếu None thì vẽ theo Epoch.
        save_dir (str | None): Thư mục lưu từng biểu đồ.
                               Nếu None thì chỉ hiển thị, không lưu ảnh.
        best_metric (str): Metric dùng để chọn checkpoint tốt nhất.
                           Mặc định là "rougeL".
    """
    log = load_training_log(json_path)
    x_values, x_label = get_x_values(log, step_size)

    plt.figure(figsize=(8, 5))
    plot_loss(log, x_values, x_label)
    plt.tight_layout()
    save_current_figure(save_dir, "01_loss.png")
    plt.show()

    plt.figure(figsize=(12, 5))
    plot_rouge(log, x_values, x_label)
    plt.tight_layout()
    save_current_figure(save_dir, "02_rouge_scores.png")
    plt.show()

    plt.figure(figsize=(8, 5))
    plot_best_rouge(log, x_values, x_label, best_metric)
    plt.tight_layout()
    save_current_figure(save_dir, "03_best_rouge.png")
    plt.show()


if __name__ == "__main__":
    # Vẽ và lưu lần lượt 3 hình vào thư mục plots.
    # Trục X hiển thị đủ 15 epochs.
    plot_training_log("training_log.json", save_dir="plots")

    # Nếu muốn vẽ theo training step, bỏ comment dòng dưới:
    # plot_training_log("training_log.json", step_size=200, save_dir="plots")

    # Nếu chỉ muốn hiển thị, không lưu ảnh:
    # plot_training_log("training_log.json", save_dir=None)
