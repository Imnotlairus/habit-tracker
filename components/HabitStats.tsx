'use client';

import React from 'react';
import { CheckCircle2, Flame, TrendingUp, Target } from 'lucide-react';
import { HabitWithStats } from '@/types/habit';

interface HabitStatsProps {
  habitsWithStats: HabitWithStats[];
  todayCompletedCount: number;
  totalHabitsCount: number;
}

export const HabitStats: React.FC<HabitStatsProps> = ({
  habitsWithStats,
  todayCompletedCount,
  totalHabitsCount,
}) => {
  // Cálculo de % de éxito de hoy
  const completionRate =
    totalHabitsCount > 0
      ? Math.round((todayCompletedCount / totalHabitsCount) * 100)
      : 0;

  // Mayor racha activa entre los hábitos
  const maxStreak = habitsWithStats.reduce(
    (max, habit) => Math.max(max, habit.currentStreak),
    0
  );

  // Racha total acumulada
  const activeHabitsWithStreak = habitsWithStats.filter(
    (h) => h.currentStreak > 0
  ).length;

  const stats = [
    {
      id: 'completed-today',
      title: 'Completados Hoy',
      value: `${todayCompletedCount} / ${totalHabitsCount}`,
      subtitle:
        todayCompletedCount === totalHabitsCount && totalHabitsCount > 0
          ? '¡Todos completados! 🎉'
          : `${totalHabitsCount - todayCompletedCount} restantes`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      borderColor: 'border-emerald-500/20',
      progress: completionRate,
      progressColor: 'bg-emerald-500',
    },
    {
      id: 'active-streak',
      title: 'Racha Activa Máxima',
      value: `${maxStreak} ${maxStreak === 1 ? 'día' : 'días'}`,
      subtitle: `${activeHabitsWithStreak} hábitos con racha viva`,
      icon: Flame,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
      borderColor: 'border-amber-500/20',
      progress: Math.min((maxStreak / 21) * 100, 100), // meta de 21 días para fijar hábito
      progressColor: 'bg-amber-500',
    },
    {
      id: 'success-rate',
      title: '% Éxito de Hoy',
      value: `${completionRate}%`,
      subtitle: completionRate >= 80 ? 'Rendimiento excelente' : 'Mantén el enfoque',
      icon: TrendingUp,
      iconColor: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      borderColor: 'border-indigo-500/20',
      progress: completionRate,
      progressColor: 'bg-indigo-500',
    },
    {
      id: 'total-habits',
      title: 'Hábitos Activos',
      value: `${totalHabitsCount}`,
      subtitle: 'En tu plan de transformación',
      icon: Target,
      iconColor: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/15',
      borderColor: 'border-cyan-500/20',
      progress: Math.min((totalHabitsCount / 7) * 100, 100),
      progressColor: 'bg-cyan-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${stat.borderColor} bg-white/80 dark:bg-zinc-900/80 shadow-sm`}
          >
            {/* Cabecera de la tarjeta */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
                {stat.title}
              </span>
              <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                <IconComponent className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>

            {/* Valor principal */}
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {stat.subtitle}
              </p>
            </div>

            {/* Barra de progreso sutil */}
            <div className="mt-4 w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${stat.progressColor}`}
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
