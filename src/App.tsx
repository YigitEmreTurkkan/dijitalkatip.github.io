import { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { DocumentViewer } from './components/DocumentViewer';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Case, Document, Message, AIResponse } from './types/database';
import { generateAIResponse } from './services/aiService';

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
      const plaintiffUpdate = aiResponse.document_update.plaintiff ?? aiResponse.document_update.plaintiff_details;
      if (plaintiffUpdate !== null && plaintiffUpdate !== document.plaintiff_details) {
        updates.plaintiff_details = plaintiffUpdate;
      }
      
      // Yeni format: defendant -> defendant_details
      const defendantUpdate = aiResponse.document_update.defendant ?? aiResponse.document_update.defendant_details;
      if (defendantUpdate !== null && defendantUpdate !== document.defendant_details) {
        updates.defendant_details = defendantUpdate;
      }
      
      if (aiResponse.document_update.subject !== null && 
          aiResponse.document_update.subject !== document.subject) {
        updates.subject = aiResponse.document_update.subject;
      }
      
      // Yeni format: body -> incident_narrative
      const bodyUpdate = aiResponse.document_update.body ?? aiResponse.document_update.incident_narrative;
      if (bodyUpdate !== null && bodyUpdate !== document.incident_narrative) {
        updates.incident_narrative = bodyUpdate;
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
