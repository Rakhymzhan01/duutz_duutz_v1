import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Update document direction for RTL languages
    if (languageCode === 'ar') {
      document.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  };

  return (
    <div className="relative language-switcher">
      <div className="flex items-center space-x-2">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
              i18n.language === language.code
                ? 'bg-purple-500 text-white'
                : 'text-purple-200 hover:text-white hover:bg-purple-600/50'
            }`}
          >
            {language.nativeName}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;