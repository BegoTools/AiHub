import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, MessageSquare, ArrowUpRight,
  Loader2, Copy, Check, Save, Plus,
  PanelLeftClose, PanelLeft, X, Wrench, Workflow as WorkflowIcon,
  Bot, Clock, StopCircle
} from 'lucide-react';
import { Tool, ApiSettings } from '../types';
import type { Workflow } from '../types/workflowTypes';
import { DynamicIcon } from './ToolForm';
import { analyzeIntent, getSuggestionsForResponse, ScoredItem } from '../lib/intentRouter';
import { apiPost } from '../lib/apiClient';
import {
  getChatSessions, createChatSession, addMessageToSession,
  deleteChatSession
} from '../services/chatService';
import { saveResult } from '../services/resultsService';
import { ChatSession } from '../types/storageTypes';

interface ChatApiResponse {
  action?: 'match' | 'create' | 'chat';
  explanation?: string;
  suggestedTools?: { toolId: string; reason: string }[];
  suggestedWorkflows?: { workflowId: string; reason: string }[];
  needCustomTool?: boolean;
  toolId?: string;
  newTool?: any;
  error?: string;
}

interface AiChatAssistantProps {
  allTools: Tool[];
  allWorkflows: Workflow[];
  settings: ApiSettings;
  onOpenTool: (toolId: string) => void;
  onOpenWorkflow: (workflowId: string) => void;
  onAddCustomTool: (newTool: any) => void;
  language: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  suggestedTools?: ScoredItem[];
  suggestedWorkflows?: ScoredItem[];
  needCustomTool?: boolean;
  createdTool?: any;
  isError?: boolean;
}

const chatTranslations: Record<string, {
  welcome: string; emptyExamples: string[]; placeholder: string;
  loadingText: string; errorMsg: string; copyBtn: string; copiedBtn: string;
  saveBtn: string; savedBtn: string; newChat: string; deleteChat: string;
  noSessions: string; stopBtn: string; headerTitle: string; headerSub: string;
  suggestionsTitle: string;
}> = {
  ar: {
    welcome: 'مرحباً بك في مساعد AI Hub الذكي 🤖\n\nأقدر أساعدك في:\n• استخدام أدوات المنصة المناسبة لطلبك\n• اقتراح رحلة عمل متكاملة\n• صناعة أداة مخصصة جديدة\n• الإجابة عن استفساراتك\n\nاختر مثال من الأسفل أو اكتب طلبك مباشرة!',
    emptyExamples: [
      '✍️ عايز أكتب إعلان لمنتج جديد',
      '📄 عايز أعمل CV احترافي',
      '📝 لخص لي نص طويل',
      '💬 عايز رد على عميل متضايق',
      '🚀 عايز أبدأ مشروع صغير',
      '🔧 عايز أداة جديدة مخصصة',
      '💻 اشرح لي قطعة كود',
    ],
    placeholder: 'اكتب طلبك هنا...',
    loadingText: 'المساعد الذكي بيفكر...',
    errorMsg: 'عذراً، حصل خطأ: {error}',
    copyBtn: 'نسخ',
    copiedBtn: 'تم النسخ!',
    saveBtn: 'حفظ',
    savedBtn: 'تم الحفظ!',
    newChat: 'محادثة جديدة',
    deleteChat: 'حذف',
    noSessions: 'لا توجد محادثات سابقة',
    stopBtn: 'إيقاف',
    headerTitle: 'المساعد الذكي',
    headerSub: 'AI Hub Assistant',
    suggestionsTitle: 'اقتراحات سريعة',
  },
  en: {
    welcome: 'Welcome to AI Hub Assistant 🤖\n\nI can help you with:\n• Using the right tools for your task\n• Suggesting a complete workflow\n• Creating a custom tool\n• Answering your questions\n\nChoose an example below or type your request!',
    emptyExamples: [
      '✍️ Write an ad for a new product',
      '📄 Create a professional CV',
      '📝 Summarize a long text',
      '💬 Reply to an angry customer',
      '🚀 Start a small business',
      '🔧 Create a new custom tool',
      '💻 Explain a piece of code',
    ],
    placeholder: 'Type your request here...',
    loadingText: 'Assistant is thinking...',
    errorMsg: 'Sorry, an error occurred: {error}',
    copyBtn: 'Copy',
    copiedBtn: 'Copied!',
    saveBtn: 'Save',
    savedBtn: 'Saved!',
    newChat: 'New Chat',
    deleteChat: 'Delete',
    noSessions: 'No previous conversations',
    stopBtn: 'Stop',
    headerTitle: 'Smart Assistant',
    headerSub: 'AI Hub Assistant',
    suggestionsTitle: 'Quick Suggestions',
  },
  de: {
    welcome: 'Willkommen beim AI Hub Assistant 🤖\n\nIch kann Ihnen helfen bei:\n• Den richtigen Werkzeug für Ihre Aufgabe\n• Vorschlagen eines kompletten Workflows\n• Erstellen eines benutzerdefinierten Tools\n• Beantwortung Ihrer Fragen\n\nWählen Sie ein Beispiel unten oder geben Sie Ihre Anfrage ein!',
    emptyExamples: [
      '✍️ Eine Anzeige für ein neues Produkt schreiben',
      '📄 Einen professionellen Lebenslauf erstellen',
      '📝 Einen langen Text zusammenfassen',
      '💬 Auf einen verärgerten Kunden antworten',
      '🚀 Ein kleines Unternehmen gründen',
      '🔧 Ein neues benutzerdefiniertes Tool erstellen',
      '💻 Ein Code-Stück erklären',
    ],
    placeholder: 'Geben Sie Ihre Anfrage hier ein...',
    loadingText: 'Assistent denkt nach...',
    errorMsg: 'Entschuldigung, ein Fehler ist aufgetreten: {error}',
    copyBtn: 'Kopieren',
    copiedBtn: 'Kopiert!',
    saveBtn: 'Speichern',
    savedBtn: 'Gespeichert!',
    newChat: 'Neuer Chat',
    deleteChat: 'Löschen',
    noSessions: 'Keine vorherigen Gespräche',
    stopBtn: 'Stopp',
    headerTitle: 'Intelligenter Assistent',
    headerSub: 'AI Hub Assistant',
    suggestionsTitle: 'Schnellvorschläge',
  },
  fr: {
    welcome: 'Bienvenue sur AI Hub Assistant 🤖\n\nJe peux vous aider avec :\n• Utiliser les bons outils pour votre tâche\n• Suggérer un workflow complet\n• Créer un outil personnalisé\n• Répondre à vos questions\n\nChoisissez un exemple ci-dessous ou tapez votre demande !',
    emptyExamples: [
      '✍️ Rédiger une annonce pour un nouveau produit',
      '📄 Créer un CV professionnel',
      '📝 Résumer un long texte',
      '💬 Répondre à un client en colère',
      '🚀 Démarrer une petite entreprise',
      '🔧 Créer un nouvel outil personnalisé',
      '💻 Expliquer un morceau de code',
    ],
    placeholder: 'Tapez votre demande ici...',
    loadingText: 'L\'assistant réfléchit...',
    errorMsg: 'Désolé, une erreur est survenue : {error}',
    copyBtn: 'Copier',
    copiedBtn: 'Copié !',
    saveBtn: 'Sauvegarder',
    savedBtn: 'Sauvegardé !',
    newChat: 'Nouveau Chat',
    deleteChat: 'Supprimer',
    noSessions: 'Aucune conversation précédente',
    stopBtn: 'Arrêter',
    headerTitle: 'Assistant Intelligent',
    headerSub: 'AI Hub Assistant',
    suggestionsTitle: 'Suggestions Rapides',
  },
  it: {
    welcome: 'Benvenuto su AI Hub Assistant 🤖\n\nPosso aiutarti con:\n• Usare gli strumenti giusti per il tuo compito\n• Suggerire un flusso di lavoro completo\n• Creare uno strumento personalizzato\n• Rispondere alle tue domande\n\nScegli un esempio qui sotto o scrivi la tua richiesta!',
    emptyExamples: [
      '✍️ Scrivere un annuncio per un nuovo prodotto',
      '📄 Creare un CV professionale',
      '📝 Riassumere un testo lungo',
      '💬 Rispondere a un cliente arrabbiato',
      '🚀 Avviare una piccola impresa',
      '🔧 Creare un nuovo strumento personalizzato',
      '💻 Spiegare un pezzo di codice',
    ],
    placeholder: 'Scrivi la tua richiesta qui...',
    loadingText: 'L\'assistente sta pensando...',
    errorMsg: 'Spiacenti, si è verificato un errore: {error}',
    copyBtn: 'Copia',
    copiedBtn: 'Copiato!',
    saveBtn: 'Salva',
    savedBtn: 'Salvato!',
    newChat: 'Nuova Chat',
    deleteChat: 'Elimina',
    noSessions: 'Nessuna conversazione precedente',
    stopBtn: 'Ferma',
    headerTitle: 'Assistente Intelligente',
    headerSub: 'AI Hub Assistant',
    suggestionsTitle: 'Suggerimenti Rapidi',
  },
};

export default function AiChatAssistant({
  allTools, allWorkflows, settings, onOpenTool,
  onOpenWorkflow, onAddCustomTool, language
}: AiChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ label: string; action: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  const t = chatTranslations[language] || chatTranslations.ar;
  const isRtl = language === 'ar';

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadSessions();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    const chatSessions = await getChatSessions();
    setSessions(chatSessions);
    if (chatSessions.length > 0) {
      const lastSession = chatSessions[chatSessions.length - 1];
      setActiveSessionId(lastSession.id);
      setMessages(lastSession.messages.map(m => ({
        id: m.id,
        sender: m.role as 'user' | 'assistant',
        text: m.content,
        timestamp: new Date(m.timestamp),
        suggestedTools: m.metadata?.suggestedTools,
        suggestedWorkflows: m.metadata?.suggestedWorkflows,
        needCustomTool: m.metadata?.needCustomTool,
        createdTool: m.metadata?.createdTool,
      })));
    }
  };

  const handleNewChat = async () => {
    const session = await createChatSession(`محادثة ${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en')}`);
    setSessions(prev => [...prev, session]);
    setActiveSessionId(session.id);
    setMessages([]);
    setSuggestions([]);
    setShowSessions(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteChatSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        const last = remaining[remaining.length - 1];
        setActiveSessionId(last.id);
        setMessages(last.messages.map(m => ({
          id: m.id, sender: m.role as 'user' | 'assistant',
          text: m.content, timestamp: new Date(m.timestamp),
          suggestedTools: m.metadata?.suggestedTools,
          suggestedWorkflows: m.metadata?.suggestedWorkflows,
          needCustomTool: m.metadata?.needCustomTool,
          createdTool: m.metadata?.createdTool,
        })));
      } else {
        setMessages([]);
        setSuggestions([]);
      }
    }
  };

  const handleCopy = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleSaveResult = async (msg: ChatMessage) => {
    if (msg.sender !== 'assistant') return;
    try {
      await saveResult({
        id: `chat_result_${Date.now()}`,
        title: msg.text.slice(0, 60) + (msg.text.length > 60 ? '...' : ''),
        toolId: 'chat',
        toolName: 'AI Assistant',
        content: msg.text,
        type: 'text',
        isFavorite: false,
        source: 'manual',
        metadata: { sessionId: activeSessionId },
      });
      setSavedId(msg.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch {}
  };

  const handleStopGeneration = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSuggestionAction = async (action: string, msgText: string) => {
    if (!msgText) return;
    const actionPrompts: Record<string, string> = {
      shorten: language === 'ar' ? 'اختصر الرد التالي: ' : 'Shorten the following: ',
      formal: language === 'ar' ? 'أعد صياغة الرد التالي بشكل رسمي: ' : 'Rewrite the following formally: ',
      egyptian: language === 'ar' ? 'أعد كتابة الرد التالي باللهجة المصرية: ' : 'Rewrite the following in Egyptian dialect: ',
      table: language === 'ar' ? 'حول الرد التالي إلى جدول منظم: ' : 'Convert the following into a table: ',
      plan: language === 'ar' ? 'اعمل خطة من الرد التالي: ' : 'Create a plan from the following: ',
    };
    if (action === 'save') {
      await handleSaveResult({ id: 'save', sender: 'assistant', text: msgText, timestamp: new Date() });
      return;
    }
    const prompt = (actionPrompts[action] || '') + msgText;
    setInputVal(prompt);
    inputRef.current?.focus();
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    let sessionId = activeSessionId;
    if (!sessionId) {
      const session = await createChatSession(textToSend.slice(0, 40) + (textToSend.length > 40 ? '...' : ''));
      sessionId = session.id;
      setActiveSessionId(session.id);
      setSessions(prev => [...prev, session]);
    }

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);
    setSuggestions([]);

    if (sessionId) {
      await addMessageToSession(sessionId, 'user', textToSend);
    }

    const intent = analyzeIntent(textToSend, allTools, allWorkflows);
    const hasGoodMatch = intent.type !== 'direct_chat' && intent.confidence >= 0.3;

    let assistantText = '';
    let suggestedTools: ScoredItem[] = [];
    let suggestedWorkflows: ScoredItem[] = [];
    let needCustomTool = false;
    let createdTool: any = null;

    if (hasGoodMatch) {
      suggestedTools = intent.matchedTools;
      suggestedWorkflows = intent.matchedWorkflows;

      if (intent.type === 'tool_match' && suggestedTools.length > 0) {
        const top = suggestedTools[0];
        const tool = allTools.find(t => t.id === top.id);
        assistantText = language === 'ar'
          ? `لقيت الأداة المناسبة! 🎯\n\n**${tool?.title || top.title}**\n${tool?.description || top.description}\n\nتقدر تفتحها وتستخدمها مباشرة 👇`
          : `Found the right tool! 🎯\n\n**${tool?.title || top.title}**\n${tool?.description || top.description}\n\nYou can open it and use it right away 👇`;
      } else if (intent.type === 'workflow_match' && suggestedWorkflows.length > 0) {
        const top = suggestedWorkflows[0];
        const wf = allWorkflows.find(w => w.id === top.id);
        assistantText = language === 'ar'
          ? `عندي رحلة متكاملة تناسب طلبك! 🚀\n\n**${wf?.title || top.title}**\n${wf?.description || top.description}\n\nتقدر تبدأ الرحلة من هنا 👇`
          : `I have a complete workflow for your request! 🚀\n\n**${wf?.title || top.title}**\n${wf?.description || top.description}\n\nStart the workflow here 👇`;
      } else {
        assistantText = language === 'ar'
          ? 'لقيت أدوات ورحلات ممكن تساعدك 👇'
          : 'Found tools and workflows that might help 👇';
      }
    } else if (intent.type === 'direct_chat' && intent.confidence < 0.3) {
      const hasAllTools = intent.matchedTools.length > 0 || intent.matchedWorkflows.length > 0;
      if (hasAllTools) {
        suggestedTools = intent.matchedTools;
        suggestedWorkflows = intent.matchedWorkflows;
        assistantText = language === 'ar'
          ? 'ممكن تساعدك الأدوات دي، أو أقدر أصنعلك أداة مخصصة! 👇'
          : 'These tools might help, or I can create a custom one! 👇';
        needCustomTool = true;
      } else {
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const data = await apiPost<ChatApiResponse>('/api/chat-assistant', {
            message: textToSend,
            existingTools: allTools,
            existingWorkflows: allWorkflows,
            customKey: settings.useCustomKeys
              ? (settings.provider === 'gemini' ? settings.geminiKey : settings.openRouterKey)
              : undefined,
            language,
          }, 30000);

          assistantText = data.explanation || (language === 'ar' ? 'تمت المعالجة!' : 'Processed!');
          suggestedTools = (data.suggestedTools || []).map((st: any) => ({
            id: st.toolId, title: st.reason || '', description: '', score: 0.5
          }));
          suggestedWorkflows = (data.suggestedWorkflows || []).map((sw: any) => ({
            id: sw.workflowId, title: sw.reason || '', description: '', score: 0.5
          }));
          needCustomTool = data.needCustomTool || false;
          if (data.action === 'match' && data.toolId && !suggestedTools.some(s => s.id === data.toolId)) {
            suggestedTools = [{
              id: data.toolId, title: language === 'ar' ? 'فتح الأداة' : 'Open tool', description: '', score: 1
            }, ...suggestedTools];
          }
          if (data.action === 'create' && data.newTool) {
            onAddCustomTool(data.newTool);
            createdTool = data.newTool;
            needCustomTool = true;
            if (!suggestedTools.some(s => s.id === data.newTool.id)) {
              suggestedTools = [{
                id: data.newTool.id,
                title: data.newTool.title || (language === 'ar' ? 'الأداة الجديدة' : 'New tool'),
                description: data.newTool.description || '', score: 1
              }, ...suggestedTools];
            }
            assistantText = (language === 'ar' ? '🎉 تم صنع أداة جديدة لك!\n\n' : '🎉 A new tool has been created for you!\n\n') + (data.explanation || '');
          }
        } catch (e: any) {
          assistantText = t.errorMsg.replace('{error}', e.message || 'Connection failed');
          if (sessionId) {
            const errMsg: ChatMessage = {
              id: `err_${Date.now()}`, sender: 'assistant', text: assistantText,
              timestamp: new Date(), isError: true,
            };
            setMessages(prev => [...prev, errMsg]);
            await addMessageToSession(sessionId, 'assistant', assistantText, { isError: true });
          }
          setIsLoading(false);
          return;
        }
      }
    } else {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await apiPost<ChatApiResponse>('/api/chat-assistant', {
          message: textToSend,
          existingTools: allTools,
          existingWorkflows: allWorkflows,
          customKey: settings.useCustomKeys
            ? (settings.provider === 'gemini' ? settings.geminiKey : settings.openRouterKey)
            : undefined,
          language,
        }, 30000);

        assistantText = data.explanation || (language === 'ar' ? 'تمت المعالجة!' : 'Processed!');
        suggestedTools = (data.suggestedTools || []).map((st: any) => ({
          id: st.toolId, title: st.reason || '', description: '', score: 0.5
        }));
        suggestedWorkflows = (data.suggestedWorkflows || []).map((sw: any) => ({
          id: sw.workflowId, title: sw.reason || '', description: '', score: 0.5
        }));
        needCustomTool = data.needCustomTool || false;
        if (data.action === 'match' && data.toolId && !suggestedTools.some(s => s.id === data.toolId)) {
          suggestedTools = [{
            id: data.toolId, title: language === 'ar' ? 'فتح الأداة' : 'Open tool', description: '', score: 1
          }, ...suggestedTools];
        }
        if (data.action === 'create' && data.newTool) {
          onAddCustomTool(data.newTool);
          createdTool = data.newTool;
          needCustomTool = true;
          if (!suggestedTools.some(s => s.id === data.newTool.id)) {
            suggestedTools = [{
              id: data.newTool.id,
              title: data.newTool.title || (language === 'ar' ? 'الأداة الجديدة' : 'New tool'),
              description: data.newTool.description || '', score: 1
            }, ...suggestedTools];
          }
          assistantText = (language === 'ar' ? '🎉 تم صنع أداة جديدة لك!\n\n' : '🎉 A new tool has been created for you!\n\n') + (data.explanation || '');
        }
      } catch (e: any) {
        assistantText = t.errorMsg.replace('{error}', e.message || 'Connection failed');
        if (sessionId) {
          const errMsg: ChatMessage = {
            id: `err_${Date.now()}`, sender: 'assistant', text: assistantText,
            timestamp: new Date(), isError: true,
          };
          setMessages(prev => [...prev, errMsg]);
          await addMessageToSession(sessionId, 'assistant', assistantText, { isError: true });
        }
        setIsLoading(false);
        return;
      }
    }

    abortRef.current = null;

    const assistantMsg: ChatMessage = {
      id: `assistant_${Date.now()}`,
      sender: 'assistant',
      text: assistantText,
      timestamp: new Date(),
      suggestedTools: suggestedTools.filter(s => s.id),
      suggestedWorkflows: suggestedWorkflows.filter(s => s.id),
      needCustomTool,
      createdTool,
    };

    setMessages(prev => [...prev, assistantMsg]);
    setSuggestions(getSuggestionsForResponse(language));

    if (sessionId) {
      await addMessageToSession(sessionId, 'assistant', assistantText, {
        suggestedTools: assistantMsg.suggestedTools,
        suggestedWorkflows: assistantMsg.suggestedWorkflows,
        needCustomTool,
        createdTool,
      });
    }

    setIsLoading(false);
  };

  const handleExampleClick = (text: string) => {
    setInputVal(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputVal);
    }
  };

  return (
    <div className={`flex gap-0 h-[calc(100vh-160px)] ${isRtl ? 'flex-row-reverse' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sessions Panel */}
      {showSessions && (
        <div className={`${isRtl ? 'lg:border-l' : 'lg:border-r'} border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] w-full lg:w-64 shrink-0 lg:relative fixed inset-0 z-30 lg:z-auto`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">
              {language === 'ar' ? 'المحادثات' : 'Chats'}
            </h3>
            <button onClick={() => setShowSessions(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <X size={16} className="text-slate-500" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1" style={{ height: 'calc(100% - 53px)' }}>
            <button onClick={handleNewChat} className="w-full p-3 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 mb-3">
              <Plus size={14} />
              {t.newChat}
            </button>
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-8">{t.noSessions}</p>
            ) : (
              [...sessions].reverse().map(session => (
                <div
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setMessages(session.messages.map(m => ({
                      id: m.id, sender: m.role as 'user' | 'assistant',
                      text: m.content, timestamp: new Date(m.timestamp),
                      suggestedTools: m.metadata?.suggestedTools,
                      suggestedWorkflows: m.metadata?.suggestedWorkflows,
                      needCustomTool: m.metadata?.needCustomTool,
                      createdTool: m.metadata?.createdTool,
                    })));
                    setShowSessions(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-colors text-xs ${
                    activeSessionId === session.id
                      ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(session.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-[#f8fafc] dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSessions(!showSessions)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors lg:flex hidden">
              {showSessions ? <PanelLeftClose size={16} className="text-slate-500" /> : <PanelLeft size={16} className="text-slate-500" />}
            </button>
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
              <Bot size={16} />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">{t.headerTitle}</h3>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-medium">{t.headerSub}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleNewChat} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors" title={t.newChat}>
              <Plus size={15} className="text-slate-500" />
            </button>
            <button onClick={() => setShowSessions(!showSessions)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors lg:hidden" title={t.newChat}>
              <MessageSquare size={15} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-sm mb-4">
                <Sparkles size={24} />
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 whitespace-pre-line max-w-md leading-relaxed mb-6">
                {t.welcome}
              </p>
              <div className="space-y-2 w-full max-w-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  {t.suggestionsTitle}
                </p>
                {t.emptyExamples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-right p-3 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950/60 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 transition-all font-medium cursor-pointer"
                    style={{ textAlign: isRtl ? 'right' : 'left' }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] space-y-1`}>
                  <div className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-lg'
                      : msg.isError
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/30 rounded-bl-lg'
                        : 'bg-slate-50 dark:bg-zinc-950/60 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-bl-lg'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Tool suggestions */}
                  {msg.suggestedTools && msg.suggestedTools.length > 0 && msg.sender === 'assistant' && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedTools.slice(0, 3).map(st => {
                        const tool = allTools.find(t => t.id === st.id);
                        if (!tool) return null;
                        return (
                          <button
                            key={st.id}
                            onClick={() => onOpenTool(st.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-900/30 rounded-lg transition-all text-[10px] font-medium text-blue-700 dark:text-blue-300"
                          >
                            <Wrench size={12} />
                            <span className="truncate max-w-[100px]">{tool.title}</span>
                            <ArrowUpRight size={10} className={isRtl ? 'rotate-[-90deg]' : ''} />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Workflow suggestions */}
                  {msg.suggestedWorkflows && msg.suggestedWorkflows.length > 0 && msg.sender === 'assistant' && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedWorkflows.slice(0, 2).map(sw => {
                        const wf = allWorkflows.find(w => w.id === sw.id);
                        if (!wf) return null;
                        return (
                          <button
                            key={sw.id}
                            onClick={() => onOpenWorkflow(sw.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-900/30 rounded-lg transition-all text-[10px] font-medium text-purple-700 dark:text-purple-300"
                          >
                            <WorkflowIcon size={12} />
                            <span className="truncate max-w-[120px]">{wf.title}</span>
                            <ArrowUpRight size={10} className={isRtl ? 'rotate-[-90deg]' : ''} />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Need custom tool */}
                  {msg.needCustomTool && msg.sender === 'assistant' && (
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          onAddCustomTool({
                            id: `custom_${Date.now()}`,
                            categoryId: 'general',
                            title: language === 'ar' ? 'أداة مخصصة' : 'Custom Tool',
                            description: inputVal || (language === 'ar' ? 'أداة من المحادثة' : 'Tool from chat'),
                            icon: 'Sparkles',
                            inputs: [
                              { id: 'topic', label: language === 'ar' ? 'الموضوع' : 'Topic', type: 'textarea', placeholder: language === 'ar' ? 'اكتب المطلوب' : 'Enter request' }
                            ],
                            exampleInput: { topic: '' },
                            promptTemplateString: language === 'ar' ? 'نفذ الطلب التالي باحتراف: {topic}' : 'Execute professionally: {topic}',
                            visibility: 'private',
                            tags: ['custom', 'chat-created'],
                          });
                        }}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Sparkles size={12} />
                        {language === 'ar' ? '🔨 اصنع أداة مخصصة' : '🔨 Create custom tool'}
                      </button>
                    </div>
                  )}

                  {/* Action buttons */}
                  {msg.sender === 'assistant' && !msg.isError && (
                    <div className="flex items-center gap-1 pt-0.5 px-1">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        title={t.copyBtn}
                      >
                        {copiedId === msg.id ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} className="text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSaveResult(msg)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        title={t.saveBtn}
                      >
                        {savedId === msg.id ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Save size={12} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 dark:bg-zinc-950/80 text-slate-500 rounded-2xl rounded-bl-lg p-3.5 border border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-xs">{t.loadingText}</span>
                <button
                  onClick={handleStopGeneration}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors ml-1"
                  title={t.stopBtn}
                >
                  <StopCircle size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        {suggestions.length > 0 && messages.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-800 bg-[#f8fafc]/50 dark:bg-zinc-950/10">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionAction(sug.action, messages[messages.length - 1]?.text || '')}
                  className="shrink-0 px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[10px] text-slate-600 dark:text-zinc-400 transition-colors font-medium"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-[#f8fafc]/50 dark:bg-zinc-950/20 shrink-0">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl px-3.5 py-2.5 placeholder-slate-400 dark:placeholder-zinc-500 text-xs transition-all outline-none focus:border-blue-500 focus:dark:border-blue-500 resize-none max-h-32"
              style={{ textAlign: isRtl ? 'right' : 'left' }}
            />
            <button
              onClick={() => handleSendMessage(inputVal)}
              disabled={isLoading || !inputVal.trim()}
              className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all flex items-center justify-center shrink-0 active:scale-95"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} className={isRtl ? 'rotate-180' : ''} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}