// Python tabanlı PDF oluşturucu (Pyodide + ReportLab/fpdf kullanarak)
// Bu modül Pyodide ile tarayıcıda Python çalıştırır ve profesyonel PDF üretir

let pyodideInstance = null;
let pythonInitialized = false;

/**
 * Pyodide'i yükler ve Python ortamını hazırlar
 */
async function loadPyodide() {
  if (pythonInitialized && pyodideInstance) {
    return pyodideInstance;
  }

  try {
    // Pyodide'i dinamik olarak yükle (CDN'den)
    if (typeof window.loadPyodide === 'undefined') {
      // Pyodide script'ini yükle
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Pyodide'i başlat
    pyodideInstance = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    });

    // fpdf2'yi yükle (ReportLab çok ağır, fpdf2 daha hafif ve Pyodide'de çalışır)
    // Not: Pyodide'de micropip ile paket yükleme biraz zaman alabilir
    await pyodideInstance.loadPackage(['micropip']);
    const micropip = pyodideInstance.pyimport('micropip');
    
    // fpdf2'yi yükle (eğer yüklenemezse alternatif çözüm kullanılacak)
    try {
      await micropip.install('fpdf2');
      console.log('fpdf2 başarıyla yüklendi');
    } catch (fpdfError) {
      console.warn('fpdf2 yüklenemedi, alternatif PDF oluşturma yöntemi kullanılacak:', fpdfError);
      // Alternatif: Pyodide'in kendi özelliklerini kullanarak basit PDF oluşturma
      // Bu durumda JavaScript motoruna geri dönülecek
      throw new Error('Python PDF kütüphanesi yüklenemedi');
    }

    // Python modülünü yükle (pdf_generator.py)
    try {
      // Public klasöründeki Python dosyasını yükle
      const pythonModuleResponse = await fetch('/dijitalkatip.github.io/utils/pdf_generator.py');
      if (!pythonModuleResponse.ok) {
        // Fallback: local development için
        const localResponse = await fetch('/utils/pdf_generator.py');
        if (localResponse.ok) {
          const pythonModuleCode = await localResponse.text();
          pyodideInstance.runPython(pythonModuleCode);
          console.log('Python PDF modülü başarıyla yüklendi (local)');
        } else {
          throw new Error('Python modülü bulunamadı');
        }
      } else {
        const pythonModuleCode = await pythonModuleResponse.text();
        pyodideInstance.runPython(pythonModuleCode);
        console.log('Python PDF modülü başarıyla yüklendi');
      }
    } catch (moduleError) {
      console.warn('Python modülü yüklenemedi, inline kod kullanılacak:', moduleError);
      // Modül yüklenemezse inline kod kullanılacak (fallback)
    }

    pythonInitialized = true;
    console.log('Pyodide ve fpdf2 başarıyla yüklendi');
    return pyodideInstance;
  } catch (error) {
    console.error('Pyodide yükleme hatası:', error);
    throw new Error('Python PDF motoru yüklenemedi. Lütfen sayfayı yenileyin.');
  }
}

/**
 * Python kodunu çalıştırarak PDF oluşturur
 */
async function generatePdfWithPython(petitionData) {
  const pyodide = await loadPyodide();

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

  // Tarih: kullanıcı vermediyse 23.12.2025
  const finalDate = footer_date && footer_date.trim() ? footer_date : "23.12.2025";
  const signatureLine = footer_signature || footer_name || "";

  // Python modülünü kullanarak PDF oluştur
  // pdf_generator.py modülündeki create_petition_pdf fonksiyonunu çağır
  const pythonCode = `
import json
from pdf_generator import create_petition_pdf

# Dilekçe verilerini Python dict'e çevir
petition_data = {
    'header': ${JSON.stringify(header)},
    'file_number': ${JSON.stringify(file_number)},
    'footer_date': ${JSON.stringify(finalDate)},
    'plaintiff': ${JSON.stringify(plaintiff)},
    'attorney': ${JSON.stringify(attorney)},
    'defendant': ${JSON.stringify(defendant)},
    'subject': ${JSON.stringify(subject)},
    'body': ${JSON.stringify(body)},
    'legal_grounds': ${JSON.stringify(legal_grounds)},
    'evidence': ${JSON.stringify(evidence)},
    'footer_signature': ${JSON.stringify(footer_signature)},
    'footer_name': ${JSON.stringify(footer_name)},
    'footer_address': ${JSON.stringify(footer_address)}
}

# PDF oluştur ve base64 döndür
pdf_base64 = create_petition_pdf(petition_data)
pdf_base64
`;

  try {
    // Python kodunu çalıştır ve base64 PDF'i al
    const pdfBase64 = await pyodide.runPython(pythonCode);

    // Base64'ü Blob'a çevir ve indir
    const binaryString = atob(pdfBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dilekce.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Python PDF oluşturma hatası:', error);
    throw new Error(`PDF oluşturulurken hata oluştu: ${error.message}`);
  }
}

/**
 * Ana PDF oluşturma fonksiyonu - Python motorunu kullanır
 */
export async function generatePetitionPdfPython(petitionData) {
  if (!petitionData) {
    throw new Error('Dilekçe verisi bulunamadı');
  }

  try {
    await generatePdfWithPython(petitionData);
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    throw error;
  }
}

