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

function normalizeText(text) {
  if (!text) return "";
  const normalized = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

  // Türkçe karakterleri Latin eşleniğine çevirerek PDF'te bozulmaların önüne geçiyoruz.
  return normalized
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U");
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
  doc.setLineHeightFactor(1.35);

  const marginLeft = 22;
  const marginRight = 188;
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

  const cleanHeader = normalizeText(header);
  const cleanSubject = normalizeText(subject);
  const cleanBody = normalizeText(body);
  const cleanFooterAddress = normalizeText(footer_address);

  // Başlık (Kurum) - ortalı
  doc.setFont(hasRoboto ? "Roboto" : "helvetica", "bold");
  doc.setFontSize(14);
  if (cleanHeader) {
    doc.text(cleanHeader, 105, cursorY, { align: "center" });
  }

  // Tarih - sağ üst (başlığın hizasında)
  if (footer_date) {
    doc.setFont(hasRoboto ? "Roboto" : "helvetica", "normal");
    doc.setFontSize(11);
    doc.text(footer_date, marginRight, cursorY - 2, { align: "right" });
  }

  cursorY += 14;

  // Konu
  if (cleanSubject) {
    doc.setFont(hasRoboto ? "Roboto" : "helvetica", "bold");
    doc.setFontSize(12);
    const subjectText = `Konu: ${cleanSubject}`;
    const lines = doc.splitTextToSize(subjectText, marginRight - marginLeft);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * lineGap + 3;
  }

  // Gövde
  doc.setFont(hasRoboto ? "Roboto" : "helvetica", "normal");
  doc.setFontSize(12);
  const bodyText = cleanBody || "";
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
  if (cleanFooterAddress) {
    const addressLines = doc.splitTextToSize(cleanFooterAddress, 70);
    doc.text(addressLines, marginRight, signatureY + 6, { align: "right" });
  }
  doc.setFontSize(11);
  doc.text("İmza", marginRight, signatureY - 6, { align: "right" });

  doc.save("dilekce.pdf");
}



