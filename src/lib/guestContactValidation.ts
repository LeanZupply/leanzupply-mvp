/**
 * Guest Contact Data Validation and Session Storage Utilities
 * Used for the quote request flow to pass contact data between pages
 */

export interface GuestContactData {
  email: string;
  phone: string;
  taxId: string;
  postalCode: string;
  acceptedTerms: boolean;
  quantity?: number;  // Optional - persists user's selected quantity from Product Details
}

const SESSION_STORAGE_KEY = 'guest_contact_data';
const QUOTE_REQUEST_ID_KEY = 'guest_quote_request_id';

// Validation regex patterns (same as Checkout.tsx)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-]{9,20}$/;
const POSTAL_CODE_REGEX = /^\d{4,10}$/;
const MIN_TAX_ID_LENGTH = 5;

/**
 * Validates all guest contact fields
 */
export function isGuestContactValid(data: GuestContactData): boolean {
  return (
    EMAIL_REGEX.test(data.email.trim()) &&
    PHONE_REGEX.test(data.phone.trim()) &&
    data.taxId.trim().length >= MIN_TAX_ID_LENGTH &&
    POSTAL_CODE_REGEX.test(data.postalCode.trim()) &&
    data.acceptedTerms
  );
}

/**
 * Validates individual fields and returns error messages
 */
export function validateGuestContactField(
  field: keyof GuestContactData,
  value: string | boolean
): string | null {
  switch (field) {
    case 'email':
      if (!value || typeof value !== 'string') return 'Email es requerido';
      if (!EMAIL_REGEX.test(value.trim())) return 'Email no es valido';
      return null;
    case 'phone':
      if (!value || typeof value !== 'string') return 'Telefono es requerido';
      if (!PHONE_REGEX.test(value.trim())) return 'Telefono no es valido';
      return null;
    case 'taxId':
      if (!value || typeof value !== 'string') return 'NIF/CIF es requerido';
      if (value.trim().length < MIN_TAX_ID_LENGTH) return 'NIF/CIF debe tener al menos 5 caracteres';
      return null;
    case 'postalCode':
      if (!value || typeof value !== 'string') return 'Codigo postal es requerido';
      if (!POSTAL_CODE_REGEX.test(value.trim())) return 'Codigo postal no es valido';
      return null;
    case 'acceptedTerms':
      if (!value) return 'Debes aceptar los terminos y condiciones';
      return null;
    default:
      return null;
  }
}

/**
 * Saves guest contact data to sessionStorage
 */
export function saveGuestContactToSession(data: GuestContactData): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save guest contact data to session:', error);
  }
}

/**
 * Retrieves guest contact data from sessionStorage
 */
export function getGuestContactFromSession(): GuestContactData | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as GuestContactData;
    }
  } catch (error) {
    console.error('Failed to retrieve guest contact data from session:', error);
  }
  return null;
}

/**
 * Clears guest contact data and quote request ID from sessionStorage
 */
export function clearGuestContactFromSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(QUOTE_REQUEST_ID_KEY);
  } catch (error) {
    console.error('Failed to clear guest contact data from session:', error);
  }
}

/**
 * Saves the abandoned quote request ID to sessionStorage
 */
export function saveGuestQuoteRequestId(id: string): void {
  try {
    sessionStorage.setItem(QUOTE_REQUEST_ID_KEY, id);
  } catch (error) {
    console.error('Failed to save guest quote request ID to session:', error);
  }
}

/**
 * Retrieves the abandoned quote request ID from sessionStorage
 */
export function getGuestQuoteRequestId(): string | null {
  try {
    return sessionStorage.getItem(QUOTE_REQUEST_ID_KEY);
  } catch (error) {
    console.error('Failed to retrieve guest quote request ID from session:', error);
  }
  return null;
}

/**
 * Clears the abandoned quote request ID from sessionStorage
 */
export function clearGuestQuoteRequestId(): void {
  try {
    sessionStorage.removeItem(QUOTE_REQUEST_ID_KEY);
  } catch (error) {
    console.error('Failed to clear guest quote request ID from session:', error);
  }
}

/**
 * Returns empty guest contact data object
 */
export function getEmptyGuestContactData(): GuestContactData {
  return {
    email: '',
    phone: '',
    taxId: '',
    postalCode: '',
    acceptedTerms: false,
  };
}
