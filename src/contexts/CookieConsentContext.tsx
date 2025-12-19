import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loadGTM, isGTMLoaded } from "@/lib/gtm";

// localStorage key for persisting consent
const CONSENT_KEY = "leanzupply_cookie_consent";

interface CookieConsentState {
  analytics: boolean;
  hasResponded: boolean;
  timestamp: string | null;
}

interface CookieConsentContextType {
  consent: CookieConsentState;
  acceptAnalytics: () => void;
  rejectAnalytics: () => void;
  resetConsent: () => void;
}

const defaultState: CookieConsentState = {
  analytics: false,
  hasResponded: false,
  timestamp: null,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

// Load consent from localStorage
const loadConsentFromStorage = (): CookieConsentState => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        analytics: Boolean(parsed.analytics),
        hasResponded: Boolean(parsed.hasResponded),
        timestamp: parsed.timestamp || null,
      };
    }
  } catch {
    // If parsing fails, return default state
  }
  return defaultState;
};

// Save consent to localStorage
const saveConsentToStorage = (state: CookieConsentState): void => {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    // Silently fail if localStorage is not available
  }
};

export const CookieConsentProvider = ({ children }: { children: React.ReactNode }) => {
  const [consent, setConsent] = useState<CookieConsentState>(defaultState);
  const [initialized, setInitialized] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    const storedConsent = loadConsentFromStorage();
    setConsent(storedConsent);
    setInitialized(true);

    // If user previously accepted, load GTM
    if (storedConsent.analytics && storedConsent.hasResponded) {
      loadGTM();
    }
  }, []);

  const acceptAnalytics = useCallback(() => {
    const newState: CookieConsentState = {
      analytics: true,
      hasResponded: true,
      timestamp: new Date().toISOString(),
    };
    setConsent(newState);
    saveConsentToStorage(newState);

    // Load GTM after acceptance
    if (!isGTMLoaded()) {
      loadGTM();
    }
  }, []);

  const rejectAnalytics = useCallback(() => {
    const newState: CookieConsentState = {
      analytics: false,
      hasResponded: true,
      timestamp: new Date().toISOString(),
    };
    setConsent(newState);
    saveConsentToStorage(newState);
  }, []);

  const resetConsent = useCallback(() => {
    setConsent(defaultState);
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      // Silently fail
    }
  }, []);

  // Don't render children until we've loaded consent from storage
  // This prevents flash of cookie banner for returning users
  if (!initialized) {
    return null;
  }

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        acceptAnalytics,
        rejectAnalytics,
        resetConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
};
