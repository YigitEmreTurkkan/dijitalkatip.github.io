import { GoogleGenerativeAI } from "@google/generative-ai";
import { MODEL_NAME, SYSTEM_PROMPT } from "../utils/constants";

export function createGeminiClient(apiKey) {
  if (!apiKey) {
    throw new Error("API anahtarı bulunamadı.");
  }

  // Bazı hesaplarda 1.5 modelleri yalnızca v1 API üzerinden erişilebilir.
  const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT
  });

  async function sendMessage({ message, history }) {
    const contents = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item.text) continue;
        contents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.text }]
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const result = await model.generateContent({
      contents,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const rawText = result?.response?.text?.() ?? "";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error("JSON parse hatası:", err, rawText);
      throw new Error(
        "Gemini yanıtı geçerli JSON formatında değil. Lütfen tekrar deneyin."
      );
    }

    if (
      !parsed ||
      (parsed.status !== "chatting" && parsed.status !== "completed")
    ) {
      throw new Error("Beklenmeyen JSON formatı alındı.");
    }

    return parsed;
  }

  return {
    sendMessage
  };
}


