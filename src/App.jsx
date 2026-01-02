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
    <div className="min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <ApiKeyModal onApiKeyReady={handleApiKeyReady} />

      <main className="w-full max-w-5xl space-y-4 sm:space-y-6">
        <section className="flex flex-col gap-3 sm:gap-4 text-slate-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-dk-blue-500 flex items-center justify-center shadow-lg shadow-dk-blue-900/50 flex-shrink-0">
              <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                DijitalKatip
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Türk hukuk sistemine uygun, resmi dilekçe oluşturma asistanı.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-300">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-slate-900/60 border border-slate-700 px-2 sm:px-3 py-1">
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 flex-shrink-0" />
              <span className="whitespace-nowrap">Sunucusuz</span>
            </div>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline">Gemini destekli</span>
            <span className="sm:hidden text-slate-400">•</span>
            <span className="text-slate-400">TDK imla uyumlu</span>
          </div>
        </section>

        <section className="h-[calc(100vh-200px)] sm:h-[70vh] min-h-[500px]">
          <Chat apiKey={apiKey} />
        </section>
      </main>
    </div>
  );
}

export default App;





