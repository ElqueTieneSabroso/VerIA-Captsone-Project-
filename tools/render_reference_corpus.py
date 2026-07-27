from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


def clean(value: Any) -> str:
    text = str(value or "").replace("\x00", " ")
    return re.sub(r"[ \t]+", " ", text).strip()


def render_pptx(content: dict[str, Any]) -> list[str]:
    lines = [
        f"- Diapositivas: {content['slide_count']}",
        f"- Recursos multimedia: {content['media_count']}",
    ]
    for slide in content["slides"]:
        lines.append(f"\n### Diapositiva {slide['slide']}")
        lines.extend(f"- {clean(item)}" for item in slide["text"] if clean(item))
        notes = [clean(item) for item in slide.get("notes", []) if clean(item)]
        if notes:
            lines.append("- Notas:")
            lines.extend(f"  - {item}" for item in notes)
    return lines


def render_docx(content: dict[str, Any]) -> list[str]:
    lines = [
        f"- Párrafos: {content['paragraph_count']}",
        f"- Tablas: {content['table_count']}",
        f"- Imágenes: {content['image_count']}",
    ]
    table_number = 0
    for block in content["blocks"]:
        if block["kind"] == "paragraph":
            style = clean(block.get("style"))
            text = clean(block.get("text"))
            if text:
                lines.append(f"- [{style or 'Párrafo'}] {text}")
        else:
            table_number += 1
            lines.append(f"\n### Tabla {table_number}")
            for row in block["rows"]:
                lines.append("- " + " | ".join(clean(cell) for cell in row))
    return lines


def render_pdf(content: dict[str, Any]) -> list[str]:
    lines = [
        f"- Páginas: {content['page_count']}",
        f"- Páginas con texto extraíble: {content['text_pages']}",
    ]
    for page in content["pages"]:
        lines.append(f"\n### Página {page['page']}")
        text = clean(page["text"])
        lines.append(text if text else "[SIN TEXTO EXTRAÍBLE]")
    return lines


def render_xlsx(content: dict[str, Any]) -> list[str]:
    lines = [f"- Hojas: {content['sheet_count']}"]
    for sheet in content["sheets"]:
        lines.extend(
            [
                f"\n### Hoja: {sheet['name']}",
                f"- Dimensiones declaradas: {sheet['max_row']} x {sheet['max_column']}",
                f"- Celdas no vacías: {sheet['nonempty_cells']}",
                f"- Fórmulas: {sheet['formula_count']}",
            ]
        )
        for cell in sheet["values"]:
            lines.append(f"- {cell['cell']}: {clean(cell['value'])}")
        if sheet["truncated"]:
            lines.append("- [EXTRACCIÓN TRUNCADA A 5000 CELDAS]")
    return lines


def main() -> None:
    corpus_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    corpus = json.loads(corpus_path.read_text(encoding="utf-8"))
    lines = [
        "# Extracción trazable de fuentes proporcionadas",
        "",
        "Documento auxiliar generado para análisis; no sustituye las fuentes.",
    ]
    for item in corpus:
        lines.extend(
            [
                "",
                "---",
                "",
                f"## {item['name']}",
                "",
                f"- SHA-256: `{item.get('sha256', 'N/D')}`",
                f"- Tamaño: {item.get('bytes', 0)} bytes",
            ]
        )
        if item.get("error"):
            lines.append(f"- Error: {item['error']}")
            continue
        content = item.get("content", {})
        extension = item.get("extension")
        if extension == ".pptx":
            lines.extend(render_pptx(content))
        elif extension == ".docx":
            lines.extend(render_docx(content))
        elif extension == ".pdf":
            lines.extend(render_pdf(content))
        elif extension == ".xlsx":
            lines.extend(render_xlsx(content))
        else:
            lines.extend(
                [
                    f"- Dimensiones: {content.get('width')} x {content.get('height')}",
                    f"- Formato: {content.get('format')}",
                ]
            )
    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Created: {output_path}")
    print(f"Lines: {len(lines)}")


if __name__ == "__main__":
    main()
