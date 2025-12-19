import { useState, useEffect } from "react";
import { LOCAL_STORAGE_KEY } from "../utils/constants";
import { KeyRound } from "lucide-react";

export function ApiKeyModal({ onApiKeyReady }) {
  const [apiKey, setApiKey] = useState("");
  const [open, setOpen] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
      setOpen(false);
      onApiKeyReady(stored);
    }
  }, [onApiKeyReady]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError("Lütfen geçerli bir API anahtarı girin.");
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, apiKey.trim());
    setError("");
    setOpen(false);
    onApiKeyReady(apiKey.trim());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="dk-glass max-w-lg w-full rounded-2xl p-8 text-slate-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-dk-blue-500 flex items-center justify-center">
            <KeyRound className="h-5 w-5 text-slate-50" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Google Gemini API Anahtarı
            </h2>
            <p className="text-sm text-slate-300">
              DijitalKatip&apos;i kullanmak için kişisel Gemini API anahtarınızı
              girmeniz gerekmektedir. Anahtar tarayıcınızda yerel olarak
              saklanır.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              API Anahtarı
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-dk-blue-400 focus:border-transparent"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {error && (
              <p className="text-xs text-red-300 font-medium">{error}</p>
            )}
            <p className="text-xs text-slate-400">
              Not: Anahtarınız güvenliğiniz için yalnızca bu tarayıcıda,
              <span className="font-semibold"> localStorage</span>&apos;da
              saklanır ve sunucuya gönderilmez.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-dk-blue-500 px-4 py-2 text-sm font-medium text-slate-50 shadow-sm hover:bg-dk-blue-600 focus:outline-none focus:ring-2 focus:ring-dk-blue-400 focus:ring-offset-1 focus:ring-offset-slate-900 transition"
            >
              Kaydet ve Devam Et
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


