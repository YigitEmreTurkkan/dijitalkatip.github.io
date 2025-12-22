import { jsPDF } from "jspdf";

// Türkçe karakterleri daha düzgün göstermek için Helvetica'yı kullanıyoruz
// (jsPDF varsayılan Times fontu bazı aksanlarda sorun çıkarabiliyor).
export function generatePetitionPdf(petitionData) {
  if (!petitionData) return;

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const marginLeft = 20;
  const marginRight = 190;
  const lineGap = 6;
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
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  if (header) {
    doc.text(header, 105, cursorY, { align: "center" });
  }

  // Tarih - sağ üst (başlığın biraz altına yerleştir)
  if (footer_date) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(footer_date, marginRight, cursorY + 2, { align: "right" });
  }

  cursorY += 14;

  // Konu
  if (subject) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const subjectText = `Konu: ${subject}`;
    const lines = doc.splitTextToSize(subjectText, marginRight - marginLeft);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * lineGap + 2;
  }

  // Gövde
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const bodyText = body || "";
  const bodyLines = doc.splitTextToSize(bodyText, marginRight - marginLeft);
  doc.text(bodyLines, marginLeft, cursorY);
  cursorY += bodyLines.length * lineGap + 16;

  // İmza alanı
  const signatureY = Math.max(cursorY, 240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  if (footer_name) {
    doc.text(footer_name, marginRight, signatureY, { align: "right" });
  }
  if (footer_address) {
    const addressLines = doc.splitTextToSize(footer_address, 70);
    doc.text(addressLines, marginRight, signatureY + 6, { align: "right" });
  }
  doc.setFontSize(11);
  doc.text("İmza", marginRight, signatureY - 6, { align: "right" });

  doc.save("dilekce.pdf");
}



