import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "../utils/cn";
import { createGeminiClient } from "../services/api";
import { generatePetitionPdf } from "../utils/pdf";
import {
  Send,
  FileText,
  Loader2,
  Bot,
  User,
  Download
} from "lucide-react";

export function Chat({ apiKey }) {
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastPetition, setLastPetition] = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (!apiKey) return;
    try {
      const c = createGeminiClient(apiKey);
      setClient(c);
    } catch (e) {
      setError(e.message || "Gemini istemcisi oluşturulamadı.");
    }
  }, [apiKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !client || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: input.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const responseJson = await client.sendMessage({
        message: userMessage.text,
        history
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: responseJson.message_to_user || "",
        raw: responseJson
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (responseJson.status === "completed" && responseJson.petition_data) {
        setLastPetition(responseJson.petition_data);
      }
    } catch (err) {
      console.error(err);
      // Daha kullanıcı dostu hata mesajları
      let errorMessage = "Bir hata oluştu. Lütfen tekrar deneyin.";
      
      if (err.message?.includes("JSON")) {
        errorMessage = "AI yanıtı işlenemedi. Lütfen mesajınızı yeniden yazın veya sayfayı yenileyin.";
      } else if (err.message?.includes("API key")) {
        errorMessage = "API anahtarı geçersiz. Lütfen ayarlardan API anahtarınızı kontrol edin.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!lastPetition) return;
    try {
      setLoading(true);
      setError("");

      // Şu anda yalnızca JS tabanlı PDF motoru (jsPDF + DejaVu) kullanılıyor.
      // Python/Pyodide tabanlı motor Türkçe karakterlerde bozulma yarattığı için devre dışı.
      await generatePetitionPdf(lastPetition);
    } catch (err) {
      console.error(err);
      setError("PDF oluşturulurken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const showDownloadButton =
    lastPetition &&
    messages.some(
      (m) =>
        m.role === "assistant" &&
        m.raw?.status === "completed" &&
        m.raw?.petition_data
    );

  return (
    <div className="flex flex-col h-full dk-card rounded-2xl overflow-hidden shadow-lg">
      <header className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-dk-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-50" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 truncate">
              DijitalKatip
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">
              Türk hukuk sistemine uygun resmi dilekçe asistanı
            </p>
          </div>
        </div>

        {showDownloadButton && (
          <button
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-dk-blue-500 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-medium text-slate-50 shadow-sm hover:bg-dk-blue-600 focus:outline-none focus:ring-2 focus:ring-dk-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Dilekçeyi İndir (PDF)</span>
            <span className="sm:hidden">İndir</span>
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-slate-50 to-slate-100 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-sm px-4 sm:px-8 animate-fade-in">
            <Bot className="h-10 w-10 sm:h-12 sm:w-12 mb-3 text-dk-blue-500 animate-bounce-slow" />
            <p className="font-medium text-slate-600 mb-1 text-base sm:text-lg">
              Merhaba, ben DijitalKatip.
            </p>
            <p className="text-sm sm:text-base max-w-md">
              Resmi kurumlara, okullara veya belediyelere iletmek istediğiniz
              dilekçeleri adım adım birlikte hazırlayalım.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Başlamak için aşağıya kısaca talebinizi yazabilirsiniz.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full animate-slide-up",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div
              className={cn(
                "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm shadow-sm border transition-all",
                msg.role === "user"
                  ? "bg-dk-blue-600 text-slate-50 border-dk-blue-700 rounded-br-sm"
                  : "bg-white text-slate-900 border-slate-200 rounded-bl-sm"
              )}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 text-[10px] sm:text-xs font-medium">
                {msg.role === "user" ? (
                  <>
                    <span className="text-slate-100">Siz</span>
                    <User className="h-3 w-3 text-slate-100" />
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3 text-dk-blue-600" />
                    <span className="text-dk-blue-700">DijitalKatip</span>
                  </>
                )}
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:text-inherit prose-strong:text-inherit">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 px-2 animate-fade-in">
            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-dk-blue-500" />
            <span>DijitalKatip işlem yapıyor...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700 animate-shake">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 px-3 sm:px-4 py-2 sm:py-3">
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 max-w-3xl mx-auto"
        >
          <div className="flex-1 min-w-0">
            <div className="relative">
              <textarea
                rows={1}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-dk-blue-400 focus:border-transparent shadow-sm transition-all"
                placeholder="Talebinizi yazın..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !loading && client) {
                      handleSend(e);
                    }
                  }
                }}
                style={{ maxHeight: "120px" }}
              />
            </div>
            <p className="mt-1 text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
              İpucu: &quot;Dilekçe yaz&quot; diyerek başlayabilirsiniz. Enter ile gönder, Shift+Enter ile yeni satır.
            </p>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading || !client}
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-dk-blue-600 text-slate-50 shadow-sm hover:bg-dk-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dk-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-all active:scale-95 flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}



