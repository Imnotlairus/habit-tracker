'use client';

import React, { useSyncExternalStore } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { DayMetric } from '@/types/habit';
import { BarChart3, Calendar } from 'lucide-react';

interface HabitProgressBarChartProps {
  data: DayMetric[];
  weekRangeLabel?: string;
}

// Subscribe helper para detección segura de hidratación en React 19 sin efectos en cascada
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// Función para determinar el color de la barra según el porcentaje
function getBarColor(percentage: number, isToday: boolean) {
  if (percentage === 100) return '#10b981'; // Emerald 500
  if (percentage >= 70) return '#6366f1'; // Indigo 500
  if (percentage >= 40) return '#0284c7'; // Sky 600
  if (percentage > 0) return '#f59e0b'; // Amber 500
  return isToday ? '#94a3b8' : '#cbd5e1'; // Slate
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DayMetric }>;
}

// Componente Tooltip declarado fuera del render para cumplir con buenas prácticas de React 19
const HabitTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const metric: DayMetric = payload[0].payload;
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-3.5 shadow-xl backdrop-blur-md text-xs">
        <div className="flex items-center justify-between gap-4 font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-1.5 mb-2">
          <span>{metric.dayName}</span>
          <span className="text-zinc-500 font-normal">{metric.date}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4 text-zinc-600 dark:text-zinc-400">
            <span>Completados:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {metric.completedCount} de {metric.totalHabits}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-600 dark:text-zinc-400">
            <span>Cumplimiento:</span>
            <span
              className={`font-bold ${
                metric.percentage >= 80
                  ? 'text-emerald-500'
                  : metric.percentage >= 50
                  ? 'text-indigo-500'
                  : 'text-amber-500'
              }`}
            >
              {metric.percentage}%
            </span>
          </div>
          {metric.percentage === 100 && (
            <div className="mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
              🎯 ¡Objetivo completado al 100%!
            </div>
          )}
          {metric.isToday && (
            <div className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
              Hoy
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const HabitProgressBarChart: React.FC<HabitProgressBarChartProps> = ({
  data,
  weekRangeLabel,
}) => {
  const isClient = useIsClient();

  const totalCompletionsThisWeek = data.reduce(
    (sum, d) => sum + d.completedCount,
    0
  );

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      {/* Cabecera del gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Rendimiento Semanal
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Hábitos completados cada día de la semana
            </p>
          </div>
        </div>

        {weekRangeLabel && (
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-3 py-1.5 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>{weekRangeLabel}</span>
          </div>
        )}
      </div>

      {/* Contenedor del Gráfico */}
      <div className="h-64 w-full">
        {!isClient ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400">
            Cargando gráfico...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                className="dark:stroke-zinc-800"
              />
              <XAxis
                dataKey="dayName"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
              />
              <Tooltip
                content={<HabitTooltip />}
                cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
              />
              <Bar
                dataKey="completedCount"
                radius={[6, 6, 2, 2]}
                maxBarSize={48}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.percentage, entry.isToday)}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Leyenda y resumen inferior */}
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            100% Cumplido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            ≥ 70%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            En progreso
          </span>
        </div>
        <div className="font-semibold text-zinc-800 dark:text-zinc-200">
          Total de hábitos completados: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{totalCompletionsThisWeek}</span>
        </div>
      </div>
    </div>
  );
};
