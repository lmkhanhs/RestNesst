#!/usr/bin/env python3
"""Run the 79 specified cases and produce a traceable report from fresh Surefire XML only."""

import argparse
from collections import Counter
from datetime import datetime
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use Maven's local dependency cache only")
    args = parser.parse_args()
    backend = Path(__file__).resolve().parents[1]
    repo = backend.parent
    docs = repo / "docs/testing/backend"
    cases = {}
    for document in sorted(docs.glob("[0-9]*.md")):
        for case_id, title in re.findall(r"^### ((?:AUTH|HOST|BOOK)-(?:UT|IT)-\d{3}) — (.+)$", document.read_text(), re.M):
            if case_id in cases:
                raise ValueError(f"Duplicate specification ID: {case_id}")
            cases[case_id] = {"title": title, "document": document.name}
    implementations = {}
    for source in sorted((backend / "src/test/java").rglob("*.java")):
        for match in re.finditer(r'@Test(?P<tags>[^{};]*?)\s+void (?P<name>(?:AUTH|HOST|BOOK)_(?:UT|IT)_\d{3}\w*)\s*\(', source.read_text()):
            case_id = "-".join(match["name"].split("_")[:3])
            if case_id in implementations:
                raise ValueError(f"Duplicate implementation ID: {case_id}")
            implementations[case_id] = {
                "source": source.relative_to(repo).as_posix(), "method": match["name"],
                "proposal": 'Tag("proposal")' in match["tags"],
                "observation": 'Tag("observation")' in match["tags"],
            }
    if set(implementations) != set(cases):
        raise ValueError(f"Specification/code mismatch: missing={set(cases) - set(implementations)}, extra={set(implementations) - set(cases)}")

    target = backend / "target"
    target.mkdir(exist_ok=True)
    log = target / "backend-spec-run.log"
    results = {}
    version_output = subprocess.run(["mvn", "-v"], cwd=backend, capture_output=True, text=True, check=False)
    versions = re.sub(r"\x1b\[[0-9;]*m", "", version_output.stdout)
    maven_version = next((line for line in versions.splitlines() if line.startswith("Apache Maven")), "Maven: unknown")
    java_version = next((line.split(",")[0] for line in versions.splitlines() if line.startswith("Java version:")), "Java: unknown")
    # A fresh directory prevents previous green runs being counted after compilation/startup failures.
    with tempfile.TemporaryDirectory(prefix="backend-spec-", dir=target) as reports:
        command = ["mvn"] + (["-o"] if args.offline else []) + [
            "-Pbackend-specs", f"-Dbackend.spec.reportsDirectory={reports}", "test"
        ]
        print("Running 79 specified cases; detailed log: " + str(log), flush=True)
        with log.open("w") as output:
            completed = subprocess.run(command, cwd=backend, stdout=output, stderr=subprocess.STDOUT, check=False)
        for report in sorted(Path(reports).glob("TEST-*.xml")):
            root = ET.parse(report).getroot()
            for case in root.findall("testcase"):
                match = re.match(r"((?:AUTH|HOST|BOOK)_(?:UT|IT)_\d{3})_", case.attrib["name"])
                if not match:
                    continue
                case_id = match[1].replace("_", "-")
                if case_id not in cases or case_id in results:
                    raise ValueError(f"Unexpected/duplicate execution ID: {case_id}")
                status = "Pass"
                detail = ""
                for kind, label in (("error", "Error"), ("failure", "Fail"), ("skipped", "Skipped")):
                    node = case.find(kind)
                    if node is not None:
                        status = label
                        detail = (node.attrib.get("message") or node.text or "").strip()
                        break
                # Keep useful diagnostics, not complete stack traces or fake fixture snapshots.
                detail = re.sub(r"\s+", " ", detail)[:250].replace("|", "\\|")
                results[case_id] = {"status": status, "detail": detail}
        # Keep raw evidence from this run in a stable, dedicated build directory.
        evidence = target / "backend-spec-reports"
        evidence.mkdir(exist_ok=True)
        for old in evidence.glob("TEST-*.xml"):
            old.unlink()
        for report in Path(reports).glob("TEST-*.xml"):
            (evidence / report.name).write_bytes(report.read_bytes())

    total = Counter(result["status"] for result in results.values())
    total["Not Run"] = len(cases) - len(results)
    unit_pass = sum("-UT-" in case_id and result["status"] == "Pass" for case_id, result in results.items())
    pending = {
        "AUTH-IT-009": "Q-A02: đã kiểm tra sai kiểu; chưa có Umax/Pmax để kiểm tra biên độ dài.",
        "HOST-IT-025": "Q-H08: đã chạy đồng thời và kiểm tra invariant; chưa có oracle thắng/thua, cần MySQL thật.",
        "BOOK-IT-018": "Q-B08: đã kiểm tra round-trip null/rỗng/tiếng Việt; chưa chốt bắt buộc và max length.",
        "BOOK-IT-020": "Q-B06: đã ghi nhận authenticated-only; chưa chốt role được phép đặt.",
    }
    observed_at = datetime.now(ZoneInfo("Asia/Bangkok")).strftime("%Y-%m-%d %H:%M:%S %Z")
    report = [
        "# Kết quả triển khai và chạy đặc tả backend", "", f"Lần chạy: **{observed_at}**.", "",
        f"Có code gắn ID: **{len(implementations)}/{len(cases)}**. Kết quả thực thi: "
        f"**{total['Pass']} Pass, {total['Fail']} Fail, {total['Error']} Error, {total['Skipped']} Skipped, {total['Not Run']} Not Run**.", "",
        f"Hoàn thành đúng mức kiểm thử trong đặc tả: **{unit_pass}/17 unit**. "
        "**0/62 integration được nghiệm thu đầy đủ trên MySQL/Redis thật**; kết quả integration dưới đây là bằng chứng một phần trên H2 và blacklist double.", "",
        "## Môi trường và cách tính", "",
        f"- Môi trường lần chạy: `{maven_version}`, `{java_version}`. Project giữ nguyên Java target 17; chỉ chứng minh trên JVM được ghi ở đây.",
        "- Unit: repository/password doubles, mapper thật khi đặc tả yêu cầu; xác minh chữ ký JWT thật.",
        "- Integration cục bộ: MockMvc qua SecurityFilterChain, CustomJwtDecoder, method security, controller/service/mapper thật, JPA và transaction thật; H2 in-memory riêng, BCrypt thật (cost 4), blacklist giả lập. Không nạp application.yml, seed startup hay kết nối DB/Redis dev.",
        "- Mỗi ID được tính một lần; nhiều biến thể trong một ID không làm tăng tổng 79. Một biến thể lỗi làm ca lỗi. Skipped có thể đã chạy một phần nhưng còn thiếu oracle/biên dữ liệu.",
        "- `proposal`: assertion dựa trên tiêu chí [ĐX]/Q chưa phê duyệt. Fail thể hiện lệch đề xuất, chưa phải kết luận Fail nghiệp vụ đã chốt. Các ca này chỉ chạy trong profile chủ động, không thuộc `mvn test` mặc định.",
        "- `observation`: chỉ ghi nhận hành vi/invariant hiện tại; chưa nghiệm thu chính sách còn mở. H2 không chứng minh SQL/locking/constraint MySQL hoặc Redis TTL/thất bại kết nối.",
        "- Error ở JWT filter ghi nhận exception thoát khỏi filter; MockMvc không chứng minh response 500 của servlet container thật.",
        "- Các số liệu này phản ánh lần chạy trên, không đồng nghĩa phần trăm hoàn thành tính năng backend.", "",
        "## Điểm cần xử lý sau lần chạy", "",
        "Đọc trạng thái từng ID bên dưới để biết điểm nào tái hiện trong lần chạy này. Những nhóm cần chú ý:", "",
        "- HOST-IT-004: kiểm tra việc caller gửi đơn cho user khác (Q-H02).",
        "- BOOK-IT-007..016, BOOK-IT-019 và BOOK-IT-023: validation ngày/giá, khả dụng, overlap, đồng thời, tài khoản khóa và retry; chính sách [ĐX]/Q cần xác nhận trước khi sửa nghiệp vụ.",
        "- AUTH-IT-012 / BOOK-IT-003: exception JWT invalid/refresh/blacklist có thể thoát khỏi filter; cần hợp đồng HTTP thống nhất (Q-G01).",
        "- AUTH-IT-014 / HOST-IT-024 / BOOK-IT-022: phân biệt rollback dữ liệu với HTTP lỗi; BookingService hiện có @Transactional cấp class, không suy từ mô tả source cũ rằng thiếu transaction.",
        "- AUTH-IT-009, HOST-IT-025, BOOK-IT-018 và BOOK-IT-020 còn thiếu giới hạn/oracle dù đã có code kiểm tra một phần.", "",
        "## Theo chức năng", "", "| Chức năng | Có code | Pass | Fail | Error | Skipped | Not Run |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for prefix, title in (("AUTH", "Đăng nhập"), ("HOST", "Yêu cầu host"), ("BOOK", "Tạo booking")):
        ids = [case_id for case_id in cases if case_id.startswith(prefix)]
        counts = Counter(results.get(case_id, {"status": "Not Run"})["status"] for case_id in ids)
        report.append(f"| {title} | {len(ids)} | {counts['Pass']} | {counts['Fail']} | {counts['Error']} | {counts['Skipped']} | {counts['Not Run']} |")
    report.extend(["", "## Truy vết từng test case", "", "| ID / đặc tả | Kết quả chạy | Loại kỳ vọng | Code | Chi tiết |", "| --- | --- | --- | --- | --- |"])
    for case_id, spec in cases.items():
        implementation = implementations[case_id]
        result = results.get(case_id, {"status": "Not Run", "detail": "Không có kết quả XML trong lần chạy này"})
        if result["status"] == "Skipped" and case_id in pending:
            result = {**result, "detail": pending[case_id]}
        kind = "Unit" if "-UT-" in case_id else "proposal" if implementation["proposal"] else "observation" if implementation["observation"] else "[CODE]/hợp đồng"
        report.append(f"| [{case_id}]({spec['document']}) | {result['status']} | {kind} | [{implementation['method']}](../../../{implementation['source']}) | {result['detail']} |")
    report.extend(["", "## Chạy lại", "", "Từ repo gốc:", "", "```bash", "python3 airbnb_service/scripts/run_backend_specs.py --offline", "```", "",
                   "Bỏ `--offline` nếu cần Maven tải dependency. Script tự ghi báo cáo này từ XML mới và trả exit code Maven; kết quả Fail/Error vẫn làm lệnh thất bại. Log và XML nằm trong `airbnb_service/target/backend-spec-run.log` và `airbnb_service/target/backend-spec-reports/`.", "",
                   "Chỉ chạy ca đã có hợp đồng (bỏ `proposal` và `observation`):", "", "```bash", "cd airbnb_service", "mvn -Pbackend-specs -DexcludedGroups=proposal,observation test", "```", "",
                   "Lệnh Maven trực tiếp không cập nhật báo cáo Markdown. Các ca integration vẫn cần chạy lại trên MySQL/Redis cô lập trước nghiệm thu đầy đủ.", ""])
    (docs / "execution-results.md").write_text("\n".join(report))
    print(f"{len(results)}/{len(cases)} cases reported: " + ", ".join(f"{status}={total[status]}" for status in ("Pass", "Fail", "Error", "Skipped", "Not Run")))
    print("Report: " + str(docs / "execution-results.md"))
    return completed.returncode or (1 if total["Not Run"] else 0)


if __name__ == "__main__":
    sys.exit(main())
