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
      setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!lastPetition) return;
    try {
      setLoading(true);
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
    <div className="flex flex-col h-full dk-card rounded-2xl overflow-hidden">
      <header className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-dk-blue-600 flex items-center justify-center shadow-sm">
            <FileText className="h-4 w-4 text-slate-50" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900">
              DijitalKatip
            </h1>
            <p className="text-xs text-slate-500">
              Türk hukuk sistemine uygun resmi dilekçe asistanı
            </p>
          </div>
        </div>

        {showDownloadButton && (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-full bg-dk-blue-500 px-4 py-1.5 text-xs font-medium text-slate-50 shadow-sm hover:bg-dk-blue-600 focus:outline-none focus:ring-2 focus:ring-dk-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Dilekçeyi İndir (PDF)
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-slate-50 to-slate-100">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-sm px-8">
            <Bot className="h-10 w-10 mb-3 text-dk-blue-500" />
            <p className="font-medium text-slate-600 mb-1">
              Merhaba, ben DijitalKatip.
            </p>
            <p>
              Resmi kurumlara, okullara veya belediyelere iletmek istediğiniz
              dilekçeleri adım adım birlikte hazırlayalım.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Başlamak için aşağıya kısaca talebinizi yazabilirsiniz.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border",
                msg.role === "user"
                  ? "bg-dk-blue-600 text-slate-50 border-dk-blue-700 rounded-br-sm"
                  : "bg-white text-slate-900 border-slate-200 rounded-bl-sm"
              )}
            >
              <div className="flex items-center gap-2 mb-1 text-xs font-medium">
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
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-dk-blue-500" />
            <span>DijitalKatip yazıyor...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 max-w-3xl mx-auto"
        >
          <div className="flex-1">
            <div className="relative">
              <textarea
                rows={1}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-dk-blue-400 focus:border-transparent shadow-sm"
                placeholder="Talebinizi veya açıklamanızı yazın. Örneğin: Kiracı olarak kira sözleşmemi feshetmek istiyorum..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              İpucu: &quot;Dilekçe yaz&quot; diyerek başlayabilir, devamında
              kurum ve konuyu açıklayabilirsiniz.
            </p>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading || !client}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-dk-blue-600 text-slate-50 shadow-sm hover:bg-dk-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dk-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition"
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



