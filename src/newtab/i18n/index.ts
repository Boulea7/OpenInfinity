import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';
import { applyDocumentLanguage, normalizeUiLanguage } from '../../shared/locale';

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: (() => {
    const stored = localStorage.getItem('language');
    if (!stored) {
      // First time user: force set to Chinese
      localStorage.setItem('language', 'zh');
      applyDocumentLanguage('zh');
      return 'zh';
    }
    applyDocumentLanguage(normalizeUiLanguage(stored));
    return stored;
  })(),
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

// Keep <html lang="..."> in sync after runtime language switches (newtab + popup).
i18n.on('languageChanged', (lng) => {
  const lang = normalizeUiLanguage(lng);
  try {
    localStorage.setItem('language', lang);
  } catch {
    // Ignore storage failures (private mode or blocked storage)
  }
  applyDocumentLanguage(lang);
});

export default i18n;
