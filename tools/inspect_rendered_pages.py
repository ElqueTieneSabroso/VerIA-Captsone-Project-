from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps


def page_number(path: Path) -> int:
    match = re.search(r"(\d+)$", path.stem)
    return int(match.group(1)) if match else 0


def main() -> None:
    render_directory = Path(sys.argv[1]).resolve()
    contact_directory = render_directory / "contact-sheets"
    contact_directory.mkdir(exist_ok=True)
    small_contact_directory = render_directory / "contact-sheets-small"
    small_contact_directory.mkdir(exist_ok=True)

    pages = sorted(render_directory.glob("page-*.png"), key=page_number)
    if not pages:
        raise RuntimeError("No rendered pages found.")

    report = []
    loaded_pages = []
    for path in pages:
        image = Image.open(path).convert("RGB")
        loaded_pages.append((path, image.copy()))
        white = Image.new("RGB", image.size, "white")
        difference = ImageChops.difference(image, white).convert("L")
        threshold = difference.point(lambda value: 255 if value > 12 else 0)
        bounding_box = threshold.getbbox()
        if bounding_box:
            left, top, right, bottom = bounding_box
            margins = {
                "left": left,
                "top": top,
                "right": image.width - right,
                "bottom": image.height - bottom,
            }
            ink_area = (right - left) * (bottom - top)
        else:
            margins = None
            ink_area = 0

        report.append(
            {
                "page": page_number(path),
                "width": image.width,
                "height": image.height,
                "blank": bounding_box is None,
                "content_margins_px": margins,
                "bounding_area_ratio": round(
                    ink_area / (image.width * image.height), 4
                ),
                "edge_risk": bool(
                    margins
                    and min(
                        margins["left"],
                        margins["right"],
                        margins["top"],
                        margins["bottom"],
                    )
                    < 18
                ),
            }
        )

    for start in range(0, len(loaded_pages), 4):
        group = loaded_pages[start : start + 4]
        page_width, page_height = group[0][1].size
        label_height = 44
        sheet = Image.new(
            "RGB",
            (page_width * 2 + 36, (page_height + label_height) * 2 + 36),
            "#D9E1E8",
        )
        draw = ImageDraw.Draw(sheet)
        for offset, (path, page) in enumerate(group):
            column = offset % 2
            row = offset // 2
            x = 12 + column * (page_width + 12)
            y = 12 + row * (page_height + label_height + 12)
            sheet.paste(page, (x, y + label_height))
            draw.rectangle((x, y, x + page_width, y + label_height), fill="#203748")
            draw.text(
                (x + 14, y + 12),
                f"Página {page_number(path)}",
                fill="white",
            )
        first = page_number(group[0][0])
        last = page_number(group[-1][0])
        sheet.save(
            contact_directory / f"contact-{first:02d}-{last:02d}.png",
            optimize=True,
        )
        small_sheet = sheet.copy()
        small_sheet.thumbnail((1400, 1800), Image.Resampling.LANCZOS)
        small_sheet.save(
            small_contact_directory / f"contact-{first:02d}-{last:02d}.png",
            optimize=True,
        )

    overview_columns = 4
    overview_page_width = 300
    source_width, source_height = loaded_pages[0][1].size
    overview_page_height = round(
        source_height * overview_page_width / source_width
    )
    overview_label_height = 28
    overview_rows = (len(loaded_pages) + overview_columns - 1) // overview_columns
    overview = Image.new(
        "RGB",
        (
            overview_columns * overview_page_width + (overview_columns + 1) * 8,
            overview_rows * (overview_page_height + overview_label_height)
            + (overview_rows + 1) * 8,
        ),
        "#D9E1E8",
    )
    overview_draw = ImageDraw.Draw(overview)
    for offset, (path, page) in enumerate(loaded_pages):
        column = offset % overview_columns
        row = offset // overview_columns
        x = 8 + column * (overview_page_width + 8)
        y = 8 + row * (overview_page_height + overview_label_height + 8)
        thumbnail = page.resize(
            (overview_page_width, overview_page_height), Image.Resampling.LANCZOS
        )
        overview_draw.rectangle(
            (x, y, x + overview_page_width, y + overview_label_height),
            fill="#203748",
        )
        overview_draw.text(
            (x + 9, y + 7),
            f"Pagina {page_number(path)}",
            fill="white",
        )
        overview.paste(thumbnail, (x, y + overview_label_height))
    overview.save(render_directory / "overview.png", optimize=True)

    summary = {
        "page_count": len(report),
        "blank_pages": [item["page"] for item in report if item["blank"]],
        "edge_risk_pages": [item["page"] for item in report if item["edge_risk"]],
        "pages": report,
    }
    report_path = render_directory / "visual-geometry-report.json"
    report_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({key: value for key, value in summary.items() if key != "pages"}))
    print(f"Contact sheets: {contact_directory}")
    print(f"Small contact sheets: {small_contact_directory}")
    print(f"Overview: {render_directory / 'overview.png'}")
    print(f"Report: {report_path}")


if __name__ == "__main__":
    main()
