import { AIResponse, Document, Message } from '../types/database';
import { MODEL_NAME, SYSTEM_PROMPT } from '../utils/constants';

// Proxy URL - API key proxy tarafından yönetiliyor
const PROXY_URL = "https://yigit-gemini-proxy.yigit-turkkan.workers.dev";

// Proxy üzerinden Gemini API çağrısı yap
async function callGeminiViaProxy(
  message: string, 
  systemInstruction: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }> = []
): Promise<string> {
  // Send to proxy (worker expects: message, history, systemInstruction)
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      history: history,
      systemInstruction: systemInstruction,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Proxy API hatası: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Worker returns Gemini API response format
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    const text = data.candidates[0].content.parts[0].text;
    return text;
  }
  
  throw new Error("Geçersiz API yanıtı");
}

export async function generateAIResponse(
  messages: Message[],
  userMessage: string,
  document: Document
): Promise<AIResponse> {
  try {
    const documentContext = `
Mevcut Belge Bilgileri:
- Başlık: ${document.header || 'Henüz belirlenmedi'}
- Konu: ${document.subject || 'Henüz belirlenmedi'}
- Davacı Bilgileri: ${document.plaintiff_details || 'Henüz eklenmedi'}
- Davalı Bilgileri: ${document.defendant_details || 'Henüz eklenmedi'}
- Olay Anlatımı: ${document.incident_narrative || 'Henüz eklenmedi'}
- Deliller: ${document.evidence_list || 'Henüz eklenmedi'}
`;

    // Convert messages to Gemini API format for history
    const geminiHistory = messages.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const conversationHistory = messages.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.content}`
    ).join('\n');

    // Build system instruction with document context
    const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${documentContext}\n\n${conversationHistory ? conversationHistory + '\n\n' : ''}`;

    const aiText = await callGeminiViaProxy(userMessage, fullSystemInstruction, geminiHistory);

    let jsonText = aiText.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }
    
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    const parsed = JSON.parse(jsonText);
    
    return {
      chat_message: parsed.chat_message || aiText,
      document_update: {
        header: parsed.document_update?.header ?? null,
        plaintiff: parsed.document_update?.plaintiff ?? null,
        defendant: parsed.document_update?.defendant ?? null,
        subject: parsed.document_update?.subject ?? null,
        body: parsed.document_update?.body ?? null,
        result: parsed.document_update?.result ?? null,
      },
      status: 'in_progress',
    };
  } catch (error) {
    console.error('Proxy API hatası:', error);
    return {
      chat_message: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
      document_update: {
        header: null,
        plaintiff: null,
        defendant: null,
        subject: null,
        body: null,
        result: null,
      },
      status: 'in_progress',
    };
  }
}
