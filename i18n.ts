import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enTools from './locales/en/tools.json';
import enAuth from './locales/en/auth.json';

import arCommon from './locales/ar/common.json';
import arTools from './locales/ar/tools.json';
import arAuth from './locales/ar/auth.json';

const resources = {
  en: {
    common: enCommon,
    tools: enTools,
    auth: enAuth,
  },
  ar: {
    common: arCommon,
    tools: arTools,
    auth: arAuth,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    // Language detection settings
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // Namespace configuration
    defaultNS: 'common',
    ns: ['common', 'tools', 'auth'],
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    // RTL language support
    react: {
      useSuspense: false,
    },
  });

export default i18n;