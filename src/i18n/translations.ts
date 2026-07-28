export type Language = "en" | "he";

type TranslationsShape = {
  nav: { brand: string };
  hero: {
    eyebrow: string;
    headlineA: string;
    headlineB: string;
    sub: string;
    cta: (price: string) => string;
    ctaLoading: string;
    finePrint: string;
  };
  steps: Array<{
    step: string;
    headlineA: string;
    headlineB: string;
    sub: string;
  }>;
  marquee: string[];
  bottomCta: {
    headlineA: string;
    headlineB: string;
    sub: string;
    cta: (price: string) => string;
    ctaLoading: string;
  };
  claim: {
    brand: string;
    invalidLinkTitle: string;
    invalidLinkDesc: string;
    activationLabel: string;
    activateHeadlineA: string;
    activateHeadlineB: string;
    yourNumber: string;
    steps: [string, string, string];
    activateBtn: string;
    retryBtn: string;
    finePrint: string;
    successTitle: string;
    successDesc: string;
    activeNumberLabel: string;
    successFooter: string;
  };
  success: {
    loading: string;
    loadingDesc: string;
    scanTitle: string;
    scanTitleB: string;
    scanDesc: (appName: string) => string;
    steps: [string, string, string];
    orDivider: string;
    installOnDevice: string;
    back: string;
    errorTitle: string;
    errorBack: string;
  };
};

export const translations: Record<Language, TranslationsShape> = {
  en: {
    nav: {
      brand: "Secnum",
    },

    hero: {
      eyebrow: "Israeli Mobile Numbers",
      headlineA: "A local Israeli number,",
      headlineB: "on your existing phone.",
      sub: "Call and message other Israeli numbers without a second SIM. Use it to register on WhatsApp or any app that needs an Israeli number. You can own multiple numbers.",
      cta: (price) => `Get Your Number — ${price}`,
      ctaLoading: "Redirecting…",
      finePrint: "€3.99 one-time setup · €4.99/month · Up to 1,500 minutes",
    },

    steps: [
      {
        step: "01",
        headlineA: "Purchase your number",
        headlineB: "in minutes.",
        sub: "One-time setup of €3.99, then €4.99/month. No contracts. Your number is reserved the moment you pay.",
      },
      {
        step: "02",
        headlineA: "Scan the QR code",
        headlineB: "with Arnacon.",
        sub: "Open the Arnacon app, scan the QR code, and your number is activated instantly.",
      },
      {
        step: "03",
        headlineA: "Call and message",
        headlineB: "Israeli numbers.",
        sub: "Up to 1,500 outgoing minutes per month and 50 outgoing SMS per day. Use the number for WhatsApp or any app requiring an Israeli number.",
      },
    ],

    marquee: [
      "Local Israeli Numbers",
      "No Extra SIM",
      "WhatsApp Ready",
      "1,500 Minutes Included",
      "Multiple Numbers",
      "Instant Activation",
      "No Contracts",
      "50 SMS / Day",
    ],

    bottomCta: {
      headlineA: "Your Israeli number.",
      headlineB: "Ready in minutes.",
      sub: "€3.99 one-time setup · €4.99/month · 1,500 minutes included",
      cta: (price) => `Get Your Number — ${price}`,
      ctaLoading: "Redirecting…",
    },

    claim: {
      brand: "Secnum",
      invalidLinkTitle: "Invalid link",
      invalidLinkDesc:
        "This activation link is incomplete. Please use the link provided after your purchase or scan the QR code from the Arnacon app.",
      activationLabel: "Number Activation",
      activateHeadlineA: "Activate your",
      activateHeadlineB: "Israeli number.",
      yourNumber: "Your number",
      steps: [
        "Verifying your purchase",
        "Preparing your number",
        "Activating your number",
      ],
      activateBtn: "Activate Number",
      retryBtn: "Try Again",
      finePrint:
        "This will link your number to your device. The process takes only a few seconds.",
      successTitle: "You're all set.",
      successDesc: "Your Israeli number is now active and ready to use.",
      activeNumberLabel: "Active number",
      successFooter:
        "You can now call and message other Israeli numbers.",
    },

    success: {
      loading: "Preparing your number…",
      loadingDesc:
        "Payment received. We're reserving your Israeli number. This usually takes just a few seconds.",
      scanTitle: "Scan to activate",
      scanTitleB: "your number.",
      scanDesc: (app) =>
        `Open the ${app} app on your phone and scan this code to activate your Israeli number.`,
      steps: ["Open Arnacon", "Tap Scan", "Done"],
      orDivider: "or",
      installOnDevice: "Activate on this device",
      back: "← Back to store",
      errorTitle: "Something went wrong",
      errorBack: "Back to Store",
    },
  },

  // ─── Hebrew ───────────────────────────────────────────────────────────────

  he: {
    nav: {
      brand: "Secnum",
    },

    hero: {
      eyebrow: "מספרי סלולר ישראליים",
      headlineA: "מספר ישראלי מקומי,",
      headlineB: "על הטלפון הקיים שלך.",
      sub: "התקשר ושלח הודעות למספרים ישראליים אחרים ללא כרטיס SIM נוסף. השתמש בו לרישום בווטסאפ או כל אפליקציה שדורשת מספר ישראלי. ניתן להחזיק מספר מספרים.",
      cta: (price) => `קבל את המספר שלך — ${price}`,
      ctaLoading: "מעביר…",
      finePrint: "הגדרה חד פעמית 3.99 יורו (€) · 4.99 יורו (€) לחודש · עד 1,500 דקות",
    },

    steps: [
      {
        step: "01",
        headlineA: "רכוש את המספר שלך",
        headlineB: "תוך דקות.",
        sub: "הגדרה חד פעמית של 3.99 יורו (€), לאחר מכן 4.99 יורו (€) לחודש. ללא חוזים. המספר שמור ברגע שאתה משלם.",
      },
      {
        step: "02",
        headlineA: "סרוק את קוד ה-QR",
        headlineB: "עם Arnacon.",
        sub: "פתח את אפליקציית Arnacon, סרוק את קוד ה-QR, והמספר שלך מופעל מיידית.",
      },
      {
        step: "03",
        headlineA: "התקשר ושלח הודעות",
        headlineB: "למספרים ישראליים.",
        sub: "עד 1,500 דקות יוצאות בחודש ו-50 SMS יוצאים ביום. השתמש במספר בווטסאפ או בכל אפליקציה שדורשת מספר ישראלי.",
      },
    ],

    marquee: [
      "מספרים ישראליים מקומיים",
      "ללא SIM נוסף",
      "מוכן לווטסאפ",
      "1,500 דקות כלולות",
      "מספרים מרובים",
      "הפעלה מיידית",
      "ללא חוזים",
      "50 SMS ליום",
    ],

    bottomCta: {
      headlineA: "המספר הישראלי שלך.",
      headlineB: "מוכן תוך דקות.",
      sub: "הגדרה חד פעמית 3.99 יורו (€) · 4.99 יורו (€) לחודש · 1,500 דקות כלולות",
      cta: (price) => `קבל את המספר שלך — ${price}`,
      ctaLoading: "מעביר…",
    },

    claim: {
      brand: "Secnum",
      invalidLinkTitle: "קישור לא תקין",
      invalidLinkDesc:
        "קישור ההפעלה אינו שלם. אנא השתמש בקישור שנשלח לאחר הרכישה או סרוק את קוד ה-QR מאפליקציית Arnacon.",
      activationLabel: "הפעלת מספר",
      activateHeadlineA: "הפעל את המספר",
      activateHeadlineB: "הישראלי שלך.",
      yourNumber: "המספר שלך",
      steps: ["מאמת את הרכישה", "מכין את המספר", "מפעיל את המספר"],
      activateBtn: "הפעל מספר",
      retryBtn: "נסה שוב",
      finePrint:
        "פעולה זו תקשר את המספר למכשיר שלך. התהליך אורך מספר שניות בלבד.",
      successTitle: "הכל מוכן.",
      successDesc: "המספר הישראלי שלך פעיל ומוכן לשימוש.",
      activeNumberLabel: "מספר פעיל",
      successFooter:
        "כעת תוכל להתקשר ולשלוח הודעות למספרים ישראליים אחרים.",
    },

    success: {
      loading: "מכין את המספר שלך…",
      loadingDesc:
        "התשלום התקבל. אנו שומרים את המספר הישראלי שלך. בדרך כלל זה לוקח מספר שניות.",
      scanTitle: "סרוק להפעלת",
      scanTitleB: "המספר שלך.",
      scanDesc: (app) =>
        `פתח את אפליקציית ${app} בטלפון שלך וסרוק את הקוד להפעלת המספר הישראלי שלך.`,
      steps: ["פתח Arnacon", "הקש סריקה", "סיום"],
      orDivider: "או",
      installOnDevice: "הפעל ב-Arnacon במכשיר זה",
      back: "→ חזרה לחנות",
      errorTitle: "משהו השתבש",
      errorBack: "חזרה לחנות",
    },
  },
};
