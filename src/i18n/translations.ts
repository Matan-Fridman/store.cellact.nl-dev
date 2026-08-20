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
  crypto: {
    back: string;
    kicker: string;
    title: string;
    lead: string;
    stepChoose: string;
    stepConnect: string;
    stepPay: string;
    network: string;
    token: string;
    walletOff: string;
    connect: string;
    connecting: string;
    stepReview: string;
    continue: string;
    reviewTitle: string;
    reviewLead: string;
    reviewEscrow: string;
    reviewTerm: string;
    reviewFxUsdc: string;
    reviewFxNative: string;
    reviewAfter: string;
    reviewClaim: string;
    changeSelection: string;
    pay: (symbol: string) => string;
    paying: string;
    recover: string;
    recoverLink: string;
    quoteLoading: string;
    perMonth: (amount: string, symbol: string) => string;
    introMonths: (amount: string, symbol: string, count: number) => string;
    lock: (amount: string, symbol: string) => string;
    amoy: string;
    sepolia: string;
    usdc: string;
    manageTitle: string;
    manageLead: string;
    manageConnected: (short: string) => string;
    noOrders: string;
    colNumber: string;
    colStatus: string;
    colUntil: string;
    statusLive: string;
    statusCancelled: string;
    statusReady: string;
    statusProvisioning: string;
    backToOrders: string;
    untilEmpty: string;
    youCanWithdraw: (amount: string, symbol: string) => string;
    youWithdrawOn: (amount: string, symbol: string, date: string) => string;
    cancelledReturned: (date: string) => string;
    nothingBackYet: string;
    ifCancel: (date: string, you: string, symbol: string) => string;
    cancelScheduled: (date: string) => string;
    cancelCta: string;
    confirmCancel: string;
    keepNumber: string;
    cancelSummaryTitle: string;
    timePassed: (elapsed: string) => string;
    timePaid: (date: string) => string;
    refundNow: (amount: string, symbol: string, months: number) => string;
    alreadyCancelled: string;
    nothingToWithdraw: string;
    notPayer: string;
    expiredQuote: string;
    rpcBusy: string;
    withdrawCta: string;
    claimCta: string;
    waitWallet: string;
    claimedDone: string;
    escrowUnread: string;
    numberLabel: (label: string) => string;
    landingTitle: string;
    landingLead: string;
    landingCta: string;
    landingExplainTitle: string;
    landingExplainLead: string;
    landingExplainCta: string;
    factLock: string;
    factCancel: string;
    factLive: string;
    contractLabel: string;
    copyAddress: string;
    copied: string;
    openExplorer: string;
    whyCta: string;
    whyTitle: string;
    whyLead: string;
    whyRefuseTitle: string;
    whyRefuse: string;
    whyLockTitle: string;
    whyLock: string;
    whyCancelTitle: string;
    whyCancelBody: string;
    whyTrustTitle: string;
    whyTrust: string;
    whyContractTitle: string;
    whySameAddress: string;
    whyCodeTitle: string;
    whyCodeLead: string;
    whyBack: string;
    waitTitle: string;
    waitPending: string;
    waitPaid: string;
    waitReady: string;
    waitKeepOpen: (orderId: string) => string;
    waitLeft: string;
    waitSign: string;
    waitSigning: string;
  };
  recover: {
    entry: string;
    title: string;
    sub: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    sentTitle: string;
    sentBody: string;
    notCustomerTitle: string;
    notCustomerBody: string;
    notCustomerCta: string;
    notRecoverableTitle: string;
    notRecoverableBody: string;
    openTitle: string;
    openBody: string;
    openCta: string;
    completingTitle: string;
    completingBody: string;
    doneTitle: string;
    doneBody: string;
    numbersLabel: string;
    errorTitle: string;
    back: string;
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
        {
          q: "New phone — can I keep my number?",
          a: "Yes. Use Recover on this site with the purchase email. We email a link, you open Arnacon on the new device, and we move every live number onto it.",
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

    crypto: {
      back: "Back to store",
      kicker: "Testnet",
      title: "Pay with crypto",
      lead: "Pay twelve months once. No monthly pull.",
      stepChoose: "Choose",
      stepConnect: "Connect",
      stepReview: "Review",
      stepPay: "Pay",
      continue: "Review lock",
      reviewTitle: "Check the lock",
      reviewLead: "This amount leaves your wallet into escrow.",
      reviewEscrow: "Your wallet pays SubscriptionEscrow, not us.",
      reviewTerm: "Twelve 30-day periods. No monthly signature.",
      reviewFxUsdc: "USDC follows the euro price.",
      reviewFxNative: "ETH or POL uses a live FX quote.",
      reviewAfter: "Cancel refunds unused months in that tx.",
      reviewClaim: "Then one signature for the QR.",
      changeSelection: "Change network or token",
      network: "Network",
      token: "Token",
      walletOff: "No wallet connected",
      connect: "Connect",
      connecting: "Connecting…",
      pay: (symbol) => `Pay with ${symbol}`,
      paying: "Confirm in your wallet",
      quoteLoading: "Getting the monthly price…",
      perMonth: (amount, symbol) => `${amount} ${symbol} / month`,
      introMonths: (amount, symbol, count) => `First ${count} months: ${amount} ${symbol} / month`,
      lock: (amount, symbol) => `Lock ${amount} ${symbol}`,
      recover: "Already paid?",
      recoverLink: "Find your order",
      amoy: "Polygon Amoy",
      sepolia: "Sepolia",
      usdc: "USDC",
      manageTitle: "Your crypto orders",
      manageLead: "Tap an order to cancel or claim.",
      manageConnected: (short) => `Connected ${short}`,
      noOrders: "No prepaid orders on this wallet.",
      colNumber: "Number",
      colStatus: "Status",
      colUntil: "Until",
      statusLive: "Live",
      statusCancelled: "Cancelled",
      statusReady: "Number ready",
      statusProvisioning: "Provisioning",
      backToOrders: "All orders",
      untilEmpty: "—",
      youCanWithdraw: (amount, symbol) => `You can withdraw ${amount} ${symbol}`,
      youWithdrawOn: (amount, symbol, date) =>
        `You withdraw ${amount} ${symbol} from ${date}`,
      cancelledReturned: (date) => `Cancelled. Unused funds are back. Number works until ${date}.`,
      nothingBackYet: "Unused funds unlock after the current period ends.",
      ifCancel: (date, you, symbol) =>
        `Service until ${date}. Cancel returns ${you} ${symbol} now.`,
      cancelScheduled: (date) => `Cancel takes effect ${date}`,
      cancelCta: "Cancel",
      confirmCancel: "Confirm cancel and refund",
      keepNumber: "Keep the number",
      cancelSummaryTitle: "Cancel summary",
      timePassed: (elapsed) => `Time passed: ${elapsed}`,
      timePaid: (date) => `This month stays paid until ${date}`,
      refundNow: (amount, symbol, months) =>
        months === 1
          ? `Refund now: ${amount} ${symbol} for 1 unused month`
          : `Refund now: ${amount} ${symbol} for ${months} unused months`,
      alreadyCancelled: "Already cancelled. Unused funds came back in that transaction.",
      nothingToWithdraw: "Nothing left to withdraw. Cancel already sent unused funds back.",
      notPayer: "This wallet did not pay this order.",
      expiredQuote: "Price expired. Tap pay once more.",
      rpcBusy: "Wallet RPC is busy. If you already confirmed in MetaMask, find your order.",
      withdrawCta: "Withdraw unused",
      claimCta: "Sign and show QR",
      waitWallet: "Confirm in your wallet",
      claimedDone: "Already activated on a device",
      escrowUnread: "Could not read escrow. Cancel needs a live lock read.",
      numberLabel: (label) => `Number ${label}`,
      landingTitle: "Pay with crypto",
      landingLead: "USDC or native on testnet.",
      landingCta: "Pay",
      landingExplainTitle: "Why prepaid, not monthly",
      landingExplainLead:
        "A monthly crypto charge fails. Empty wallet, missed tx, dead number. Escrow locks twelve months once. Cancel returns unused months now.",
      landingExplainCta: "Read how the contract works",
      factLock: "Funds sit in the contract, not with us.",
      factCancel: "Cancel returns unused months in the same tx.",
      factLive: "This month stays paid. The number doesn't drop.",
      contractLabel: "SubscriptionEscrow",
      copyAddress: "Copy",
      copied: "Copied",
      openExplorer: "Explorer",
      whyCta: "Why we lock it this way",
      whyTitle: "Why escrow, not monthly billing",
      whyLead: "A monthly crypto charge fails. Empty wallet, missed tx, dead number, then you wait.",
      whyRefuseTitle: "The thing we refuse",
      whyRefuse:
        "Don't make a live number depend on you remembering to pay every 30 days. Don't pause service while a transaction confirms.",
      whyLockTitle: "The lock",
      whyLock:
        "You lock setup plus twelve 30-day periods. Each finished period vests to the provider. You don't sign every month.",
      whyCancelTitle: "Cancel",
      whyCancelBody:
        "Unused future periods return to you in that transaction. The current period is spent. The number stays live until that period ends.",
      whyTrustTitle: "Verify it",
      whyTrust: "The UI is not the source of truth. Read the deployed contract.",
      whyContractTitle: "Deployed contract",
      whySameAddress: "Same bytecode on Amoy and Sepolia.",
      whyCodeTitle: "The cancel code",
      whyCodeLead: "cancel() refunds unused periods immediately. That is the product.",
      whyBack: "Back to checkout",
      waitTitle: "Waiting on escrow",
      waitPending: "Waiting for the subscribe transaction…",
      waitPaid: "Paid. Provisioning your number…",
      waitReady: "Payment confirmed. Sign with the paying wallet for the QR.",
      waitKeepOpen: (orderId) => `Keep this page open. Order ${orderId}`,
      waitLeft: "Left by accident?",
      waitSign: "Sign and show QR",
      waitSigning: "Waiting for signature…",
    },

    recover: {
      entry: "New device? Recover your number",
      title: "Recover your number",
      sub: "Enter the email you used to buy. We will move every live number onto this device.",
      emailLabel: "Purchase email",
      emailPlaceholder: "you@email.com",
      submit: "Send recovery link",
      submitting: "Checking…",
      sentTitle: "Check your email",
      sentBody: "We sent a recovery link. Open it on the new phone, then continue in Arnacon.",
      notCustomerTitle: "No Secnum account on this email",
      notCustomerBody: "This address has not bought a Cellact number. Buy one to get started.",
      notCustomerCta: "Buy a number",
      notRecoverableTitle: "Nothing left to recover",
      notRecoverableBody: "This email has no live, non-expired numbers. Buy a number to continue.",
      openTitle: "Open Arnacon on this phone",
      openBody: "This proves the new identity. We then move your live numbers onto this device.",
      openCta: "Continue in Arnacon",
      completingTitle: "Moving your numbers…",
      completingBody: "Linking every live number to this device and sending the install.",
      doneTitle: "Numbers moved",
      doneBody: "Install the product in Arnacon if it does not appear within a few seconds.",
      numbersLabel: "Recovered numbers",
      errorTitle: "Recovery failed",
      back: "Back to store",
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
        {
          q: "החלפתי טלפון — אפשר לשמור את המספר?",
          a: "כן. לחצו על שחזור באתר עם האימייל של הרכישה. נשלח קישור, פותחים את Arnacon במכשיר החדש, ומעבירים אליו את כל המספרים הפעילים.",
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

    crypto: {
      back: "חזרה לחנות",
      kicker: "רשת בדיקה",
      title: "תשלום בקריפטו",
      lead: "שניים-עשר חודשים בתשלום אחד. בלי חיוב חודשי.",
      stepChoose: "בחירה",
      stepConnect: "חיבור",
      stepReview: "סקירה",
      stepPay: "תשלום",
      continue: "סקירת הנעילה",
      reviewTitle: "בדקו את הנעילה",
      reviewLead: "הסכום הזה יוצא מהארנק לחוזה הנעילה.",
      reviewEscrow: "הארנק משלם ל-SubscriptionEscrow, לא אלינו.",
      reviewTerm: "שתים-עשרה תקופות של 30 יום. בלי חתימה כל חודש.",
      reviewFxUsdc: "USDC לפי מחיר האירו.",
      reviewFxNative: "ETH או POL לפי שער חי.",
      reviewAfter: "ביטול מחזיר חודשים שלא נוצלו באותה עסקה.",
      reviewClaim: "ואז חתימה אחת ל-QR.",
      changeSelection: "שינוי רשת או מטבע",
      network: "רשת",
      token: "מטבע",
      walletOff: "אין ארנק מחובר",
      connect: "חיבור",
      connecting: "מתחברים…",
      pay: (symbol) => `תשלום ב-${symbol}`,
      paying: "אשרו בארנק",
      quoteLoading: "מחשבים מחיר לחודש…",
      perMonth: (amount, symbol) => `${amount} ${symbol} לחודש`,
      introMonths: (amount, symbol, count) => `${count} החודשים הראשונים: ${amount} ${symbol} לחודש`,
      lock: (amount, symbol) => `נעילה של ${amount} ${symbol}`,
      recover: "כבר שילמתם?",
      recoverLink: "איתור הזמנה",
      amoy: "Polygon Amoy",
      sepolia: "Sepolia",
      usdc: "USDC",
      manageTitle: "ההזמנות בקריפטו",
      manageLead: "לחצו על הזמנה לביטול או להפעלה.",
      manageConnected: (short) => `מחובר ${short}`,
      noOrders: "אין הזמנות ממולאות מראש בארנק הזה.",
      colNumber: "מספר",
      colStatus: "סטטוס",
      colUntil: "עד",
      statusLive: "פעיל",
      statusCancelled: "בוטל",
      statusReady: "המספר מוכן",
      statusProvisioning: "בהקצאה",
      backToOrders: "כל ההזמנות",
      untilEmpty: "—",
      youCanWithdraw: (amount, symbol) => `אפשר למשוך ${amount} ${symbol}`,
      youWithdrawOn: (amount, symbol, date) =>
        `תמשכו ${amount} ${symbol} מ-${date}`,
      cancelledReturned: (date) => `בוטל. היתרה חזרה. המספר פעיל עד ${date}.`,
      nothingBackYet: "היתרה נפתחת בסוף התקופה הנוכחית.",
      ifCancel: (date, you, symbol) =>
        `השירות עד ${date}. ביטול מחזיר ${you} ${symbol} עכשיו.`,
      cancelScheduled: (date) => `הביטול נכנס לתוקף ${date}`,
      cancelCta: "ביטול",
      confirmCancel: "אישור ביטול והחזר",
      keepNumber: "להשאיר את המספר",
      cancelSummaryTitle: "סיכום ביטול",
      timePassed: (elapsed) => `זמן שעבר: ${elapsed}`,
      timePaid: (date) => `החודש הזה משולם עד ${date}`,
      refundNow: (amount, symbol, months) =>
        months === 1
          ? `החזר עכשיו: ${amount} ${symbol} על חודש אחד שלא נוצל`
          : `החזר עכשיו: ${amount} ${symbol} על ${months} חודשים שלא נוצלו`,
      alreadyCancelled: "כבר בוטל. היתרה חזרה באותה עסקה.",
      nothingToWithdraw: "אין מה למשוך. הביטול כבר החזיר את היתרה.",
      notPayer: "הארנק הזה לא שילם על ההזמנה.",
      expiredQuote: "המחיר פג. לחצו תשלום פעם אחת שוב.",
      rpcBusy: "הארנק עמוס. אם כבר אישרתם ב-MetaMask, איתרו את ההזמנה.",
      withdrawCta: "משיכת יתרה",
      claimCta: "חתימה והצגת QR",
      waitWallet: "אשרו בארנק",
      claimedDone: "כבר הופעל במכשיר",
      escrowUnread: "לא ניתן לקרוא את החוזה. הביטול דורש קריאה חיה.",
      numberLabel: (label) => `מספר ${label}`,
      landingTitle: "תשלום בקריפטו",
      landingLead: "USDC או מטבע רשת, ברשת בדיקה.",
      landingCta: "לתשלום",
      landingExplainTitle: "למה מראש, לא כל חודש",
      landingExplainLead:
        "חיוב קריפטו כל חודש נכשל. ארנק ריק, עסקה שפספסתם, מספר מת. נועלים שניים-עשר חודשים פעם אחת. ביטול מחזיר חודשים שלא נוצלו עכשיו.",
      landingExplainCta: "איך החוזה עובד",
      factLock: "הכסף בחוזה, לא אצלנו.",
      factCancel: "ביטול מחזיר חודשים שלא נוצלו באותה עסקה.",
      factLive: "החודש הנוכחי משולם. המספר לא נופל.",
      contractLabel: "SubscriptionEscrow",
      copyAddress: "העתקה",
      copied: "הועתק",
      openExplorer: "אקספלורר",
      whyCta: "למה נועלים ככה",
      whyTitle: "למה אסקרו, לא חיוב חודשי",
      whyLead: "חיוב קריפטו כל חודש נכשל. ארנק ריק, עסקה שפספסתם, מספר מת, ואז מחכים.",
      whyRefuseTitle: "מה לא עושים",
      whyRefuse:
        "לא תולים מספר חי על זה שתזכרו לשלם כל 30 יום. לא עוצרים שירות בזמן שעסקה ממתינה לאישור.",
      whyLockTitle: "הנעילה",
      whyLock:
        "נועלים הקמה ועוד שתים-עשרה תקופות של 30 יום. כל תקופה שנגמרה עוברת לספק. אין חתימה כל חודש.",
      whyCancelTitle: "ביטול",
      whyCancelBody:
        "חודשים עתידיים חוזרים אליכם באותה עסקה. החודש הנוכחי נשאר משולם. המספר חי עד סוף התקופה.",
      whyTrustTitle: "אל תסמכו על המסך",
      whyTrust: "הממשק לא קובע. קראו את החוזה שפורסם.",
      whyContractTitle: "החוזה שפורסם",
      whySameAddress: "אותו בייטקוד ב-Amoy וב-Sepolia.",
      whyCodeTitle: "קוד הביטול",
      whyCodeLead: "cancel מחזיר יתרה מיד. זה המוצר.",
      whyBack: "חזרה לתשלום",
      waitTitle: "ממתינים לאסקרו",
      waitPending: "ממתינים לעסקת ה-subscribe…",
      waitPaid: "שולם. מקצים את המספר…",
      waitReady: "התשלום אושר. חתמו עם הארנק ששילם לקבלת QR.",
      waitKeepOpen: (orderId) => `השאירו את הדף פתוח. הזמנה ${orderId}`,
      waitLeft: "יצאתם בטעות?",
      waitSign: "חתימה והצגת QR",
      waitSigning: "ממתינים לחתימה…",
    },

    recover: {
      entry: "מכשיר חדש? שחזור המספר",
      title: "שחזור המספר",
      sub: "הזינו את האימייל שאיתו קניתם. נעביר למכשיר הזה את כל המספרים הפעילים.",
      emailLabel: "אימייל הרכישה",
      emailPlaceholder: "you@email.com",
      submit: "שלחו קישור לשחזור",
      submitting: "בודקים…",
      sentTitle: "בדקו את האימייל",
      sentBody: "שלחנו קישור לשחזור. פתחו אותו בטלפון החדש והמשיכו ב-Arnacon.",
      notCustomerTitle: "אין חשבון Secnum לאימייל הזה",
      notCustomerBody: "הכתובת הזו לא רכשה מספר. אפשר לקנות מספר ולהתחיל.",
      notCustomerCta: "קנו מספר",
      notRecoverableTitle: "אין מה לשחזר",
      notRecoverableBody: "לאימייל הזה אין מספרים פעילים שלא פגו. אפשר לקנות מספר ולהמשיך.",
      openTitle: "פתחו את Arnacon בטלפון הזה",
      openBody: "כך מוכיחים את הזהות החדשה. אחר כך נעביר למכשיר את המספרים הפעילים.",
      openCta: "המשיכו ב-Arnacon",
      completingTitle: "מעבירים את המספרים…",
      completingBody: "מקשרים כל מספר פעיל למכשיר הזה ושולחים התקנה.",
      doneTitle: "המספרים הועברו",
      doneBody: "אם המוצר לא מופיע תוך כמה שניות, התקינו אותו מ-Arnacon.",
      numbersLabel: "מספרים ששוחזרו",
      errorTitle: "השחזור נכשל",
      back: "חזרה לחנות",
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
