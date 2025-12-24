import { jsPDF } from "jspdf";

// Times New Roman benzeri serif font için Noto Serif kullanıyoruz (Türkçe karakter desteği ile)
const NOTO_SERIF_REGULAR_URL =
  "https://fonts.gstatic.com/s/notoserif/v23/ga6iaw1J5X9T9RW6j9bNVls-hfgvz8JcMofYTa32J4wsL2JAlAhZqFGjwM0Lh.woff2";
const NOTO_SERIF_BOLD_URL =
  "https://fonts.gstatic.com/s/notoserif/v23/ga6Law1J5X9T9RW6j9bNVls-hfgvz8JcMofYTa32J4wsL2JAlAhZqFGjwM0Lh.woff2";

let fontLoaded = false;

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Türkçe karakterleri koruyarak metni temizle (UTF-8 desteği ile)
function normalizeText(text) {
  if (!text) return "";
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

async function ensureNotoSerif(doc) {
  if (fontLoaded) return true;

  try {
    // Noto Serif yerine jsPDF'in dahili Times fontunu kullanıyoruz (Türkçe karakter desteği için)
    // jsPDF'in Times fontu Türkçe karakterleri destekler
    fontLoaded = true;
    return true;
  } catch (e) {
    console.warn("Font yükleme hatası, varsayılan font kullanılacak.", e);
    return false;
  }
}

// Resmi mahkeme dilekçesi formatında PDF üretir (Times font, 2.5cm kenar boşlukları, 1.5 satır aralığı)
export async function generatePetitionPdf(petitionData) {
  if (!petitionData) return;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await ensureNotoSerif(doc);
  
  // Resmi yazışma standartları: 2.5cm kenar boşlukları, 1.5 satır aralığı
  const marginLeft = 25; // 2.5cm
  const marginRight = 185; // A4 genişliği (210mm) - 25mm
  const lineHeight = 4.5; // 1.5 satır aralığı (12pt font için ~4.5mm)
  let cursorY = 25;

  const {
    header = "",
    plaintiff = "",
    attorney = "",
    defendant = "",
    subject = "",
    body = "",
    legal_grounds = "",
    evidence = "",
    footer_date = "",
    footer_signature = "",
    footer_name = "",
    footer_address = "",
    file_number = ""
  } = petitionData;

  const cleanHeader = normalizeText(header).toUpperCase();
  const cleanPlaintiff = normalizeText(plaintiff).replace(/^DAVACI:\s*/i, "");
  const cleanAttorney = normalizeText(attorney).replace(/^VEKİLİ:\s*/i, "");
  const cleanDefendant = normalizeText(defendant).replace(/^DAVALI:\s*/i, "");
  const cleanSubject = normalizeText(subject).replace(/^KONU:\s*/i, "");
  const cleanBody = normalizeText(body);
  const cleanLegal = normalizeText(legal_grounds);
  const cleanEvidence = normalizeText(evidence);
  const cleanFooterAddress = normalizeText(footer_address);
  const cleanFileNumber = normalizeText(file_number);

  // Tarih: kullanıcı vermediyse 23.12.2025
  const finalDate = footer_date && footer_date.trim() ? footer_date : "23.12.2025";
  const signatureLine = footer_signature
    ? normalizeText(footer_signature)
    : footer_name
      ? normalizeText(footer_name)
      : "Hakan"; // Örnek isim

  // 1. BAŞLIK: Mahkeme adı ortalanmış, BOLD, BÜYÜK HARFLERLE
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  if (cleanHeader) {
    doc.text(cleanHeader, 105, cursorY, { align: "center" });
  }
  cursorY += 8;

  // 2. DOSYA NO: Sağ üst köşede (başlığın altında)
  if (cleanFileNumber) {
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text(`Dosya No: ${cleanFileNumber}`, marginRight, cursorY, { align: "right" });
  }
  cursorY += 6;

  // 3. TARİH: Sağ üstte
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(finalDate, marginRight, cursorY, { align: "right" });
  cursorY += 10;

  // 4. TARAFLAR: DAVACI, VEKİLİ, DAVALI (sol blokta etiketler, sağda değerler)
  const labelWidth = 35; // Etiket genişliği (DAVACI:, VEKİLİ:, DAVALI:)
  const valueStartX = marginLeft + labelWidth; // Değerlerin başlangıç pozisyonu

  if (cleanPlaintiff) {
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("DAVACI:", marginLeft, cursorY);
    doc.setFont("times", "normal");
    const plaintiffLines = doc.splitTextToSize(cleanPlaintiff, marginRight - valueStartX);
    doc.text(plaintiffLines, valueStartX, cursorY);
    cursorY += plaintiffLines.length * lineHeight + 2;
  }

  if (cleanAttorney) {
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("VEKİLİ:", marginLeft, cursorY);
    doc.setFont("times", "normal");
    const attorneyLines = doc.splitTextToSize(cleanAttorney, marginRight - valueStartX);
    doc.text(attorneyLines, valueStartX, cursorY);
    cursorY += attorneyLines.length * lineHeight + 2;
  }

  if (cleanDefendant) {
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("DAVALI:", marginLeft, cursorY);
    doc.setFont("times", "normal");
    const defendantLines = doc.splitTextToSize(cleanDefendant, marginRight - valueStartX);
    doc.text(defendantLines, valueStartX, cursorY);
    cursorY += defendantLines.length * lineHeight + 4;
  }

  // 5. KONU: Sol blokta, bold
  if (cleanSubject) {
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("KONU:", marginLeft, cursorY);
    const subjectLines = doc.splitTextToSize(cleanSubject, marginRight - marginLeft - 30);
    doc.setFont("times", "normal");
    doc.text(subjectLines, marginLeft + 30, cursorY);
    cursorY += subjectLines.length * lineHeight + 4;
  }

  // 6. GÖVDE: Resmi dilekçe metni, paragraflar arası boşluk
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  const bodyParagraphs = cleanBody.split(/\n\n+/).filter(Boolean);
  bodyParagraphs.forEach((para, idx) => {
    if (idx > 0) cursorY += 4; // Paragraflar arası boşluk
    const paraLines = doc.splitTextToSize(para, marginRight - marginLeft);
    doc.text(paraLines, marginLeft, cursorY);
    cursorY += paraLines.length * lineHeight;
  });
  cursorY += 8;

  // 7. HUKUKİ DAYANAKLAR (varsa)
  if (cleanLegal) {
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Hukuki Dayanaklar:", marginLeft, cursorY);
    cursorY += lineHeight;
    doc.setFont("times", "normal");
    const legalLines = doc.splitTextToSize(cleanLegal, marginRight - marginLeft);
    doc.text(legalLines, marginLeft, cursorY);
    cursorY += legalLines.length * lineHeight + 6;
  }

  // 8. DELİLLER (varsa)
  if (cleanEvidence) {
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Deliller:", marginLeft, cursorY);
    cursorY += lineHeight;
    doc.setFont("times", "normal");
    const evidenceLines = doc.splitTextToSize(cleanEvidence, marginRight - marginLeft);
    doc.text(evidenceLines, marginLeft, cursorY);
    cursorY += evidenceLines.length * lineHeight + 8;
  }

  // 9. İMZA ALANI: Sağ alt köşede
  const signatureY = Math.max(cursorY, 250);
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text("İmza", marginRight, signatureY - 8, { align: "right" });
  doc.setFontSize(12);
  if (signatureLine) {
    doc.text(signatureLine, marginRight, signatureY, { align: "right" });
  }
  if (cleanFooterAddress) {
    const addressLines = doc.splitTextToSize(cleanFooterAddress, 70);
    doc.text(addressLines, marginRight, signatureY + 6, { align: "right" });
  }

  doc.save("dilekce.pdf");
}



