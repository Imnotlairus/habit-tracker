'use client';

import React from 'react';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Trash2,
  Check,
  Sparkles,
  Plus,
} from 'lucide-react';
import { HabitLog, HabitWithStats } from '@/types/habit';
import { WeekDayInfo, CATEGORY_METADATA, isHabitCompletedOnDate } from '@/lib/habitUtils';

interface WeeklyHabitGridProps {
  habits: HabitWithStats[];
  logs: HabitLog[];
  weekDays: WeekDayInfo[];
  weekLabel: string;
  isCurrentWeek: boolean;
  onToggleHabit: (habitId: string, dateStr: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetToCurrentWeek: () => void;
  onOpenAddModal: () => void;
}

export const WeeklyHabitGrid: React.FC<WeeklyHabitGridProps> = ({
  habits,
  logs,
  weekDays,
  weekLabel,
  isCurrentWeek,
  onToggleHabit,
  onDeleteHabit,
  onPrevWeek,
  onNextWeek,
  onResetToCurrentWeek,
  onOpenAddModal,
}) => {
  const handleCheckboxClick = (
    habitId: string,
    dateStr: string,
    alreadyCompleted: boolean
  ) => {
    // Si no estaba completado y lo va a marcar, lanzar confeti
    if (!alreadyCompleted) {
      try {
        confetti({
          particleCount: 40,
          spread: 65,
          origin: { y: 0.75 },
          colors: ['#10b981', '#6366f1', '#06b6d4', '#f59e0b', '#ec4899'],
        });
      } catch {
        // Ignorar si canvas-confetti falla en algún entorno restringido
      }
    }
    onToggleHabit(habitId, dateStr);
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {/* Barra superior de navegación de semana y controles */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Seguimiento Semanal de Hábitos
            </h3>
            {isCurrentWeek && (
              <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                Semana Actual
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Marca cada hábito conforme lo cumplas para mantener vivas tus rachas
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Navegación de semanas */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
            <button
              onClick={onPrevWeek}
              title="Semana anterior"
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-xs transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap">
              {weekLabel}
            </span>
            <button
              onClick={onNextWeek}
              title="Semana siguiente"
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-xs transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isCurrentWeek && (
            <button
              onClick={onResetToCurrentWeek}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Hoy
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl shadow-xs transition transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Nuevo Hábito</span>
          </button>
        </div>
      </div>

      {/* Contenedor de la tabla con scroll horizontal en móviles */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <th className="py-3 px-4 w-72">Hábito / Meta</th>
              {weekDays.map((day) => (
                <th
                  key={day.dateStr}
                  className={`py-3 px-2 text-center transition-colors ${
                    day.isToday
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold'
                      : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="uppercase text-[11px] tracking-wider">
                      {day.dayName}
                    </span>
                    <span
                      className={`text-sm mt-0.5 w-6 h-6 flex items-center justify-center rounded-full ${
                        day.isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                </th>
              ))}
              <th className="py-3 px-3 text-center w-24">Racha</th>
              <th className="py-3 px-3 text-center w-28">Semana</th>
              <th className="py-3 px-2 text-center w-12"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
            {habits.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="py-12 text-center text-zinc-400 dark:text-zinc-500"
                >
                  <p className="font-medium text-sm">No tienes hábitos registrados aún.</p>
                  <button
                    onClick={onOpenAddModal}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear tu primer hábito saludable
                  </button>
                </td>
              </tr>
            ) : (
              habits.map((habit) => {
                const categoryInfo =
                  CATEGORY_METADATA[habit.category] || CATEGORY_METADATA.otro;

                return (
                  <tr
                    key={habit.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                    {/* Columna Nombre del hábito */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <span
                          className="w-3 h-3 rounded-full mt-1.5 shrink-0 shadow-xs"
                          style={{ backgroundColor: habit.color || '#6366f1' }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {habit.name}
                          </div>
                          {habit.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                              {habit.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${categoryInfo.bgClass} ${categoryInfo.textClass}`}
                            >
                              {categoryInfo.label}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Objetivo: {habit.target_days_per_week} días/sem
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Columnas de los 7 días */}
                    {weekDays.map((day) => {
                      const completed = isHabitCompletedOnDate(
                        habit.id,
                        day.dateStr,
                        logs
                      );

                      return (
                        <td
                          key={day.dateStr}
                          className={`py-3.5 px-2 text-center transition-colors ${
                            day.isToday
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                              : ''
                          }`}
                        >
                          <button
                            onClick={() =>
                              handleCheckboxClick(habit.id, day.dateStr, completed)
                            }
                            title={`${habit.name} - ${day.fullDateLabel} (${
                              completed ? 'Completado' : 'Pendiente'
                            })`}
                            className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 transform active:scale-90 ${
                              completed
                                ? 'shadow-xs text-white'
                                : 'border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:border-indigo-400 text-transparent'
                            }`}
                            style={{
                              backgroundColor: completed
                                ? habit.color || '#10b981'
                                : undefined,
                              borderColor: completed
                                ? habit.color || '#10b981'
                                : undefined,
                            }}
                          >
                            <Check
                              className={`w-4 h-4 stroke-[3] transition-transform ${
                                completed ? 'scale-100' : 'scale-0'
                              }`}
                            />
                          </button>
                        </td>
                      );
                    })}

                    {/* Columna Racha actual */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{habit.currentStreak}d</span>
                      </div>
                    </td>

                    {/* Columna Cumplimiento de semana */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {habit.weeklyCompletions} / {habit.target_days_per_week}
                        </span>
                        <div className="w-16 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (habit.weeklyCompletions / habit.target_days_per_week) * 100,
                                100
                              )}%`,
                              backgroundColor: habit.color || '#6366f1',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Columna Eliminar */}
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `¿Eliminar el hábito "${habit.name}" y todos sus registros?`
                            )
                          ) {
                            onDeleteHabit(habit.id);
                          }
                        }}
                        title="Eliminar hábito"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition opacity-60 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
