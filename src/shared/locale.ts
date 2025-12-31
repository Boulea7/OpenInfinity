export type UiLanguage = 'zh' | 'en';

export function normalizeUiLanguage(value: unknown): UiLanguage {
  if (value === 'en') return 'en';
  return 'zh';
}

export function getLocaleFromUiLanguage(lang: UiLanguage): string {
  return lang === 'zh' ? 'zh-CN' : 'en-US';
}

export function getCurrentUiLanguage(): UiLanguage {
  if (typeof localStorage === 'undefined') return 'zh';
  return normalizeUiLanguage(localStorage.getItem('language'));
}

export function applyDocumentLanguage(lang: UiLanguage): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = getLocaleFromUiLanguage(lang);
  document.documentElement.dataset.lang = lang;
}

