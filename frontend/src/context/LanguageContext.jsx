import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  en: {
    tagline: 'Understand. Fill. Verify. Apply.',
    dashboard: 'Dashboard',
    vault: 'Document Vault',
    upload_form: 'Upload Form',
    history: 'Application History',
    profile: 'My Profile',
    admin: 'Admin Portal',
    settings: 'Settings',
    logout: 'Sign Out',
    login: 'Sign In',
    register: 'Create Account',
    get_started: 'Get Started',
    assisted_mode: 'Assisted Autofill',
    auto_mode: 'Smart Automatic Autofill',
    validate: 'Validation Center',
    export_pdf: 'Export Completed PDF',
    explain_field: 'Explain Field',
    missing_docs: 'Missing Documents',
    verified_stamp: 'FormWise Verified',
  },
  te: {
    tagline: 'అర్థం చేసుకోండి. పూరించండి. ధృవీకరించండి. దరఖాస్తు చేయండి.',
    dashboard: 'డ్యాష్‌బోర్డ్',
    vault: 'డాక్యుమెంట్ వాల్ట్',
    upload_form: 'ఫారమ్ అప్‌లోడ్',
    history: 'దరఖాస్తుల చరిత్ర',
    profile: 'నా ప్రొఫైల్',
    admin: 'అడ్మిన్ పోర్టల్',
    settings: 'సెట్టింగ్‌లు',
    logout: 'లాగ్ అవుట్',
    login: 'లాగిన్',
    register: 'ఖాతా సృష్టించండి',
    get_started: 'ప్రారంభించండి',
    assisted_mode: 'సహాయక ఆటోఫిల్',
    auto_mode: 'స్మార్ట్ ఆటోమేటిక్ ఆటోఫిల్',
    validate: 'ధృవీకరణ కేంద్రం',
    export_pdf: 'పూర్తయిన PDF డౌన్‌లోడ్',
    explain_field: 'కాలమ్ వివరణ',
    missing_docs: 'అవసరమైన పత్రాలు',
    verified_stamp: 'ఫారమ్‌వైజ్ ధృవీకరించబడింది',
  },
  hi: {
    tagline: 'समझें। भरें। सत्यापित करें। आवेदन करें।',
    dashboard: 'डैशबोर्ड',
    vault: 'दस्तावेज़ वॉल्ट',
    upload_form: 'फॉर्म अपलोड करें',
    history: 'आवेदन इतिहास',
    profile: 'मेरी प्रोफ़ाइल',
    admin: 'एडमिन पोर्टल',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    login: 'लॉग इन',
    register: 'खाता बनाएं',
    get_started: 'शुरू करें',
    assisted_mode: 'सहायक ऑटो-फिल',
    auto_mode: 'स्मार्ट स्वचालित ऑटो-फिल',
    validate: 'सत्यापन केंद्र',
    export_pdf: 'पूर्ण पीडीएफ डाउनलोड',
    explain_field: 'फ़ील्ड विवरण',
    missing_docs: 'आवश्यक दस्तावेज़',
    verified_stamp: 'फॉर्मवाइज सत्यापित',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('formwise_lang') || 'en');

  const switchLanguage = (langCode) => {
    localStorage.setItem('formwise_lang', langCode);
    setLanguage(langCode);
  };

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

