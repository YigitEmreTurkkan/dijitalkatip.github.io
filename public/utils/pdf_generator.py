"""
DijitalKatip PDF Oluşturucu
fpdf2 + Unicode font ile Türkçe karakter destekli resmi dilekçe PDF'i
"""

from fpdf import FPDF
import base64
import html
import os


def decode_html(text):
    """HTML entity'leri (&uuml;, &#304; vb.) gerçek karakterlere çevirir"""
    if not text:
        return ""
    return html.unescape(text)


class TurkishPetitionPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_margins(25, 25, 25)
        self.set_auto_page_break(True, margin=25)
        self.add_page()

        # ✅ Unicode font (ZORUNLU)
        self.add_font(
            "DejaVu",
            "",
            "DejaVuSans.ttf",
            uni=True
        )
        self.add_font(
            "DejaVu",
            "B",
            "DejaVuSans-Bold.ttf",
            uni=True
        )

    def header_text(self, text):
        self.set_font("DejaVu", "B", 14)
        self.cell(0, 8, text.upper(), 0, 1, "C")
        self.ln(4)

    def section_label(self, label):
        self.set_font("DejaVu", "B", 12)
        self.cell(35, 6, label, 0, 0, "L")

    def section_value(self, value, width=160):
        self.set_font("DejaVu", "", 12)
        self.cell(width, 6, value, 0, 1, "L")

    def body_text(self, text):
        self.set_font("DejaVu", "", 12)
        for para in text.split("\n\n"):
            if para.strip():
                self.multi_cell(160, 6, para.strip(), 0, "J")
                self.ln(2)


def create_petition_pdf(petition_data):
    pdf = TurkishPetitionPDF()

    # 🔴 TÜM METİNLER DECODE EDİLİYOR
    header = decode_html(petition_data.get("header", ""))
    file_number = decode_html(petition_data.get("file_number", ""))
    footer_date = decode_html(petition_data.get("footer_date", "23.12.2025"))

    plaintiff = decode_html(petition_data.get("plaintiff", "")).replace("DAVACI:", "").strip()
    attorney = decode_html(petition_data.get("attorney", "")).replace("VEKİLİ:", "").strip()
    defendant = decode_html(petition_data.get("defendant", "")).replace("DAVALI:", "").strip()
    subject = decode_html(petition_data.get("subject", "")).replace("KONU:", "").strip()
    body = decode_html(petition_data.get("body", ""))
    legal_grounds = decode_html(petition_data.get("legal_grounds", ""))
    evidence = decode_html(petition_data.get("evidence", ""))

    footer_signature = decode_html(petition_data.get("footer_signature", ""))
    footer_name = decode_html(petition_data.get("footer_name", ""))
    footer_address = decode_html(petition_data.get("footer_address", ""))

    signature_line = footer_signature or footer_name

    # 1. BAŞLIK
    if header:
        pdf.header_text(header)

    # 2. DOSYA NO
    if file_number:
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, f"Dosya No: {file_number}", 0, 1, "R")
        pdf.ln(2)

    # 3. TARİH
    pdf.set_font("DejaVu", "", 11)
    pdf.cell(0, 6, footer_date, 0, 1, "R")
    pdf.ln(4)

    # 4. TARAFLAR
    if plaintiff:
        pdf.section_label("DAVACI:")
        pdf.section_value(plaintiff)
        pdf.ln(1)

    if attorney:
        pdf.section_label("VEKİLİ:")
        pdf.section_value(attorney)
        pdf.ln(1)

    if defendant:
        pdf.section_label("DAVALI:")
        pdf.section_value(defendant)
        pdf.ln(3)

    # 5. KONU
    if subject:
        pdf.set_font("DejaVu", "B", 12)
        pdf.cell(30, 6, "KONU:", 0, 0)
        pdf.set_font("DejaVu", "", 12)
        pdf.cell(0, 6, subject, 0, 1)
        pdf.ln(2)

    # 6. GÖVDE
    if body:
        pdf.body_text(body)
        pdf.ln(4)

    # 7. HUKUKİ DAYANAKLAR
    if legal_grounds:
        pdf.set_font("DejaVu", "B", 12)
        pdf.cell(0, 6, "Hukuki Dayanaklar:", 0, 1)
        pdf.set_font("DejaVu", "", 12)
        pdf.multi_cell(160, 6, legal_grounds, 0, "J")
        pdf.ln(3)

    # 8. DELİLLER
    if evidence:
        pdf.set_font("DejaVu", "B", 12)
        pdf.cell(0, 6, "Deliller:", 0, 1)
        pdf.set_font("DejaVu", "", 12)
        pdf.multi_cell(160, 6, evidence, 0, "J")
        pdf.ln(4)

    # 9. İMZA
    pdf.set_y(max(pdf.get_y(), 250))
    pdf.set_font("DejaVu", "", 11)
    pdf.cell(0, 6, "İmza", 0, 1, "R")

    if signature_line:
        pdf.set_font("DejaVu", "", 12)
        pdf.cell(0, 6, signature_line, 0, 1, "R")

    if footer_address:
        pdf.set_font("DejaVu", "", 11)
        pdf.multi_cell(70, 5, footer_address, 0, "R")

    pdf_bytes = pdf.output(dest="S").encode("latin1")
    return base64.b64encode(pdf_bytes).decode("utf-8")
