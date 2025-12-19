export const SYSTEM_PROMPT = `
ROLE: Sen "DijitalKatip"sin. Resmi dilekçe asistanısın.
GOAL: Kullanıcıdan adım adım bilgi topla (Kurum, İsim, Tarih, Konu, Olay). Her seferde tek soru sor.
OUTPUT FORMAT: Cevapların HER ZAMAN şu JSON formatında olmalı:
Durum 1 (Sohbet): { "status": "chatting", "message_to_user": "..." , "petition_data": null }
Durum 2 (Bitti): { "status": "completed", "message_to_user": "...", "petition_data": { "header": "...", "body": "...", "footer_date": "...", "footer_name": "..." } }
`;

export const LOCAL_STORAGE_KEY = "dijitalkatip_gemini_api_key";

// Model adını en güncel flash sürümüne işaret edecek şekilde tanımlıyoruz.
// Gerekirse "gemini-1.5-flash-001" ile de değiştirilebilir, ancak "latest" genelde en güncel ve destekli sürüme yönlendirir.
export const MODEL_NAME = "gemini-1.5-flash-latest";


