from pathlib import Path
import sys

from pypdf import PdfReader, PdfWriter


def main() -> None:
    output = Path(sys.argv[1])
    inputs = [Path(value) for value in sys.argv[2:]]
    writer = PdfWriter()

    for input_path in inputs:
        reader = PdfReader(input_path)
        for page in reader.pages:
            writer.add_page(page)

    with output.open("wb") as stream:
        writer.write(stream)

    print(f"Merged {len(inputs)} PDFs into {output} ({len(writer.pages)} pages)")


if __name__ == "__main__":
    main()
