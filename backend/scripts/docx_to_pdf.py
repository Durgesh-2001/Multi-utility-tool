import sys
from docx2pdf import convert

if len(sys.argv) < 3:
    print("Usage: docx_to_pdf.py input.docx output.pdf")
    sys.exit(1)

input_docx, output_pdf = sys.argv[1], sys.argv[2]
convert(input_docx, output_pdf)
print("success")
