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
        }
      });

      const rawText = result.response.text();

      // JSON Parse İşlemi
      // Bazen model JSON'ı ```json ... ``` blokları içine alabilir, temizlemek gerekebilir.
      const cleanText = rawText.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch (err) {
        console.error("Ham Cevap:", rawText);
        throw new Error("AI geçerli bir JSON üretmedi.");
      }

      // Beklenen format kontrolü
      if (!parsed.status) {
         // Eğer status yoksa AI muhtemelen saçmaladı, manuel düzeltme yapıyoruz
         return {
             status: "chatting",
             message_to_user: parsed.message_to_user || "Anlaşılamadı, tekrar eder misiniz?",
             petition_data: null
         };
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