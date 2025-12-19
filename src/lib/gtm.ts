// Google Tag Manager utilities
// GTM Container ID and GA4 Measurement ID
const GTM_ID = 'GTM-PW4XW8TS';

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Initialize dataLayer before GTM loads
export const initDataLayer = (): void => {
  window.dataLayer = window.dataLayer || [];
};

// Check if GTM is already loaded
export const isGTMLoaded = (): boolean => {
  return document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${GTM_ID}"]`) !== null;
};

// Dynamically inject GTM script (only called after consent)
export const loadGTM = (): void => {
  if (isGTMLoaded()) {
    return;
  }

  // Initialize dataLayer
  initDataLayer();

  // Push initial config with IP anonymization
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  // Create and inject GTM script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

  const firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode?.insertBefore(script, firstScript);

  // Add noscript iframe for users with JS disabled
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
};

// Type-safe dataLayer push
export interface GTMEvent {
  event: string;
  [key: string]: unknown;
}

export const pushToDataLayer = (eventData: GTMEvent): void => {
  if (!window.dataLayer) {
    initDataLayer();
  }
  window.dataLayer.push(eventData);
};
