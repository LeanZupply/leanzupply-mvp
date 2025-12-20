// GTM Event Tracking Helpers
// These functions push events to the dataLayer for Google Tag Manager

import { pushToDataLayer } from "./gtm";

/**
 * Track form submission events
 * @param formName - Name identifier for the form
 * @param formLocation - URL path where the form is located (optional, defaults to current path)
 */
export const trackFormSubmission = (
  formName: string,
  formLocation?: string
): void => {
  pushToDataLayer({
    event: "form_submission",
    form_name: formName,
    form_location: formLocation || window.location.pathname,
  });
};

/**
 * Track contact/CTA click events
 * @param contactType - Type of contact (email, phone, cta, whatsapp)
 * @param contactValue - Optional value (email address, phone number, CTA name)
 */
export const trackContactClick = (
  contactType: "email" | "phone" | "cta" | "whatsapp",
  contactValue?: string
): void => {
  pushToDataLayer({
    event: "contact_click",
    contact_type: contactType,
    contact_value: contactValue,
  });
};

/**
 * Track page view events (for SPA navigation)
 * @param pagePath - The page path
 * @param pageTitle - The page title
 */
export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  pushToDataLayer({
    event: "page_view",
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
};

// Form name constants for consistency
export const FORM_NAMES = {
  SIGNUP: "signup",
  LOGIN: "login",
  BUYER_PROFILE_PERSONAL: "buyer_profile_personal",
  BUYER_PROFILE_FISCAL: "buyer_profile_fiscal",
  BUYER_PROFILE_DELIVERY: "buyer_profile_delivery",
  MANUFACTURER_PROFILE: "manufacturer_profile",
  PRODUCT_CREATE: "product_create",
  PRODUCT_EDIT: "product_edit",
  PROFILE_COMPLETION: "profile_completion",
  ORDER_CHECKOUT: "order_checkout",
  QUOTE_REQUEST: "quote_request",
} as const;

/**
 * Track quote request events
 * @param productId - The product ID for the quote request
 * @param isAuthenticated - Whether the user was logged in
 */
export const trackQuoteRequest = (
  productId: string,
  isAuthenticated: boolean
): void => {
  pushToDataLayer({
    event: "quote_request",
    product_id: productId,
    is_authenticated: isAuthenticated,
    page_location: window.location.pathname,
  });
};
