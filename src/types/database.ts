export interface Case {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'in_progress' | 'completed';
  case_type: string;
  title: string;
}

export interface Document {
  id: string;
  case_id: string;
  header: string;
  plaintiff_details: string;
  defendant_details: string;
  subject: string;
  incident_narrative: string;
  legal_grounds: string;
  evidence_list: string;
  conclusion_request: string;
  updated_at: string;
}

export interface Message {
  id: string;
  case_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AIResponse {
  chat_message: string;
  document_update: {
    header: string | null;
    plaintiff: string | null;  // Maps to plaintiff_details in Document
    defendant: string | null;   // Maps to defendant_details in Document
    subject: string | null;
    body: string | null;        // Maps to incident_narrative in Document
    result: string | null;      // Maps to conclusion_request in Document
    // Legacy fields for backward compatibility
    plaintiff_details?: string | null;
    defendant_details?: string | null;
    incident_narrative?: string | null;
    legal_grounds?: string | null;
    evidence_list?: string | null;
    conclusion_request?: string | null;
  };
  status: 'in_progress' | 'completed';
}
