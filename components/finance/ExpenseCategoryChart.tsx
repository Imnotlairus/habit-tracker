'use client';

import React, { useSyncExternalStore } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { CategorySummary, formatCOP } from '@/types/finance';
import { PieChart as PieChartIcon, ShoppingBag } from 'lucide-react';

interface ExpenseCategoryChartProps {
  data: CategorySummary[];
  totalExpenses: number;
}

const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CategorySummary }>;
}

const CategoryPieTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item: CategorySummary = payload[0].payload;
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-3 shadow-xl backdrop-blur-md text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {item.category}
          </span>
        </div>
        <div className="text-zinc-600 dark:text-zinc-400 space-y-0.5">
          <div>
            Total: <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatCOP(item.total)}</span>
          </div>
          <div>
            Participación: <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.percentage}%</span>
          </div>
          <div className="text-[10px] text-zinc-400">
            {item.count} {item.count === 1 ? 'registro' : 'registros'}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({
  data,
  totalExpenses,
}) => {
  const isClient = useIsClient();

  if (data.length === 0 || totalExpenses === 0) {
    return (
      <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mb-3">
          <ShoppingBag className="w-8 h-8 stroke-1" />
        </div>
        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          Sin gastos registrados este mes
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1">
          Registra tus gastos diarios para ver la distribución y porcentajes por categoría.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      {/* Cabecera del gráfico */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Distribución por Categorías
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Porcentaje de gastos acumulados del mes
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
            Total Egresos
          </span>
          <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
            {formatCOP(totalExpenses)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
        {/* Gráfico Donut de Recharts */}
        <div className="h-60 w-full relative flex items-center justify-center">
          {!isClient ? (
            <div className="text-xs text-zinc-400">Cargando gráfico...</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CategoryPieTooltip />} />
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="transparent"
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Centro de la dona */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                  Categorías
                </span>
                <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  {data.length}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Leyenda interactiva personalizada */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {data.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-md shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                  {formatCOP(item.total)}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                  }}
                >
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
