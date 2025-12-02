import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './translations/en.json';
import arTranslations from './translations/ar.json';

// Detect device language
const getDeviceLanguage = () => {
  const saved = localStorage.getItem('language');
  if (saved) return saved;
  
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang?.startsWith('ar')) return 'ar';
  return 'en';
};

const detectedLang = getDeviceLanguage();

// Set document direction based on language
export const setDocumentDirection = (lang: string) => {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  localStorage.setItem('language', lang);
};

// Set initial direction
setDocumentDirection(detectedLang);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations },
    },
    lng: detectedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Listen for language changes and update direction
i18n.on('languageChanged', (lang) => {
  setDocumentDirection(lang);
});

export default i18n;
