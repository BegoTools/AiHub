import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'writing',
    name: 'كتابة وتحرير',
    description: 'اكتب، لخص، ترجم، وصحح نصوصك باحترافية. كل أدوات الكتابة في مكان واحد.',
    icon: 'PenTool',
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/20',
    borderColor: 'border-blue-100 dark:border-blue-900/30'
  },
  {
    id: 'business',
    name: 'بيزنس ومشاريع',
    description: 'خطط، حلل، وطور مشروعك التجاري بأدوات ذكية للتحليل والتسويق والتواصل.',
    icon: 'Briefcase',
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/20',
    borderColor: 'border-emerald-100 dark:border-emerald-900/30'
  },
  {
    id: 'social',
    name: 'سوشيال ميديا',
    description: 'بوستات، إعلانات، هاشتاجات، وخطط محتوى لمنصات التواصل الاجتماعي.',
    icon: 'Megaphone',
    color: 'from-rose-500 to-red-600',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/20',
    borderColor: 'border-rose-100 dark:border-rose-900/30'
  },
  {
    id: 'study',
    name: 'تعلم ودراسة',
    description: 'افهم، راجع، واختبر نفسك بأدوات تلخيص وشرح وتوليد أسئلة ذكية.',
    icon: 'GraduationCap',
    color: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/20',
    borderColor: 'border-amber-100 dark:border-amber-900/30'
  },
  {
    id: 'career',
    name: 'شغل ووظائف',
    description: 'ابنِ مسيرتك المهنية بسيرة ذاتية احترافية، خطاب تقديم، وتحضير للمقابلات.',
    icon: 'UserCheck',
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-950/20',
    borderColor: 'border-violet-100 dark:border-violet-900/30'
  },
  {
    id: 'daily',
    name: 'حياة يومية',
    description: 'نظم يومك، خطط ميزانيتك، سافر بذكاء، وتناول طعاماً صحياً.',
    icon: 'Sun',
    color: 'from-yellow-500 to-orange-500',
    bgLight: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-950/20',
    borderColor: 'border-yellow-100 dark:border-yellow-900/30'
  },
  {
    id: 'coding',
    name: 'برمجة وتقنية',
    description: 'حل مشاكل برمجية، افهم أكواد، وطور مشاريعك التقنية بسرعة.',
    icon: 'Code',
    color: 'from-cyan-500 to-blue-600',
    bgLight: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-950/20',
    borderColor: 'border-cyan-100 dark:border-cyan-900/30'
  },
  {
    id: 'media',
    name: 'صور وملفات',
    description: 'ارفع صور وملفات، حللها، واستخرج منها معلومات ذكية.',
    icon: 'Image',
    color: 'from-pink-500 to-rose-600',
    bgLight: 'bg-pink-50',
    bgDark: 'dark:bg-pink-950/20',
    borderColor: 'border-pink-100 dark:border-pink-900/30'
  }
];
