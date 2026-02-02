import { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { DocumentViewer } from './components/DocumentViewer';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Case, Document, Message, AIResponse } from './types/database';
import { generateAIResponse } from './services/aiService';

// Data Accumulation helper functions removed - AI now handles full content replacement


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

      // Yeni JSON formatından field mapping

      if (aiResponse.document_update.header !== null &&
        aiResponse.document_update.header !== document.header) {
        updates.header = aiResponse.document_update.header;
      }

      // Plaintiff Update - Direct Assignment
      const plaintiffUpdate = aiResponse.document_update.plaintiff ?? aiResponse.document_update.plaintiff_details;
      if (plaintiffUpdate !== null && plaintiffUpdate !== document.plaintiff_details) {
        updates.plaintiff_details = plaintiffUpdate;
      }

      // Defendant Update - Direct Assignment
      const defendantUpdate = aiResponse.document_update.defendant ?? aiResponse.document_update.defendant_details;
      if (defendantUpdate !== null && defendantUpdate !== document.defendant_details) {
        updates.defendant_details = defendantUpdate;
      }

      // Subject Update
      if (aiResponse.document_update.subject !== null &&
        aiResponse.document_update.subject !== document.subject) {
        updates.subject = aiResponse.document_update.subject;
      }

      // Body/Narrative Update - Direct Assignment
      const bodyUpdate = aiResponse.document_update.body ?? aiResponse.document_update.incident_narrative;
      if (bodyUpdate !== null && bodyUpdate !== document.incident_narrative) {
        updates.incident_narrative = bodyUpdate;
      }

      // Legacy/Other Fields
      if (aiResponse.document_update.legal_grounds !== null &&
        aiResponse.document_update.legal_grounds !== document.legal_grounds) {
        updates.legal_grounds = aiResponse.document_update.legal_grounds;
      }
      if (aiResponse.document_update.evidence_list !== null &&
        aiResponse.document_update.evidence_list !== document.evidence_list) {
        updates.evidence_list = aiResponse.document_update.evidence_list;
      }

      // Result/Conclusion Update - Direct Assignment
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

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<'chat' | 'document'>('chat');
  const [hasUnreadChanges, setHasUnreadChanges] = useState(false);

  // Switch to document tab when AI updates the document
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      if (activeTab !== 'document') {
        setHasUnreadChanges(true);
      }
    }
  }, [messages, activeTab]);

  const handleTabChange = (tab: 'chat' | 'document') => {
    setActiveTab(tab);
    if (tab === 'document') {
      setHasUnreadChanges(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* Chat Interface Area */}
      <div className={`
        w-full md:w-1/2 h-full border-r border-slate-300 pb-20 md:pb-0
        ${activeTab === 'chat' ? 'flex' : 'hidden md:flex'}
      `}>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Document Viewer Area */}
      <div className={`
        w-full md:w-1/2 h-full pb-20 md:pb-0
        ${activeTab === 'document' ? 'flex' : 'hidden md:flex'}
      `}>
        <DocumentViewer document={document} />
      </div>

      {/* Mobile Bottom Navigation - Large Buttons for Accessibility */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => handleTabChange('chat')}
          className={`flex-1 flex flex-col items-center justify-center p-4 gap-1 transition-colors ${activeTab === 'chat'
            ? 'text-blue-600 bg-blue-50'
            : 'text-slate-500 hover:bg-slate-50'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-bold">Yazışma</span>
        </button>

        <button
          onClick={() => handleTabChange('document')}
          className={`flex-1 flex flex-col items-center justify-center p-4 gap-1 transition-colors relative ${activeTab === 'document'
            ? 'text-blue-600 bg-blue-50'
            : 'text-slate-500 hover:bg-slate-50'
            }`}
        >
          {hasUnreadChanges && (
            <span className="absolute top-3 right-1/4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-sm ring-2 ring-white" />
          )}
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="text-sm font-bold">Dilekçeni Gör</span>
        </button>
      </div>
    </div>
  );
}

export default App;
