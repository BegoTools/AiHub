interface PrivacyPageProps {
  t: any;
  language: string;
}

export default function PrivacyPage({ language }: PrivacyPageProps) {
  const isAr = language === 'ar';

  const sections = isAr ? [
    {
      title: 'المقدمة',
      body: 'نحن في AI Hub نهتم بخصوصيتك وأمان بياناتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك عند استخدام منصتنا.'
    },
    {
      title: 'المعلومات التي نجمعها',
      body: 'عند تسجيل الدخول باستخدام Facebook، نجمع المعلومات التالية فقط:\n\n• اسمك العام (public profile)\n• صورة الملف الشخصي (profile picture)\n• البريد الإلكتروني (إن وفرته Facebook)\n\nلا نجمع أي معلومات حساسة أو منشورات أو قائمة أصدقاء أو أي بيانات إضافية.'
    },
    {
      title: 'كيف نستخدم معلوماتك',
      body: 'نستخدم معلوماتك فقط للأغراض التالية:\n\n• إنشاء وإدارة حسابك على المنصة\n• تخصيص تجربتك وعرض اسمك وصورتك\n• التواصل معك بخصوص خدماتنا (عبر البريد الإلكتروني إن وفرته)\n\nلا نبيع أو نشارك معلوماتك مع أي طرف ثالث.'
    },
    {
      title: 'تخزين البيانات وأمانها',
      body: 'بياناتك مخزنة بشكل آمن على خوادم Supabase. نستخدم إجراءات أمان قياسية لحماية معلوماتك من الوصول غير المصرح به.'
    },
    {
      title: 'حذف البيانات',
      body: 'يمكنك حذف بياناتك في أي وقت من خلال صفحة الحساب داخل الموقع، أو عبر إرسال طلب حذف إلى البريد الإلكتروني الموجود في الموقع.'
    },
    {
      title: 'التعديلات على السياسة',
      body: 'قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإعلامك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال المنصة.'
    },
    {
      title: 'اتصل بنا',
      body: 'إذا كان لديك أي استفسار حول سياسة الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني الموجود في صفحة "عن المنصة".'
    }
  ] : [
    {
      title: 'Introduction',
      body: 'At AI Hub, we care about your privacy and data security. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.'
    },
    {
      title: 'Information We Collect',
      body: 'When you sign in with Facebook, we only collect the following information:\n\n• Your public profile name\n• Your profile picture\n• Your email address (if provided by Facebook)\n\nWe do not collect any sensitive information, posts, friend lists, or any additional data.'
    },
    {
      title: 'How We Use Your Information',
      body: 'We use your information solely for:\n\n• Creating and managing your account on the platform\n• Personalizing your experience by displaying your name and picture\n• Communicating with you about our services (via email if provided)\n\nWe do not sell or share your information with any third party.'
    },
    {
      title: 'Data Storage and Security',
      body: 'Your data is securely stored on Supabase servers. We use industry-standard security measures to protect your information from unauthorized access.'
    },
    {
      title: 'Data Deletion',
      body: 'You can delete your data at any time through your account page on the website, or by sending a deletion request to the email address listed on the site.'
    },
    {
      title: 'Policy Changes',
      body: 'We may update this Privacy Policy from time to time. We will notify you of any material changes via email or through the platform.'
    },
    {
      title: 'Contact Us',
      body: 'If you have any questions about this Privacy Policy, you can contact us via the email address listed on the "About" page.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-8">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-zinc-100 mb-2">
          {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
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
