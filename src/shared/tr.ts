import { getCurrentUiLanguage, type UiLanguage } from './locale';

export function tr(zh: string, en: string, lang: UiLanguage = getCurrentUiLanguage()): string {
  return lang === 'zh' ? zh : en;
}

