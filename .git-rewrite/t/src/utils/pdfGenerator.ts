import jsPDF from 'jspdf';
import { Document } from '../types/database';

// Türkçe karakter desteği için font ayarları
function setupTurkishFont(doc: jsPDF) {
  // jsPDF varsayılan olarak Türkçe karakterleri destekler ama emin olmak için
  doc.setLanguage('tr');
}

export function generatePDF(document: Document): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  setupTurkishFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin + 10;

  // Başlık (Makam) - Ortalanmış ve büyük harflerle
  if (document.header) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const headerText = document.header.toUpperCase();
    const headerLines = doc.splitTextToSize(headerText, pageWidth - 2 * margin);
    headerLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' });
      yPos += 7;
    });
    yPos += 10;
  }

  // Davacı Bilgileri
  if (document.plaintiff_details) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DAVACI:', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // Her satırı ayrı işle (Adı:, Soyadı:, TC:, Telefon:, Adres:)
    const plaintiffLines = document.plaintiff_details.split('\n').filter(line => line.trim());
    plaintiffLines.forEach((line: string) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line.trim(), margin + 5, yPos);
      yPos += 5;
    });
    yPos += 5;
  }

  // Davalı Bilgileri
  if (document.defendant_details) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DAVALI:', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const defendantLines = doc.splitTextToSize(document.defendant_details, pageWidth - 2 * margin);
    defendantLines.forEach((line: string) => {
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
    yPos += 3;
  }

  // Konu
  if (document.subject) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('KONU:', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subjectLines = doc.splitTextToSize(document.subject, pageWidth - 2 * margin);
    subjectLines.forEach((line: string) => {
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
    yPos += 3;
  }

  // Açıklamalar
  if (document.incident_narrative) {
    // Sayfa kontrolü
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('AÇIKLAMALAR:', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // Açıklamaları düzgün formatla - sadece içerik kısmını al
    let narrativeText = document.incident_narrative;
    // Başlık ve sonuç cümlesini temizle, sadece içeriği al
    narrativeText = narrativeText
      .replace(/Davacı ile davalı arasında aşağıda belirtilen olay meydana gelmiştir:[\s\n]*/gi, '')
      .replace(/Bu durum davacının haklarının ihlal edilmesine ve zarara uğramasına sebep olmuştur\.?[\s\n]*/gi, '')
      .trim();
    
    const narrativeLines = doc.splitTextToSize(narrativeText, pageWidth - 2 * margin - 5);
    narrativeLines.forEach((line: string) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
    yPos += 5;
  }

  // Hukuki Sebepler ve Deliller
  if (document.legal_grounds) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('HUKUKİ SEBEPLER VE DELİLLER:', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const legalLines = doc.splitTextToSize(document.legal_grounds, pageWidth - 2 * margin);
    legalLines.forEach((line: string) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
    yPos += 3;
  }

  // Deliller
  if (document.evidence_list) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DELİLLER:', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const evidenceLines = doc.splitTextToSize(document.evidence_list, pageWidth - 2 * margin);
    evidenceLines.forEach((line: string) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
    yPos += 3;
  }

  // Sonuç ve İstem
  if (document.conclusion_request) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SONUÇ VE İSTEM:', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // Yasal uyarıyı ayır
    let conclusionText = document.conclusion_request;
    const disclaimerIndex = conclusionText.indexOf('DİKKAT:');
    let disclaimerText = '';
    
    if (disclaimerIndex !== -1) {
      disclaimerText = conclusionText.substring(disclaimerIndex);
      conclusionText = conclusionText.substring(0, disclaimerIndex).trim();
    }
    
    // Sonuç ve istem metnini ekle
    const conclusionLines = doc.splitTextToSize(conclusionText, pageWidth - 2 * margin - 5);
    conclusionLines.forEach((line: string) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
    
    // Yasal uyarıyı ayrı bir kutu içinde göster (PDF'de küçük fontla)
    if (disclaimerText) {
      yPos += 5;
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.setFontSize(8);
      doc.setTextColor(150, 100, 0); // Sarımsı renk
      const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - 2 * margin - 5);
      disclaimerLines.forEach((line: string) => {
        if (yPos > pageHeight - 10) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin + 5, yPos);
        yPos += 4;
      });
      doc.setTextColor(0, 0, 0); // Siyah renge geri dön
    }
    
    yPos += 5;
  }

  // İmza bölümü (sağ alt) - Sadece sonuç ve istem varsa
  if (document.conclusion_request) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = pageHeight - 40;
    } else {
      yPos = pageHeight - 40;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Saygılarımla,', pageWidth - margin - 5, yPos, { align: 'right' });
    yPos += 10;
    
    // Tarih
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    doc.text(`Tarih: ${dateStr}`, pageWidth - margin - 5, yPos, { align: 'right' });
    yPos += 8;

    // İmza çizgisi ve alanı
    const signatureX = pageWidth - margin - 50;
    doc.setLineWidth(0.5);
    doc.line(signatureX, yPos, pageWidth - margin - 5, yPos);
    yPos += 6;
    doc.setFontSize(9);
    
    // Davacı adını çıkar (varsa)
    let plaintiffName = '';
    if (document.plaintiff_details) {
      const nameMatch = document.plaintiff_details.match(/(?:Adı|Adı Soyadı)[\s:]+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)/i);
      const surnameMatch = document.plaintiff_details.match(/Soyadı[\s:]+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)/i);
      if (nameMatch && surnameMatch) {
        plaintiffName = `${nameMatch[1]} ${surnameMatch[1]}`;
      } else if (nameMatch) {
        plaintiffName = nameMatch[1];
      }
    }
    
    if (plaintiffName) {
      doc.text(plaintiffName, pageWidth - margin - 27.5, yPos, { align: 'center' });
      yPos += 4;
    }
    doc.setFontSize(8);
    doc.text('İmza', pageWidth - margin - 27.5, yPos, { align: 'center' });
  }

  // Dosya adı oluştur
  const fileName = `dilekce_${document.subject?.substring(0, 20).replace(/[^a-z0-9]/gi, '_') || 'dilekce'}_${Date.now()}.pdf`;
  
  // PDF'i indir
  doc.save(fileName);
}

