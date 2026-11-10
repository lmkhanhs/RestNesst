# Skill của RestNesst

Các skill đang dùng nằm trong `skills/`:

| Skill | Khi dùng |
| --- | --- |
| `frontend-design` | Định hướng thẩm mỹ, bố cục và typography |
| `ui-ux-pro-max` | UX, responsive, accessibility và hướng dẫn theo stack |
| `design-system` | Token, theme và trạng thái component dùng chung |
| `qa-test-planner` | Lập test plan, test case thủ công, bộ regression và báo cáo lỗi |

Giữ MUI/Emotion và theme hiện tại theo `frontend/AGENTS.md`. Bản `ui-ux-pro-max` trong project được giữ nguyên; lần tinh giản này không sửa skill cấp người dùng ở `~/.codex/skills/`.

`qa-test-planner` được cài từ [jamesrochabrun/skills](https://github.com/jamesrochabrun/skills/tree/main/skills/qa-test-planner). Chức năng đối chiếu thiết kế Figma cần Figma MCP. Trước khi gọi script hoặc đọc reference của skill bên ngoài, kiểm tra file thực tế có trong gói cài đặt.

## Kho lưu trữ

`skill-archive/frontend-extra-skills-2026-11-08.tar.gz` chứa nguyên bản của năm skill đã đưa khỏi `skills/`: `banner-design`, `brand`, `design`, `slides`, `ui-styling`. Gói cũng chứa bản gốc của `design-system` trước khi thu gọn hướng dẫn. Các tài nguyên phụ trợ của `design-system` vẫn được giữ tại chỗ.

Gói nén không có entrypoint `SKILL.md` rời trong thư mục skill đang dùng. Một số quy trình cũ bên trong vẫn tham chiếu công cụ ngoài project; lưu trữ không có nghĩa là các quy trình đó đã chạy được.

Chạy từ repo gốc để xem nội dung:

```bash
tar -tzf .agents/skill-archive/frontend-extra-skills-2026-11-08.tar.gz
```

Khôi phục một skill, ví dụ `brand`:

```bash
tar -xzf .agents/skill-archive/frontend-extra-skills-2026-11-08.tar.gz -C .agents/skills brand
```

Thay `brand` bằng tên skill cần khôi phục. Khôi phục `design-system` sẽ ghi đè hướng dẫn đã tinh giản bằng bản gốc.
