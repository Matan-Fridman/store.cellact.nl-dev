import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { translations, type Language } from "../i18n/translations";
import { captureAttribution, isFacebookTraffic } from "../lib/campaign";

type TranslationsShape = (typeof translations)["en"];

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: TranslationsShape;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function resolveInitialLang(): Language {
  const VALID: Language[] = ["en", "he"];
  captureAttribution();

  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get("lang") as Language | null;
  // Explicit ?lang= always wins (manual toggle also writes it).
  if (urlParam && VALID.includes(urlParam)) return urlParam;

  // FB ad traffic: force Hebrew even if a prior EN visit left localStorage.
  // Secondary-number campaign is Hebrew; English landing is a silent conversion killer.
  if (isFacebookTraffic()) return "he";

  try {
    const stored = localStorage.getItem("secnum_lang") as Language | null;
    if (stored && VALID.includes(stored)) return stored;
  } catch {
    // ignore
  }

  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(resolveInitialLang);

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
