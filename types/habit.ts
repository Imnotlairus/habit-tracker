export type HabitCategory =
  | 'salud'
  | 'fitness'
  | 'mente'
  | 'productividad'
  | 'nutricion'
  | 'otro';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  color: string;
  target_days_per_week: number;
  created_at?: string;
}

export interface HabitLog {
  id?: string;
  habit_id: string;
  completed_date: string; // Formato YYYY-MM-DD
  created_at?: string;
}

export interface DayMetric {
  date: string; // YYYY-MM-DD
  dayName: string; // Lun, Mar, Mié, etc.
  completedCount: number;
  totalHabits: number;
  percentage: number;
  isToday: boolean;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  weeklyCompletions: number;
  isCompletedToday: boolean;
}

export interface HabitTemplate {
  name: string;
  description: string;
  category: HabitCategory;
  color: string;
  target_days_per_week: number;
  iconName: string;
}
