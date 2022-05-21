import i18n from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
// import i18next from 'i18next';
// import moment from 'moment'

const languages = {
    ca: { code: "ca", lng_code: "LANG_CA", lng_title_native: "Català", active: true },
    cs: { code: "cs", lng_code: "LANG_CS", lng_title_native: "Česky", active: true },
    de: { code: "de", lng_code: "LANG_DE", lng_title_native: "Deutsch", active: true },
    en: { code: "en", lng_code: "LANG_EN", lng_title_native: "English", active: true, default: true },
    es: { code: "es", lng_code: "LANG_ES", lng_title_native: "Español", active: true },
    fi: { code: "fi", lng_code: "LANG_FI", lng_title_native: "Suomi", active: true },
    fr: { code: "fr", lng_code: "LANG_FR", lng_title_native: "Français", active: true },
    hr: { code: "hr", lng_code: "LANG_HR", lng_title_native: "Hrvatski" },
    hu: { code: "hu", lng_code: "LANG_HU", lng_title_native: "Magyar", active: true },
    it: { code: "it", lng_code: "LANG_IT", lng_title_native: "Italiano", active: true },
    ja: { code: "ja", lng_code: "LANG_JA", lng_title_native: "日本語" },
    ko: { code: "ko", lng_code: "LANG_KO", lng_title_native: "한국어" },
    nl: { code: "nl", lng_code: "LANG_NL", lng_title_native: "Nederlands", active: true },
    pl: { code: "pl", lng_code: "LANG_PL", lng_title_native: "Polskie", active: true },
    pt: { code: "pt", lng_code: "LANG_PT_PT", lng_title_native: "Portuguese", active: true },
    "pt-br": { code: "pt-br", lng_code: "LANG_PT_BR", lng_title_native: "Portuguese (BR)", active: true },
    ru: { code: "ru", lng_code: "LANG_RU", lng_title_native: "Русский", active: true },
    vi: { code: "vi", lng_code: "LANG_VI", lng_title_native: "" }, // lng_title_native incorrect
    da: { code: "da", lng_code: "LANG_DA", lng_title_native: "" }, // lng_title_native incorrect
    sv: { code: "sv", lng_code: "LANG_SV", lng_title_native: "Svenska", active: true },
    sk: { code: "sk", lng_code: "LANG_SK", lng_title_native: "Slovák", active: true },
    uk: { code: "uk", lng_code: "LANG_UK", lng_title_native: "Український", active: true },
    no: { code: "no", lng_code: "LANG_NO", lng_title_native: "Norsk", active: true },
    he: { code: "he", lng_code: "LANG_HE", lng_title_native: "" }, // lng_title_native incorrect
    ar: { code: "ar", lng_code: "LANG_AR", lng_title_native: "" }, // lng_title_native incorrect
    hi: { code: "hi", lng_code: "LANG_HI", lng_title_native: "" }, // lng_title_native incorrect
    bn: { code: "bn", lng_code: "LANG_BN", lng_title_native: "বাংলা", active: true },
    zh_CN: { code: "zh_CN", lng_code: "LANG_ZH_CN", lng_title_native: "漢語" },
};

const supportedLngs = [];

Object.entries(languages).forEach(([key, value]) => {
    if (value.active) {
        supportedLngs.push(value.code);
    }
});

i18n
    // load translation using xhr -> see /public/locales
    // learn more: https://github.com/i18next/i18next-xhr-backend
    .use(Backend)
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        fallbackLng: "en",
        supportedLngs: supportedLngs,
        load: "languageOnly",
        debug: process.env.NODE_ENV === "development",
        backend: {
            // for all available options read the backend's repository readme file
            loadPath: "./translations/locale-{{lng}}.json",
        },

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
    });

export { i18n as default, languages };
