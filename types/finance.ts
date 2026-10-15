export type TransactionType = 'gasto' | 'ingreso';

export const CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Servicios/Hogar',
  'Ocio/Salidas',
  'Salud',
  'Educación',
  'Imprevistos',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta Débito',
  'Tarjeta Crédito',
  'Transferencia',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  type: TransactionType;
  category: Category;
  payment_method: PaymentMethod;
  description?: string;
  date: string; // Formato YYYY-MM-DD (hora local)
  created_at?: string;
}

export type NewTransactionInput = Omit<Transaction, 'id' | 'created_at' | 'user_id'>;

export interface CategorySummary {
  category: Category;
  total: number;
  percentage: number;
  count: number;
  color: string;
}

export interface MonthlyBudget {
  id?: string;
  user_id?: string;
  month: string; // Formato YYYY-MM (ej. "2026-10")
  amount: number;
  created_at?: string;
}

export interface CategoryMetadata {
  label: Category;
  color: string; // HEX para Recharts y estilos en línea
  bgClass: string;
  textClass: string;
  borderClass: string;
  iconName: string;
  description: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryMetadata> = {
  Alimentación: {
    label: 'Alimentación',
    color: '#10b981', // Emerald 500
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-500/30',
    iconName: 'Utensils',
    description: 'Comida, supermercado, restaurantes y cafés',
  },
  Transporte: {
    label: 'Transporte',
    color: '#0284c7', // Sky 600
    bgClass: 'bg-sky-500/10 dark:bg-sky-500/20',
    textClass: 'text-sky-700 dark:text-sky-400',
    borderClass: 'border-sky-500/30',
    iconName: 'Car',
    description: 'Gasolina, taxi, transporte público y peajes',
  },
  'Servicios/Hogar': {
    label: 'Servicios/Hogar',
    color: '#6366f1', // Indigo 500
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    textClass: 'text-indigo-700 dark:text-indigo-400',
    borderClass: 'border-indigo-500/30',
    iconName: 'Home',
    description: 'Arriendo, luz, agua, internet y mantenimiento',
  },
  'Ocio/Salidas': {
    label: 'Ocio/Salidas',
    color: '#ec4899', // Pink 500
    bgClass: 'bg-pink-500/10 dark:bg-pink-500/20',
    textClass: 'text-pink-700 dark:text-pink-400',
    borderClass: 'border-pink-500/30',
    iconName: 'Film',
    description: 'Cine, eventos, paseos, suscripciones y hobbies',
  },
  Salud: {
    label: 'Salud',
    color: '#ef4444', // Red 500
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/20',
    textClass: 'text-rose-700 dark:text-rose-400',
    borderClass: 'border-rose-500/30',
    iconName: 'HeartPulse',
    description: 'Medicinas, consultas médicas y bienestar',
  },
  Educación: {
    label: 'Educación',
    color: '#8b5cf6', // Violet 500
    bgClass: 'bg-violet-500/10 dark:bg-violet-500/20',
    textClass: 'text-violet-700 dark:text-violet-400',
    borderClass: 'border-violet-500/30',
    iconName: 'GraduationCap',
    description: 'Cursos, libros, talleres y certificaciones',
  },
  Imprevistos: {
    label: 'Imprevistos',
    color: '#f59e0b', // Amber 500
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
    iconName: 'AlertTriangle',
    description: 'Reparaciones urgentes, emergencias y extras',
  },
};

export const SUGGESTED_AMOUNTS = [5000, 10000, 20000, 50000, 100000] as const;

/**
 * Formateador de moneda oficial para pesos colombianos (COP) sin decimales.
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}
