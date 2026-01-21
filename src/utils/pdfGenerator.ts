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

  // html2pdf renders via html2canvas -> jsPDF; since we render from the browser,
  // Turkish characters are handled by the active web fonts.
  const opt = {
    margin: [12, 12, 14, 12],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  await html2pdf().set(opt).from(element).save();
}

