import { GoogleGenerativeAI } from "@google/generative-ai";
import { MODEL_NAME, SYSTEM_PROMPT } from "../utils/constants";

export function createGeminiClient(apiKey) {
  if (!apiKey) {
    throw new Error("API anahtarı bulunamadı.");
  }

  // Google Generative AI SDK - varsayılan API versiyonunu kullanır
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT
  });

  async function sendMessage({ message, history }) {
    // Sohbet geçmişini API'nin istediği formata çeviriyoruz
    const contents = [];

    if (Array.isArray(history)) {
      history.forEach((item) => {
        // Boş mesajları veya hatalı objeleri filtrele
        if (!item.text) return; 
        
        contents.push({
          // Senin React state'inde "bot" diyorsan buraya "model" olarak çevirmen lazım
          role: item.role === "user" ? "user" : "model", 
          parts: [{ text: item.text }]
        });
      });
    }

    // En son kullanıcının yeni mesajını ekle
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    try {
      // generateContent, her seferinde tüm geçmişi manuel gönderdiğin için "stateless" çalışır.
      // Bu yapı senin React uygulaman için uygundur.
      const result = await model.generateContent({
        contents,
        generationConfig: {
          responseMimeType: "application/json" // JSON modu
          // responseSchema kaldırıldı - Gemini API'nin type: ["object", "null"] formatını desteklemediği için
          // System prompt ile JSON formatı zorunlu kılındı
        }
      });

      const rawText = result.response.text();

      // JSON Parse İşlemi - Birden fazla deneme
      let cleanText = rawText.trim();
      
      // Markdown code block'larını temizle
      cleanText = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      
      // Eğer başında { yoksa, JSON'ı bulmaya çalış
      if (!cleanText.startsWith("{")) {
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanText = jsonMatch[0];
        }
      }

      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch (err) {
        console.error("JSON Parse Hatası:", err);
        console.error("Ham Cevap:", rawText);
        console.error("Temizlenmiş Metin:", cleanText);
        
        // Son çare: Eğer JSON değilse ama metin varsa, kullanıcıya göster
        // Ancak bu durumda AI'ya tekrar sormak daha iyi olur
        throw new Error("AI geçerli bir JSON üretmedi. Lütfen tekrar deneyin veya mesajınızı yeniden yazın.");
      }

      // Beklenen format kontrolü
      if (!parsed.status) {
         // Eğer status yoksa, varsayılan değerlerle doldur
         return {
             status: "chatting",
             message_to_user: parsed.message_to_user || rawText.substring(0, 200) + "...",
             petition_data: parsed.petition_data || null
         };
      }

      // Status kontrolü - sadece "chatting" veya "completed" olabilir
      if (parsed.status !== "chatting" && parsed.status !== "completed") {
        parsed.status = "chatting";
      }

      return parsed;

    } catch (error) {
      console.error("Gemini API Hatası:", error);
      throw error; // Hatayı UI'da yakalamak için fırlatıyoruz
    }
  }

  return {
    sendMessage
  };
}