'use client';

import React, { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { FinanceStatsCards } from '@/components/finance/FinanceStatsCards';
import { ExpenseCategoryChart } from '@/components/finance/ExpenseCategoryChart';
import { TransactionHistory } from '@/components/finance/TransactionHistory';
import { AddTransactionModal } from '@/components/finance/AddTransactionModal';
import {
  Wallet,
  Plus,
  CloudOff,
  Database,
  Sparkles,
  PiggyBank,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { formatCOP } from '@/types/finance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FinancePanelProps {
  headerNav?: React.ReactNode;
}

export const FinancePanel: React.FC<FinancePanelProps> = ({ headerNav }) => {
  const {
    transactions,
    loading,
    error,
    isDemoMode,
    budget,
    addTransaction,
    deleteTransaction,
    updateBudget,
    todayTotal,
    monthExpensesTotal,
    netBalance,
    remainingBudget,
    topCategory,
    categorySummaries,
    currentMonthKey,
  } = useTransactions();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetInputStr, setBudgetInputStr] = useState('');
  const [budgetError, setBudgetError] = useState('');

  const currentMonthLabel = (() => {
    const [year, month] = currentMonthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const raw = format(date, "MMMM 'de' yyyy", { locale: es });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  const handleOpenBudgetModal = () => {
    setBudgetInputStr(budget ? String(budget) : '');
    setBudgetError('');
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = parseFloat(budgetInputStr.replace(/[^0-9.]/g, ''));
    if (isNaN(clean) || clean < 0) {
      setBudgetError('Por favor ingresa un presupuesto válido (ej. 1500000).');
      return;
    }
    await updateBudget(clean);
    setIsBudgetModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
      {/* Top Header unificado */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo y Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight bg-linear-to-r from-zinc-900 via-emerald-900 to-emerald-600 dark:from-white dark:via-zinc-200 dark:to-emerald-400 bg-clip-text text-transparent">
                  HabitPulse
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Finanzas
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block -mt-0.5">
                Control de Finanzas y Gastos Diarios
              </span>
            </div>
          </div>

          {/* Navegación por pestañas inyectada */}
          {headerNav && <div className="hidden md:flex">{headerNav}</div>}

          {/* Acciones del encabezado derecho */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Badge de Almacenamiento */}
            <div
              title={
                isDemoMode
                  ? 'Modo Local (Demo) — Los registros se guardan en tu navegador'
                  : 'Sincronizado con Supabase'
              }
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                !isDemoMode
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              {!isDemoMode ? (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Supabase Conectado</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modo Local (Demo)</span>
                </>
              )}
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Gasto (+)</span>
            </button>
          </div>
        </div>

        {/* Pestañas en móvil si existen */}
        {headerNav && (
          <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800 p-2 flex justify-center">
            {headerNav}
          </div>
        )}
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Aviso visible de Modo Demo */}
        {isDemoMode && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              <strong>Modo Local Activo:</strong> Las transacciones se guardan localmente en tu navegador. Para sincronizarlas en la nube, añade tus credenciales en el archivo <code className="font-mono px-1 py-0.5 bg-amber-500/20 rounded">.env.local</code>.
            </span>
          </div>
        )}

        {/* Mensaje de error general si ocurre */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Hero & Motivational Banner Financiero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-linear-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-xs mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentMonthLabel}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Controla tus finanzas, conquista tu libertad.
            </h1>
            <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
              Cada gasto registrado con claridad es una decisión consciente para alcanzar tus metas financieras y personales.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center gap-3 self-start md:self-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center min-w-[130px]">
              <div className="text-xl font-black text-emerald-300">
                {formatCOP(monthExpensesTotal)}
              </div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-100">
                Gastos del Mes
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs px-4 py-3.5 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Registrar Gasto (+)</span>
            </button>
          </div>

          {/* Decoración de fondo */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-teal-500/30 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* 1. Tarjetas de Estadísticas Financieras */}
        <section>
          <FinanceStatsCards
            loading={loading}
            todayTotal={todayTotal}
            monthExpensesTotal={monthExpensesTotal}
            budget={budget}
            remainingBudget={remainingBudget}
            netBalance={netBalance}
            topCategory={topCategory}
            onOpenBudgetModal={handleOpenBudgetModal}
          />
        </section>

        {/* 2. Sección Gráfico de Categorías + Historial de Transacciones */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <ExpenseCategoryChart
              data={categorySummaries}
              totalExpenses={monthExpensesTotal}
            />
          </div>
          <div className="lg:col-span-2">
            <TransactionHistory
              transactions={transactions}
              onDeleteTransaction={deleteTransaction}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          </div>
        </section>

        {/* Modal de Registro de Transacción */}
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddTransaction={addTransaction}
        />

        {/* Modal de Configuración de Presupuesto Mensual */}
        {isBudgetModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Definir Presupuesto Mensual"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          >
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Presupuesto para {currentMonthLabel}
                  </h3>
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                {budgetError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-semibold">
                    {budgetError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Límite Mensual de Gastos (COP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="Ej: 1500000"
                      value={budgetInputStr}
                      onChange={(e) => {
                        setBudgetInputStr(e.target.value.replace(/[^0-9]/g, ''));
                        if (budgetError) setBudgetError('');
                      }}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Este valor servirá para calcular tu &quot;Presupuesto Restante&quot; y alertarte cuando te acerques al límite.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBudgetModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Presupuesto</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 mt-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xs text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              HabitPulse Finanzas
            </span>
            <span>— Control inteligente de gastos y bienestar integral</span>
          </div>
          <div>
            Desarrollado con Next.js 14+, Tailwind CSS, Supabase & Recharts
          </div>
        </div>
      </footer>
    </div>
  );
};
