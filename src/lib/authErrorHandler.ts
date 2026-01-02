/**
 * Safe authentication error handler
 * Maps Supabase auth errors to generic messages to prevent user enumeration
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'Email not confirmed': 'Por favor confirma tu email antes de iniciar sesión',
  'User not found': 'Email o contraseña incorrectos', // Same as invalid credentials
  'User already registered': 'Esta dirección de email ya está en uso',
  'Email rate limit exceeded': 'Demasiados intentos. Intenta de nuevo más tarde',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 8 caracteres',
  'Unable to validate email address: invalid format': 'Formato de email inválido',
  'Signup requires a valid password': 'Se requiere una contraseña válida',
  'Token has expired or is invalid': 'El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo',
  'Password reset requires a valid token': 'El enlace de recuperación no es válido. Solicita uno nuevo',
  'New password should be different from the old password': 'La nueva contraseña debe ser diferente a la anterior',
};

export function getSafeAuthError(error: any): string {
  const message = error?.message || '';
  
  // Return mapped safe message or generic fallback
  return AUTH_ERROR_MESSAGES[message] || 'Error de autenticación. Por favor intenta de nuevo';
}
