interface DataDeletionPageProps {
  t: any;
  language: string;
}

export default function DataDeletionPage({ language }: DataDeletionPageProps) {
  const isAr = language === 'ar';

  const steps = isAr ? [
    {
      title: 'الطريقة الأولى: من صفحة الحساب',
      body: 'سجّل الدخول إلى حسابك، اذهب إلى صفحة الحساب (Profile)، ومن هناك يمكنك تعديل بياناتك أو حذف معلومات ملفك الشخصي.'
    },
    {
      title: 'الطريقة الثانية: طلب حذف عبر البريد الإلكتروني',
      body: 'يمكنك إرسال طلب حذف بياناتك إلى البريد الإلكتروني الموجود في صفحة "عن المنصة". يجب أن يتضمن الطلب:\n\n• اسم المستخدم أو البريد الإلكتروني المسجل به\n• طلب صريح بحذف جميع البيانات المرتبطة بالحساب\n\nسيتم معالجة طلبك خلال 30 يومًا.'
    },
    {
      title: 'الطريقة الثالثة: تسجيل الخروج',
      body: 'يمكنك تسجيل الخروج من حسابك في أي وقت باستخدام زر "تسجيل الخروج" في صفحة الحساب.'
    },
    {
      title: 'ماذا يحدث بعد حذف البيانات؟',
      body: 'عند حذف بياناتك:\n\n• سيتم حذف ملفك الشخصي\n• سيتم حذف الإعدادات الخاصة بك\n• قد تبقى بعض البيانات مجهولة المصدر لأغراض إحصائية\n• لن نتمكن من استعادة بياناتك بعد الحذف'
    },
    {
      title: 'Facebook Login',
      body: 'إذا كنت تستخدم Facebook Login، يمكنك أيضًا إزالة صلاحيات التطبيق من إعدادات Facebook الخاصة بك:\n\n1. اذهب إلى إعدادات Facebook\n2. اختر "التطبيقات والمواقع"\n3. ابحث عن AI Hub\n4. اختر "إزالة"'
    },
    {
      title: 'البيانات المخزنة',
      body: 'البيانات التي نخزنها عنك تشمل:\n\n• اسمك العام من Facebook\n• صورة ملفك الشخصي\n• بريدك الإلكتروني (إن وفرته)\n• سجل استخدامك للأدوات (لتحسين تجربتك)\n\nيتم حذف جميع هذه البيانات عند تقديم طلب الحذف.'
    }
  ] : [
    {
      title: 'Method 1: From Account Page',
      body: 'Log in to your account, go to the Profile page, where you can edit your data or delete your profile information.'
    },
    {
      title: 'Method 2: Deletion Request via Email',
      body: 'You can send a data deletion request to the email address listed on the "About" page. The request must include:\n\n• Your username or registered email address\n• A clear request to delete all data associated with the account\n\nYour request will be processed within 30 days.'
    },
    {
      title: 'Method 3: Sign Out',
      body: 'You can sign out of your account at any time using the "Sign Out" button on the Profile page.'
    },
    {
      title: 'What Happens After Data Deletion?',
      body: 'When your data is deleted:\n\n• Your profile will be removed\n• Your settings will be deleted\n• Some anonymized data may remain for statistical purposes\n• We cannot restore your data after deletion'
    },
    {
      title: 'Facebook Login',
      body: 'If you use Facebook Login, you can also remove the app permissions from your Facebook settings:\n\n1. Go to Facebook Settings\n2. Click "Apps and Websites"\n3. Find AI Hub\n4. Click "Remove"'
    },
    {
      title: 'Stored Data',
      body: 'The data we store about you includes:\n\n• Your public name from Facebook\n• Your profile picture\n• Your email address (if provided)\n• Your tool usage history (to improve your experience)\n\nAll of this data is deleted upon deletion request.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-8">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-zinc-100 mb-2">
          {isAr ? 'حذف البيانات' : 'Data Deletion Instructions'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-8">
          {isAr
            ? 'تعليمات حذف بياناتك من AI Hub'
            : 'Instructions for deleting your data from AI Hub'}
        </p>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={i}>
              <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-2">{step.title}</h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
