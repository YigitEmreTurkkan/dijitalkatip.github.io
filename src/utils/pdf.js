import { jsPDF } from "jspdf";

// Basit A4 düzeniyle dilekçeyi PDF'e çevirir.
// Not: Gerçek projede Türkçe karakterler için gömülü bir Unicode font eklemek önerilir.
export function generatePetitionPdf(petitionData) {
  if (!petitionData) return;

  const doc = new jsPDF({
    unit: "mm",
    format: "a4"
  });

  const marginLeft = 20;
  const marginRight = 190;
  let cursorY = 20;

  const {
    header = "",
    subject = "",
    body = "",
    footer_date = "",
    footer_name = "",
    footer_address = ""
  } = petitionData;

  // Başlık (Kurum) - ortalı
  doc.setFont("Times", "Bold");
  doc.setFontSize(14);
  doc.text(header || "", 105, cursorY, { align: "center" });

  cursorY += 16;

  // Tarih - sağ üst
  if (footer_date) {
    doc.setFont("Times", "Normal");
    doc.setFontSize(11);
    doc.text(footer_date, marginRight, cursorY - 10, { align: "right" });
  }

  // Konu (varsa)
  if (subject) {
    doc.setFont("Times", "Bold");
    doc.setFontSize(12);
    const subjectText = `Konu: ${subject}`;
    const lines = doc.splitTextToSize(subjectText, marginRight - marginLeft);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * 6 + 4;
  }

  // Hitap ve gövde
  doc.setFont("Times", "Normal");
  doc.setFontSize(12);

  const bodyText = body || "";
  const bodyLines = doc.splitTextToSize(bodyText, marginRight - marginLeft);
  doc.text(bodyLines, marginLeft, cursorY);

  cursorY += bodyLines.length * 6 + 20;

  // İmza alanı - sağ altta
  const signatureY = Math.max(cursorY, 240);
  doc.setFont("Times", "Normal");
  doc.setFontSize(12);
  if (footer_name) {
    doc.text(footer_name, marginRight, signatureY, { align: "right" });
  }
  if (footer_address) {
    const addressLines = doc.splitTextToSize(footer_address, 70);
    doc.text(addressLines, marginRight, signatureY + 6, { align: "right" });
  }

  // "İmza" metni
  doc.setFontSize(11);
  doc.text("İmza", marginRight, signatureY - 6, { align: "right" });

  doc.save("dilekce.pdf");
}


