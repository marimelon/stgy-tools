import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

const resources = {
	ja: { translation: ja },
	en: { translation: en },
};

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "ja",
		supportedLngs: ["ja", "en"],
		interpolation: {
			escapeValue: false, // React already escapes values
		},
		detection: {
			order: ["querystring", "localStorage", "navigator"],
			lookupQuerystring: "lang",
			lookupLocalStorage: "i18nextLng",
			caches: ["localStorage"],
		},
	});

export default i18n;
