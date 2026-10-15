'use client';

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import {
  Transaction,
  NewTransactionInput,
  Category,
  CategorySummary,
  CATEGORY_CONFIG,
  CATEGORIES,
} from '@/types/finance';
import { getFinanceRepository, IFinanceRepository } from '@/lib/finance/repository';
import { format } from 'date-fns';

const noopSubscribe = () => () => {};
const getClientMonthKey = () =>
  typeof window === 'undefined' ? '' : format(new Date(), 'yyyy-MM');
const getClientTodayStr = () =>
  typeof window === 'undefined' ? '' : format(new Date(), 'yyyy-MM-dd');

export function useTransactions() {
  const [repository] = useState<IFinanceRepository>(() => getFinanceRepository());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fecha local para mes actual (YYYY-MM) y hoy (YYYY-MM-DD) usando useSyncExternalStore para SSR/prerender seguro
  const currentMonthKey = useSyncExternalStore(noopSubscribe, getClientMonthKey, () => '');
  const todayDateStr = useSyncExternalStore(noopSubscribe, getClientTodayStr, () => '');

  // Cargar datos dentro de useEffect para evitar desajustes de hidratación
  useEffect(() => {
    let isCancelled = false;
    const activeMonthKey = currentMonthKey || format(new Date(), 'yyyy-MM');

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsDemoMode(repository.isDemo());

        const [list, loadedBudget] = await Promise.all([
          repository.list(),
          repository.getBudget(activeMonthKey),
        ]);

        if (!isCancelled) {
          setTransactions(list);
          setBudget(loadedBudget);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error desconocido al cargar finanzas'
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [repository, currentMonthKey]);

  // Agregar transacción con actualización optimista
  const addTransaction = useCallback(
    async (input: NewTransactionInput): Promise<Transaction> => {
      const tempId = `temp-${Date.now()}`;
      const optimisticTx: Transaction = {
        ...input,
        id: tempId,
        created_at: new Date().toISOString(),
      };

      // 1. Actualización optimista inmediata en la UI
      setTransactions((prev) => [optimisticTx, ...prev]);

      try {
        const persisted = await repository.add(input);
        // 2. Reemplazar transacción temporal con la real
        setTransactions((prev) =>
          prev.map((item) => (item.id === tempId ? persisted : item))
        );
        return persisted;
      } catch (err) {
        // 3. Revertir si ocurrió un fallo
        setTransactions((prev) => prev.filter((item) => item.id !== tempId));
        const message =
          err instanceof Error
            ? err.message
            : 'Fallo al guardar la transacción';
        setError(message);
        throw err;
      }
    },
    [repository]
  );

  // Eliminar transacción con actualización optimista
  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      const previousList = transactions;
      // 1. Eliminar optimistamente de la UI
      setTransactions((prev) => prev.filter((item) => item.id !== id));

      try {
        const success = await repository.remove(id);
        if (!success) {
          setTransactions(previousList);
          return false;
        }
        return true;
      } catch (err) {
        // Revertir
        setTransactions(previousList);
        setError(
          err instanceof Error ? err.message : 'Error al eliminar transacción'
        );
        return false;
      }
    },
    [repository, transactions]
  );

  // Actualizar presupuesto mensual
  const updateBudget = useCallback(
    async (amount: number): Promise<void> => {
      const prevBudget = budget;
      setBudget(amount);
      try {
        await repository.setBudget(currentMonthKey, amount);
      } catch (err) {
        setBudget(prevBudget);
        setError(
          err instanceof Error ? err.message : 'Error al guardar presupuesto'
        );
      }
    },
    [repository, budget, currentMonthKey]
  );

  // ============================================================================
  // CÁLCULOS DERIVADOS
  // ============================================================================

  // Gastos de hoy
  const todayTotal = useMemo(() => {
    return transactions
      .filter((tx) => tx.date === todayDateStr && tx.type === 'gasto')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [transactions, todayDateStr]);

  // Transacciones del mes actual
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(currentMonthKey));
  }, [transactions, currentMonthKey]);

  // Total gastado en el mes
  const monthExpensesTotal = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === 'gasto')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [monthTransactions]);

  // Total ingresos en el mes
  const monthIncomeTotal = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === 'ingreso')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [monthTransactions]);

  // Balance neto del mes: Ingresos - Gastos
  const netBalance = useMemo(() => {
    return monthIncomeTotal - monthExpensesTotal;
  }, [monthIncomeTotal, monthExpensesTotal]);

  // Presupuesto restante: Presupuesto - Gastos del mes
  const remainingBudget = useMemo(() => {
    if (budget === null || budget === undefined) return null;
    return budget - monthExpensesTotal;
  }, [budget, monthExpensesTotal]);

  // Resumen de gastos por categoría en el mes
  const categorySummaries = useMemo<CategorySummary[]>(() => {
    const expenses = monthTransactions.filter((tx) => tx.type === 'gasto');
    const total = monthExpensesTotal || 1; // Evitar división por 0

    const map = new Map<Category, { total: number; count: number }>();

    for (const cat of CATEGORIES) {
      map.set(cat, { total: 0, count: 0 });
    }

    for (const tx of expenses) {
      const current = map.get(tx.category) || { total: 0, count: 0 };
      map.set(tx.category, {
        total: current.total + Number(tx.amount),
        count: current.count + 1,
      });
    }

    const summaries: CategorySummary[] = [];
    map.forEach((value, cat) => {
      if (value.total > 0) {
        summaries.push({
          category: cat,
          total: value.total,
          count: value.count,
          percentage: Math.round((value.total / total) * 100),
          color: CATEGORY_CONFIG[cat].color,
        });
      }
    });

    // Ordenar de mayor a menor monto
    return summaries.sort((a, b) => b.total - a.total);
  }, [monthTransactions, monthExpensesTotal]);

  // Categoría con mayor consumo del mes
  const topCategory = useMemo(() => {
    if (categorySummaries.length === 0) return null;
    const top = categorySummaries[0];
    return {
      category: top.category,
      amount: top.total,
      percentage: top.percentage,
    };
  }, [categorySummaries]);

  return {
    transactions,
    loading,
    error,
    isDemoMode,
    budget,
    addTransaction,
    deleteTransaction,
    updateBudget,
    // Métricas
    todayTotal,
    monthExpensesTotal,
    monthIncomeTotal,
    netBalance,
    remainingBudget,
    topCategory,
    categorySummaries,
    currentMonthKey,
  };
}
