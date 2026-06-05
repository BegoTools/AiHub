import { Workflow } from '../types/workflowTypes';

export const workflows: Workflow[] = [
  {
    id: 'wf_article',
    title: 'كتابة مقال متكامل',
    description: 'رحلة كاملة لكتابة مقال احترافي من الفكرة إلى النشر',
    icon: 'FileEdit',
    category: 'writing',
    color: 'blue',
    estimatedTime: '10-15 دقيقة',
    steps: [
      {
        id: 'article_topic',
        title: 'موضوع المقال',
        description: 'حدد موضوع المقال الذي تريد كتابته',
        type: 'input',
        inputField: {
          label: 'ما هو موضوع المقال؟',
          placeholder: 'مثلاً: تأثير الذكاء الاصطناعي على التعليم...',
          type: 'textarea',
        },
      },
      {
        id: 'article_audience',
        title: 'الجمهور المستهدف',
        description: 'لمن تكتب هذا المقال؟',
        type: 'select',
        inputField: {
          label: 'اختر الجمهور المستهدف',
          placeholder: 'اختر الجمهور',
          type: 'select',
          options: [
            { value: 'general', label: 'عامة القراء' },
            { value: 'students', label: 'طلاب وباحثين' },
            { value: 'professionals', label: 'محترفين وخبراء' },
            { value: 'beginners', label: 'مبتدئين في المجال' },
          ],
        },
      },
      {
        id: 'article_outline',
        title: 'توليد مخطط المقال',
        description: 'يقوم الذكاء الاصطناعي بتوليد مخطط منظم للمقال',
        type: 'generate',
        toolId: 'writing_ideas',
        promptTemplate: `اقترح مخططاً متكاملاً لمقال عن الموضوع: "{{topic}}" للجمهور: "{{audience}}". المخطط يشمل: مقدمة، 3-5 عناوين رئيسية مع نقاط فرعية، وخاتمة.`,
      },
      {
        id: 'article_result',
        title: 'المقال النهائي',
        description: 'المقال متكامل وجاهز للنشر',
        type: 'result',
      },
    ],
  },
  {
    id: 'wf_marketing',
    title: 'حملة تسويقية متكاملة',
    description: 'خطط وأطلق حملة تسويقية ناجحة لمنتجك أو خدمتك',
    icon: 'Megaphone',
    category: 'business',
    color: 'amber',
    estimatedTime: '15-20 دقيقة',
    steps: [
      {
        id: 'mk_product',
        title: 'المنتج أو الخدمة',
        description: 'صف منتجك أو خدمتك بالتفصيل',
        type: 'input',
        inputField: {
          label: 'ما هو المنتج أو الخدمة؟',
          placeholder: 'صف المنتج، مميزاته، وسعره...',
          type: 'textarea',
        },
      },
      {
        id: 'mk_target',
        title: 'الجمهور المستهدف',
        description: 'من هم عملاؤك المحتملون؟',
        type: 'input',
        inputField: {
          label: 'صف جمهورك المستهدف',
          placeholder: 'مثلاً: شباب 20-35 سنة، مهتمين بالتكنولوجيا...',
          type: 'textarea',
        },
      },
      {
        id: 'mk_goals',
        title: 'أهداف الحملة',
        description: 'حدد أهداف الحملة التسويقية',
        type: 'select',
        inputField: {
          label: 'الهدف الرئيسي للحملة',
          placeholder: 'اختر الهدف',
          type: 'select',
          options: [
            { value: 'awareness', label: 'زيادة الوعي بالعلامة التجارية' },
            { value: 'sales', label: 'زيادة المبيعات' },
            { value: 'engagement', label: 'زيادة التفاعل' },
            { value: 'leads', label: 'توليد عملاء محتملين' },
          ],
        },
      },
      {
        id: 'mk_strategy',
        title: 'الخطة التسويقية',
        description: 'توليد خطة تسويقية متكاملة',
        type: 'generate',
        toolId: 'business_marketing_plan',
        promptTemplate: `صمم خطة تسويقية متكاملة للمنتج: "{{product}}" للجمهور: "{{target}}" بهدف: "{{goals}}".`,
      },
      {
        id: 'mk_result',
        title: 'الخطة النهائية',
        description: 'خطتك التسويقية جاهزة للتنفيذ',
        type: 'result',
      },
    ],
  },
  {
    id: 'wf_exam',
    title: 'مذاكرة لامتحان',
    description: 'رحلة متكاملة للمذاكرة والاستعداد لأي امتحان',
    icon: 'GraduationCap',
    category: 'study',
    color: 'green',
    estimatedTime: '20-30 دقيقة',
    steps: [
      {
        id: 'exam_subject',
        title: 'المادة الدراسية',
        description: 'حدد المادة والموضوع',
        type: 'input',
        inputField: {
          label: 'ما هي المادة والموضوع؟',
          placeholder: 'مثلاً: فيزياء - فصل الكهرباء والمغناطيسية',
          type: 'textarea',
        },
      },
      {
        id: 'exam_time',
        title: 'الوقت المتاح',
        description: 'كم يوماً متبقياً للامتحان؟',
        type: 'input',
        inputField: {
          label: 'عدد الأيام المتاحة للمذاكرة',
          placeholder: 'مثلاً: 5 أيام',
          type: 'text',
        },
      },
      {
        id: 'exam_summary',
        title: 'ملخص سريع',
        description: 'توليد ملخص سريع لأهم النقاط',
        type: 'generate',
        toolId: 'study_summarizer',
        promptTemplate: `لخص النقاط الأساسية في مادة "{{subject}}" بشكل منظم وسهل الحفظ.`,
      },
      {
        id: 'exam_plan',
        title: 'جدول المذاكرة',
        description: 'توليد جدول مذاكرة مخصص',
        type: 'generate',
        toolId: 'study_plan',
        promptTemplate: `اعمل جدول مذاكرة لمادة "{{subject}}" في "{{time}}" مع تقسيم يومي.`,
      },
      {
        id: 'exam_quiz',
        title: 'اختبار تجريبي',
        description: 'اختبر فهمك بأسئلة تجريبية',
        type: 'generate',
        toolId: 'study_mcq',
        promptTemplate: `اعمل 5 أسئلة اختيار من متعدد في مادة "{{subject}}" لاختبار الفهم.`,
      },
      {
        id: 'exam_result',
        title: 'جاهز للامتحان!',
        description: 'الملخص، الجدول، والاختبار جاهزون',
        type: 'result',
      },
    ],
  },
  {
    id: 'wf_business',
    title: 'بدء مشروع صغير',
    description: 'من الفكرة إلى خطة عمل كاملة لمشروعك الصغير',
    icon: 'Rocket',
    category: 'business',
    color: 'indigo',
    estimatedTime: '15-20 دقيقة',
    steps: [
      {
        id: 'biz_idea',
        title: 'فكرة المشروع',
        description: 'صف فكرة مشروعك',
        type: 'input',
        inputField: {
          label: 'ما هي فكرة مشروعك؟',
          placeholder: 'صف الفكرة باختصار...',
          type: 'textarea',
        },
      },
      {
        id: 'biz_budget',
        title: 'الميزانية',
        description: 'حدد ميزانيتك التقريبية',
        type: 'input',
        inputField: {
          label: 'ما هي ميزانيتك التقريبية؟',
          placeholder: 'مثلاً: 5000 - 10000 جنيه',
          type: 'text',
        },
      },
      {
        id: 'biz_skills',
        title: 'مهاراتك',
        description: 'ما هي المهارات التي تمتلكها؟',
        type: 'input',
        inputField: {
          label: 'أهم مهاراتك',
          placeholder: 'مثلاً: تسويق، برمجة، تصميم...',
          type: 'textarea',
        },
      },
      {
        id: 'biz_feasibility',
        title: 'دراسة جدوى سريعة',
        description: 'توليد تحليل لجدوى المشروع',
        type: 'generate',
        toolId: 'business_ideas',
        promptTemplate: `حلل فكرة المشروع: "{{idea}}" بميزانية "{{budget}}" ومهارات "{{skills}}". قدم تحليل SWOT ونقاط القوة والفرص.`,
      },
      {
        id: 'biz_marketing',
        title: 'خطة تسويق أولية',
        description: 'توليد خطة تسويق بسيطة',
        type: 'generate',
        toolId: 'business_marketing_plan',
        promptTemplate: `صمم خطة تسويق أولية لمشروع: "{{idea}}" بميزانية "{{budget}}" مستغلاً مهارات "{{skills}}".`,
      },
      {
        id: 'biz_result',
        title: 'خطة المشروع',
        description: 'دراسة الجدوى وخطة التسويق جاهزتان',
        type: 'result',
      },
    ],
  },
  {
    id: 'wf_cv',
    title: 'بناء سيرة ذاتية احترافية',
    description: 'أنشئ سيرة ذاتية كاملة وجذابة لأي وظيفة',
    icon: 'FileUser',
    category: 'career',
    color: 'purple',
    estimatedTime: '15-20 دقيقة',
    steps: [
      {
        id: 'cv_personal',
        title: 'البيانات الشخصية',
        description: 'أدخل بياناتك الأساسية',
        type: 'input',
        inputField: {
          label: 'الاسم الكامل والمسمى الوظيفي',
          placeholder: 'مثلاً: أحمد علي - مهندس برمجيات',
          type: 'text',
        },
      },
      {
        id: 'cv_education',
        title: 'المؤهلات التعليمية',
        description: 'أدخل مؤهلاتك الدراسية',
        type: 'input',
        inputField: {
          label: 'التعليم والشهادات',
          placeholder: 'مثلاً: بكالوريوس هندسة حاسبات 2020',
          type: 'textarea',
        },
      },
      {
        id: 'cv_experience',
        title: 'الخبرات العملية',
        description: 'أدخل خبراتك السابقة',
        type: 'input',
        inputField: {
          label: 'الخبرات والوظائف السابقة',
          placeholder: 'مثلاً: شركة XYZ - مبرمج - سنتين',
          type: 'textarea',
        },
      },
      {
        id: 'cv_skills',
        title: 'المهارات',
        description: 'أدخل مهاراتك',
        type: 'input',
        inputField: {
          label: 'المهارات التقنية والشخصية',
          placeholder: 'مثلاً: JavaScript, React, إدارة فرق...',
          type: 'textarea',
        },
      },
      {
        id: 'cv_generate',
        title: 'توليد السيرة الذاتية',
        description: 'يقوم الذكاء الاصطناعي بصياغة سيرتك',
        type: 'generate',
        toolId: 'writing_cv',
        promptTemplate: `صغ سيرة ذاتية احترافية بالعربية:
الاسم: "{{personal}}"
التعليم: "{{education}}"
الخبرات: "{{experience}}"
المهارات: "{{skills}}"`,
      },
      {
        id: 'cv_result',
        title: 'السيرة الذاتية جاهزة',
        description: 'سيرتك الذاتية جاهزة للتحميل',
        type: 'result',
      },
    ],
  },
  {
    id: 'wf_travel',
    title: 'تخطيط رحلة سفر',
    description: 'خطط لرحلتك القادمة بالكامل من البداية للنهاية',
    icon: 'Compass',
    category: 'daily',
    color: 'teal',
    estimatedTime: '10-15 دقيقة',
    steps: [
      {
        id: 'travel_dest',
        title: 'الوجهة',
        description: 'اختر وجهة سفرك',
        type: 'input',
        inputField: {
          label: 'إلى أين تريد السفر؟',
          placeholder: 'مثلاً: دهب، شرم الشيخ، إسطنبول...',
          type: 'text',
        },
      },
      {
        id: 'travel_days',
        title: 'مدة الرحلة',
        description: 'كم يوماً ستستغرق الرحلة؟',
        type: 'input',
        inputField: {
          label: 'عدد الأيام',
          placeholder: 'مثلاً: 4 أيام',
          type: 'text',
        },
      },
      {
        id: 'travel_budget',
        title: 'الميزانية',
        description: 'حدد ميزانية رحلتك',
        type: 'select',
        inputField: {
          label: 'مستوى الميزانية',
          placeholder: 'اختر الميزانية',
          type: 'select',
          options: [
            { value: 'eco', label: 'اقتصادية' },
            { value: 'medium', label: 'متوسطة' },
            { value: 'luxury', label: 'فاخرة' },
          ],
        },
      },
      {
        id: 'travel_plan',
        title: 'جدول الرحلة',
        description: 'توليد جدول سياحي مفصل',
        type: 'generate',
        toolId: 'daily_travel',
        promptTemplate: `خطط لرحلة إلى "{{dest}}" لمدة "{{days}}" بميزانية "{{budget}". قدم جدولاً يومياً كاملاً.`,
      },
      {
        id: 'travel_packing',
        title: 'قائمة المستلزمات',
        description: 'توليد قائمة بما تحتاج أخذه',
        type: 'generate',
        toolId: 'daily_packing',
        promptTemplate: `اعمل قائمة مستلزمات السفر إلى "{{dest}}" لمدة "{{days}}" بميزانية "{{budget}}".`,
      },
      {
        id: 'travel_result',
        title: 'الرحلة جاهزة!',
        description: 'جدول الرحلة وقائمة المستلزمات جاهزان',
        type: 'result',
      },
    ],
  },
  {
    id: 'wf_decision',
    title: 'تحليل واتخاذ قرار',
    description: 'رحلة منظمة لتحليل الخيارات واتخاذ أفضل قرار',
    icon: 'Scale',
    category: 'daily',
    color: 'rose',
    estimatedTime: '10-15 دقيقة',
    steps: [
      {
        id: 'dec_topic',
        title: 'القرار المطلوب',
        description: 'ما هو القرار الذي تريد اتخاذه؟',
        type: 'input',
        inputField: {
          label: 'ما هو القرار الذي تريد اتخاذه؟',
          placeholder: 'مثلاً: شراء سيارة جديدة، تغيير وظيفة، اختيار تخصص...',
          type: 'textarea',
        },
      },
      {
        id: 'dec_options',
        title: 'الخيارات المتاحة',
        description: 'أدخل الخيارات المتاحة أمامك',
        type: 'input',
        inputField: {
          label: 'ما هي الخيارات المتاحة؟',
          placeholder: 'الخيار 1: ...\nالخيار 2: ...\nالخيار 3: ...',
          type: 'textarea',
        },
      },
      {
        id: 'dec_criteria',
        title: 'معايير التقييم',
        description: 'ما هي المعايير المهمة بالنسبة لك؟',
        type: 'input',
        inputField: {
          label: 'المعايير المهمة لاتخاذ القرار',
          placeholder: 'مثلاً: التكلفة، الجودة، الوقت، المسافة...',
          type: 'textarea',
        },
      },
      {
        id: 'dec_analysis',
        title: 'تحليل الخيارات',
        description: 'تحليل شامل لجميع الخيارات',
        type: 'generate',
        toolId: 'daily_decisions',
        promptTemplate: `ساعدني في اتخاذ قرار بشأن: "{{topic}}"
الخيارات: "{{options}}"
المعايير المهمة: "{{criteria}}"
قدم تحليلاً مقارناً وتوصية نهائية.`,
      },
      {
        id: 'dec_result',
        title: 'القرار الأمثل',
        description: 'التحليل والتوصية جاهزان',
        type: 'result',
      },
    ],
  },
];

export function getWorkflowById(id: string): Workflow | undefined {
  return workflows.find(w => w.id === id);
}

export function getWorkflowsByCategory(category: string): Workflow[] {
  return workflows.filter(w => w.category === category);
}
