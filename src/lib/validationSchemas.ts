import { z } from 'zod';

// Product Validation Schema
export const productSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  
  category: z.string()
    .min(1, 'La categoría es requerida'),
  
  subcategory: z.string()
    .max(100, 'La subcategoría no puede exceder 100 caracteres')
    .optional(),
  
  description: z.string()
    .max(5000, 'La descripción no puede exceder 5000 caracteres')
    .optional(),
  
  price_unit: z.number()
    .positive('El precio debe ser positivo')
    .max(999999999, 'El precio es demasiado alto')
    .finite('El precio debe ser un número válido'),
  
  moq: z.number()
    .int('La cantidad mínima debe ser un número entero')
    .positive('La cantidad mínima debe ser mayor a 0')
    .max(1000000, 'La cantidad mínima es demasiado alta'),
  
  stock: z.number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .max(999999999, 'El stock es demasiado alto'),
  
  length_cm: z.number()
    .positive('El largo debe ser positivo')
    .max(10000, 'El largo es demasiado grande')
    .optional(),
  
  width_cm: z.number()
    .positive('El ancho debe ser positivo')
    .max(10000, 'El ancho es demasiado grande')
    .optional(),
  
  height_cm: z.number()
    .positive('El alto debe ser positivo')
    .max(10000, 'El alto es demasiado grande')
    .optional(),
  
  weight_net_kg: z.number()
    .positive('El peso debe ser positivo')
    .max(100000, 'El peso es demasiado grande')
    .optional(),
  
  weight_gross_kg: z.number()
    .positive('El peso bruto debe ser positivo')
    .max(100000, 'El peso bruto es demasiado grande')
    .optional(),
  
  lead_time_production_days: z.number()
    .int('Los días de producción deben ser un número entero')
    .min(0, 'Los días de producción no pueden ser negativos')
    .max(365, 'Los días de producción no pueden exceder 365 días')
    .optional(),
  
  lead_time_logistics_days: z.number()
    .int('Los días de logística deben ser un número entero')
    .min(0, 'Los días de logística no pueden ser negativos')
    .max(90, 'Los días de logística no pueden exceder 90 días')
    .optional(),
  
  sku: z.string()
    .max(100, 'El SKU no puede exceder 100 caracteres')
    .optional(),
  
  model: z.string()
    .max(100, 'El modelo no puede exceder 100 caracteres')
    .optional(),
});

// Order Validation Schema
export const orderSchema = z.object({
  quantity: z.number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(1000000, 'La cantidad es demasiado alta'),
  
  notes: z.string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional(),
});

// Auth Validation Schemas
export const signupSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .trim()
    .toLowerCase(),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  
  fullName: z.string()
    .trim()
    .min(1, 'El nombre completo es requerido')
    .max(100, 'El nombre completo no puede exceder 100 caracteres'),
  
  companyName: z.string()
    .trim()
    .min(1, 'El nombre de la empresa es requerido')
    .max(200, 'El nombre de la empresa no puede exceder 200 caracteres'),
  
  country: z.string()
    .trim()
    .min(1, 'El país es requerido')
    .max(100, 'El país no puede exceder 100 caracteres'),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .trim()
    .toLowerCase(),
  
  password: z.string()
    .min(1, 'La contraseña es requerida'),
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .trim()
    .toLowerCase(),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  
  confirmPassword: z.string()
    .min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Profile Validation Schema
export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, 'El nombre completo es requerido')
    .max(100, 'El nombre completo no puede exceder 100 caracteres'),

  company_name: z.string()
    .trim()
    .min(1, 'El nombre de la empresa es requerido')
    .max(200, 'El nombre de la empresa no puede exceder 200 caracteres'),

  country: z.literal('España', { errorMap: () => ({ message: 'El país debe ser España' }) }),

  tax_id: z.string()
    .trim()
    .min(1, 'El NIF/CIF/NIE/DNI/VAT-ID es requerido')
    .max(50, 'El identificador fiscal no puede exceder 50 caracteres'),

  eori_number: z.string()
    .trim()
    .min(1, 'El número EORI es requerido')
    .max(20, 'El número EORI no puede exceder 20 caracteres'),

  mobile_phone: z.string()
    .trim()
    .min(1, 'El número de contacto móvil es requerido')
    .max(20, 'El número de contacto móvil no puede exceder 20 caracteres'),

  address: z.string()
    .max(500, 'La dirección fiscal no puede exceder 500 caracteres')
    .optional(),

  city: z.string()
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .optional(),

  postal_code: z.string()
    .max(20, 'El código postal no puede exceder 20 caracteres')
    .optional(),

  importer_status: z.string()
    .max(100, 'El estado de importador no puede exceder 100 caracteres')
    .optional(),

  delivery_address: z.string()
    .trim()
    .min(1, 'El domicilio exacto de entrega es requerido')
    .max(500, 'El domicilio de entrega no puede exceder 500 caracteres'),

  delivery_city: z.string()
    .trim()
    .min(1, 'La ciudad de entrega es requerida')
    .max(100, 'La ciudad de entrega no puede exceder 100 caracteres'),

  delivery_postal_code: z.string()
    .trim()
    .min(1, 'El código postal de entrega es requerido')
    .max(10, 'El código postal de entrega no puede exceder 10 caracteres'),

  delivery_hours: z.string()
    .max(100, 'Los horarios de entrega no pueden exceder 100 caracteres')
    .optional(),

  delivery_phone: z.string()
    .max(20, 'El teléfono de contacto de entrega no puede exceder 20 caracteres')
    .optional(),

  is_professional_business: z.literal(true, {
    errorMap: () => ({ message: 'Debe declarar ser empresa profesional activa registrada' })
  }),
});
