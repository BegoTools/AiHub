interface TermsPageProps {
  t: any;
  language: string;
}

export default function TermsPage({ language }: TermsPageProps) {
  const isAr = language === 'ar';

  const sections = isAr ? [
    {
      title: 'القبول بالشروط',
      body: 'باستخدامك لمنصة AI Hub، فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يُرجى عدم استخدام المنصة.'
    },
    {
      title: 'الحساب',
      body: 'للاستفادة من بعض خدماتنا، قد تحتاج إلى إنشاء حساب. أنت مسؤول عن الحفاظ على سرية معلومات حسابك وعن جميع الأنشطة التي تتم تحت حسابك.'
    },
    {
      title: 'الاستخدام المسموح',
      body: 'توافق على استخدام المنصة فقط للأغراض القانونية ووفقًا لهذه الشروط. لا يجوز لك:\n\n• استخدام المنصة لأي غرض غير قانوني\n• محاولة الوصول غير المصرح به إلى أنظمتنا\n• إساءة استخدام الأدوات أو الخدمات المقدمة\n• نقل أي فيروسات أو تعليمات برمجية ضارة'
    },
    {
      title: 'الملكية الفكرية',
      body: 'جميع المحتويات والأدوات والخدمات المتاحة على المنصة هي ملك لنا أو لمرخصينا، ومحمية بموجب قوانين الملكية الفكرية.'
    },
    {
      title: 'إخلاء المسؤولية',
      body: 'المنصة متاحة "كما هي" دون أي ضمانات. لا نضمن أن المنصة ستكون خالية من الأخطاء أو متاحة بشكل مستمر.'
    },
    {
      title: 'تحديد المسؤولية',
      body: 'لن نكون مسؤولين عن أي أضرار غير مباشرة أو تبعية ناتجة عن استخدام أو عدم القدرة على استخدام المنصة.'
    }
  ] : [
    {
      title: 'Acceptance of Terms',
      body: 'By using AI Hub, you agree to these terms and conditions. If you do not agree to any part of these terms, please do not use the platform.'
    },
    {
      title: 'Account',
      body: 'To use certain services, you may need to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities under your account.'
    },
    {
      title: 'Permitted Use',
      body: 'You agree to use the platform only for lawful purposes and in accordance with these terms. You may not:\n\n• Use the platform for any illegal purpose\n• Attempt unauthorized access to our systems\n• Misuse the tools or services provided\n• Transmit any viruses or malicious code'
    },
    {
      title: 'Intellectual Property',
      body: 'All content, tools, and services available on the platform are owned by us or our licensors and are protected by intellectual property laws.'
    },
    {
      title: 'Disclaimer',
      body: 'The platform is provided "as is" without any warranties. We do not guarantee that the platform will be error-free or continuously available.'
    },
    {
      title: 'Limitation of Liability',
      body: 'We shall not be liable for any indirect or consequential damages arising from the use or inability to use the platform.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-8">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-zinc-100 mb-2">
          {isAr ? 'شروط الخدمة' : 'Terms of Service'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-8">
          {isAr ? 'آخر تحديث: يونيو 2026' : 'Last updated: June 2026'}
        </p>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-2">{section.title}</h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
