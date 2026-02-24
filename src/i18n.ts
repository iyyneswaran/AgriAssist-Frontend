import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';
import taTranslation from './locales/ta/translation.json';

const resources = {
    en: {
        translation: enTranslation
    },
    hi: {
        translation: hiTranslation
    },
    ta: {
        translation: taTranslation
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already safely escapes
        }
    });

export default i18n;
