import { useState, useCallback } from "react";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { Chat } from "./components/Chat";
import { Scale, ShieldCheck } from "lucide-react";

function App() {
  const [apiKey, setApiKey] = useState("");

  const handleApiKeyReady = useCallback((key) => {
    setApiKey(key);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <ApiKeyModal onApiKeyReady={handleApiKeyReady} />

      <main className="w-full max-w-5xl space-y-6">
        <section className="flex flex-col gap-4 text-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-dk-blue-500 flex items-center justify-center shadow-lg shadow-dk-blue-900/50">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                DijitalKatip
              </h1>
              <p className="text-sm text-slate-300">
                Türk hukuk sistemine uygun, resmi dilekçe oluşturma asistanı.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 border border-slate-700 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sunucusuz · Tüm işlemler tarayıcınızda çalışır</span>
            </div>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span>Gemini destekli · Resmi yazışma ve TDK imla uyumlu</span>
          </div>
        </section>

        <section className="h-[70vh]">
          <Chat apiKey={apiKey} />
        </section>
      </main>
    </div>
  );
}

export default App;





