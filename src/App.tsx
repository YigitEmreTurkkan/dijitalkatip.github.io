import { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { DocumentViewer } from './components/DocumentViewer';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Case, Document, Message, AIResponse } from './types/database';
import { generateAIResponse } from './services/aiService';

// Data Accumulation: Mevcut ve yeni veriyi birleştir
function mergePlaintiffData(existing: string, newData: string): string {
  const existingLines = existing.split('\n').filter(line => line.trim());
  const newLines = newData.split('\n').filter(line => line.trim());
  
  // Mevcut satırları map'e al (key -> value)
  const existingMap = new Map<string, string>();
  existingLines.forEach(line => {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      existingMap.set(key, match[2].trim());
    }
  });
  
  // Yeni satırları ekle veya güncelle
  newLines.forEach(line => {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      existingMap.set(key, match[2].trim());
    } else {
      // Format uygun değilse direkt ekle
      existingMap.set(line.trim(), '');
    }
  });
  
  // Map'i tekrar satırlara çevir
  const result: string[] = [];
  existingMap.forEach((value, key) => {
    if (value) {
      result.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
    } else {
      result.push(key);
    }
  });
  
  return result.join('\n');
}

function mergeDefendantData(existing: string, newData: string): string {
  // Defendant için basit birleştirme (genelde tek satır)
  if (existing.trim() && newData.trim()) {
    // Eğer yeni veri mevcut veriyi içermiyorsa birleştir
    if (!newData.includes(existing) && !existing.includes(newData)) {
      return `${existing}\n${newData}`;
    }
    // Eğer yeni veri daha kapsamlıysa onu kullan
    if (newData.length > existing.length) {
      return newData;
    }
    return existing;
  }
  return newData || existing;
}

function mergeBodyData(existing: string, newData: string): string {
  // Body için: Eğer yeni veri mevcut veriyi içermiyorsa ekle
  if (existing.trim() && newData.trim()) {
    // Eğer yeni veri mevcut verinin bir parçası değilse ekle
    if (!existing.includes(newData) && !newData.includes(existing)) {
      // Yeni paragraf olarak ekle
      return `${existing}\n\n${newData}`;
    }
    // Eğer yeni veri daha kapsamlıysa onu kullan
    if (newData.length > existing.length * 1.5) {
      return newData;
    }
    return existing;
  }
  return newData || existing;
}

function App() {
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeCase();
  }, []);

  const initializeCase = async () => {
    try {
      if (isSupabaseConfigured() && supabase) {
        // Supabase kullan
        const { data: newCase, error: caseError } = await supabase
          .from('cases')
          .insert({
            status: 'in_progress',
            case_type: '',
            title: 'Yeni Dava',
          })
          .select()
          .single();

        if (caseError) throw caseError;

        const { data: newDocument, error: docError } = await supabase
          .from('documents')
          .insert({
            case_id: newCase.id,
          })
          .select()
          .single();

        if (docError) throw docError;

        setCurrentCase(newCase);
        setDocument(newDocument);
      } else {
        // Local state ile çalış (Supabase yoksa)
        const localCase: Case = {
          id: 'local-' + Date.now(),
          status: 'in_progress',
          case_type: '',
          title: 'Yeni Dava',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const localDocument: Document = {
          id: 'local-doc-' + Date.now(),
          case_id: localCase.id,
          header: '',
          subject: '',
          plaintiff_details: '',
          defendant_details: '',
          incident_narrative: '',
          legal_grounds: '',
          evidence_list: '',
          conclusion_request: '',
          updated_at: new Date().toISOString(),
        };

        setCurrentCase(localCase);
        setDocument(localDocument);
      }
    } catch (error) {
      console.error('Error initializing case:', error);
      // Hata durumunda da local state ile devam et
      const localCase: Case = {
        id: 'local-' + Date.now(),
        status: 'in_progress',
        case_type: '',
        title: 'Yeni Dava',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const localDocument: Document = {
        id: 'local-doc-' + Date.now(),
        case_id: localCase.id,
        header: '',
        subject: '',
        plaintiff_details: '',
        defendant_details: '',
        incident_narrative: '',
        legal_grounds: '',
        evidence_list: '',
        conclusion_request: '',
        updated_at: new Date().toISOString(),
      };

      setCurrentCase(localCase);
      setDocument(localDocument);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentCase || !document) return;

    setIsLoading(true);

    try {
      const useSupabase = isSupabaseConfigured() && supabase;

      let userMessage: Message;
      let assistantMessage: Message;

      if (useSupabase) {
        // Supabase kullan
        const { data: msgData, error: userMsgError } = await supabase!
          .from('messages')
          .insert({
            case_id: currentCase.id,
            role: 'user',
            content,
          })
          .select()
          .single();

        if (userMsgError) throw userMsgError;
        userMessage = msgData;
      } else {
        // Local state kullan
        userMessage = {
          id: 'msg-' + Date.now(),
          case_id: currentCase.id,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };
      }

      setMessages((prev) => [...prev, userMessage]);

      const aiResponse: AIResponse = await generateAIResponse(messages, content, document);

      if (useSupabase) {
        const { data: assistantMsgData, error: assistantMsgError } = await supabase!
          .from('messages')
          .insert({
            case_id: currentCase.id,
            role: 'assistant',
            content: aiResponse.chat_message,
          })
          .select()
          .single();

        if (assistantMsgError) throw assistantMsgError;
        assistantMessage = assistantMsgData;
      } else {
        assistantMessage = {
          id: 'msg-' + (Date.now() + 1),
          case_id: currentCase.id,
          role: 'assistant',
          content: aiResponse.chat_message,
          created_at: new Date().toISOString(),
        };
      }

      setMessages((prev) => [...prev, assistantMessage]);

      const updates: Partial<Document> = {};
      
      // Yeni JSON formatından field mapping (plaintiff -> plaintiff_details, body -> incident_narrative, result -> conclusion_request)
      // Eğer AI 'plaintiff' için bir şey gönderdiyse (null değilse),
      // Kutucuğun içini TAMAMEN bu yeni veriyle değiştir.
      // Çünkü AI zaten eski veriyi de içine katarak gönderdi.
      
      if (aiResponse.document_update.header !== null && 
          aiResponse.document_update.header !== document.header) {
        updates.header = aiResponse.document_update.header;
      }
      
      // Yeni format: plaintiff -> plaintiff_details
      // Data Accumulation: AI'dan gelen değeri mevcut değerle birleştir
      const plaintiffUpdate = aiResponse.document_update.plaintiff ?? aiResponse.document_update.plaintiff_details;
      if (plaintiffUpdate !== null) {
        if (document.plaintiff_details && document.plaintiff_details.trim()) {
          // Mevcut bilgileri koru ve yeni bilgileri ekle
          const merged = mergePlaintiffData(document.plaintiff_details, plaintiffUpdate);
          if (merged !== document.plaintiff_details) {
            updates.plaintiff_details = merged;
          }
        } else {
          // Mevcut bilgi yoksa direkt kullan
          updates.plaintiff_details = plaintiffUpdate;
        }
      }
      
      // Yeni format: defendant -> defendant_details
      const defendantUpdate = aiResponse.document_update.defendant ?? aiResponse.document_update.defendant_details;
      if (defendantUpdate !== null) {
        if (document.defendant_details && document.defendant_details.trim()) {
          // Mevcut bilgileri koru ve yeni bilgileri ekle
          const merged = mergeDefendantData(document.defendant_details, defendantUpdate);
          if (merged !== document.defendant_details) {
            updates.defendant_details = merged;
          }
        } else {
          updates.defendant_details = defendantUpdate;
        }
      }
      
      if (aiResponse.document_update.subject !== null && 
          aiResponse.document_update.subject !== document.subject) {
        updates.subject = aiResponse.document_update.subject;
      }
      
      // Yeni format: body -> incident_narrative
      // Data Accumulation: Body için de birleştirme yap
      const bodyUpdate = aiResponse.document_update.body ?? aiResponse.document_update.incident_narrative;
      if (bodyUpdate !== null) {
        if (document.incident_narrative && document.incident_narrative.trim()) {
          // Mevcut anlatımı koru, yeni bilgiyi ekle
          const merged = mergeBodyData(document.incident_narrative, bodyUpdate);
          if (merged !== document.incident_narrative) {
            updates.incident_narrative = merged;
          }
        } else {
          updates.incident_narrative = bodyUpdate;
        }
      }
      
      // Legacy fields (backward compatibility)
      if (aiResponse.document_update.legal_grounds !== null && 
          aiResponse.document_update.legal_grounds !== document.legal_grounds) {
        updates.legal_grounds = aiResponse.document_update.legal_grounds;
      }
      if (aiResponse.document_update.evidence_list !== null && 
          aiResponse.document_update.evidence_list !== document.evidence_list) {
        updates.evidence_list = aiResponse.document_update.evidence_list;
      }
      
      // Yeni format: result -> conclusion_request
      const resultUpdate = aiResponse.document_update.result ?? aiResponse.document_update.conclusion_request;
      if (resultUpdate !== null && resultUpdate !== document.conclusion_request) {
        updates.conclusion_request = resultUpdate;
      }

      // HER MESAJDA belgeyi güncelle (en azından updated_at ile)
      // Eğer hiç güncelleme yoksa bile, belgeyi yenile (UI'ın güncellenmesi için)
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();

        if (useSupabase) {
          const { data: updatedDocument, error: updateError } = await supabase!
            .from('documents')
            .update(updates)
            .eq('id', document.id)
            .select()
            .single();

          if (updateError) throw updateError;
          setDocument(updatedDocument);
        } else {
          // Local state güncelle
          setDocument({ ...document, ...updates });
        }
      } else {
        // Hiç güncelleme yoksa bile belgeyi yenile (UI güncellemesi için)
        // Bu, her mesajda belgenin görüntülenmesini garanti eder
        setDocument({ ...document, updated_at: new Date().toISOString() });
      }

      if (aiResponse.status === 'completed') {
        if (useSupabase) {
          await supabase!
            .from('cases')
            .update({ status: 'completed' })
            .eq('id', currentCase.id);
        }
        setCurrentCase({ ...currentCase, status: 'completed' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-300">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
      <div className="w-full md:w-1/2 h-1/2 md:h-full">
        <DocumentViewer document={document} />
      </div>
    </div>
  );
}

export default App;
