import { useRef } from 'react';
import { FileText, Download } from 'lucide-react';
import { Document } from '../types/database';
import { generatePDF } from '../utils/pdfGenerator';

interface DocumentViewerProps {
  document: Document | null;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const pdfRef = useRef<HTMLDivElement>(null);

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Dilekçe oluşturmak için sohbete başlayın</p>
        </div>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!document || !pdfRef.current) return;
    await generatePDF(pdfRef.current, { subject: document.subject });
  };

  return (
    <div className="h-full overflow-auto bg-white relative">
      {/* PDF İndirme Butonu */}
      {document && document.header && (
        <button
          onClick={handleDownloadPDF}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-10 transition-colors"
          title="PDF İndir"
        >
          <Download className="w-5 h-5" />
          <span>PDF İndir</span>
        </button>
      )}
      
      <div className="max-w-4xl mx-auto p-8 md:p-12 pb-24">
        <div
          ref={pdfRef}
          className="bg-white shadow-sm border border-slate-200 rounded-lg p-8 md:p-12 space-y-6 font-serif"
        >
          {document.header && (
            <div className="text-center font-bold text-lg mb-8">
              {document.header}
            </div>
          )}

          {document.plaintiff_details && (
            <div className="space-y-1">
              <div className="font-semibold">DAVACI:</div>
              <div className="pl-4 whitespace-pre-wrap">{document.plaintiff_details}</div>
            </div>
          )}

          {document.defendant_details && (
            <div className="space-y-1">
              <div className="font-semibold">DAVALI:</div>
              <div className="pl-4 whitespace-pre-wrap">{document.defendant_details}</div>
            </div>
          )}

          {document.subject && (
            <div className="space-y-1 mt-4">
              <div className="font-semibold text-base">KONU:</div>
              <div className="pl-4 whitespace-pre-wrap">{document.subject}</div>
            </div>
          )}

          {document.incident_narrative && (
            <div className="space-y-1 mt-6">
              <div className="font-semibold text-base">AÇIKLAMALAR:</div>
              <div className="pl-4 whitespace-pre-wrap leading-relaxed text-justify">
                {document.incident_narrative}
              </div>
            </div>
          )}

          {document.legal_grounds && (
            <div className="space-y-1 mt-6">
              <div className="font-semibold text-base">HUKUKİ SEBEPLER VE DELİLLER:</div>
              <div className="pl-4 whitespace-pre-wrap">{document.legal_grounds}</div>
            </div>
          )}

          {document.evidence_list && (
            <div className="space-y-1 mt-4">
              <div className="font-semibold text-base">DELİLLER:</div>
              <div className="pl-4 whitespace-pre-wrap">{document.evidence_list}</div>
            </div>
          )}

          {document.conclusion_request && (
            <div className="space-y-1 mt-6">
              <div className="font-semibold text-base">SONUÇ VE İSTEM:</div>
              <div className="pl-4 whitespace-pre-wrap leading-relaxed">{document.conclusion_request}</div>
            </div>
          )}

          {document.header && (
            <>
              <div className="pt-8 text-right">
                <div>Saygılarımla,</div>
                <div className="mt-12 border-t border-slate-300 inline-block px-8">
                  İmza
                </div>
              </div>
              {document.conclusion_request && document.conclusion_request.includes('DİKKAT') && (
                <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <div className="font-semibold text-yellow-800 mb-2">DİKKAT:</div>
                  <div className="text-sm text-yellow-700">
                    Bu belge bir taslak niteliğindedir ve avukat tavsiyesi yerine geçmez. Hukuki hak kaybı yaşamamak için bir avukata danışmanız ve metni somut olaya göre düzenlemeniz önerilir.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
