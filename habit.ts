export interface Habit {
    id: string;
    name: string;
    description?: string;
    category: 'salud' | 'fitness' | 'mente' | 'productividad' | 'sueno';
    color: string;
    target_days_per_week: number;
    created_at?: string;
}

export interface HabitLog {
    id?: string;
    habit_id: string;
    completed_date: string; // YYYY-MM-DD
}

export interface DayMetric {
    date: string;       // YYYY-MM-DD
    dayName: string;    // Lun, Mar, etc.
    completed: number;
    total: number;
    percentage: number;
}
