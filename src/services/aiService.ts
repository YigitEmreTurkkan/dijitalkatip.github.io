import { AIResponse, Document, Message } from '../types/database';
import { MODEL_NAME, SYSTEM_PROMPT } from '../utils/constants';

// Proxy URL - API key proxy tarafından yönetiliyor
const PROXY_URL = "https://yigit-gemini-proxy.yigit-turkkan.workers.dev";

// Proxy üzerinden Gemini API çağrısı yap
// GÜNCELLEME: Temperature (yaratıcılık) parametresi eklendi
async function callGeminiViaProxy(
  message: string, 
  systemInstruction: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }> = [],
  temperature: number = 0.7 
): Promise<string> {
  // Send to proxy (worker expects: message, history, systemInstruction, generationConfig)
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      history: history,
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: temperature, // Yaratıcılık ayarı buraya gidiyor
        topP: 0.95,
        topK: 40,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Proxy API hatası: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Worker returns { text: "..." } format
  if (data.text) {
    return data.text;
  }
  
  // Fallback: Check for Gemini API format
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    const text = data.candidates[0].content.parts[0].text;
    return text;
  }
  
  // Log the actual response for debugging
  console.error('Unexpected response format:', data);
  throw new Error(`Geçersiz API yanıtı: ${JSON.stringify(data)}`);
}

export async function generateAIResponse(
  messages: Message[],
  userMessage: string,
  document: Document
): Promise<AIResponse> {
  try {
    // GÜNCELLEME: Daha yaratıcı ve avukat kimliğine bürünmüş prompt
    const documentContext = `
GÖREV: Sen tecrübeli bir hukukçusun. Amacın sadece bilgi vermek değil, hukuki jargona hakim, ikna edici ve müvekkil lehine en güçlü dilekçeyi yazmaktır.

DOSYA DETAYLARI:
- Başlık: ${document.header || 'Olayın niteliğine göre uygun bir başlık seç'}
- Konu: ${document.subject || 'Hukuki dayanaklarıyla özetle'}
- Davacı: ${document.plaintiff_details || 'Belirtilmemiş'}
- Davalı: ${document.defendant_details || 'Belirtilmemiş'}
- Olay: ${document.incident_narrative || 'Henüz detaylandırılmadı'}
- Deliller: ${document.evidence_list || 'Henüz sunulmadı'}

KURALLAR:
1. Robotik cevaplardan kaçın. "Yapay zeka dili" yerine "Hukuk dili" kullan.
2. "document_update.body" kısmını yazarken Yargıtay kararlarına atıf yapar gibi profesyonel, akıcı ve ikna edici bir üslup takın.
3. Kullanıcı kısa bir bilgi verse bile (örn: "borcunu ödemedi"), sen bunu hukuki terimlerle genişlet (örn: "Davalı, müvekkile olan edimini ifa etmekten kaçınarak temerrüde düşmüştür...").
`;

    // GÜNCELLEME: Geçmişi daha temiz formatlıyoruz
    const geminiHistory = messages.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // System Instruction içine documentContext ekleniyor
    const fullSystemInstruction = `${SYSTEM_PROMPT}\n\n${documentContext}`;

    // GÜNCELLEME: Temperature 0.8 ile çağrı yapılıyor (Yaratıcı mod)
    const aiText = await callGeminiViaProxy(
        userMessage, 
        fullSystemInstruction, 
        geminiHistory,
        0.8 
    );

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
    
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    } catch (e) {
        console.warn("JSON Parse hatası, ham metin kullanılıyor");
        return {
             chat_message: aiText,
             document_update: { ...document },
             status: 'in_progress',
        };
    }
    
    return {
      chat_message: parsed.chat_message || aiText,
      document_update: {
        header: parsed.document_update?.header ?? document.header,
        plaintiff: parsed.document_update?.plaintiff ?? document.plaintiff_details,
        defendant: parsed.document_update?.defendant ?? document.defendant_details,
        subject: parsed.document_update?.subject ?? document.subject,
        body: parsed.document_update?.body ?? document.body,
        result: parsed.document_update?.result ?? document.result,
      },
      status: 'in_progress',
    };
  } catch (error) {
    console.error('Proxy API hatası:', error);
    return {
      chat_message: 'Üzgünüm, bir hata oluştu. Ancak hukuki sürece devam edebiliriz, lütfen tekrar deneyin.',
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
