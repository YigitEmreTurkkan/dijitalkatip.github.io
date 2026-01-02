// pdfmake - Dinamik import ile runtime'da yükle (build hatasını önler)
let pdfMake = null;
let pdfFonts = null;

async function loadPdfMake() {
  if (pdfMake && pdfFonts) {
    return { pdfMake, pdfFonts };
  }

  try {
    // Dinamik import - build aşamasında Rollup bunu çözmeye çalışmaz
    const [pdfMakeModule, pdfFontsModule] = await Promise.all([
      import("pdfmake/build/pdfmake.js"),
      import("pdfmake/build/vfs_fonts.js")
    ]);

    pdfMake = pdfMakeModule.default || pdfMakeModule;
    pdfFonts = pdfFontsModule.default || pdfFontsModule;

    // Fontları bağlama - güvenli kontrol
    if (pdfFonts && pdfFonts.pdfMake) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    } else if (pdfFonts && pdfFonts.vfs) {
      pdfMake.vfs = pdfFonts.vfs;
    }

    return { pdfMake, pdfFonts };
  } catch (error) {
    console.error("pdfmake yükleme hatası:", error);
    throw new Error("PDF oluşturma kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin.");
  }
}

// Türkçe karakterleri koruyarak metni normalize et
function normalizeText(text) {
  if (!text) return "";
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

// Resmi mahkeme dilekçesi formatında PDF üretir - pdfmake ile kusursuz Türkçe karakter desteği
export async function generatePetitionPdf(petitionData) {
  if (!petitionData) return;

  // pdfmake'i dinamik olarak yükle
  const { pdfMake: pdfMakeInstance } = await loadPdfMake();

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

  // Tüm alanları normalize et - Türkçe karakterler korunur
  const cleanHeader = normalizeText(header).toLocaleUpperCase("tr-TR");
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
      : "Hakan";

  // PDF doküman tanımı
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40], // 2.5cm kenar boşlukları
    defaultStyle: {
      font: "Roboto",
      fontSize: 12,
      lineHeight: 1.5,
      color: "#1e293b"
    },
    content: []
  };

  // 1. BAŞLIK: Mahkeme adı ortalanmış, BOLD, BÜYÜK HARFLERLE
  if (cleanHeader) {
    docDefinition.content.push({
      text: cleanHeader,
      fontSize: 14,
      bold: true,
      alignment: "center",
      margin: [0, 0, 0, 8]
    });
  }

  // 2. DOSYA NO ve TARİH: Sağ üst köşede
  const headerRow = [];
  if (cleanFileNumber) {
    headerRow.push({
      text: `Dosya No: ${cleanFileNumber}`,
      fontSize: 10,
      alignment: "right",
      margin: [0, 0, 0, 4]
    });
  }
  headerRow.push({
    text: finalDate,
    fontSize: 11,
    alignment: "right",
    margin: [0, 0, 0, 10]
  });
  
  if (headerRow.length > 0) {
    docDefinition.content.push({
      columns: [
        { text: "", width: "*" },
        {
          width: "auto",
          stack: headerRow
        }
      ],
      margin: [0, 0, 0, 10]
    });
  }

  // 3. TARAFLAR: DAVACI, VEKİLİ, DAVALI
  const parties = [];
  
  if (cleanPlaintiff) {
    parties.push({
      columns: [
        { text: "DAVACI:", bold: true, width: 60 },
        { text: cleanPlaintiff, width: "*" }
      ],
      margin: [0, 0, 0, 4]
    });
  }

  if (cleanAttorney && cleanAttorney.trim()) {
    parties.push({
      columns: [
        { text: "VEKİLİ:", bold: true, width: 60 },
        { text: cleanAttorney, width: "*" }
      ],
      margin: [0, 0, 0, 4]
    });
  }

  if (cleanDefendant) {
    parties.push({
      columns: [
        { text: "DAVALI:", bold: true, width: 60 },
        { text: cleanDefendant, width: "*" }
      ],
      margin: [0, 0, 0, 8]
    });
  }

  if (parties.length > 0) {
    docDefinition.content.push({
      stack: parties
    });
  }

  // 4. KONU
  if (cleanSubject) {
    docDefinition.content.push({
      columns: [
        { text: "KONU:", bold: true, width: 60 },
        { text: cleanSubject, width: "*" }
      ],
      margin: [0, 0, 0, 12]
    });
  }

  // 5. GÖVDE: Resmi dilekçe metni, paragraflar arası boşluk
  if (cleanBody) {
    const bodyParagraphs = cleanBody.split(/\n\n+/).filter(Boolean);
    bodyParagraphs.forEach((para, idx) => {
      docDefinition.content.push({
        text: para,
        margin: [0, idx > 0 ? 8 : 0, 0, 0]
      });
    });
    docDefinition.content.push({ text: "", margin: [0, 0, 0, 12] });
  }

  // 6. HUKUKİ DAYANAKLAR
  if (cleanLegal && cleanLegal.trim()) {
    docDefinition.content.push({
      text: "Hukuki Dayanaklar:",
      bold: true,
      margin: [0, 12, 0, 4]
    });
    docDefinition.content.push({
      text: cleanLegal,
      margin: [0, 0, 0, 12]
    });
  }

  // 7. DELİLLER
  if (cleanEvidence && cleanEvidence.trim()) {
    docDefinition.content.push({
      text: "Deliller:",
      bold: true,
      margin: [0, 0, 0, 4]
    });
    docDefinition.content.push({
      text: cleanEvidence,
      margin: [0, 0, 0, 20]
    });
  }

  // 8. İMZA ALANI: Sağ alt köşede
  const signatureStack = [];
  
  signatureStack.push({
    text: "İmza",
    fontSize: 11,
    alignment: "right",
    margin: [0, 0, 0, 4]
  });

  if (signatureLine && signatureLine.trim()) {
    signatureStack.push({
      text: signatureLine,
      fontSize: 12,
      alignment: "right",
      margin: [0, 0, 0, 4]
    });
  }

  if (cleanFooterAddress && cleanFooterAddress.trim()) {
    signatureStack.push({
      text: cleanFooterAddress,
      fontSize: 11,
      alignment: "right",
      margin: [0, 0, 0, 0]
    });
  }

  if (signatureStack.length > 0) {
    docDefinition.content.push({
      columns: [
        { text: "", width: "*" },
        {
          width: "auto",
          stack: signatureStack
        }
      ],
      margin: [0, 20, 0, 0]
    });
  }

  // PDF'i oluştur ve indir - Türkçe karakterler kusursuz
  try {
    const pdfDoc = pdfMakeInstance.createPdf(docDefinition);
    pdfDoc.download("dilekce.pdf");
    console.log("PDF başarıyla oluşturuldu - tüm bilgiler eklendi, Türkçe karakterler korundu.");
  } catch (error) {
    console.error("PDF oluşturma hatası:", error);
    throw new Error("PDF oluşturulurken bir hata oluştu.");
  }
}
