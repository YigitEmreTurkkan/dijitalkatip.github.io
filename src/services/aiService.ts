import { AIResponse, Document, Message } from '../types/database';
import { MODEL_NAME, SYSTEM_PROMPT } from '../utils/constants';

// Proxy URL - API key proxy tarafından yönetiliyor
const PROXY_URL = "https://yigit-gemini-proxy.yigit-turkkan.workers.dev";

// Proxy üzerinden Gemini API çağrısı yap
async function callGeminiViaProxy(prompt: string): Promise<string> {
  const response = await fetch(`${PROXY_URL}/v1beta/models/${MODEL_NAME}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      },
      systemInstruction: {
        parts: [{
          text: SYSTEM_PROMPT
        }]
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Proxy API hatası: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Gemini API response formatından text'i çıkar
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

    const conversationHistory = messages.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.content}`
    ).join('\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${documentContext}\n\n${conversationHistory ? conversationHistory + '\n\n' : ''}Kullanıcı: ${userMessage}\n\nAsistan:`;

    const aiText = await callGeminiViaProxy(fullPrompt);

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
