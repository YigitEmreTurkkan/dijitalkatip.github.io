// Dilekçe türlerine göre soru ağaçları (Decision Trees)

export interface QuestionTree {
  caseType: string;
  questions: QuestionStep[];
}

export interface QuestionStep {
  id: string;
  question: string;
  field: string;
  required: boolean;
  validation?: (answer: string) => boolean;
}

export const QUESTION_TREES: Record<string, QuestionStep[]> = {
  // Aile Hukuku - Boşanma
  family: [
    {
      id: 'divorce_reason',
      question: 'Boşanma gerekçeniz nedir? (Şiddetli geçimsizlik, zina, terk, akıl hastalığı vb.)',
      field: 'divorce_reason',
      required: true,
    },
    {
      id: 'marriage_date',
      question: 'Evlilik tarihiniz nedir? (GG/AA/YYYY formatında)',
      field: 'marriage_date',
      required: true,
      validation: (answer) => /^\d{2}\/\d{2}\/\d{4}$/.test(answer),
    },
    {
      id: 'children',
      question: 'Müşterek çocuk var mı? Varsa kaç yaşında ve velayet kimde kalsın istiyorsunuz?',
      field: 'children_info',
      required: false,
    },
    {
      id: 'alimony',
      question: 'Tedbir nafakası veya maddi/manevi tazminat talebiniz var mı? Varsa miktarını belirtin.',
      field: 'alimony_request',
      required: false,
    },
    {
      id: 'property',
      question: 'Mal rejimi sözleşmesi var mı? Varsa detaylarını belirtin.',
      field: 'property_regime',
      required: false,
    },
  ],

  // Ceza Hukuku - Şikayet
  criminal: [
    {
      id: 'crime_date',
      question: 'Suç tarihi ve yeri tam olarak nedir? (Yetkili savcılık tespiti için kritik)',
      field: 'crime_date_location',
      required: true,
    },
    {
      id: 'suspect_info',
      question: 'Şüpheli biliniyor mu? Biliniyorsa adı, soyadı ve varsa TC kimlik numarasını belirtin. Bilinmiyorsa "Faili Meçhul" yazacağız.',
      field: 'suspect_info',
      required: true,
    },
    {
      id: 'crime_description',
      question: 'Suçun maddi ve manevi unsurlarını detaylıca anlatın. (Ne oldu? Nasıl oldu? Kim yaptı?)',
      field: 'crime_description',
      required: true,
    },
    {
      id: 'evidence',
      question: 'Elinizde delil var mı? (Kamera kaydı, WhatsApp yazışması, tanık, fotoğraf vb.) Varsa detaylarını belirtin.',
      field: 'evidence_details',
      required: false,
    },
    {
      id: 'witnesses',
      question: 'Tanık var mı? Varsa adları ve iletişim bilgilerini belirtin.',
      field: 'witnesses',
      required: false,
    },
  ],

  // İcra ve İflas
  execution: [
    {
      id: 'execution_file_no',
      question: 'İcra dosya numarası ve İcra Dairesi adı nedir?',
      field: 'execution_file_info',
      required: true,
    },
    {
      id: 'objection_type',
      question: 'Borca mı itiraz ediyorsunuz yoksa imzaya mı? (Bu ayrım hayati önem taşır)',
      field: 'objection_type',
      required: true,
      validation: (answer) => answer.toLowerCase().includes('borç') || answer.toLowerCase().includes('imza'),
    },
    {
      id: 'debt_amount',
      question: 'Borç miktarı nedir? (TL cinsinden)',
      field: 'debt_amount',
      required: false,
    },
    {
      id: 'payment_status',
      question: 'Borç ödendiyse dekont tarihi nedir? Ödenmediyse neden ödenmediğini belirtin.',
      field: 'payment_status',
      required: false,
    },
  ],

  // Akademik ve İdari
  administrative: [
    {
      id: 'appeal_type',
      question: 'İtiraz konusu nedir? (Etik İhlal, Yetersiz Yayın, Asgari Şart Eksikliği, Eser İnceleme Başarısız vb.)',
      field: 'appeal_type',
      required: true,
    },
    {
      id: 'jury_date',
      question: 'Jüri raporunun tebliğ tarihi nedir? (Süre hesabı için kritik - GG/AA/YYYY)',
      field: 'jury_notification_date',
      required: true,
      validation: (answer) => /^\d{2}\/\d{2}\/\d{4}$/.test(answer),
    },
    {
      id: 'objection_details',
      question: 'Hangi esere, hangi gerekçeyle itiraz ediliyor? (Örn: "Yağmacı dergi" iddiası, yetersiz atıf vb.)',
      field: 'objection_details',
      required: true,
    },
    {
      id: 'regulation_reference',
      question: 'İlgili yönetmelik maddesi nedir? (ÜAK Yönetmeliği, Etik Kurul Kararları vb.)',
      field: 'regulation_reference',
      required: false,
    },
  ],

  // İş Hukuku
  labor: [
    {
      id: 'employment_start',
      question: 'İşe başlama tarihiniz nedir? (GG/AA/YYYY)',
      field: 'employment_start_date',
      required: true,
    },
    {
      id: 'termination_date',
      question: 'İşten çıkarılma tarihiniz nedir? (GG/AA/YYYY)',
      field: 'termination_date',
      required: true,
    },
    {
      id: 'termination_reason',
      question: 'İşten çıkarılma nedeni nedir? (İşveren tarafından mı çıkarıldınız, kendi isteğinizle mi ayrıldınız?)',
      field: 'termination_reason',
      required: true,
    },
    {
      id: 'severance',
      question: 'Kıdem ve ihbar tazminatı ödendi mi? Ödenmediyse neden ödenmediğini belirtin.',
      field: 'severance_status',
      required: false,
    },
  ],

  // Tüketici Hukuku
  consumer: [
    {
      id: 'purchase_date',
      question: 'Alışveriş tarihi nedir? (GG/AA/YYYY)',
      field: 'purchase_date',
      required: true,
    },
    {
      id: 'product_service',
      question: 'Satın aldığınız ürün veya hizmet nedir?',
      field: 'product_service',
      required: true,
    },
    {
      id: 'problem_description',
      question: 'Sorun nedir? (Ayıplı ürün, hizmet eksikliği, garanti ihlali vb.)',
      field: 'problem_description',
      required: true,
    },
    {
      id: 'seller_contact',
      question: 'Satıcı ile görüşme yaptınız mı? Yaptıysanız sonuç ne oldu?',
      field: 'seller_contact',
      required: false,
    },
  ],

  // Kira Tahliyesi
  eviction: [
    {
      id: 'rental_start',
      question: 'Kira sözleşmesi başlangıç tarihi nedir? (GG/AA/YYYY)',
      field: 'rental_start_date',
      required: true,
    },
    {
      id: 'rent_amount',
      question: 'Aylık kira tutarı nedir? (TL)',
      field: 'rent_amount',
      required: true,
    },
    {
      id: 'unpaid_months',
      question: 'Kaç ay kira ödenmedi?',
      field: 'unpaid_months',
      required: true,
    },
    {
      id: 'rental_agreement',
      question: 'Yazılı kira sözleşmesi var mı?',
      field: 'has_rental_agreement',
      required: false,
    },
  ],
};

// Soru sırasını belirleyen fonksiyon
export function getNextQuestion(
  caseType: string | null,
  context: Record<string, any>
): QuestionStep | null {
  if (!caseType || !QUESTION_TREES[caseType]) {
    return null;
  }

  const questions = QUESTION_TREES[caseType];
  
  // İlk sorulmamış soruyu bul
  for (const question of questions) {
    if (!context[question.field] && question.required) {
      return question;
    }
  }

  // Tüm zorunlu sorular sorulduysa, opsiyonel soruları sor
  for (const question of questions) {
    if (!context[question.field] && !question.required) {
      return question;
    }
  }

  return null;
}

