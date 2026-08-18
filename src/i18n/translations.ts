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
      learnMore: string;
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
      learnMore: string;
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
  landing: {
    trust: string[];
    usesKicker: string;
    usesTitle: string;
    whyBody: string;
    uses: Array<{ title: string; body: string }>;
    planKicker: string;
    planTitle: string;
    planPrice: string;
    planSetup: string;
    minutesValue: string;
    minutesLabel: string;
    smsValue: string;
    smsLabel: string;
    allowanceKicker: string;
    planItems: string[];
    planCta: string;
    couponKicker: string;
    couponTitle: string;
    couponBody: string;
    couponPaste: string;
    couponCopy: string;
    couponCopied: string;
    flagKicker: string;
    flagOffer: string;
    flagHint: string;
    couponSupport: string;
    couponCall: string;
    couponEmail: string;
    supportKicker: string;
    supportHours: string;
    coupons: Array<{ badge: string; code: string; note: string }>;
    howKicker: string;
    howTitle: string;
    faqKicker: string;
    faqTitle: string;
    faqSub: string;
    faq: Array<{ q: string; a: string }>;
    stickyTag: string;
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
      eyebrow: "Israeli mobile number · 972",
      headlineA: "An Israeli mobile number",
      headlineB: "in an app on your phone.",
      sub: "You keep your current SIM and number. The new 972 number sits in the Arnacon app — you call and send SMS from there. No second SIM, no new phone.",
      cta: "Get your Israeli number",
      ctaLoading: "Redirecting…",
      finePrint: "€3.99 setup · €4.99/month",
    },

    campaignHero: {
      eyebrow: "Secondary Israeli mobile number",
      headlineA: "Another Israeli mobile number",
      headlineB: "in an app on this phone.",
      sub: "Keep your current SIM. The extra 972 number lives in the Arnacon app on this device. Call and SMS from the app — no extra SIM.",
      cta: "Buy now",
      ctaLoading: "Redirecting…",
      finePrint: "€3.99 setup + €4.99/mo · billed in EUR · cancel anytime",
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
        sub: "€3.99 setup, then €4.99/mo. No contract. Number reserved when you pay.",
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
      "1,500 Minutes / Month",
      "50 SMS / Day",
      "Multiple Numbers",
      "Instant Activation",
      "No Contracts",
    ],

    campaignMarquee: [
      "No Primary Number Needed",
      "No Extra SIM",
      "Works on Phone & iPad",
      "WhatsApp Ready",
      "1,500 Minutes / Month",
      "50 SMS / Day",
      "Secondary Number",
      "Instant Activation",
    ],

    bottomCta: {
      headlineA: "Your Israeli mobile number.",
      headlineB: "Ready in minutes.",
      sub: "€3.99 setup · €4.99/month · 1,500 minutes/month · 50 SMS/day",
      cta: "Get your Israeli number",
      ctaLoading: "Redirecting…",
    },

    campaignBottomCta: {
      headlineA: "Your Israeli mobile number.",
      headlineB: "On this device.",
      sub: "€3.99 setup + €4.99/mo · 1,500 minutes/month · 50 SMS/day",
      cta: "Get secondary number",
      ctaLoading: "Redirecting…",
    },

    campaign: {
      welcomeBanner: {
        brand: "Secnum",
        title: "Secondary Israeli number — on this device",
        body: "No extra SIM. Pay here, activate in Arnacon.",
        priceNote: "€3.99 setup · €4.99/month · cancel anytime",
        euroNote:
          "Billed in euros (international network). Israeli cards are charged in ₪ at your bank’s rate.",
        cta: "Continue to checkout",
        dismiss: "Close",
        learnMore: "Want to know more? Scroll down.",
      },
      welcomeBannerCoupon: {
        brand: "Facebook offer",
        title: "30% off a secondary Israeli number",
        body: "Same number on this device. Discount is the first 3 months.",
        priceNote: "€3.99 setup · €4.99/month",
        euroNote:
          "Billed in euros. Israeli cards are charged in ₪ at your bank’s rate.",
        couponBadge: "First 3 months",
        couponCode: "SecNumAgain30",
        couponHint: "Tap copy, then paste the code on the Stripe payment page.",
        cta: "Checkout with 30% off",
        dismiss: "Close",
        learnMore: "Want to know more? Scroll down.",
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

    landing: {
      trust: [
        "Israeli 972 mobile number",
        "No extra SIM",
        "Cancel anytime",
      ],
      usesKicker: "Why this is useful",
      usesTitle: "Second line. Same phone.",
      whyBody:
        "A real Israeli mobile number on the phone you already have. Second WhatsApp, work off your private line, a temporary number when you sell a car, or a 972 number to take abroad.",
      uses: [
        {
          title: "Going abroad",
          body: "Take an Israeli mobile number with you. Call and SMS Israeli numbers from abroad, on the phone you already carry.",
        },
        {
          title: "Work vs private",
          body: "Clients on one line, life on the other. Stop mixing business into your personal number.",
        },
        {
          title: "Selling a car",
          body: "A temporary number on the listing. Sale done — cancel. Your private number stays private.",
        },
        {
          title: "WhatsApp",
          body: "Use the Israeli number to register WhatsApp or any app that asks for one — including a second WhatsApp. No second SIM.",
        },
      ],
      planKicker: "What you get",
      planTitle: "One Israeli mobile number",
      planPrice: "€4.99 / month",
      planSetup: "€3.99 one-time setup",
      minutesValue: "1,500",
      minutesLabel: "outgoing minutes / month",
      smsValue: "50",
      smsLabel: "outgoing SMS / day",
      allowanceKicker: "Included",
      planItems: [
        "1,500 outgoing minutes / month",
        "50 outgoing SMS / day",
        "Real Israeli (972) mobile number",
        "WhatsApp and any app that needs an Israeli number",
        "Activate in Arnacon — no extra SIM",
        "Cancel anytime",
      ],
      planCta: "Get your Israeli number",
      couponKicker: "Coupon",
      couponTitle: "30% off the first 3 months",
      couponBody: "Copy the code. Paste it on the Stripe page.",
      couponPaste: "Copy here, paste at checkout",
      couponCopy: "Copy",
      couponCopied: "Copied",
      flagKicker: "Launch",
      flagOffer: "First 1,000 people · 30% off",
      flagHint: "Tap to copy",
      couponSupport: "Questions? Call support.",
      couponCall: "Call support",
      couponEmail: "Email support",
      supportKicker: "Support",
      supportHours: "Sun–Thu, 08:00–18:00 Israel time",
      coupons: [
        {
          badge: "30% off · first 3 months",
          code: "SecNumAgain30",
          note: "Paste SecNumAgain30 on the Stripe page.",
        },
      ],
      howKicker: "How it works",
      howTitle: "Pay. Activate. Call.",
      faqKicker: "FAQ",
      faqTitle: "Straight answers",
      faqSub: "If this page does not answer it — call support.",
      faq: [
        {
          q: "What number do I get?",
          a: "A real Israeli mobile number (972). It runs on the phone you already have, in the Arnacon app. No extra SIM.",
        },
        {
          q: "What is included?",
          a: "Up to 1,500 outgoing minutes per month, and 50 outgoing SMS per day. Setup is €3.99 once, then €4.99 per month.",
        },
        {
          q: "Can I use WhatsApp?",
          a: "You can use the Israeli mobile number to register WhatsApp or any app that asks for an Israeli number — including a second WhatsApp.",
        },
        {
          q: "How do coupons work?",
          a: "Copy the code on this page. At Stripe checkout, paste it in the promo field. The discount is for the first 3 months.",
        },
        {
          q: "Who do I call if I am stuck?",
          a: "Cellact support: +972 55 700 55 55 (Sun–Thu 08:00–18:00 Israel time), or support@arnacon.com.",
        },
      ],
      stickyTag: "1,500 min / month + 50 SMS / day",
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
      eyebrow: "מספר נייד ישראלי · 972",
      headlineA: "מספר נייד ישראלי",
      headlineB: "באפליקציה בטלפון שלך.",
      sub: "נשארים עם הסים והמספר שיש לכם. המספר החדש יושב באפליקציית Arnacon — משם מתקשרים ושולחים סמס. בלי סים שני ובלי טלפון חדש.",
      cta: "רכשו מספר ישראלי",
      ctaLoading: "מעבירים לתשלום…",
      finePrint: "דמי הקמה €3.99 · €4.99 לחודש",
    },

    campaignHero: {
      eyebrow: "מספר ישראלי נוסף",
      headlineA: "עוד מספר נייד ישראלי",
      headlineB: "באפליקציה בטלפון הזה.",
      sub: "נשארים עם הסים שיש. המספר הנוסף יושב באפליקציית Arnacon על המכשיר — שיחות וסמס מהאפליקציה, בלי סים נוסף.",
      cta: "לרכישה",
      ctaLoading: "מעבירים לתשלום…",
      finePrint: "דמי הקמה €3.99 + €4.99 לחודש · ביטול בכל רגע",
    },

    steps: [
      {
        step: "01",
        headlineA: "רוכשים מספר",
        headlineB: "תוך דקות.",
        sub: "דמי הקמה €3.99, ואז €4.99 לחודש. בלי חוזה. המספר נשמר ברגע התשלום.",
      },
      {
        step: "02",
        headlineA: "סורקים QR",
        headlineB: "ב־Arnacon.",
        sub: "פותחים את האפליקציה, סורקים את הקוד, והמספר מופעל.",
      },
      {
        step: "03",
        headlineA: "מתקשרים ושולחים",
        headlineB: "הודעות בישראל.",
        sub: "עד 1,500 דקות יוצאות בחודש, ו־50 הודעות סמס ביום. אפשר גם וואטסאפ.",
      },
    ],

    campaignSteps: [
      {
        step: "01",
        headlineA: "משלמים,",
        headlineB: "מקבלים מספר.",
        sub: "דמי הקמה €3.99, ואז €4.99 לחודש. בלי חוזה.",
      },
      {
        step: "02",
        headlineA: "מפעילים",
        headlineB: "ב־Arnacon.",
        sub: "האפליקציה מריצה את המספר על המכשיר — בלי סים. אחרי התשלום פותחים אותה.",
      },
      {
        step: "03",
        headlineA: "שיחות, סמס",
        headlineB: "ווואטסאפ.",
        sub: "עד 1,500 דקות בחודש ו־50 הודעות סמס ביום. לכל אפליקציה שצריכה מספר ישראלי.",
      },
    ],

    marquee: [
      "מספר נייד ישראלי",
      "בלי סים נוסף",
      "מוכן לוואטסאפ",
      "1,500 דקות בחודש",
      "50 הודעות סמס ליום",
      "כמה מספרים",
      "הפעלה מיידית",
      "בלי חוזה",
    ],

    campaignMarquee: [
      "בלי קו ראשי",
      "בלי סים נוסף",
      "טלפון ואייפד",
      "מוכן לוואטסאפ",
      "1,500 דקות בחודש",
      "50 הודעות סמס ליום",
      "מספר נוסף",
      "הפעלה מיידית",
    ],

    bottomCta: {
      headlineA: "המספר הישראלי שלכם.",
      headlineB: "מוכן תוך דקות.",
      sub: "דמי הקמה €3.99 · €4.99 לחודש · 1,500 דקות בחודש · 50 הודעות סמס ליום",
      cta: "רכשו מספר ישראלי",
      ctaLoading: "מעבירים לתשלום…",
    },

    campaignBottomCta: {
      headlineA: "המספר הישראלי שלכם.",
      headlineB: "על המכשיר הזה.",
      sub: "דמי הקמה €3.99 + €4.99 לחודש · 1,500 דקות בחודש · 50 הודעות סמס ליום",
      cta: "רכשו מספר נוסף",
      ctaLoading: "מעבירים לתשלום…",
    },

    campaign: {
      welcomeBanner: {
        brand: "Secnum",
        title: "מספר ישראלי נוסף — על המכשיר שלכם",
        body: "בלי סים נוסף. משלמים כאן, מפעילים ב־Arnacon.",
        priceNote: "דמי הקמה €3.99 · €4.99 לחודש · ביטול בכל רגע",
        euroNote:
          "החיוב באירו (רשת בינלאומית). כרטיס ישראלי יחויב בשקלים לפי שער הבנק.",
        cta: "המשך לתשלום",
        dismiss: "סגור",
        learnMore: "רוצים לדעת עוד? גללו למטה.",
      },
      welcomeBannerCoupon: {
        brand: "מבצע מפייסבוק",
        title: "30% הנחה על מספר ישראלי נוסף",
        body: "אותו מספר על המכשיר. ההנחה לשלושת החודשים הראשונים.",
        priceNote: "דמי הקמה €3.99 · €4.99 לחודש",
        euroNote:
          "החיוב באירו. כרטיס ישראלי יחויב בשקלים לפי שער הבנק.",
        couponBadge: "3 חודשים ראשונים",
        couponCode: "SecNumAgain30",
        couponHint: "העתיקו את הקוד והדביקו בעמוד התשלום של Stripe.",
        cta: "לתשלום עם 30% הנחה",
        dismiss: "סגור",
        learnMore: "רוצים לדעת עוד? גללו למטה.",
      },
      sixSevenPage: {
        brand: "Secnum",
        kicker: "Six seven.",
        headline: "67% הנחה על מספר ישראלי נוסף",
        body: "מספר עסקי על המכשיר שכבר יש לכם. בלי סים נוסף. שלושת החודשים הראשונים ב־67% הנחה, אחר כך €4.99 לחודש.",
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
      cancelled: "התשלום בוטל — אפשר לנסות שוב מתי שנוח.",
    },

    landing: {
      trust: [
        "מספר ישראלי 972",
        "בלי סים נוסף",
        "ביטול בכל רגע",
      ],
      usesKicker: "למה זה טוב",
      usesTitle: "קו שני. אותו טלפון.",
      whyBody:
        "מספר נייד ישראלי אמיתי, על הטלפון שלך. וואטסאפ שני, הפרדה בין עסקי לפרטי, מספר זמני כשמוכרים רכב, או מספר לצאת איתו לחול.",
      uses: [
        {
          title: "יוצאים לחול",
          body: "מספר ישראלי שנוסע איתכם. שיחות וסמס לישראל מחו״ל, על הטלפון שכבר יש.",
        },
        {
          title: "עסקי ופרטי",
          body: "לקוחות על קו אחד, חיים על קו אחר. בלי לערבב.",
        },
        {
          title: "מוכרים רכב",
          body: "מספר זמני למודעה. נגמרה המכירה — מבטלים. המספר הפרטי לא עולה ליד2.",
        },
        {
          title: "וואטסאפ",
          body: "נרשמים לוואטסאפ או לכל אפליקציה שדורשת מספר ישראלי — גם חשבון שני. בלי סים נוסף.",
        },
      ],
      planKicker: "מה מקבלים",
      planTitle: "מספר נייד ישראלי אחד",
      planPrice: "€4.99 לחודש",
      planSetup: "דמי הקמה חד־פעמיים €3.99",
      minutesValue: "1,500",
      minutesLabel: "דקות יוצאות בחודש",
      smsValue: "50",
      smsLabel: "הודעות סמס ביום",
      allowanceKicker: "כלול בתוכנית",
      planItems: [
        "1,500 דקות יוצאות בחודש",
        "50 הודעות סמס ביום",
        "מספר נייד ישראלי אמיתי (972)",
        "וואטסאפ וכל אפליקציה שצריכה מספר ישראלי",
        "הפעלה ב־Arnacon, בלי סים נוסף",
        "ביטול בכל רגע",
      ],
      planCta: "רכשו מספר ישראלי",
      couponKicker: "קופון",
      couponTitle: "30% הנחה לשלושת החודשים הראשונים",
      couponBody: "מעתיקים את הקוד. מדביקים בעמוד של Stripe.",
      couponPaste: "מעתיקים מכאן, מדביקים בתשלום",
      couponCopy: "העתקה",
      couponCopied: "הועתק",
      flagKicker: "השקה",
      flagOffer: "לאלף הראשונים · 30% הנחה",
      flagHint: "העתיקו את הקוד",
      couponSupport: "יש שאלות? חייגו לתמיכה.",
      couponCall: "חייגו לתמיכה",
      couponEmail: "כתבו למייל",
      supportKicker: "תמיכה",
      supportHours: "א׳–ה׳, 08:00–18:00",
      coupons: [
        {
          badge: "30% הנחה · 3 חודשים ראשונים",
          code: "SecNumAgain30",
          note: "מדביקים את הקוד בעמוד של Stripe.",
        },
      ],
      howKicker: "איך זה עובד",
      howTitle: "משלמים. מפעילים. מתקשרים.",
      faqKicker: "שאלות נפוצות",
      faqTitle: "בקצרה",
      faqSub: "לא מצאתם תשובה? חייגו לתמיכה.",
      faq: [
        {
          q: "איזה מספר מקבלים?",
          a: "מספר נייד ישראלי אמיתי (972). רץ על הטלפון שלכם, באפליקציית Arnacon. בלי סים נוסף.",
        },
        {
          q: "מה כלול?",
          a: "עד 1,500 דקות יוצאות בחודש, ו־50 הודעות סמס ביום. דמי הקמה €3.99, אחר כך €4.99 לחודש.",
        },
        {
          q: "אפשר וואטסאפ?",
          a: "אפשר להשתמש במספר לרישום לוואטסאפ או לכל אפליקציה שדורשת מספר ישראלי — גם לחשבון שני.",
        },
        {
          q: "איך משתמשים בקופון?",
          a: "מעתיקים את הקוד כאן. ב־Stripe מדביקים בשדה המבצע. ההנחה לשלושת החודשים הראשונים.",
        },
        {
          q: "למי מתקשרים אם נתקעים?",
          a: "תמיכת Cellact: 055-700-5555 (א׳–ה׳ 08:00–18:00), או support@arnacon.com.",
        },
      ],
      stickyTag: "1,500 דקות בחודש + 50 הודעות סמס ליום",
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
