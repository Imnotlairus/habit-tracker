'use client';

import React from 'react';
import {
  CalendarDays,
  Wallet,
  PiggyBank,
  TrendingDown,
  Settings,
  PlusCircle,
  Award,
} from 'lucide-react';
import { formatCOP, Category } from '@/types/finance';

interface FinanceStatsCardsProps {
  loading: boolean;
  todayTotal: number;
  monthExpensesTotal: number;
  budget: number | null;
  remainingBudget: number | null;
  netBalance: number;
  topCategory: { category: Category; amount: number; percentage: number } | null;
  onOpenBudgetModal: () => void;
}

export const FinanceStatsCards: React.FC<FinanceStatsCardsProps> = ({
  loading,
  todayTotal,
  monthExpensesTotal,
  budget,
  remainingBudget,
  netBalance,
  topCategory,
  onOpenBudgetModal,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/60 dark:bg-zinc-900/60 p-5 animate-pulse"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            </div>
            <div className="h-7 w-36 bg-zinc-300 dark:bg-zinc-700 rounded-lg mb-2" />
            <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  // Porcentaje del presupuesto consumido
  const budgetConsumedPercentage =
    budget && budget > 0
      ? Math.min(Math.round((monthExpensesTotal / budget) * 100), 100)
      : 0;

  const isOverBudget = remainingBudget !== null && remainingBudget < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Gastado Hoy */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-white/80 dark:bg-zinc-900/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
            Gastado Hoy
          </span>
          <div className="p-2.5 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatCOP(todayTotal)}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {todayTotal === 0 ? 'Sin gastos registrados hoy' : 'Consumo del día actual'}
          </p>
        </div>
      </div>

      {/* 2. Gastado en el Mes */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-white/80 dark:bg-zinc-900/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
            Gastado en el Mes
          </span>
          <div className="p-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatCOP(monthExpensesTotal)}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Total de egresos acumulados
          </p>
        </div>
      </div>

      {/* 3. Presupuesto Restante o Balance Neto */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
          budget !== null
            ? isOverBudget
              ? 'border-rose-500/40 bg-rose-500/5'
              : 'border-emerald-500/20 bg-white/80 dark:bg-zinc-900/80'
            : 'border-indigo-500/20 bg-white/80 dark:bg-zinc-900/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
            {budget !== null ? 'Presupuesto Restante' : 'Balance Neto del Mes'}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenBudgetModal}
              title={budget !== null ? 'Ajustar Presupuesto' : 'Definir Presupuesto'}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition"
            >
              {budget !== null ? (
                <Settings className="w-4 h-4" />
              ) : (
                <PlusCircle className="w-4 h-4 text-indigo-500" />
              )}
            </button>
            <div
              className={`p-2.5 rounded-xl ${
                budget !== null
                  ? isOverBudget
                    ? 'bg-rose-500/10 text-rose-600'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {budget !== null ? (
                <PiggyBank className="w-5 h-5" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          {budget !== null && remainingBudget !== null ? (
            <>
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isOverBudget
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {formatCOP(remainingBudget)}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <span>de {formatCOP(budget)}</span>
                <span className={isOverBudget ? 'text-rose-600 font-bold' : ''}>
                  {budgetConsumedPercentage}% usado
                </span>
              </div>
              <div className="mt-2 w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isOverBudget
                      ? 'bg-rose-500'
                      : budgetConsumedPercentage > 85
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${budgetConsumedPercentage}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  netBalance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCOP(netBalance)}
              </div>
              <button
                onClick={onOpenBudgetModal}
                className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Definir presupuesto mensual
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4. Categoría con Mayor Consumo del Mes */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-white/80 dark:bg-zinc-900/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
            Categoría Mayor Consumo
          </span>
          <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {topCategory ? (
            <>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                {topCategory.category}
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {formatCOP(topCategory.amount)} ({topCategory.percentage}% del total)
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight text-zinc-400 dark:text-zinc-500">
                Sin consumos
              </div>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                No hay gastos en este mes
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
