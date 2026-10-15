'use client';

import React, { useState, useMemo } from 'react';
import {
  Transaction,
  Category,
  CATEGORIES,
  CATEGORY_CONFIG,
  formatCOP,
} from '@/types/finance';
import {
  Utensils,
  Car,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  AlertTriangle,
  Trash2,
  Filter,
  Calendar,
  History,
  Inbox,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => Promise<unknown>;
  onOpenAddModal: () => void;
}

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  Alimentación: Utensils,
  Transporte: Car,
  'Servicios/Hogar': Home,
  'Ocio/Salidas': Film,
  Salud: HeartPulse,
  Educación: GraduationCap,
  Imprevistos: AlertTriangle,
};

function formatGroupDateHeader(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    if (isToday(dateObj)) {
      return `Hoy — ${format(dateObj, "EEEE, d 'de' MMMM", { locale: es })}`;
    }
    if (isYesterday(dateObj)) {
      return `Ayer — ${format(dateObj, "EEEE, d 'de' MMMM", { locale: es })}`;
    }
    return format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onDeleteTransaction,
  onOpenAddModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Meses disponibles a partir de las transacciones existentes
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthSet.add(tx.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [transactions]);

  // Transacciones filtradas
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesCategory =
        selectedCategory === 'all' || tx.category === selectedCategory;
      const matchesMonth =
        selectedMonth === 'all' || tx.date.startsWith(selectedMonth);
      return matchesCategory && matchesMonth;
    });
  }, [transactions, selectedCategory, selectedMonth]);

  // Transacciones agrupadas cronológicamente por día
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; items: Transaction[]; dayTotal: number }[] = [];
    const dateMap = new Map<string, Transaction[]>();

    // Ordenar de más reciente a más antiguo
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const tx of sorted) {
      const list = dateMap.get(tx.date) || [];
      list.push(tx);
      dateMap.set(tx.date, list);
    }

    dateMap.forEach((items, date) => {
      // Sumar solo gastos para el indicador del día
      const dayTotal = items
        .filter((tx) => tx.type === 'gasto')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      groups.push({ date, items, dayTotal });
    });

    return groups;
  }, [filteredTransactions]);

  const handleDelete = async (id: string, description?: string) => {
    const text = description ? `"${description}"` : 'esta transacción';
    if (confirm(`¿Estás seguro de eliminar ${text}?`)) {
      await onDeleteTransaction(id);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {/* Barra de Filtros y Encabezado */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Historial de Movimientos
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Registro diario cronológico de gastos e ingresos
              </p>
            </div>
          </div>

          {/* Selector de Mes */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
              >
                <option value="all">Todos los meses</option>
                {availableMonths.map((m) => {
                  const [y, mon] = m.split('-').map(Number);
                  const date = new Date(y, mon - 1, 1);
                  const label = format(date, "MMMM 'de' yyyy", { locale: es });
                  return (
                    <option key={m} value={m}>
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Píldoras de Filtro por Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          <span className="text-xs font-semibold text-zinc-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Agrupada por Día */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {groupedTransactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              No se encontraron transacciones
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1">
              No hay movimientos que coincidan con los filtros aplicados.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Registrar nuevo movimiento (+)
            </button>
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.date} className="p-4 sm:p-5">
              {/* Encabezado del Grupo de Fecha */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  {formatGroupDateHeader(group.date)}
                </span>
                {group.dayTotal > 0 && (
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Total gastado: <span className="font-bold text-rose-600 dark:text-rose-400">{formatCOP(group.dayTotal)}</span>
                  </span>
                )}
              </div>

              {/* Items del día */}
              <div className="space-y-2.5">
                {group.items.map((tx) => {
                  const IconComponent = CATEGORY_ICONS[tx.category] || AlertTriangle;
                  const config = CATEGORY_CONFIG[tx.category];
                  const isExpense = tx.type === 'gasto';

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition-colors group"
                    >
                      {/* Lado izquierdo: Icono y detalles */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="p-2.5 rounded-xl text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: config.color }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {tx.category}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                              {tx.payment_method}
                            </span>
                          </div>
                          {tx.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lado derecho: Monto y Eliminar */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-black text-xs sm:text-sm ${
                            isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatCOP(tx.amount)}
                        </span>

                        <button
                          onClick={() => handleDelete(tx.id, tx.description)}
                          title="Eliminar movimiento"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition opacity-70 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
