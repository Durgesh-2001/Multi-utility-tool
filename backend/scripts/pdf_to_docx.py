import sys
from pdf2docx import Converter

if len(sys.argv) < 3:
    print("Usage: pdf_to_docx.py input.pdf output.docx")
    sys.exit(1)

input_pdf, output_docx = sys.argv[1], sys.argv[2]

cv = Converter(input_pdf)
cv.convert(output_docx, start=0, end=None)
cv.close()
print("success")
