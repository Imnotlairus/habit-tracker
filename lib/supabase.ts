import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Habit, HabitLog } from '@/types/habit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Determinar si Supabase está correctamente configurado
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('tu-proyecto')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// Claves y almacenamiento local (Fallback/Demo)
// ==========================================
const STORAGE_KEYS = {
  HABITS: 'habitpulse_habits',
  LOGS: 'habitpulse_logs',
};

// Hábitos iniciales saludables para modo demo/offline
export const DEFAULT_INITIAL_HABITS: Habit[] = [
  {
    id: 'demo-habit-1',
    name: 'Beber 2 Litros de Agua',
    description: 'Mantenerse hidratado durante todo el día (8 vasos)',
    category: 'salud',
    color: '#0284c7', // Sky blue
    target_days_per_week: 7,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-habit-2',
    name: 'Ejercicio o Caminata 30 min',
    description: 'Actividad cardiovascular o entrenamiento funcional',
    category: 'fitness',
    color: '#10b981', // Emerald green
    target_days_per_week: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-habit-3',
    name: 'Meditación o Respiración Consciente',
    description: '10 minutos de calma mental al despertar o antes de dormir',
    category: 'mente',
    color: '#8b5cf6', // Violet
    target_days_per_week: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-habit-4',
    name: 'Lectura enriquecedora 20 min',
    description: 'Aprender algo nuevo de un libro de no-ficción o desarrollo',
    category: 'productividad',
    color: '#f59e0b', // Amber
    target_days_per_week: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-habit-5',
    name: 'Dormir 7 a 8 horas',
    description: 'Higiene del sueño: descansar y desconectar pantallas',
    category: 'salud',
    color: '#6366f1', // Indigo
    target_days_per_week: 7,
    created_at: new Date().toISOString(),
  },
];

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getLocalHabits(): Habit[] {
  if (!isBrowser()) return DEFAULT_INITIAL_HABITS;
  const stored = localStorage.getItem(STORAGE_KEYS.HABITS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_INITIAL_HABITS));
    return DEFAULT_INITIAL_HABITS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error al parsear hábitos locales', e);
    return DEFAULT_INITIAL_HABITS;
  }
}

function saveLocalHabits(habits: Habit[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
}

function getLocalLogs(): HabitLog[] {
  if (!isBrowser()) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (!stored) {
    // Generar algunos logs de muestra para los últimos 3 días para enriquecer la demo
    const sampleLogs: HabitLog[] = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      sampleLogs.push({
        id: `demo-log-${i}-1`,
        habit_id: 'demo-habit-1',
        completed_date: dateStr,
      });
      if (i % 2 === 0) {
        sampleLogs.push({
          id: `demo-log-${i}-2`,
          habit_id: 'demo-habit-2',
          completed_date: dateStr,
        });
      }
      if (i < 2) {
        sampleLogs.push({
          id: `demo-log-${i}-3`,
          habit_id: 'demo-habit-3',
          completed_date: dateStr,
        });
      }
    }
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(sampleLogs));
    return sampleLogs;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error al parsear logs locales', e);
    return [];
  }
}

function saveLocalLogs(logs: HabitLog[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

// ==========================================
// API Unificada con Fallback Elegante
// ==========================================
export const habitService = {
  isOfflineMode: !isSupabaseConfigured,

  async getHabits(): Promise<Habit[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as Habit[];
        }
      } catch (err) {
        console.warn('Supabase no disponible, usando LocalStorage fallback:', err);
      }
    }
    return getLocalHabits();
  },

  async createHabit(habitData: Omit<Habit, 'id'>): Promise<Habit> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `h-${Date.now()}`;
    const newHabit: Habit = {
      ...habitData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('habits')
          .insert([newHabit])
          .select()
          .single();

        if (!error && data) {
          return data as Habit;
        }
      } catch (err) {
        console.warn('Fallo guardado en Supabase, guardando localmente:', err);
      }
    }

    const current = getLocalHabits();
    const updated = [...current, newHabit];
    saveLocalHabits(updated);
    return newHabit;
  },

  async deleteHabit(habitId: string): Promise<boolean> {
    if (supabase) {
      try {
        await supabase.from('habit_logs').delete().eq('habit_id', habitId);
        const { error } = await supabase.from('habits').delete().eq('id', habitId);
        if (!error) return true;
      } catch (err) {
        console.warn('Error al borrar en Supabase, borrando local:', err);
      }
    }

    const currentHabits = getLocalHabits();
    saveLocalHabits(currentHabits.filter((h) => h.id !== habitId));

    const currentLogs = getLocalLogs();
    saveLocalLogs(currentLogs.filter((l) => l.habit_id !== habitId));
    return true;
  },

  async getHabitLogs(): Promise<HabitLog[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('habit_logs').select('*');
        if (!error && data) {
          return data as HabitLog[];
        }
      } catch (err) {
        console.warn('Error al consultar logs en Supabase, fallback a local:', err);
      }
    }
    return getLocalLogs();
  },

  async toggleHabitLog(habitId: string, dateStr: string): Promise<boolean> {
    const currentLogs = getLocalLogs();
    const existingIndex = currentLogs.findIndex(
      (l) => l.habit_id === habitId && l.completed_date === dateStr
    );
    const isNowCompleted = existingIndex === -1;

    if (supabase) {
      try {
        if (!isNowCompleted) {
          await supabase
            .from('habit_logs')
            .delete()
            .match({ habit_id: habitId, completed_date: dateStr });
        } else {
          await supabase.from('habit_logs').insert([
            {
              habit_id: habitId,
              completed_date: dateStr,
            },
          ]);
        }
      } catch (err) {
        console.warn('Error al alternar log en Supabase, usando local:', err);
      }
    }

    let updatedLogs: HabitLog[];
    if (isNowCompleted) {
      const newLog: HabitLog = {
        id: `log-${Date.now()}`,
        habit_id: habitId,
        completed_date: dateStr,
        created_at: new Date().toISOString(),
      };
      updatedLogs = [...currentLogs, newLog];
    } else {
      updatedLogs = currentLogs.filter(
        (l) => !(l.habit_id === habitId && l.completed_date === dateStr)
      );
    }
    saveLocalLogs(updatedLogs);

    return isNowCompleted;
  },
};
