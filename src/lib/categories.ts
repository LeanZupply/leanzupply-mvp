import {
  ChefHat,
  Cake,
  Beef,
  IceCream,
  Snowflake,
  Package,
  Hotel,
  Presentation,
  Forklift,
  Wrench,
  Coffee,
  Dumbbell,
  LucideIcon,
} from "lucide-react";

export const PRODUCT_CATEGORIES = [
  "Cocina y Restauración",
  "Panaderías y Pastelerías",
  "Carnicerías y Chacinados",
  "Heladerías y Pastelería Fría",
  "Refrigeración Comercial e Industrial",
  "Packaging y Envasado",
  "Mobiliario y Equipamiento para Hoteles",
  "Equipamiento Audiovisual y para Eventos",
  "Movilidad y Logística Interna (Intralogística)",
  "Ferretería y Construcción",
  "Vending & Automatización Comercial",
  "Centros de Entrenamiento y Gimnasios Profesionales",
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Mapeo de categorías a iconos
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Cocina y Restauración": ChefHat,
  "Panaderías y Pastelerías": Cake,
  "Carnicerías y Chacinados": Beef,
  "Heladerías y Pastelería Fría": IceCream,
  "Refrigeración Comercial e Industrial": Snowflake,
  "Packaging y Envasado": Package,
  "Mobiliario y Equipamiento para Hoteles": Hotel,
  "Equipamiento Audiovisual y para Eventos": Presentation,
  "Movilidad y Logística Interna (Intralogística)": Forklift,
  "Ferretería y Construcción": Wrench,
  "Vending & Automatización Comercial": Coffee,
  "Centros de Entrenamiento y Gimnasios Profesionales": Dumbbell,
};

// Función para obtener el icono correcto o uno por defecto
export const getCategoryIcon = (category: string): LucideIcon => {
  return CATEGORY_ICONS[category] || Package;
};
