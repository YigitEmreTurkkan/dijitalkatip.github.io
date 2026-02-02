import { useState, useEffect, useRef } from 'react';
import { Send, Scale } from 'lucide-react';
import { Message } from '../types/database';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-slate-800 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Dijital Katip</h1>
            <p className="text-sm text-slate-300">Hukuki Asistan</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-md mx-auto">
              <Scale className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Hoş geldiniz!
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Ben Dijital Katip, Türk hukuku konusunda size yardımcı olmak için buradayım.
                Hukuki sorununuzu anlatın ve sizin için resmi bir dilekçe hazırlayayım.
              </p>
              <div className="mt-4 text-xs text-slate-500 space-y-1">
                <p>• Tüketici Hukuku</p>
                <p>• İş Hukuku</p>
                <p>• Aile Hukuku</p>
                <p>• Ceza Hukuku</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-5 text-lg ${message.role === 'user'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-800 shadow-sm border border-slate-200'
                }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-lg text-slate-600">Yanıt hazırlanıyor...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 relative z-20">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ne yapmak istiyorsunuz? Buraya yazın..."
            disabled={isLoading}
            className="flex-1 px-5 py-4 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-800/20 focus:border-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-slate-900 text-white px-8 py-4 rounded-xl hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Send className="w-7 h-7" />
            <span className="hidden sm:inline text-lg font-medium">Gönder</span>
          </button>
        </form>
      </div>
    </div>
  );
}
