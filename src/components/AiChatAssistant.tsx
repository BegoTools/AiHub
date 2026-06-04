import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, MessageSquare, ArrowLeft, ArrowUpRight, HelpCircle, Loader2 } from 'lucide-react';
import { Tool, ApiSettings } from '../types';
import { DynamicIcon } from './ToolForm';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedToolId?: string;
  createdTool?: any;
  timestamp: Date;
}

interface AiChatAssistantProps {
  allTools: Tool[];
  settings: ApiSettings;
  onOpenTool: (toolId: string) => void;
  onAddCustomTool: (newTool: any) => void;
  language: string;
}

// Translations dictionary for AiChatAssistant
const chatTranslations: Record<string, {
  welcome: string;
  suggestionsTitle: string;
  suggestions: string[];
  suggestionsFooter: string;
  guideTitle: string;
  guideDesc: string;
  tipsHeader: string;
  tips: string[];
  headerTitle: string;
  headerSub: string;
  placeholder: string;
  loadingText: string;
  errorMsg: string;
  toolMatched_title: string;
  toolMatched_btn: string;
  toolCreated_title: string;
  toolCreated_btn: string;
  defaultExplanation: string;
  geminiBadge: string;
  fallbackToolTitle: string;
}> = {
  ar: {
    welcome: 'أهلاً بك في خدمات الدعم والذكاء الفوري! 🤖\n\nأنا هنا كـ AI مساعد لمساندتك. إذا كنت تبحث عن ميزة أو أداة معينة ولم تجدها في المنصة، أو كانت مفقودة، فقط اكتب لي ما تريدها أن تنجز:\n\n1. سأقوم بالبحث الفوري عنها بالمنصة وإعطائك إياها.\n2. إذا كانت غير متوفرة، سأقوم بصناعتها وتثبيتها لك فوراً وبشكل آلي تماماً لتستخدمها في نفس اللحظة!\n\nاكتب فكرتك أو اختر أحد المقترحات بالأسفل لنجرب ذلك سوياً ✨',
    suggestionsTitle: 'أفكار مقترحة للتجربة السريعة:',
    suggestions: [
      'محتاج أداة تترجم النصوص إلى لهجة مصرية مضحكة جداً',
      'عاوز أداة تكتب إيميل اعتذار رسمي ومهذب لمديري في الشغل',
      'أداة لحساب السعرات الحرارية التقريبية للوجبات الشعبية العربية',
      'أريد أداة تصنع أفكاراً لمنشورات تيك توك لحساب تسويق إلكتروني'
    ],
    suggestionsFooter: 'انقر على أي مقترح لملئه مباشرة في صندوق المحادثة.',
    guideTitle: 'صناعة فورية واختصار للوقت',
    guideDesc: 'المنصة مصممة بأحدث تكنولوجيا التطور التوليدي. إذا لم تتمكن من العثور على أداة تلبي ما تريد، اكتب لنا فقط "أداة لـ..."',
    tipsHeader: '💡 كيف تكتب الفكرة بأفضل طريقة؟',
    tips: [
      'صف بدقة المدخلات التي تريدها.',
      'حدد المخرج المطلوب شكله (جدول، نقاط، تلخيص).',
      'اطلب لهجة مضحكة بمزاح أو أسلوب أكاديمي متقن.'
    ],
    headerTitle: 'مساعد الذكاء الاصطناعي وإنشاء الميزات',
    headerSub: 'مستعد للتبسيط وصناعة الأدوات والخدمات فوراً',
    placeholder: 'اكتب فكرتك أو الأداة المعينة التي تبحث عنها هنا...',
    loadingText: 'المساعد يقوم بفحص فكرتك وصناعة الأدوات المناسبة لك...',
    errorMsg: 'أووووه! حدث شيء خاطئ أثناء محاولة إنجاز فكرتك. \n\nالسبب: {error}\n\nيرجى التأكد من إعدادات مفتاح API Key في صفحة "أدوات الاتصال"، ثم المحاولة مجدداً.',
    toolMatched_title: 'جاهزة ومتاحة بالكامل للاستخدام',
    toolMatched_btn: 'افتح وجرب الفكرة',
    toolCreated_title: 'تم تثبيت أداة ذكية جديدة بنجاح في المنصة! 🎉',
    toolCreated_btn: 'ابدأ الاستخدام الفوري',
    defaultExplanation: 'تم معالجة فكرتك الإبداعية!',
    geminiBadge: 'GEMINI ACTIVE',
    fallbackToolTitle: 'أداة بالمنصة'
  },
  en: {
    welcome: 'Welcome to instant support and intelligence! 🤖\n\nI am your AI Assistant here to help you. If you are looking for a feature or custom tool and failed to find it, just tell me what you want to achieve:\n\n1. I will instantly search the platform and provide it to you.\n2. If it is not available, I will dynamically build and install it for you on the fly!\n\nDescribe your idea or choose a suggestion below to begin ✨',
    suggestionsTitle: 'Suggested Ideas to try:',
    suggestions: [
      'I need a tool to translate texts into a funny Egyptian dialect',
      'I want a tool to write a polite and formal apology email to my manager',
      'A tool to calculate calorie approximations for popular Arabic foods',
      'An AI tool to generate TikTok content ideas for a marketing campaign'
    ],
    suggestionsFooter: 'Click on any suggestion to fill it directly in the chat box.',
    guideTitle: 'Instant Creation & Zero Setup',
    guideDesc: 'This hub uses bleeding-edge generative tech. If you can\'t find the tool you need, simply tell the AI: "A tool for..."',
    tipsHeader: '💡 How to write your prompt?',
    tips: [
      'Describe the input fields you want.',
      'Specify the format of the output (table, bullet points).',
      'Request any styling or specific professional tone.'
    ],
    headerTitle: 'AI Intelligence Assistant',
    headerSub: 'Ready to simplify workflows and generate custom tools instantly',
    placeholder: 'Type your idea or the tool you are searching for here...',
    loadingText: 'AI assistant is reviewing your idea and generating tools...',
    errorMsg: 'Oops! Something went wrong while processing your idea. \n\nReason: {error}\n\nPlease verify your API settings in the Connections tab and try again.',
    toolMatched_title: 'Fully ready and available to use',
    toolMatched_btn: 'Open and Try Tool',
    toolCreated_title: 'New smart tool compiled and installed successfully! 🎉',
    toolCreated_btn: 'Start Using Instantly',
    defaultExplanation: 'Your creative idea was processed successfully!',
    geminiBadge: 'GEMINI ACTIVE',
    fallbackToolTitle: 'Tool on platform'
  },
  de: {
    welcome: 'Willkommen beim sofortigen KI-Support! 🤖\n\nIch bin Ihr KI-Assistent. Wenn Sie nach einer Funktion oder einem Tool suchen, das fehlt, schreiben Sie mir einfach, was Sie machen möchten:\n\n1. Ich werde die Plattform sofort durchsuchen und Ihnen das Tool zeigen.\n2. Wenn es fehlt, werde ich es sofort speziell für Sie generieren und installieren!\n\nWählen Sie unten einen Vorschlag aus, um zu beginnen ✨',
    suggestionsTitle: 'Empfohlene Ideen zum Ausprobieren:',
    suggestions: [
      'Ich brauche ein Tool, das Texte in einen lustigen Dialekt übersetzt',
      'Schreibe eine formelle Entschuldigungs-E-Mail an meinen Manager',
      'Ein Tool zur Berechnung von Kalorien für arabische Speisen',
      'Eine KI, die TikTok-Beitragsideen für Marketing generiert'
    ],
    suggestionsFooter: 'Klicken Sie auf einen Vorschlag, um ihn ins Textfeld einzufügen.',
    guideTitle: 'Sofortige Erstellung im Workbench',
    guideDesc: 'Unsere Plattform verwendet modernste generative Technologie. Schreiben Sie einfach: "Ein Werkzeug für..."',
    tipsHeader: '💡 Wie formuliere ich meine Idee am besten?',
    tips: [
      'Beschreiben Sie genau die gewünschten Eingabefelder.',
      'Legen Sie das Ausgabeformat fest (etwa Tabellen oder Stichpunkte).',
      'Geben Sie den gewünschten humorvollen oder professionellen Ton an.'
    ],
    headerTitle: 'KI-Assistent & Feature-Generator',
    headerSub: 'Bereit, Ihre Workflows zu vereinfachen und neue Tools zu erstellen',
    placeholder: 'Schreiben Sie Ihre Idee oder das gesuchte Tool hier...',
    loadingText: 'Der Assistent überprüft Ihre Idee und erstellt das Tool...',
    errorMsg: 'Hoppla! Beim Verarbeiten Ihrer Idee ist ein Fehler aufgetreten. \n\nGrund: {error}\n\nBitte überprüfen Sie Ihre API-Schlüssel-Einstellungen und versuchen Sie es erneut.',
    toolMatched_title: 'Bereit und sofort einsatzbereit',
    toolMatched_btn: 'Tool öffnen',
    toolCreated_title: 'Neues KI-Spezialtool erfolgreich installiert! 🎉',
    toolCreated_btn: 'Jetzt verwenden',
    defaultExplanation: 'Ihre kreative Idee wurde verarbeitet!',
    geminiBadge: 'GEMINI AKTIV',
    fallbackToolTitle: 'Werkzeug auf der Plattform'
  },
  fr: {
    welcome: 'Bienvenue sur l\'assistance IA instantanée ! 🤖\n\nJe suis votre assistant IA. Si vous manquez d\'un outil ou d\'une fonctionnalité spécifique, dites-moi simplement ce que vous souhaitez accomplir :\n\n1. Je vais rechercher instantanément dans le catalogue et vous le fournir.\n2. S\'il n\'existe pas, je le concevrai et l\'installerai automatiquement en direct !\n\nÉcrivez votre idée ou choisissez une suggestion ci-dessous ✨',
    suggestionsTitle: 'Suggestions pour essayer d\'un clic :',
    suggestions: [
      'Un traducteur de texte en dialecte égyptien drôle',
      'Rédiger un e-mail d\'excuse formel et poli pour mon manager',
      'Calculateur de calories pour plats arabes',
      'Générateur d\'idées de publications TikTok d\'e-commerce'
    ],
    suggestionsFooter: 'Cliquez sur une suggestion pour remplir automatiquement.',
    guideTitle: 'Création instantanée sans code',
    guideDesc: 'La plateforme utilise des technologies d\'IA de pointe. Pour coder, demandez simplement : "Un outil pour..."',
    tipsHeader: '💡 Comment formuler au mieux ?',
    tips: [
      'Décrivez précisément les champs de saisie voulus.',
      'Précisez le format de sortie attendu (bullet points, tableau).',
      'Indiquez le style, sérieux ou humoristique.'
    ],
    headerTitle: 'Assistant IA & Générateur de Services',
    headerSub: 'Prêt à simplifier vos processus et coder des outils sur mesure',
    placeholder: 'Saisissez votre idée ou l\'outil recherché ici...',
    loadingText: 'L\'assistant traite votre idée et génère votre module personnalisé...',
    errorMsg: 'Oups ! Une erreur est survenue lors de la création. \n\nCause : {error}\n\nVeuillez vérifier vos clés API dans l\'onglet des paramètres et réessayer.',
    toolMatched_title: 'Entièrement configuré et prêt',
    toolMatched_btn: 'Ouvrir l\'outil',
    toolCreated_title: 'Nouvel outil intelligent compilé et déployé avec succès ! 🎉',
    toolCreated_btn: 'Commencer l\'utilisation',
    defaultExplanation: 'Votre concept créatif a été traité !',
    geminiBadge: 'GEMINI ACTIF',
    fallbackToolTitle: 'Outil sur la plateforme'
  },
  it: {
    welcome: 'Benvenuto nell\'assistenza IA istantanea! 🤖\n\nSono il tuo Assistente IA. Se cerchi una funzionalità o uno strumento personalizzato che manca nella suite, scrivimi cosa vuoi realizzare:\n\n1. Cercherò nel catalogo e te lo proprodo all\'istante.\n2. Se non disponibile, lo progetterò e lo installerò al volo per te!\n\nEsponi la tua idea o scegli un suggerimento qui sotto per iniziare ✨',
    suggestionsTitle: 'Idee suggerite da provare:',
    suggestions: [
      'Ho bisogno di un traduttore divertente in dialetto egiziano',
      'Email formale di scuse per il mio manager lavorativo',
      'Calcolatore calorie per cibi tradizionali arabi',
      'Idee post per TikTok marketing ed e-commerce'
    ],
    suggestionsFooter: 'Fai clic su un suggerimento per inserirlo nella casella.',
    guideTitle: 'Creazione Immediata & Zero Setup',
    guideDesc: 'L\'hub integra tecnologie generative avanzate. Se non trovi lo strumento adatto, chiedi semplicemente: "Uno strumento per..."',
    tipsHeader: '💡 Come comporre la tua richiesta?',
    tips: [
      'Descrivi in dettaglio gli input desiderati.',
      'Scegli il formato dell\'output (tabella, punti elenco, ecc.).',
      'Richiedi un particolare tono (divertente, accademico, formale).'
    ],
    headerTitle: 'Assistente IA & Estensore di Funzionalità',
    headerSub: 'Pronto a semplificare compiti e generare configurazioni personalizzate istantaneamente',
    placeholder: 'Scrivi la tua idea o lo strumento che stai cercando...',
    loadingText: 'L\'assistente sta esaminando la tua idea e compilando il modulo...',
    errorMsg: 'Ops! Qualcosa è andato storto nel processo. \n\nCausa: {error}\n\nVerifica le impostazioni API nella scheda Connessioni e riprova.',
    toolMatched_title: 'Pronto e disponibile all\'uso',
    toolMatched_btn: 'Apri strumento',
    toolCreated_title: 'Nuovo strumento IA compilato e installato con successo! 🎉',
    toolCreated_btn: 'Inizia subito ad usare',
    defaultExplanation: 'Il tuo concetto creativo è stato elaborato!',
    geminiBadge: 'GEMINI ATTIVO',
    fallbackToolTitle: 'Strumento nella piattaforma'
  }
};

export default function AiChatAssistant({
  allTools,
  settings,
  onOpenTool,
  onAddCustomTool,
  language
}: AiChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = chatTranslations[language] || chatTranslations.en;

  useEffect(() => {
    // Add welcome message on mount and reset message feed when language shifts context
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: t.welcome,
        timestamp: new Date()
      }
    ]);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          existingTools: allTools,
          customKey: settings.useCustomKeys ? (settings.provider === 'gemini' ? settings.geminiKey : settings.openRouterKey) : undefined,
          language: language // Send developer desired language preference to AI helper API endpoint!
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Exception (${response.status})`);
      }

      const reply = await response.json();

      let matchedId: string | undefined;
      let createdToolData: any | undefined;

      if (reply.action === 'match' && reply.toolId) {
        matchedId = reply.toolId;
      } else if (reply.action === 'create' && reply.newTool) {
        createdToolData = reply.newTool;
        onAddCustomTool(reply.newTool);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: reply.explanation || t.defaultExplanation,
        matchedToolId: matchedId,
        createdTool: createdToolData,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);

    } catch (e: any) {
      console.error(e);
      const textError = t.errorMsg.replace('{error}', e.message || 'AI Connection Failure.');
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: textError,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const isRtl = language === 'ar';

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] items-stretch ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Suggestions and Guide column (4 spans) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Help / Guide Box */}
        <div className="bg-gradient-to-tr from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 lg:p-6 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-500/10 text-orange-600 dark:text-amber-400 rounded-xl">
              <Sparkles size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">{t.guideTitle}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            {t.guideDesc}
          </p>
          <div className="mt-4 p-3.5 bg-white dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800/60 text-[11px] text-slate-500 dark:text-zinc-500 space-y-2">
            <span className="font-bold text-slate-700 dark:text-zinc-400 block mb-1">{t.tipsHeader}</span>
            <ul className="list-disc list-inside space-y-1">
              {t.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Suggestions Box */}
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 lg:p-6 flex-1 flex flex-col justify-between shadow-sm dark:shadow-none">
          <div>
            <h4 className="font-bold text-xs text-slate-500 dark:text-zinc-550 uppercase tracking-wider mb-3">{t.suggestionsTitle}</h4>
            <div className="space-y-2.5">
              {t.suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputVal(sug);
                  }}
                  disabled={isLoading}
                  className="w-full text-right p-3 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950/40 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-700 dark:text-zinc-300 hover:text-blue-500 hover:border-blue-500/20 dark:hover:border-blue-400/20 transition-all font-medium cursor-pointer disabled:opacity-50"
                  style={{ textAlign: isRtl ? 'right' : 'left' }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-850 mt-4 text-[11px] text-slate-400 dark:text-zinc-650 flex items-center gap-1.5 font-medium leading-relaxed">
            <HelpCircle size={13} className="shrink-0" />
            <span>{t.suggestionsFooter}</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface (8 spans) */}
      <div className="lg:col-span-8 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-none flex flex-col h-full min-h-[450px]">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-[#f8fafc] dark:bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{t.headerTitle}</h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium mt-0.5">{t.headerSub}</span>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-lg text-[10px] font-bold tracking-wide">
            {t.geminiBadge || 'GEMINI ACTIVE'}
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.5rem] p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm font-sans'
                      : 'bg-slate-50 dark:bg-zinc-950/60 text-slate-800 dark:text-zinc-100 rounded-bl-none border border-slate-150 dark:border-zinc-800 shadow-xs'
                  }`}
                  style={{ 
                    whiteSpace: 'pre-line',
                    textAlign: isUser ? (isRtl ? 'right' : 'left') : (isRtl ? 'right' : 'left') 
                  }}
                >
                  <p className="font-sans font-medium">{msg.text}</p>

                  {/* Render dynamic CTA if we found/matched an existing tool */}
                  {!isUser && msg.matchedToolId && (
                    <div className="mt-4 p-4 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4 animate-shake">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-500/10 text-blue-550 rounded-xl shrink-0">
                          <DynamicIcon name={allTools.find(t => t.id === msg.matchedToolId)?.icon || 'Wand2'} size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-[11px] text-slate-800 dark:text-zinc-200">
                            {allTools.find(t => t.id === msg.matchedToolId)?.title || t.fallbackToolTitle || 'أداة بالمنصة'}
                          </h4>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 block mt-0.5">{t.toolMatched_title}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenTool(msg.matchedToolId!)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold rounded-xl transition-all block text-center w-fit cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 active:scale-95"
                      >
                        <span>{t.toolMatched_btn}</span>
                        <ArrowUpRight size={12} className={isRtl ? 'rotate-[-90deg]' : ''} />
                      </button>
                    </div>
                  )}

                  {/* Render dynamic CTA if we created a brand new custom tool */}
                  {!isUser && msg.createdTool && (
                    <div className="mt-4 p-4 bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/20 rounded-2xl animate-fade-in text-right">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">{t.toolCreated_title}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-850 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                            <DynamicIcon name={msg.createdTool.icon || 'Sparkles'} size={16} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[11px] text-slate-800 dark:text-zinc-205">{msg.createdTool.title}</h4>
                            <p className="text-[9px] text-slate-450 dark:text-zinc-500 truncate max-w-[150px] mt-0.5">{msg.createdTool.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onOpenTool(msg.createdTool.id)}
                          className="px-4 py-2.5 bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-[10px] font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer text-center shrink-0"
                        >
                          <span>{t.toolCreated_btn}</span>
                          <ArrowLeft size={11} className={isRtl ? '' : 'rotate-180'} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Loading indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-slate-50 dark:bg-zinc-950/80 text-slate-500 rounded-[1.5rem] rounded-bl-none p-4 border border-slate-150 dark:border-zinc-800 flex items-center gap-2.5 w-fit">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-xs">{t.loadingText}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input box footer controls */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-[#f8fafc]/50 dark:bg-zinc-950/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="flex gap-2"
          >
            <input
              id="chat-user-input"
              type="text"
              required
              disabled={isLoading}
              placeholder={t.placeholder}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-2xl px-4 py-3 placeholder-slate-400 dark:placeholder-zinc-500 hover:border-slate-350 dark:hover:border-zinc-700 text-xs transition-all outline-none focus:border-blue-500 focus:dark:border-blue-500"
              style={{ textAlign: isRtl ? 'right' : 'left' }}
            />
            <button
              id="btn-chat-send-msg"
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95 shrink-0"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={15} className={isRtl ? 'rotate-180' : ''} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
