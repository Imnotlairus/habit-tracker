export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  name: string;
  maxFractionDigits: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  COP: {
    code: 'COP',
    symbol: '$',
    locale: 'es-CO',
    name: 'Peso Colombiano',
    maxFractionDigits: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    name: 'Dólar Estadounidense',
    maxFractionDigits: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    locale: 'es-ES',
    name: 'Euro',
    maxFractionDigits: 2,
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    locale: 'es-MX',
    name: 'Peso Mexicano',
    maxFractionDigits: 2,
  },
};

// Moneda por defecto
export const DEFAULT_CURRENCY_CODE = 'COP';

// Umbral por defecto para gastos hormiga (en COP: ~$5 USD ≈ $20.000 COP)
export const DEFAULT_ANT_EXPENSE_THRESHOLD_COP = 20000;

const CURRENCY_STORAGE_KEY = 'habitpulse_user_currency';
const ANT_THRESHOLD_STORAGE_KEY = 'habitpulse_ant_threshold';

/**
 * Formatea un valor monetario según la moneda activa.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY_CODE
): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.COP;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: config.maxFractionDigits,
  }).format(amount);
}

/**
 * Obtiene la configuración de moneda guardada en el cliente.
 */
export function getUserCurrency(): CurrencyConfig {
  if (typeof window === 'undefined') return SUPPORTED_CURRENCIES.COP;
  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      return SUPPORTED_CURRENCIES[saved];
    }
  } catch {
    // Modo privado o SSR
  }
  return SUPPORTED_CURRENCIES.COP;
}

/**
 * Obtiene el umbral de gastos hormiga configurado por el usuario.
 */
export function getUserAntExpenseThreshold(): number {
  if (typeof window === 'undefined') return DEFAULT_ANT_EXPENSE_THRESHOLD_COP;
  try {
    const saved = localStorage.getItem(ANT_THRESHOLD_STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return DEFAULT_ANT_EXPENSE_THRESHOLD_COP;
}
