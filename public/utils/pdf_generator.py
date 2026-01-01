"""
DijitalKatip PDF Oluşturucu
Python tabanlı profesyonel PDF oluşturma modülü
fpdf2 kütüphanesi kullanarak Türkçe karakter desteği ile resmi dilekçe PDF'i üretir
"""

from fpdf import FPDF
import base64
import html

def decode_html(text):
    if not text:
        return ""
    return html.unescape(text)
    
class TurkishPetitionPDF(FPDF):
    """Türkçe karakter desteği olan resmi dilekçe PDF sınıfı"""
    
    def __init__(self):
        super().__init__()
        # A4 formatı, milimetre birimi
        self.set_margins(25, 25, 25)  # Sol, üst, sağ kenar boşlukları (2.5cm)
        self.set_auto_page_break(True, margin=25)  # Alt kenar boşluk
        self.add_page()
        
    def header_text(self, text):
        """Başlık metnini ortalanmış, bold, büyük harflerle yazdırır"""
        self.set_font('Arial', 'B', 14)
        self.cell(0, 8, text.upper(), 0, 1, 'C')
        self.ln(4)
    
    def section_label(self, label):
        """Bölüm etiketini (DAVACI:, VEKİLİ:, vb.) yazdırır"""
        self.set_font('Arial', 'B', 12)
        self.cell(35, 6, label, 0, 0, 'L')
    
    def section_value(self, value, width=160):
        """Bölüm değerini yazdırır"""
        self.set_font('Arial', '', 12)
        self.cell(width, 6, value, 0, 1, 'L')
    
    def body_text(self, text):
        """Gövde metnini paragraflara bölerek yazdırır (justified alignment)"""
        self.set_font('Arial', '', 12)
        # Paragrafları ayır ve her birini yazdır
        paragraphs = text.split('\n\n')
        for para in paragraphs:
            if para.strip():
                # Metni satırlara böl (160mm genişlik, justified alignment)
                self.multi_cell(160, 6, para.strip(), 0, 'J', False)
                self.ln(2)

def create_petition_pdf(petition_data):
    """
    Dilekçe verisinden PDF oluşturur
    
    Args:
        petition_data (dict): Dilekçe verilerini içeren sözlük
        
    Returns:
        str: Base64 kodlanmış PDF içeriği
    """
    pdf = TurkishPetitionPDF()
    
    # Verileri al (varsayılan değerlerle)
    header = decode_html(petition_data.get('header', ''))
    file_number = decode_html(petition_data.get('file_number', ''))
    footer_date = decode_html(petition_data.get('footer_date', '23.12.2025'))
    plaintiff = decode_html(
        petition_data.get('plaintiff', '')
    ).replace('DAVACI:', '').strip()
    attorney = decode_html(
        petition_data.get('attorney', '')
    ).replace('VEKİLİ:', '').strip()
    defendant = decode_html(
        petition_data.get('defendant', '')
    ).replace('DAVALI:', '').strip()
    subject = decode_html(
        petition_data.get('subject', '')
    ).replace('KONU:', '').strip()
    body = decode_html(petition_data.get('body', ''))
    legal_grounds = decode_html(petition_data.get('legal_grounds', ''))
    evidence = decode_html(petition_data.get('evidence', ''))
    footer_signature = decode_html(petition_data.get('footer_signature', ''))
    footer_name = decode_html(petition_data.get('footer_name', ''))
    footer_address = decode_html(petition_data.get('footer_address', ''))
    
    # İmza satırı: footer_signature varsa onu kullan, yoksa footer_name
    signature_line = footer_signature if footer_signature else footer_name
    
    # 1. BAŞLIK
    if header:
        pdf.header_text(header)
    
    # 2. DOSYA NO (sağ üstte)
    if file_number:
        pdf.set_font('Arial', '', 10)
        pdf.cell(0, 6, f'Dosya No: {file_number}', 0, 1, 'R')
        pdf.ln(2)
    
    # 3. TARİH (sağ üstte)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, footer_date, 0, 1, 'R')
    pdf.ln(4)
    
    # 4. TARAFLAR
    if plaintiff:
        pdf.section_label('DAVACI:')
        pdf.section_value(plaintiff)
        pdf.ln(1)
    
    if attorney:
        pdf.section_label('VEKİLİ:')
        pdf.section_value(attorney)
        pdf.ln(1)
    
    if defendant:
        pdf.section_label('DAVALI:')
        pdf.section_value(defendant)
        pdf.ln(3)
    
    # 5. KONU
    if subject:
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(30, 6, 'KONU:', 0, 0, 'L')
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 6, subject, 0, 1, 'L')
        pdf.ln(2)
    
    # 6. GÖVDE METNİ
    if body:
        pdf.body_text(body)
        pdf.ln(4)
    
    # 7. HUKUKİ DAYANAKLAR
    if legal_grounds:
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 6, 'Hukuki Dayanaklar:', 0, 1, 'L')
        pdf.set_font('Arial', '', 12)
        pdf.multi_cell(160, 6, legal_grounds, 0, 'J', False)
        pdf.ln(3)
    
    # 8. DELİLLER
    if evidence:
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 6, 'Deliller:', 0, 1, 'L')
        pdf.set_font('Arial', '', 12)
        pdf.multi_cell(160, 6, evidence, 0, 'J', False)
        pdf.ln(4)
    
    # 9. İMZA ALANI (sağ alt)
    signature_y = max(pdf.get_y(), 250)
    pdf.set_y(signature_y)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, 'İmza', 0, 1, 'R')
    pdf.ln(2)
    
    if signature_line:
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 6, signature_line, 0, 1, 'R')
    
    if footer_address:
        pdf.set_font('Arial', '', 11)
        pdf.multi_cell(70, 5, footer_address, 0, 'R', False)
    
    # PDF'i base64'e çevir
    pdf_output = pdf.output(dest='S')
    pdf_base64 = base64.b64encode(pdf_output).decode('utf-8')
    
    return pdf_base64

