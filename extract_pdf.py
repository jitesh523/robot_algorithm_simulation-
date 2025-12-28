#!/usr/bin/env python3
import PyPDF2
import sys

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            print(f"PDF has {num_pages} pages\n")
            print("="*80)
            
            full_text = []
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                full_text.append(f"\n--- Page {page_num + 1} ---\n{text}")
            
            return '\n'.join(full_text)
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 extract_pdf.py <pdf_file>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    text = extract_pdf_text(pdf_path)
    if text:
        print(text)
