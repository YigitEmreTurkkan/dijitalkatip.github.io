import html2pdf from 'html2pdf.js';

function defaultFileName(subject?: string | null) {
  const safeSubject =
    subject?.substring(0, 40).replace(/[^a-z0-9çğıöşüÇĞİÖŞÜ]/gi, '_') || 'dilekce';
  return `dilekce_${safeSubject}_${Date.now()}.pdf`;
}

export async function generatePDF(
  element: HTMLElement,
  options?: { fileName?: string; subject?: string | null }
): Promise<void> {
  const fileName = options?.fileName ?? defaultFileName(options?.subject);

  // Clone the element to avoid modifying the visible DOM
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Apply specific print styles to the clone
  clone.style.fontFamily = '"Times New Roman", Times, serif';
  clone.style.fontSize = '12pt';
  clone.style.lineHeight = '1.5';
  clone.style.color = '#000000';
  clone.style.background = '#ffffff';
  clone.style.width = '100%';
  clone.style.maxWidth = 'none';
  clone.style.margin = '0';
  clone.style.padding = '20px'; // Add some padding for the content itself inside margins
  
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm'; // A4 width
  container.appendChild(clone);
  document.body.appendChild(container);

  const opt = {
    margin: [20, 20, 20, 20], // standard 2cm margins
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollY: 0,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  try {
    await html2pdf().set(opt).from(clone).save();
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

