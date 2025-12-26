# DijitalKatip Prompt ve Çıktı İyileştirme Rehberi

## 🎯 Mevcut Durum Analizi

### Güçlü Yönler:
- ✅ İki fazlı çalışma (Draft → Finalize)
- ✅ Hukuk alanı bilgisi (TBK, TMK, HMK)
- ✅ JSON formatı net

### İyileştirme Alanları:
- ⚠️ `dilekçe.md` içeriği prompt'a tam entegre değil
- ⚠️ Hata önleme mekanizmaları eksik
- ⚠️ Çıktı tutarlılığı için daha fazla örnek gerekli
- ⚠️ PDF formatı için daha detaylı talimatlar

---

## 📋 İyileştirme Önerileri

### 1. PROMPT İYİLEŞTİRMELERİ

#### A) `dilekçe.md` Entegrasyonu
```javascript
// dilekçe.md içeriğini prompt'a ekle
const KNOWLEDGE_BASE = `
DAMAGE CLAIMS (Maddi Tazminat):
- Always calculate: Material damage + Labor costs + Lost income (closed shop days)
- Required evidence: Expert report (Bilirkişi Raporu), Damage photos, Invoice records
- Legal basis: TBK 49, 50, 51

MENFI TESPIT (Debt Disputes):
- ALWAYS include: İhtiyati Tedbir (Stay of Execution) request
- Distinguish: Stolen checks vs Disputed invoices
- Required evidence: Check/Note copies, Police report (if stolen), Contract documents
- Legal basis: HMK 389, TBK 125

EVICTION (Tahliye - TBK 350):
- MUST collect: Full property address, Purchase date, Notary notification date
- Reference: Law 6570, TBK 350
- Required evidence: Title deed (Tapu), Notary notification (İhtarname), Lease contract
- Legal basis: TBK 350, 6570 Sayılı Kanun

GUARDIANSHIP (Vasi Tayini):
- Focus: Clinical diagnosis (Alzheimer, dementia, old age)
- Specify: Inability to manage specific assets (e.g., Board Chairmanship)
- Required evidence: Medical reports, Hospital records, Expert medical opinion
- Legal basis: TMK 404, 405

TITLE DEED CANCELLATION (Tapu İptal):
- Check: Muvazaa (collusion), Kinship issues
- Request: Injunction to prevent sale to 3rd parties
- Required evidence: Title deed, Inheritance certificate, Family relationship documents
- Legal basis: TMK 202, 203

INHERITANCE REJECTION (Redd-i Miras):
- CRITICAL: 3-month legal window (TMK 606)
- Required evidence: Death certificate, Inheritance certificate
- Legal basis: TMK 606, 607
`;
```

#### B) Hata Önleme Kuralları
```javascript
ERROR PREVENTION RULES:
- Before finalizing, ALWAYS verify:
  1. All required fields filled (no placeholders)
  2. Dates in correct format (DD.MM.YYYY)
  3. Addresses complete (street, district, city)
  4. Party names spelled correctly
  5. Legal basis codes match case type
  6. Evidence list matches case requirements

- If ANY field missing, ask again (never guess)
- If user provides incomplete info, ask for clarification
- If legal basis unclear, suggest appropriate codes
```

#### C) Çıktı Tutarlılığı
```javascript
OUTPUT CONSISTENCY RULES:
- Header format: Always "[CITY] [COURT TYPE] SAYIN HÂKİMLİĞİ'NE"
- Subject format: Always "KONU: [Brief, formal description]"
- Body structure: ALWAYS 3+ paragraphs:
  * Paragraph 1: Introduction (parties, relationship, context)
  * Paragraph 2: Incident/Facts (chronological, detailed)
  * Paragraph 3: Legal basis + Request (formal conclusion)
- Evidence: Always numbered list (1-, 2-, 3-)
- Signature: Always "Davacı / Davacı Vekili: [Name]"
```

### 2. PDF FORMAT İYİLEŞTİRMELERİ

#### A) Tipografi İyileştirmeleri
- Font: Times New Roman (serif) - Türkçe karakter desteği
- Başlık: 14pt, Bold, Uppercase, Centered
- Gövde: 12pt, Normal, Justified (iki yana yaslı)
- Satır aralığı: 1.5 (4.5mm)
- Kenar boşlukları: 2.5cm (25mm)

#### B) Görsel Hiyerarşi
- Başlık → Dosya No → Tarih → Taraflar → Konu → Gövde → Dayanaklar → Deliller → İmza
- Her bölüm arası boşluk: 8-10mm
- Paragraflar arası: 4mm

### 3. KULLANICI DENEYİMİ İYİLEŞTİRMELERİ

#### A) Akıllı Soru Sorma
```javascript
SMART QUESTIONING:
- Don't ask obvious questions (e.g., if user says "tahliye", don't ask "hangi tür tahliye?")
- Ask follow-up questions based on case type:
  * Eviction → Address, purchase date, notification date
  * Damage → Expert report, damage photos, income loss calculation
  * Debt → Check/note details, theft report, contract
- If user provides partial info, acknowledge and ask for missing parts
```

#### B) Geri Bildirim İyileştirmeleri
```javascript
FEEDBACK IMPROVEMENTS:
- After draft: Show summary of collected info
- Before finalizing: List all fields and ask for confirmation
- If revision needed: Show what changed and why
- Success message: Include next steps (e.g., "PDF indirildi, mahkemeye başvurabilirsiniz")
```

---

## 🚀 Uygulama Adımları

### Adım 1: Prompt'u Güncelle
`src/utils/constants.js` dosyasındaki `SYSTEM_PROMPT`'u yukarıdaki iyileştirmelerle güncelle.

### Adım 2: PDF Formatını İyileştir
`src/utils/pdf.js` dosyasında:
- Justified text (iki yana yaslı) ekle
- Daha iyi boşluk yönetimi
- Türkçe karakter desteğini test et

### Adım 3: Test ve İterasyon
1. Her dilekçe türü için test yap
2. Çıktıları avukatlara göster, geri bildirim al
3. Hataları düzelt, prompt'u güncelle
4. Tekrar test et

### Adım 4: Kullanıcı Geri Bildirimi Topla
- Hangi sorular gereksiz?
- Hangi bilgiler eksik kalıyor?
- PDF formatı yeterince profesyonel mi?
- Hukuk dili doğru mu?

---

## 📊 Başarı Metrikleri

- ✅ Tüm dilekçe türleri için %95+ doğruluk
- ✅ Kullanıcı başına ortalama soru sayısı < 5
- ✅ PDF formatı %100 resmi standartlara uygun
- ✅ Hukuk dili tutarlılığı %98+

---

## 🔧 Teknik İyileştirmeler

### 1. Validation Layer Ekleyebilirsiniz
```javascript
// src/utils/validation.js
export function validatePetitionData(data) {
  const errors = [];
  
  if (!data.header) errors.push("Başlık eksik");
  if (!data.plaintiff) errors.push("Davacı bilgisi eksik");
  if (!data.defendant) errors.push("Davalı bilgisi eksik");
  if (!data.subject) errors.push("Konu eksik");
  if (!data.body || data.body.length < 100) errors.push("Gövde metni çok kısa");
  if (!data.footer_date || !/^\d{2}\.\d{2}\.\d{4}$/.test(data.footer_date)) {
    errors.push("Tarih formatı hatalı (DD.MM.YYYY olmalı)");
  }
  
  return errors;
}
```

### 2. Prompt Versioning
```javascript
// Prompt versiyonlarını takip et
export const PROMPT_VERSION = "2.1.0";
export const LAST_UPDATED = "2025-12-23";
```

### 3. A/B Testing
Farklı prompt versiyonlarını test edip hangisinin daha iyi çıktı verdiğini ölç.

---

## 💡 Sonuç

Prompt ve çıktıyı mükemmelleştirmek için:
1. **İteratif yaklaşım**: Küçük değişiklikler yap, test et, ölç
2. **Kullanıcı geri bildirimi**: Gerçek avukatların görüşlerini al
3. **Sürekli iyileştirme**: Her hafta prompt'u gözden geçir
4. **Örnek koleksiyonu**: Başarılı dilekçeleri örnek olarak sakla

