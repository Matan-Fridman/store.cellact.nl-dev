export type Language = "en" | "he";

type HeroCopy = {
  eyebrow: string;
  headlineA: string;
  headlineB: string;
  sub: string;
  /** Short CTA label — never mix LTR price strings into RTL labels */
  cta: string;
  ctaLoading: string;
  finePrint: string;
};

type TranslationsShape = {
  nav: { brand: string };
  hero: HeroCopy;
  /** Facebook / secondary-number campaign copy overrides hero when active */
  campaignHero: HeroCopy;
  steps: Array<{
    step: string;
    headlineA: string;
    headlineB: string;
    sub: string;
  }>;
  campaignSteps: Array<{
    step: string;
    headlineA: string;
    headlineB: string;
    sub: string;
  }>;
  marquee: string[];
  campaignMarquee: string[];
  bottomCta: {
    headlineA: string;
    headlineB: string;
    sub: string;
    cta: string;
    ctaLoading: string;
  };
  campaignBottomCta: {
    headlineA: string;
    headlineB: string;
    sub: string;
    cta: string;
    ctaLoading: string;
  };
  campaign: {
    welcomeBanner: {
      brand: string;
      title: string;
      body: string;
      priceNote: string;
      euroNote: string;
      couponBadge?: string;
      couponCode?: string;
      couponHint?: string;
      cta: string;
      dismiss: string;
    };
    welcomeBannerCoupon: {
      brand: string;
      title: string;
      body: string;
      priceNote: string;
      euroNote: string;
      couponBadge: string;
      couponCode: string;
      couponHint: string;
      cta: string;
      dismiss: string;
    };
    sixSevenPage: {
      brand: string;
      kicker: string;
      headline: string;
      body: string;
      laugh: string;
      percent: string;
      priceNote: string;
      euroNote: string;
      couponBadge: string;
      couponCode: string;
      couponHint: string;
      cta: string;
    };
    cancelled: string;
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
    alreadyActivatedTitle: string;
    alreadyActivatedDesc: string;
    alreadyActivatedSupport: string;
  };
  success: {
    paymentConfirmed: string;
    loading: string;
    loadingDesc: string;
    loadingHint: string;
    emailTitle: string;
    emailDesc: string;
    emailHint: string;
    emailSteps: [string, string, string][];
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
      cta: "Get Your Number",
      ctaLoading: "Redirecting…",
      finePrint: "€3.99 one-time setup · €4.99/month · Up to 1,500 minutes",
    },

    campaignHero: {
      eyebrow: "Secondary number — no primary needed",
      headlineA: "Another Israeli number,",
      headlineB: "on the device you already have.",
      sub: "No primary number, no extra SIM — even iPad. Pay here, activate in Arnacon on this device. For WhatsApp, calls, and SMS.",
      cta: "Buy now",
      ctaLoading: "Redirecting…",
      finePrint:
        "€3.99 setup + €4.99/mo = €8.98 first month · then €4.99/mo · cancel anytime · EUR (international Arnacon network)",
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

    campaignSteps: [
      {
        step: "01",
        headlineA: "Pay once,",
        headlineB: "get your number.",
        sub: "First month €8.98 (€3.99 setup + €4.99). Then €4.99/mo. No contract. Number reserved when you pay.",
      },
      {
        step: "02",
        headlineA: "Activate in the",
        headlineB: "Arnacon app.",
        sub: "Arnacon is the app that runs your number on this device — no physical SIM. Open it after payment (or scan the QR).",
      },
      {
        step: "03",
        headlineA: "WhatsApp, calls,",
        headlineB: "and SMS — ready.",
        sub: "Use it for WhatsApp or any app that needs an Israeli number. Up to 1,500 minutes/month and 50 SMS/day.",
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

    campaignMarquee: [
      "No Primary Number Needed",
      "No Extra SIM",
      "Works on Phone & iPad",
      "WhatsApp Ready",
      "1,500 Minutes Included",
      "Secondary Number",
      "Instant Activation",
      "Cancel Anytime",
    ],

    bottomCta: {
      headlineA: "Your Israeli number.",
      headlineB: "Ready in minutes.",
      sub: "€3.99 one-time setup · €4.99/month · 1,500 minutes included",
      cta: "Get Your Number",
      ctaLoading: "Redirecting…",
    },

    campaignBottomCta: {
      headlineA: "Your secondary number.",
      headlineB: "On this device.",
      sub: "€8.98 first month · then €4.99/mo · no primary number · charged in EUR",
      cta: "Get secondary number",
      ctaLoading: "Redirecting…",
    },

    campaign: {
      welcomeBanner: {
        brand: "Secnum",
        title: "Secondary Israeli number — on this device",
        body: "No primary number. No extra SIM. Pay here, activate in Arnacon for WhatsApp, calls, and SMS.",
        priceNote: "First month €8.98, then €4.99/mo · cancel anytime",
        euroNote:
          "Billed in euros (international network). Israeli cards are charged in ₪ at your bank’s rate.",
        cta: "Continue to checkout",
        dismiss: "Close",
      },
      welcomeBannerCoupon: {
        brand: "Facebook offer",
        title: "30% off a secondary Israeli number",
        body: "Same number on this device — no primary SIM. Discount applies to your first 3 months.",
        priceNote: "Use code SecNumAgain30 at checkout",
        euroNote:
          "Billed in euros. Israeli cards are charged in ₪ at your bank’s rate.",
        couponBadge: "First 3 months",
        couponCode: "SecNumAgain30",
        couponHint: "Tap copy, then paste the code on the Stripe payment page.",
        cta: "Checkout with 30% off",
        dismiss: "Close",
      },
      sixSevenPage: {
        brand: "Secnum",
        kicker: "Six seven.",
        headline: "67% off a secondary Israeli number",
        body: "Same business number on the phone you already carry. No extra SIM. First three months at sixty-seven percent off, then the normal €4.99/mo.",
        laugh: "The internet turned 6-7 into a joke. This is the grown-up version: a real rate, billed in euros, cancelled whenever you want.",
        percent: "67%",
        priceNote: "Use code BEST67DEAL at checkout",
        euroNote:
          "Billed in euros. Israeli cards are charged in ₪ at your bank’s rate.",
        couponBadge: "First 3 months",
        couponCode: "BEST67DEAL",
        couponHint: "Tap copy, then paste the code on the Stripe payment page.",
        cta: "Continue to checkout",
      },
      cancelled: "Checkout was cancelled — you can try again whenever you're ready.",
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
      alreadyActivatedTitle: "This number is already activated",
      alreadyActivatedDesc:
        "It looks like this Israeli number was already linked to a device. You don’t need to activate it again.",
      alreadyActivatedSupport:
        "If you believe that’s wrong, contact support at support@arnacon.com",
    },

    success: {
      paymentConfirmed: "Payment confirmed",
      loading: "Preparing your number…",
      loadingDesc:
        "We're setting up your Israeli number now. This usually takes 1–2 minutes — you'll move to activation automatically.",
      loadingHint:
        "You can close this page — an activation link will also be sent to your email.",
      emailTitle: "Check your email",
      emailDesc:
        "Your number is almost ready. You'll get an activation link by email — open it for your QR code and connect in Arnacon.",
      emailHint:
        "The email can take up to 10 minutes. Check spam if you don't see it.",
      emailSteps: [
        ["📬", "Check your inbox", "Look for an email from Secnum by Cellact."],
        ["🔗", "Click the activation link", "It opens a page with your personal QR code."],
        ["📱", "Scan or tap to connect", "Open Arnacon and your number will be active."],
      ],
      scanTitle: "Scan to activate",
      scanTitleB: "your number.",
      scanDesc: (app) =>
        `Open the ${app} app on your phone and scan this code to activate your Israeli number.`,
      steps: ["Open Arnacon", "Tap Scan", "Done"],
      orDivider: "or",
      installOnDevice: "Activate on this device",
      back: "← Back to home",
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
      cta: "קבל את המספר שלך",
      ctaLoading: "מעביר…",
      finePrint: "הגדרה חד־פעמית €3.99 · €4.99 לחודש · עד 1,500 דקות",
    },

    campaignHero: {
      eyebrow: "מספר נוסף — בלי מספר ראשי",
      headlineA: "מספר ישראלי שני,",
      headlineB: "על המכשיר שכבר אצלך.",
      sub: "בלי מספר ראשי, בלי SIM — גם באייפד. משלמים כאן ומפעילים ב-Arnacon על המכשיר. לווטסאפ, שיחות והודעות.",
      cta: "קנה עכשיו",
      ctaLoading: "מעביר…",
      finePrint:
        "€3.99 הגדרה + €4.99 לחודש = €8.98 לחודש הראשון · אחר כך €4.99 · ביטול בכל רגע · אירו (רשת Arnacon הבינלאומית)",
    },

    steps: [
      {
        step: "01",
        headlineA: "רכוש את המספר שלך",
        headlineB: "תוך דקות.",
        sub: "הגדרה חד־פעמית של €3.99, לאחר מכן €4.99 לחודש. ללא חוזים. המספר שמור ברגע שאתה משלם.",
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

    campaignSteps: [
      {
        step: "01",
        headlineA: "משלמים פעם אחת,",
        headlineB: "מקבלים מספר.",
        sub: "חודש ראשון €8.98 (€3.99 הגדרה + €4.99). אחר כך €4.99 לחודש. בלי חוזה. המספר נשמר ברגע התשלום.",
      },
      {
        step: "02",
        headlineA: "הפעלה באפליקציית",
        headlineB: "Arnacon.",
        sub: "Arnacon היא האפליקציה שמריצה את המספר על המכשיר — בלי SIM פיזי. אחרי התשלום פותחים אותה (או סורקים QR).",
      },
      {
        step: "03",
        headlineA: "ווטסאפ, שיחות",
        headlineB: "והודעות — מוכנים.",
        sub: "לווטסאפ או לכל אפליקציה שצריכה מספר ישראלי. עד 1,500 דקות בחודש ו-50 SMS ביום.",
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

    campaignMarquee: [
      "בלי מספר ראשי",
      "בלי SIM נוסף",
      "עובד בטלפון ובאייפד",
      "מוכן לווטסאפ",
      "1,500 דקות כלולות",
      "מספר נוסף",
      "הפעלה מיידית",
      "ביטול בכל רגע",
    ],

    bottomCta: {
      headlineA: "המספר הישראלי שלך.",
      headlineB: "מוכן תוך דקות.",
      sub: "הגדרה חד־פעמית €3.99 · €4.99 לחודש · 1,500 דקות כלולות",
      cta: "קבל את המספר שלך",
      ctaLoading: "מעביר…",
    },

    campaignBottomCta: {
      headlineA: "המספר הנוסף שלך.",
      headlineB: "על המכשיר הזה.",
      sub: "€8.98 לחודש הראשון · אחר כך €4.99 לחודש · בלי מספר ראשי · חיוב באירו",
      cta: "קבל מספר נוסף",
      ctaLoading: "מעביר…",
    },

    campaign: {
      welcomeBanner: {
        brand: "Secnum",
        title: "מספר ישראלי נוסף — על המכשיר שלך",
        body: "בלי מספר ראשי ובלי SIM. משלמים כאן ומפעילים ב־Arnacon — לווטסאפ, שיחות והודעות.",
        priceNote: "חודש ראשון €8.98, אחר כך €4.99 לחודש · ביטול בכל רגע",
        euroNote:
          "החיוב באירו (רשת בינלאומית). כרטיס ישראלי יחויב בשקלים לפי שער הבנק.",
        cta: "המשך לתשלום",
        dismiss: "סגור",
      },
      welcomeBannerCoupon: {
        brand: "מבצע מפייסבוק",
        title: "30% הנחה על מספר ישראלי נוסף",
        body: "אותו מספר על המכשיר הזה — בלי מספר ראשי ובלי SIM. ההנחה ל־3 החודשים הראשונים.",
        priceNote: "השתמשו בקוד SecNumAgain30 בתשלום",
        euroNote:
          "החיוב באירו. כרטיס ישראלי יחויב בשקלים לפי שער הבנק.",
        couponBadge: "3 חודשים ראשונים",
        couponCode: "SecNumAgain30",
        couponHint: "העתיקו את הקוד והדביקו בעמוד התשלום של Stripe.",
        cta: "לתשלום עם 30% הנחה",
        dismiss: "סגור",
      },
      sixSevenPage: {
        brand: "Secnum",
        kicker: "Six seven.",
        headline: "67% הנחה על מספר ישראלי נוסף",
        body: "אותו מספר עסקי על המכשיר שכבר אצלך. בלי SIM נוסף. שלושת החודשים הראשונים ב־67% הנחה, אחר כך €4.99 לחודש.",
        laugh: "הרשת הפכה את 6-7 לבדיחה. כאן זה תעריף אמיתי: חיוב באירו, ביטול בכל רגע.",
        percent: "67%",
        priceNote: "השתמשו בקוד BEST67DEAL בתשלום",
        euroNote:
          "החיוב באירו. כרטיס ישראלי יחויב בשקלים לפי שער הבנק.",
        couponBadge: "3 חודשים ראשונים",
        couponCode: "BEST67DEAL",
        couponHint: "העתיקו את הקוד והדביקו בעמוד התשלום של Stripe.",
        cta: "המשך לתשלום",
      },
      cancelled: "התשלום בוטל — אפשר לנסות שוב מתי שנוח לך.",
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
      alreadyActivatedTitle: "המספר הזה כבר הופעל",
      alreadyActivatedDesc:
        "נראה שהמספר הישראלי הזה כבר מקושר למכשיר. אין צורך להפעיל אותו שוב.",
      alreadyActivatedSupport:
        "אם לדעתכם זו טעות, פנו לתמיכה ב־support@arnacon.com",
    },

    success: {
      paymentConfirmed: "התשלום אושר",
      loading: "מכינים את המספר שלך…",
      loadingDesc:
        "אנחנו מגדירים עכשיו את המספר הישראלי שלך. בדרך כלל זה לוקח 1–2 דקות — תועבר אוטומטית למסך ההפעלה.",
      loadingHint:
        "אפשר לסגור את העמוד — קישור להפעלה יישלח גם לאימייל שלך.",
      emailTitle: "בדקו את האימייל",
      emailDesc:
        "המספר כמעט מוכן. תקבלו קישור להפעלה באימייל — פתחו אותו לקבלת קוד QR וחיבור ב-Arnacon.",
      emailHint:
        "האימייל יכול להגיע עד 10 דקות. בדקו גם בספאם אם לא מופיע.",
      emailSteps: [
        ["📬", "בדקו את תיבת הדואר", "חפשו אימייל מ-Secnum by Cellact."],
        ["🔗", "לחצו על קישור ההפעלה", "ייפתח עמוד עם קוד QR אישי."],
        ["📱", "סרקו או הקישו לחיבור", "פתחו את Arnacon והמספר יהיה פעיל."],
      ],
      scanTitle: "סרוק להפעלת",
      scanTitleB: "המספר שלך.",
      scanDesc: (app) =>
        `פתח את אפליקציית ${app} בטלפון שלך וסרוק את הקוד להפעלת המספר הישראלי שלך.`,
      steps: ["פתח Arnacon", "הקש סריקה", "סיום"],
      orDivider: "או",
      installOnDevice: "הפעל ב-Arnacon במכשיר זה",
      back: "→ חזרה לדף הבית",
      errorTitle: "משהו השתבש",
      errorBack: "חזרה לחנות",
    },
  },
};
