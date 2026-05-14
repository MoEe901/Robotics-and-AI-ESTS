/**
 * Canonical shape of a translation dictionary.
 * Every language file must satisfy this type exactly.
 */
export type Translations = {
  meta: {
    /** BCP-47 language tag for <html lang> */
    lang: string;
    /** Label shown in the switcher */
    label: string;
    /** App name used in loading screens and alt text */
    appName: string;
  };

  nav: {
    openMenu: string;
    closeMenu: string;
    /** Maps lowercase English nav link labels to their translated equivalents */
    linkLabelMap: Record<string, string>;
  };

  languageSwitcher: {
    label: string;
    switchToEn: string;
    switchToFr: string;
  };

  /** Hero section — overrides CMS values when locale ≠ EN */
  hero: {
    eyebrow: string;
    location: string;
    /** Each string becomes one line of the big headline */
    titleLines: string[];
    description: string;
    primaryCta: string;
    secondaryCta: string;
    /** Floating cards */
    activityEyebrow: string;
    activityTitle: string;
    techStackEyebrow: string;
    techStackTitle: string;
    growthEyebrow: string;
    growthTitle: string;
    /** Inline UI strings */
    notEnoughData: string;
    scroll: string;
  };

  /** Home page sections */
  sections: {
    /** Section eyebrow comments */
    eventsEyebrow: string;
    knowUsEyebrow: string;
    whyJoinEyebrow: string;
    cellulesEyebrow: string;
    partnersEyebrow: string;
    structureEyebrow: string;

    /** Events */
    eventsTitle: string;

    /** Know Us */
    knowUsTitle: string;
    knowUsIntro: string;
    knowUsCards: { title: string; description: string }[];

    /** Why Join */
    whyJoinSmallHeading: string;
    whyJoinTitle: string;
    whyJoinDescription: string;
    whyJoinHighlights: { title: string; subtitle: string }[];
    whyJoinCards: { title: string; description: string }[];

    /** Cellules */
    cellulesTitle: string;
    cellulesSubtitle: string;
    cellulesCards: { title: string; description: string; iconKey?: string; iconImageUrl?: string }[];
    /** Inner eyebrow inside the cellules box (e.g. "Robotics & AI Club") */
    cellulesClubName: string;

    /** Team */
    teamTitle: string;
    teamSubtitle: string;
    teamViewAll: string;
    teamEmptyTitle: string;
    teamEmptyDesc: string;

    /** FAQ UI chrome */
    faqFilterByTopic: string;
    faqAllQuestions: string;

    /** Partners section fallback title */
    partnersTitle: string;
  };

  /** /team directory page */
  teamPage: {
    directory: string;
    titleMain: string;
    titleAccent: string;
    members: string;
    academicYear: string;
    notCurrentYear: string;
    cellules: string;
    jumpToCurrent: string;
    backToHome: string;
    noMembersPublished: string;
    noMembersPublishedShowing: string;
    tip: string;
    tipSuffix: string;
    searchPlaceholder: string;
    gridView: string;
    listView: string;
    showing: string;
    noMembersYet: string;
    noMembersYetDesc: string;
    noMembersYetDescSuffix: string;
    noMembersFound: string;
    noMembersFoundDesc: string;
    noMembersInCategory: string;
    loadMore: string;
  };

  /** /events/[slug] page */
  eventPage: {
    allEvents: string;
    share: string;
    details: string;
    register: string;
    featuredEvent: string;
    event: string;
    registrationOnExternalSite: string;
    clubEvent: string;
    reserveYourSpot: string;
    readTheStory: string;
    dateTba: string;
    eventPassed: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    aboutTheEvent: string;
    exploreFullStory: string;
    programAndResources: string;
    resource: string;
    opensInNewTab: string;
    gallery: string;
    moreMedia: string;
    registration: string;
    joinViaOfficialPage: string;
    onCampusEvent: string;
    externalRegDesc: string;
    onCampusDesc: string;
    registerInfo: string;
    estSafiStudentClub: string;
    eventDetails: string;
    dateLabel: string;
    timeLabel: string;
    venueLabel: string;
    organizerLabel: string;
    tba: string;
    topics: string;
    openRegistration: string;
    loading: string;
    notFound: string;
    backToEvents: string;
    openVideo: string;
    close: string;
    previousMedia: string;
    nextMedia: string;
    mediaPreview: string;
    noStoryYet: string;
    /** Events carousel */
    viewEventStory: string;
    noEventsYet: string;
    openEventStoryAriaLabel: string;
    eventsCarouselAriaLabel: string;
    slideLabel: string;
    slideOf: string;
    pauseSlideshow: string;
    playSlideshow: string;
    slideshowReducedMotionTitle: string;
  };

  /** /team/[slug] member profile page */
  memberProfilePage: {
    teamDirectory: string;
    sendMessage: string;
    shareProfile: string;
    share: string;
    message: string;
    bio: string;
    about: string;
    expertise: string;
    interestsAndAreas: string;
    impact: string;
    details: string;
    department: string;
    school: string;
    academicYear: string;
    birthday: string;
    socialAndContact: string;
    rolesLabel: string;
    startedLabel: string;
    orderLabel: string;
    linksLabel: string;
    clubMemberFallback: string;
    schoolFallback: string;
    loading: string;
    notFound: string;
  };

  /** Apply form validation & UI chrome */
  apply: {
    optional: string;
    notRequiredForLevel: string;
    sending: string;
    networkError: string;
    serverError: string;
    selectYear: string;
    selectYearPlaceholder: string;
    selectDepartment: string;
    validation: {
      firstNameRequired: string;
      lastNameRequired: string;
      yearRequired: string;
      departmentRequired: string;
      departmentMismatch: string;
      emailRequired: string;
      emailFormat: string;
      phoneRequired: string;
      phoneFormat: string;
    };
  };

  /** Apply section content (headings, labels, success copy) */
  applySection: {
    topLabel: string;
    heroLine1: string;
    heroLine2: string;
    heroSub: string;
    infoBadge: string;
    infoTitle: string;
    infoDesc: string;
    formTitle: string;
    formSubtitle: string;
    firstNameLabel: string;
    lastNameLabel: string;
    yearLabel: string;
    departmentLabel: string;
    emailLabel: string;
    phoneLabel: string;
    messageLabel: string;
    submitNotePrefix: string;
    charterLinkText: string;
    submitButtonLabel: string;
    successTitle: string;
    successMessage: string;
    contactRows: { label: string; value: string; iconKey: string; tone: string }[];
    placeholders: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      message: string;
    };
    community: {
      eyebrow: string;
      titleLine: string;
      titleAccent: string;
      description: string;
      buttonLabels?: Record<string, string>;
    };
  };

  /** FAQ section content */
  faqSection: {
    eyebrow: string;
    titleLine: string;
    titleAccent: string;
    subtitle: string;
    categories: { id: string; label: string }[];
    items: {
      categoryId: string;
      question: string;
      answer: string;
      color: string;
      iconKey: string;
    }[];
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButtonLabel: string;
    ctaButtonHref: string;
  };

  /** Process steps section content */
  processSteps: {
    eyebrow: string;
    titleLine: string;
    titleAccent: string;
    steps: { badge: string; title: string; description: string; iconKey: string }[];
  };
  /** CMS value translation maps */
  cmsMap: {
    roleType: Record<string, string>;
    topics: Record<string, string>;
  };

  /** Footer */
  footer: {
    brandName: string;
    tagline: string;
    clubColumn: string;
    infoColumn: string;
    connectColumn: string;
    socialColumn: string;
    clubLinks: { label: string; href: string }[];
    infoLinks: { label: string; href: string }[];
    connectLinks: { label: string; href: string }[];
    allSystemsOperational: string;
    estBadge: string;
  };
};

export type Locale = "en" | "fr";
