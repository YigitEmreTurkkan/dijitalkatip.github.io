import { jsPDF } from "jspdf";

// Roboto latin geniş karakter setini uzaktan yükleyip jsPDF'e gömüyoruz.
// Böylece Türkçe karakterler bozulmadan yazılır.
const ROBOTO_REGULAR_URL =
  "https://unpkg.com/@fontsource/roboto/files/roboto-latin-400-normal.ttf";
const ROBOTO_BOLD_URL =
  "https://unpkg.com/@fontsource/roboto/files/roboto-latin-700-normal.ttf";

let fontLoaded = false;

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function ensureRoboto(doc) {
  if (fontLoaded) return true;

  try {
    const [regularRes, boldRes] = await Promise.all([
      fetch(ROBOTO_REGULAR_URL),
      fetch(ROBOTO_BOLD_URL)
    ]);

    if (!regularRes.ok || !boldRes.ok) {
      console.warn("Roboto fontları indirilemedi, varsayılan font kullanılacak.");
      return false;
    }

    const regularBase64 = arrayBufferToBase64(await regularRes.arrayBuffer());
    const boldBase64 = arrayBufferToBase64(await boldRes.arrayBuffer());

    doc.addFileToVFS("Roboto-Regular.ttf", regularBase64);
    doc.addFileToVFS("Roboto-Bold.ttf", boldBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

    fontLoaded = true;
    return true;
  } catch (e) {
    console.warn("Roboto font yükleme hatası, varsayılan font kullanılacak.", e);
    return false;
  }
}

// PDF'i Roboto fontu ile, düzenli satır aralığı ve kenar boşluklarıyla üretir.
export async function generatePetitionPdf(petitionData) {
  if (!petitionData) return;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const hasRoboto = await ensureRoboto(doc);

  const marginLeft = 20;
  const marginRight = 190;
  const lineGap = 6;
  let cursorY = 22;

  const {
    header = "",
    subject = "",
    body = "",
    footer_date = "",
    footer_name = "",
    footer_address = ""
  } = petitionData;

  // Başlık (Kurum) - ortalı
  doc.setFont(hasRoboto ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(14);
  if (header) {
    doc.text(header, 105, cursorY, { align: "center" });
  }

  // Tarih - sağ üst (başlığın hizasında)
  if (footer_date) {
    doc.setFont(hasRoboto ? "Roboto" : "helvetica", "normal");
    doc.setFontSize(11);
    doc.text(footer_date, marginRight, cursorY - 2, { align: "right" });
  }

  cursorY += 14;

  // Konu
  if (subject) {
    doc.setFont(hasRoboto ? "Roboto" : "helvetica", "bold");
    doc.setFontSize(12);
    const subjectText = `Konu: ${subject}`;
    const lines = doc.splitTextToSize(subjectText, marginRight - marginLeft);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * lineGap + 3;
  }

  // Gövde
  doc.setFont(hasRoboto ? "Roboto" : "helvetica", "normal");
  doc.setFontSize(12);
  const bodyText = body || "";
  const bodyLines = doc.splitTextToSize(bodyText, marginRight - marginLeft);
  doc.text(bodyLines, marginLeft, cursorY);
  cursorY += bodyLines.length * lineGap + 18;

  // İmza alanı
  const signatureY = Math.max(cursorY, 240);
  doc.setFont(hasRoboto ? "Roboto" : "helvetica", "normal");
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



