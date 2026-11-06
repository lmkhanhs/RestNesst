#!/usr/bin/env python3
"""Create original outline icons as local transparent PNGs and editable SVGs."""

import html
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / "airbnb_service/src/main/resources/static/uploads/amenities"
COLOR = "#222222"
STROKE = 1.65
SCALE = 512 / 24


def line(*points):
    return ("line", points)


def rect(x, y, width, height, radius=0):
    return ("rect", (x, y, width, height, radius))


def circle(x, y, radius):
    return ("circle", (x, y, radius))


ICONS = [
    ("air-conditioning", "Điều hòa", "Điều hòa giúp điều chỉnh nhiệt độ trong phòng.", [
        rect(3, 4, 18, 8, 2), line((6, 8), (18, 8)), line((7, 11), (17, 11)),
        line((7, 15), (7, 19), (5, 21)), line((12, 15), (12, 21)), line((17, 15), (17, 19), (19, 21)),
    ]),
    ("elevator", "Thang máy", "Thang máy phục vụ di chuyển giữa các tầng.", [
        rect(4, 7, 16, 14, 1.5), line((12, 8), (12, 20)),
        line((7, 4), (9, 2), (11, 4)), line((14, 2), (16, 4), (18, 2)),
        circle(8, 12, .8), line((8, 15), (8, 18)), circle(16, 12, .8), line((16, 15), (16, 18)),
    ]),
    ("hair-dryer", "Máy sấy tóc", "Máy sấy tóc dành cho khách lưu trú.", [
        circle(8, 8, 4), circle(8, 8, 1.3), line((12, 5), (21, 6), (21, 10), (12, 11)),
        line((7, 12), (8, 19), (12, 19), (11, 12)), line((10, 19), (10, 22), (17, 22)),
    ]),
    ("work-desk", "Bàn làm việc", "Bàn làm việc phù hợp sử dụng máy tính cá nhân.", [
        line((3, 13), (21, 13)), line((5, 13), (5, 21)), line((19, 13), (19, 21)),
        line((15, 13), (15, 17), (19, 17)), line((6, 10), (6, 7), (10, 3)),
        line((8, 3), (12, 3), (14, 7), (7, 7), (8, 3)), line((4, 10), (8, 10)),
    ]),
    ("fitness-center", "Phòng tập thể dục", "Khu tập luyện với thiết bị thể dục.", [
        rect(3, 7, 4, 10, 1), rect(17, 7, 4, 10, 1),
        line((7, 12), (17, 12)), line((1, 10), (1, 14)), line((23, 10), (23, 14)),
    ]),
    ("spa", "Spa", "Khu dịch vụ thư giãn và chăm sóc cơ thể.", [
        line((12, 17), (9, 13), (9, 8), (12, 3), (15, 8), (15, 13), (12, 17)),
        line((10, 18), (5, 17), (2, 13), (2, 8), (7, 10)),
        line((14, 18), (19, 17), (22, 13), (22, 8), (17, 10)),
        line((5, 21), (19, 21)),
    ]),
    ("reception-24h", "Lễ tân 24 giờ", "Quầy lễ tân hỗ trợ khách suốt 24 giờ.", [
        line((3, 18), (15, 18)), line((5, 16), (5, 13), (7, 10), (11, 10), (13, 13), (13, 16)),
        line((9, 10), (9, 7)), line((7, 7), (11, 7)), circle(18, 7, 4),
        line((18, 4.8), (18, 7), (20, 8)), line((4, 21), (14, 21)),
    ]),
    ("restaurant", "Nhà hàng", "Nhà hàng phục vụ ăn uống tại chỗ nghỉ.", [
        line((4, 3), (4, 8), (6, 11), (8, 8), (8, 3)), line((6, 3), (6, 21)),
        line((17, 3), (14, 8), (14, 13), (19, 13), (19, 3), (19, 21)),
    ]),
    ("airport-transfer", "Đưa đón sân bay", "Dịch vụ di chuyển giữa sân bay và chỗ nghỉ.", [
        line((3, 13), (10, 10), (10, 5), (12, 2), (14, 5), (14, 10), (21, 13),
             (21, 16), (14, 14), (14, 19), (17, 21), (17, 22), (12, 20),
             (7, 22), (7, 21), (10, 19), (10, 14), (3, 16), (3, 13)),
    ]),
    ("ev-charging", "Trạm sạc xe điện", "Điểm sạc dành cho phương tiện chạy điện.", [
        rect(3, 3, 11, 18, 1.5), rect(6, 6, 5, 5, .5),
        line((9, 13), (6.5, 16), (10.5, 16), (8, 19)),
        line((14, 8), (17, 8), (19, 10), (19, 17), (21, 17), (21, 6)),
        line((19, 3), (19, 6), (23, 6), (23, 3)),
    ]),
]


def svg_shape(shape):
    kind, values = shape
    if kind == "line":
        return '<polyline points="' + " ".join(f"{x},{y}" for x, y in values) + '"/>'
    if kind == "circle":
        x, y, radius = values
        return f'<circle cx="{x}" cy="{y}" r="{radius}"/>'
    x, y, width, height, radius = values
    return f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="{radius}"/>'


def render_png(shapes):
    image = Image.new("RGBA", (512, 512))
    draw = ImageDraw.Draw(image)
    width = round(STROKE * SCALE)
    for kind, values in shapes:
        if kind == "line":
            points = [(x * SCALE, y * SCALE) for x, y in values]
            draw.line(points, fill=COLOR, width=width, joint="curve")
            for x, y in points:
                radius = width / 2
                draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=COLOR)
        elif kind == "circle":
            x, y, radius = values
            draw.ellipse(((x-radius)*SCALE, (y-radius)*SCALE, (x+radius)*SCALE, (y+radius)*SCALE),
                         outline=COLOR, width=width)
        else:
            x, y, w, h, radius = values
            draw.rounded_rectangle((x*SCALE, y*SCALE, (x+w)*SCALE, (y+h)*SCALE),
                                   radius=radius*SCALE, outline=COLOR, width=width)
    return image.resize((128, 128), Image.Resampling.LANCZOS)


def main():
    DIRECTORY.mkdir(parents=True, exist_ok=True)
    records = []
    gallery = Image.new("RGB", (1000, 400), "white")
    canvas = ImageDraw.Draw(gallery)
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    for index, (key, name, description, shapes) in enumerate(ICONS):
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24">'
               f'<title>{html.escape(name)}</title><g fill="none" stroke="{COLOR}" stroke-width="{STROKE}" '
               'stroke-linecap="round" stroke-linejoin="round">'
               + "".join(svg_shape(shape) for shape in shapes) + '</g></svg>\n')
        (DIRECTORY / f"{key}.svg").write_text(svg)
        image = render_png(shapes)
        image.save(DIRECTORY / f"{key}.png")
        records.append({"name": name, "description": description,
                        "thumbnail_url": f"/uploads/amenities/{key}.png"})
        x, y = (index % 5) * 200, (index // 5) * 200
        gallery.paste(image, (x + 36, y + 8), image)
        canvas.text((x + 100, y + 155), name, anchor="mm", fill=COLOR, font=font)
    seed = ROOT / "airbnb_service/scripts/seed/amenities.json"
    seed.parent.mkdir(parents=True, exist_ok=True)
    seed.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    gallery.save(DIRECTORY / "preview.png")
    print(f"Created {len(records)} transparent 128x128 PNG icons, SVG sources and seed catalog.")


if __name__ == "__main__":
    main()
