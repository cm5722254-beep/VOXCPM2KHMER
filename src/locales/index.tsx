import React, { createContext, useContext, useState } from 'react';
import { km } from './km';
import { en } from './en';

export type LanguageCode = 'km' | 'en';

type Dictionaries = typeof km;

const dictionaries: Record<LanguageCode, Dictionaries> = {
  km,
  en,
};

interface TranslationContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string, fallback?: string) => string;
}

const TranslationContext = createContext<TranslationContextType>({
  language: 'km',
  setLanguage: () => {},
  t: (path: string, fallback?: string) => fallback || path,
});

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      return (localStorage.getItem('dragon_app_language') as LanguageCode) || 'km';
    } catch {
      return 'km';
    }
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('dragon_app_language', lang);
    } catch {}
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current: any = dictionaries[language] || dictionaries.km;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to Khmer primary dictionary if key not found in current language
        let fallbackCurrent: any = dictionaries.km;
        for (const fbKey of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbKey in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fbKey];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackCurrent === 'string' ? fallbackCurrent : fallback || path;
      }
    }

    return typeof current === 'string' ? current : fallback || path;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);

/**
 * Standalone translation getter for non-React contexts or outside components
 */
export const t = (path: string, fallback?: string): string => {
  let lang: LanguageCode = 'km';
  try {
    lang = (localStorage.getItem('dragon_app_language') as LanguageCode) || 'km';
  } catch {}

  const dict = dictionaries[lang] || dictionaries.km;
  const keys = path.split('.');
  let current: any = dict;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return fallback || path;
    }
  }

  return typeof current === 'string' ? current : fallback || path;
};
