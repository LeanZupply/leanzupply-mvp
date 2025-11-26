/**
 * Secure error handling utility
 * Only logs detailed errors in development mode
 * Returns user-friendly messages for production
 */

const isDev = import.meta.env.DEV;

const errorMessages: Record<string, string> = {
  'row-level security': 'No tienes permisos para esta acción',
  'not found': 'Recurso no encontrado',
  'unique violation': 'Este valor ya existe',
  'foreign key': 'No se puede completar la acción debido a dependencias',
  'permission denied': 'No tienes permisos suficientes',
  'authentication': 'Error de autenticación',
  'network': 'Error de conexión. Por favor verifica tu conexión a internet',
};

export const handleError = (context: string, error: any): string => {
  // Log detailed error only in development
  if (isDev) {
    console.error(`[${context}]`, error);
  }

  // Get user-friendly message
  const errorMessage = error?.message?.toLowerCase() || '';
  
  for (const [key, value] of Object.entries(errorMessages)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  return 'Ocurrió un error. Por favor intenta de nuevo.';
};

export const logInfo = (message: string, data?: any) => {
  if (isDev) {
    console.log(message, data);
  }
};
