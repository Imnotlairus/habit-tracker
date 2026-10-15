import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Transaction,
  NewTransactionInput,
} from '@/types/finance';
import { format, subDays } from 'date-fns';

export interface IFinanceRepository {
  list(): Promise<Transaction[]>;
  add(tx: NewTransactionInput): Promise<Transaction>;
  remove(id: string): Promise<boolean>;
  getBudget(month: string): Promise<number | null>;
  setBudget(month: string, amount: number): Promise<boolean>;
  isDemo(): boolean;
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'habitpulse_transactions',
  BUDGETS: 'habitpulse_budgets',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Transacciones iniciales de muestra para alimentar el modo demo y dar una
 * experiencia rica y visual desde el primer segundo.
 */
function getInitialDemoTransactions(): Transaction[] {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
  const threeDaysAgoStr = format(subDays(today, 3), 'yyyy-MM-dd');
  const fiveDaysAgoStr = format(subDays(today, 5), 'yyyy-MM-dd');

  return [
    {
      id: 'demo-tx-1',
      amount: 28000,
      type: 'gasto',
      category: 'Alimentación',
      payment_method: 'Tarjeta Débito',
      description: 'Almuerzo saludable y jugo natural',
      date: todayStr,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-tx-2',
      amount: 12500,
      type: 'gasto',
      category: 'Transporte',
      payment_method: 'Efectivo',
      description: 'Recarga tarjeta de transporte y pasajes',
      date: todayStr,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-tx-3',
      amount: 65000,
      type: 'gasto',
      category: 'Salud',
      payment_method: 'Tarjeta Débito',
      description: 'Vitaminas y suplemento de magnesio',
      date: yesterdayStr,
      created_at: subDays(today, 1).toISOString(),
    },
    {
      id: 'demo-tx-4',
      amount: 45000,
      type: 'gasto',
      category: 'Ocio/Salidas',
      payment_method: 'Tarjeta Crédito',
      description: 'Entrada a cine y café con amigos',
      date: yesterdayStr,
      created_at: subDays(today, 1).toISOString(),
    },
    {
      id: 'demo-tx-5',
      amount: 220000,
      type: 'gasto',
      category: 'Servicios/Hogar',
      payment_method: 'Transferencia',
      description: 'Pago mensual de internet y energía',
      date: threeDaysAgoStr,
      created_at: subDays(today, 3).toISOString(),
    },
    {
      id: 'demo-tx-6',
      amount: 85000,
      type: 'gasto',
      category: 'Educación',
      payment_method: 'Transferencia',
      description: 'Libro de finanzas y hábitos atómicos',
      date: fiveDaysAgoStr,
      created_at: subDays(today, 5).toISOString(),
    },
    {
      id: 'demo-tx-7',
      amount: 2500000,
      type: 'ingreso',
      category: 'Servicios/Hogar',
      payment_method: 'Transferencia',
      description: 'Ingreso quincenal de nómina',
      date: fiveDaysAgoStr,
      created_at: subDays(today, 5).toISOString(),
    },
  ];
}

// ==============================================================================
// Implementación LocalStorage (Modo Demo / Offline-First)
// ==============================================================================
export class LocalStorageFinanceRepository implements IFinanceRepository {
  isDemo(): boolean {
    return true;
  }

  async list(): Promise<Transaction[]> {
    if (!isBrowser()) return [];
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      const demoData = getInitialDemoTransactions();
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(demoData));
      return demoData;
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error al parsear transacciones de localStorage:', err);
      return [];
    }
  }

  async add(tx: NewTransactionInput): Promise<Transaction> {
    const newTx: Transaction = {
      ...tx,
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `tx-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const current = await this.list();
    const updated = [newTx, ...current];
    if (isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    }
    return newTx;
  }

  async remove(id: string): Promise<boolean> {
    const current = await this.list();
    const updated = current.filter((item) => item.id !== id);
    if (isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    }
    return true;
  }

  async getBudget(month: string): Promise<number | null> {
    if (!isBrowser()) return 1800000;
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!raw) {
      // Presupuesto por defecto para demo: 1.800.000 COP
      const initialBudgets: Record<string, number> = { [month]: 1800000 };
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(initialBudgets));
      return 1800000;
    }
    try {
      const budgets: Record<string, number> = JSON.parse(raw);
      return budgets[month] ?? null;
    } catch {
      return null;
    }
  }

  async setBudget(month: string, amount: number): Promise<boolean> {
    if (!isBrowser()) return false;
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    let budgets: Record<string, number> = {};
    if (raw) {
      try {
        budgets = JSON.parse(raw);
      } catch {
        budgets = {};
      }
    }
    budgets[month] = amount;
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    return true;
  }
}

// ==============================================================================
// Implementación Supabase (Cloud Database)
// ==============================================================================
export class SupabaseFinanceRepository implements IFinanceRepository {
  private fallback = new LocalStorageFinanceRepository();

  isDemo(): boolean {
    return false;
  }

  async list(): Promise<Transaction[]> {
    if (!supabase) return this.fallback.list();
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error en Supabase transactions.list, usando fallback:', error.message);
        return this.fallback.list();
      }

      return (data as Transaction[]) || [];
    } catch (err) {
      console.warn('Fallo de red con Supabase, usando fallback:', err);
      return this.fallback.list();
    }
  }

  async add(tx: NewTransactionInput): Promise<Transaction> {
    if (!supabase) return this.fallback.add(tx);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([tx])
        .select()
        .single();

      if (error || !data) {
        console.warn('Fallo insert en Supabase, guardando en fallback local:', error?.message);
        return this.fallback.add(tx);
      }

      return data as Transaction;
    } catch (err) {
      console.warn('Excepción al insertar en Supabase:', err);
      return this.fallback.add(tx);
    }
  }

  async remove(id: string): Promise<boolean> {
    if (!supabase) return this.fallback.remove(id);
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.warn('Error delete en Supabase:', error.message);
        return this.fallback.remove(id);
      }
      return true;
    } catch {
      return this.fallback.remove(id);
    }
  }

  async getBudget(month: string): Promise<number | null> {
    if (!supabase) return this.fallback.getBudget(month);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('amount')
        .eq('month', month)
        .maybeSingle();

      if (error || !data) {
        return this.fallback.getBudget(month);
      }
      return Number(data.amount);
    } catch {
      return this.fallback.getBudget(month);
    }
  }

  async setBudget(month: string, amount: number): Promise<boolean> {
    if (!supabase) return this.fallback.setBudget(month, amount);
    try {
      const { error } = await supabase.from('budgets').upsert(
        {
          month,
          amount,
        },
        { onConflict: 'user_id,month' }
      );

      if (error) {
        console.warn('Error al guardar presupuesto en Supabase:', error.message);
        return this.fallback.setBudget(month, amount);
      }
      return true;
    } catch {
      return this.fallback.setBudget(month, amount);
    }
  }
}

/**
 * Fábrica de Repositorio:
 * Si Supabase está configurado con credenciales válidas, retorna la instancia de Supabase;
 * de lo contrario, entrega la instancia LocalStorage para funcionamiento offline/demo garantizado.
 */
export function getFinanceRepository(): IFinanceRepository {
  if (isSupabaseConfigured && supabase) {
    return new SupabaseFinanceRepository();
  }
  return new LocalStorageFinanceRepository();
}
