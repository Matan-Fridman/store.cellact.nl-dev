import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { translations, type Language } from "../i18n/translations";

type TranslationsShape = (typeof translations)["en"];

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: TranslationsShape;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const VALID: Language[] = ["en", "he"];
    const urlParam = new URLSearchParams(window.location.search).get("lang") as Language | null;
    if (urlParam && VALID.includes(urlParam)) return urlParam;
    try {
      const stored = localStorage.getItem("secnum_lang") as Language | null;
      if (stored && VALID.includes(stored)) return stored;
    } catch {
      // ignore
    }
    return "en";
  });

  const setLang = (l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem("secnum_lang", l);
    } catch {
      // ignore
    }
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.history.replaceState(null, "", url.toString());
  };

  const isRTL = lang === "he";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
