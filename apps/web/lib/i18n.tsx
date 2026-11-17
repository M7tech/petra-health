'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'en' | 'ar' | 'ckb';
export const LANGS: { code: Lang; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'ckb', label: 'کوردی', dir: 'rtl' },
];

// Shell, navigation, sign-in and the most-used screens. Strings not listed here
// fall back to English, so untranslated pages still render.
const DICT: Record<string, Record<Lang, string>> = {
  'nav.care': { en: 'Care', ar: 'الرعاية', ckb: 'چاودێری' },
  'nav.directory': { en: 'Directory', ar: 'الدليل', ckb: 'ڕێبەر' },
  'nav.administration': { en: 'Administration', ar: 'الإدارة', ckb: 'بەڕێوەبردن' },
  'nav.practice': { en: 'My practice', ar: 'عيادتي', ckb: 'کلینیکەکەم' },
  'nav.overview': { en: 'Overview', ar: 'نظرة عامة', ckb: 'تێڕوانینی گشتی' },
  'nav.patients': { en: 'Patients', ar: 'المرضى', ckb: 'نەخۆشەکان' },
  'nav.myPatients': { en: 'My Patients', ar: 'مرضاي', ckb: 'نەخۆشەکانم' },
  'nav.map': { en: 'Map', ar: 'الخريطة', ckb: 'نەخشە' },
  'nav.messages': { en: 'Messages', ar: 'الرسائل', ckb: 'نامەکان' },
  'nav.reports': { en: 'Reports', ar: 'التقارير', ckb: 'ڕاپۆرتەکان' },
  'nav.content': { en: 'Training & News', ar: 'التدريب والأخبار', ckb: 'ڕاهێنان و هەواڵ' },
  'nav.countries': { en: 'Countries', ar: 'الدول', ckb: 'وڵاتان' },
  'nav.cities': { en: 'Cities', ar: 'المدن', ckb: 'شارەکان' },
  'nav.doctors': { en: 'Doctors', ar: 'الأطباء', ckb: 'پزیشکەکان' },
  'nav.users': { en: 'Users', ar: 'المستخدمون', ckb: 'بەکارهێنەران' },
  'nav.pharmacies': { en: 'Pharmacies', ar: 'الصيدليات', ckb: 'دەرمانخانەکان' },
  'nav.settings': { en: 'Settings', ar: 'الإعدادات', ckb: 'ڕێکخستنەکان' },
  'shell.signOut': { en: 'Sign out', ar: 'تسجيل الخروج', ckb: 'چوونەدەرەوە' },
  'shell.openNav': { en: 'Open navigation', ar: 'فتح القائمة', ckb: 'کردنەوەی لیست' },
  'shell.closeNav': { en: 'Close navigation', ar: 'إغلاق القائمة', ckb: 'داخستنی لیست' },
  'shell.collapse': { en: 'Collapse sidebar', ar: 'طي الشريط الجانبي', ckb: 'بچووککردنەوەی لایەنی' },
  'shell.expand': { en: 'Expand sidebar', ar: 'توسيع الشريط الجانبي', ckb: 'گەورەکردنی لایەنی' },
  'shell.light': { en: 'Switch to light theme', ar: 'التبديل إلى السمة الفاتحة', ckb: 'گۆڕین بۆ ڕووناک' },
  'shell.dark': { en: 'Switch to dark theme', ar: 'التبديل إلى السمة الداكنة', ckb: 'گۆڕین بۆ تاریک' },
  'shell.search': { en: 'Search pages and patients', ar: 'ابحث في الصفحات والمرضى', ckb: 'گەڕان لە پەڕە و نەخۆشەکان' },
  'shell.searchHint': { en: 'Search', ar: 'بحث', ckb: 'گەڕان' },
  'shell.noResults': { en: 'No results', ar: 'لا توجد نتائج', ckb: 'ئەنجام نییە' },
  'shell.pages': { en: 'Pages', ar: 'الصفحات', ckb: 'پەڕەکان' },
  'shell.language': { en: 'Language', ar: 'اللغة', ckb: 'زمان' },
  'login.title': { en: 'Sign in', ar: 'تسجيل الدخول', ckb: 'چوونەژوورەوە' },
  'login.subtitle': { en: 'Use your Petra Health portal account.', ar: 'استخدم حسابك في بوابة بترا هيلث.', ckb: 'هەژماری پۆرتاڵی پێترا هێڵس بەکاربهێنە.' },
  'login.admin': { en: 'Admin', ar: 'مدير', ckb: 'بەڕێوەبەر' },
  'login.doctor': { en: 'Doctor', ar: 'طبيب', ckb: 'پزیشک' },
  'login.username': { en: 'Username', ar: 'اسم المستخدم', ckb: 'ناوی بەکارهێنەر' },
  'login.email': { en: 'Email', ar: 'البريد الإلكتروني', ckb: 'ئیمەیڵ' },
  'login.password': { en: 'Password', ar: 'كلمة المرور', ckb: 'وشەی نهێنی' },
  'login.remember': { en: 'Remember me', ar: 'تذكرني', ckb: 'بمهێنەوە بیرت' },
  'login.forgot': { en: 'Forgot password?', ar: 'نسيت كلمة المرور؟', ckb: 'وشەی نهێنیت بیرچووە؟' },
  'login.continue': { en: 'Continue', ar: 'متابعة', ckb: 'بەردەوام بە' },
  'login.signIn': { en: 'Sign in', ar: 'دخول', ckb: 'چوونەژوورەوە' },
  'login.wait': { en: 'Please wait…', ar: 'يرجى الانتظار…', ckb: 'تکایە چاوەڕێ بە…' },
  'common.search': { en: 'Search', ar: 'بحث', ckb: 'گەڕان' },
  'common.save': { en: 'Save', ar: 'حفظ', ckb: 'پاشەکەوتکردن' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء', ckb: 'پاشگەزبوونەوە' },
  'common.edit': { en: 'Edit', ar: 'تعديل', ckb: 'دەستکاری' },
  'common.delete': { en: 'Delete', ar: 'حذف', ckb: 'سڕینەوە' },
  'common.back': { en: 'All patients', ar: 'كل المرضى', ckb: 'هەموو نەخۆشەکان' },
  'patients.title': { en: 'Patients', ar: 'المرضى', ckb: 'نەخۆشەکان' },
  'patients.searchPh': { en: 'Search name, email, city or doctor', ar: 'ابحث بالاسم أو البريد أو المدينة أو الطبيب', ckb: 'گەڕان بە ناو، ئیمەیڵ، شار یان پزیشک' },
  'patients.name': { en: 'Name', ar: 'الاسم', ckb: 'ناو' },
  'patients.email': { en: 'Email', ar: 'البريد الإلكتروني', ckb: 'ئیمەیڵ' },
  'patients.location': { en: 'Location', ar: 'الموقع', ckb: 'شوێن' },
  'patients.doctor': { en: 'Doctor', ar: 'الطبيب', ckb: 'پزیشک' },
  'patients.meds': { en: 'Meds', ar: 'الأدوية', ckb: 'دەرمان' },
  'patients.doses': { en: 'Doses', ar: 'الجرعات', ckb: 'دۆز' },
  'patients.none': { en: 'No patients yet', ar: 'لا يوجد مرضى بعد', ckb: 'هێشتا نەخۆش نییە' },
  'patients.noMatch': { en: 'No patients match your search', ar: 'لا يوجد مرضى مطابقون للبحث', ckb: 'هیچ نەخۆشێک لەگەڵ گەڕانەکەت ناگونجێت' },
  'settings.title': { en: 'Settings', ar: 'الإعدادات', ckb: 'ڕێکخستنەکان' },
  'settings.doctorFeatures': { en: 'Doctor features', ar: 'ميزات الأطباء', ckb: 'تایبەتمەندییەکانی پزیشک' },
  'settings.doctorFeaturesDesc': {
    en: 'When on, patients choose a doctor when they set up the app and can chat with them. When off, the app hides doctors, doctor comments and chat, and patients only choose a country and city. Existing messages are kept.',
    ar: 'عند التفعيل، يختار المرضى طبيبًا عند إعداد التطبيق ويمكنهم التحدث معه. عند الإيقاف، يخفي التطبيق الأطباء وتعليقاتهم والمحادثة، ويختار المرضى الدولة والمدينة فقط. تبقى الرسائل الحالية محفوظة.',
    ckb: 'کاتێک چالاکە، نەخۆشەکان لە کاتی ڕێکخستنی ئەپەکە پزیشک هەڵدەبژێرن و دەتوانن قسەی لەگەڵ بکەن. کاتێک ناچالاکە، ئەپەکە پزیشک و تێبینییەکانی و چاتەکە دەشارێتەوە و نەخۆش تەنها وڵات و شار هەڵدەبژێرێت. نامە پێشووەکان دەمێننەوە.',
  },
};

interface I18n {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
  setLang: (l: Lang) => void;
}
const Ctx = createContext<I18n>({ lang: 'en', dir: 'ltr', t: (k) => DICT[k]?.en ?? k, setLang: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('petra_lang') as Lang | null;
      if (saved && LANGS.some((l) => l.code === saved)) setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const dir = LANGS.find((l) => l.code === lang)!.dir;
  useEffect(() => {
    document.documentElement.lang = lang === 'ckb' ? 'ckb' : lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('petra_lang', l);
    } catch {
      /* ignore */
    }
  }, []);
  const t = useCallback((key: string) => DICT[key]?.[lang] ?? DICT[key]?.en ?? key, [lang]);

  return <Ctx.Provider value={{ lang, dir, t, setLang }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
