import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Habit, HabitLog, DayMetric, HabitWithStats } from '@/types/habit';

export interface WeekDayInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayName: string; // 'Lun', 'Mar', etc.
  dayNumber: string; // '14'
  fullDateLabel: string; // 'Miércoles, 14 de Octubre'
  isToday: boolean;
}

/**
 * Obtiene los 7 días de la semana (Lunes a Domingo) para una fecha dada.
 */
export function getWeekDays(referenceDate: Date = new Date()): WeekDayInfo[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 }); // 1 = Lunes
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });

  const intervalDays = eachDayOfInterval({ start, end });

  return intervalDays.map((day) => {
    const rawDay = format(day, 'EEE', { locale: es });
    // Capitalizar primera letra: 'lun' -> 'Lun'
    const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1).replace('.', '');
    
    return {
      date: day,
      dateStr: format(day, 'yyyy-MM-dd'),
      dayName,
      dayNumber: format(day, 'd'),
      fullDateLabel: format(day, "EEEE, d 'de' MMMM", { locale: es }),
      isToday: isToday(day),
    };
  });
}

/**
 * Verifica si un hábito específico fue completado en una fecha determinada (YYYY-MM-DD).
 */
export function isHabitCompletedOnDate(
  habitId: string,
  dateStr: string,
  logs: HabitLog[]
): boolean {
  return logs.some(
    (log) => log.habit_id === habitId && log.completed_date === dateStr
  );
}

/**
 * Calcula la racha activa (días consecutivos) de un hábito.
 * Si hoy no está completado, pero ayer sí, la racha sigue viva (puede completarse hoy).
 */
export function calculateHabitStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = new Set(
    logs.filter((l) => l.habit_id === habitId).map((l) => l.completed_date)
  );

  if (habitLogs.size === 0) return 0;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  let currentCheck = new Date();
  let streak = 0;

  // Comprobar si hoy está completado
  if (habitLogs.has(todayStr)) {
    streak++;
    currentCheck = subDays(currentCheck, 1);
  } else if (habitLogs.has(yesterdayStr)) {
    // Si hoy aún no se ha marcado, pero ayer sí, empezamos a contar desde ayer
    currentCheck = subDays(currentCheck, 1);
  } else {
    // Ni hoy ni ayer se completó, la racha es 0
    return 0;
  }

  // Contar días consecutivos hacia atrás
  while (true) {
    const dateStr = format(currentCheck, 'yyyy-MM-dd');
    if (habitLogs.has(dateStr)) {
      if (dateStr !== todayStr) {
        streak++;
      }
      currentCheck = subDays(currentCheck, 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calcula métricas de cumplimiento para un día específico.
 */
export function calculateDayMetrics(
  habits: Habit[],
  logs: HabitLog[],
  dateStr: string
): { completed: number; total: number; percentage: number } {
  if (habits.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const completed = habits.filter((habit) =>
    isHabitCompletedOnDate(habit.id, dateStr, logs)
  ).length;

  const percentage = Math.round((completed / habits.length) * 100);

  return {
    completed,
    total: habits.length,
    percentage,
  };
}

/**
 * Prepara los datos para el gráfico de barras interactivo de Recharts.
 */
export function formatWeeklyChartData(
  habits: Habit[],
  logs: HabitLog[],
  weekDays: WeekDayInfo[]
): DayMetric[] {
  return weekDays.map((day) => {
    const { completed, total, percentage } = calculateDayMetrics(
      habits,
      logs,
      day.dateStr
    );

    return {
      date: day.dateStr,
      dayName: day.dayName,
      completedCount: completed,
      totalHabits: total,
      percentage,
      isToday: day.isToday,
    };
  });
}

/**
 * Enriquece los hábitos con sus estadísticas actuales (racha, completitud hoy, etc.).
 */
export function enrichHabitsWithStats(
  habits: Habit[],
  logs: HabitLog[],
  weekDays: WeekDayInfo[]
): HabitWithStats[] {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return habits.map((habit) => {
    const currentStreak = calculateHabitStreak(habit.id, logs);
    const isCompletedToday = isHabitCompletedOnDate(habit.id, todayStr, logs);

    // Conteo de completados en la semana actual visible
    const weeklyCompletions = weekDays.filter((day) =>
      isHabitCompletedOnDate(habit.id, day.dateStr, logs)
    ).length;

    return {
      ...habit,
      currentStreak,
      weeklyCompletions,
      isCompletedToday,
    };
  });
}

/**
 * Metadatos para categorías (colores de etiqueta, nombres en español)
 */
export const CATEGORY_METADATA: Record<
  string,
  { label: string; bgClass: string; textClass: string; dotColor: string }
> = {
  salud: {
    label: 'Salud',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    dotColor: '#10b981',
  },
  fitness: {
    label: 'Fitness',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/20',
    textClass: 'text-rose-700 dark:text-rose-400',
    dotColor: '#f43f5e',
  },
  mente: {
    label: 'Mente & Calma',
    bgClass: 'bg-violet-500/10 dark:bg-violet-500/20',
    textClass: 'text-violet-700 dark:text-violet-400',
    dotColor: '#8b5cf6',
  },
  productividad: {
    label: 'Productividad',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
    textClass: 'text-amber-700 dark:text-amber-400',
    dotColor: '#f59e0b',
  },
  nutricion: {
    label: 'Nutrición',
    bgClass: 'bg-sky-500/10 dark:bg-sky-500/20',
    textClass: 'text-sky-700 dark:text-sky-400',
    dotColor: '#0ea5e9',
  },
  otro: {
    label: 'General',
    bgClass: 'bg-slate-500/10 dark:bg-slate-500/20',
    textClass: 'text-slate-700 dark:text-slate-400',
    dotColor: '#64748b',
  },
};
