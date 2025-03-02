"use client";

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '~/i18n/navigation';
import { locales, type Locale } from '~/i18n/locales';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('languageSwitcher');
  
  const switchLocale = (newLocale: Locale) => {
    // Use the router to navigate to the same path but with a new locale
    router.replace(pathname, { locale: newLocale });
  };
  
  return (
    <div className="flex text-sm text-blue-100" aria-label={t('ariaLabel')}>
      {locales.map((l) => (
        <React.Fragment key={l}>
          {l !== locales[0] && <span className="mx-1">|</span>}
          <button 
            onClick={() => switchLocale(l)}
            className={`px-2 ${locale === l ? 'font-bold underline' : 'hover:underline'}`}
          >
            {l.toUpperCase()}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
} 