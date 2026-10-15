'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  Plus,
  Sparkles,
  Database,
  CloudOff,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { addWeeks, subWeeks, isSameWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Habit, HabitLog } from '@/types/habit';
import { habitService, isSupabaseConfigured } from '@/lib/supabase';
import {
  getWeekDays,
  formatWeeklyChartData,
  enrichHabitsWithStats,
  isHabitCompletedOnDate,
  WeekDayInfo,
} from '@/lib/habitUtils';

import { HabitStats } from '@/components/HabitStats';
import { HabitProgressBarChart } from '@/components/HabitProgressBarChart';
import { WeeklyHabitGrid } from '@/components/WeeklyHabitGrid';
import { AddHabitModal } from '@/components/AddHabitModal';

interface HabitTrackerDashboardProps {
  headerNav?: React.ReactNode;
}

export default function HabitTrackerDashboard({
  headerNav,
}: HabitTrackerDashboardProps = {}) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(() => new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Carga de datos desde Supabase / LocalStorage
  const loadData = useCallback(async () => {
    try {
      const [fetchedHabits, fetchedLogs] = await Promise.all([
        habitService.getHabits(),
        habitService.getHabitLogs(),
      ]);
      setHabits(fetchedHabits);
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    habitService.getHabits().then((fetchedHabits) => {
      if (!ignore) setHabits(fetchedHabits);
    });
    habitService.getHabitLogs().then((fetchedLogs) => {
      if (!ignore) {
        setLogs(fetchedLogs);
        setIsLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Filtrado de hábitos por categoría
  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'all') return habits;
    return habits.filter((h) => h.category === selectedCategory);
  }, [habits, selectedCategory]);

  // Días de la semana seleccionada (Lunes a Domingo)
  const weekDays = useMemo<WeekDayInfo[]>(() => {
    return getWeekDays(selectedWeekDate);
  }, [selectedWeekDate]);

  // Etiqueta de rango de la semana actual
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = weekDays[0].date;
    const last = weekDays[6].date;
    return `${format(first, "d 'de' MMM", { locale: es })} - ${format(
      last,
      "d 'de' MMM, yyyy",
      { locale: es }
    )}`;
  }, [weekDays]);

  const isCurrentWeek = useMemo(() => {
    return isSameWeek(selectedWeekDate, new Date(), { weekStartsOn: 1 });
  }, [selectedWeekDate]);

  // Hábitos con estadísticas enriquecidas
  const habitsWithStats = useMemo(() => {
    return enrichHabitsWithStats(filteredHabits, logs, weekDays);
  }, [filteredHabits, logs, weekDays]);

  // Datos para el gráfico de barras
  const chartData = useMemo(() => {
    return formatWeeklyChartData(filteredHabits, logs, weekDays);
  }, [filteredHabits, logs, weekDays]);

  // Cantidad de completados en el día de hoy
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const todayCompletedCount = useMemo(() => {
    return habits.filter((h) => isHabitCompletedOnDate(h.id, todayStr, logs)).length;
  }, [habits, logs, todayStr]);

  // Saludo según la hora
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 19) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  }, []);

  // Handlers
  const handleToggleHabit = async (habitId: string, dateStr: string) => {
    const existingIndex = logs.findIndex(
      (l) => l.habit_id === habitId && l.completed_date === dateStr
    );

    let updatedLogs: HabitLog[];
    if (existingIndex > -1) {
      updatedLogs = logs.filter(
        (l) => !(l.habit_id === habitId && l.completed_date === dateStr)
      );
    } else {
      updatedLogs = [
        ...logs,
        {
          id: `tmp-${Date.now()}`,
          habit_id: habitId,
          completed_date: dateStr,
        },
      ];
    }
    setLogs(updatedLogs);

    await habitService.toggleHabitLog(habitId, dateStr);
  };

  const handleAddHabit = async (habitData: Omit<Habit, 'id'>) => {
    const created = await habitService.createHabit(habitData);
    setHabits((prev) => [...prev, created]);
  };

  const handleDeleteHabit = async (habitId: string) => {
    await habitService.deleteHabit(habitId);
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setLogs((prev) => prev.filter((l) => l.habit_id !== habitId));
  };

  const handlePrevWeek = () => {
    setSelectedWeekDate((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setSelectedWeekDate((prev) => addWeeks(prev, 1));
  };

  const handleResetToCurrentWeek = () => {
    setSelectedWeekDate(new Date());
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-linear-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight bg-linear-to-r from-zinc-900 via-indigo-900 to-indigo-600 dark:from-white dark:via-zinc-200 dark:to-indigo-400 bg-clip-text text-transparent">
                  HabitPulse
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block -mt-0.5">
                Seguimiento de Hábitos Saludables
              </span>
            </div>
          </div>

          {/* Navegación por pestañas inyectada */}
          {headerNav && <div className="hidden md:flex">{headerNav}</div>}

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-3">
            {/* Estado de Almacenamiento (Supabase vs LocalStorage) */}
            <div
              title={
                isSupabaseConfigured
                  ? 'Sincronizado con base de datos Supabase'
                  : 'Modo Offline / Demo con LocalStorage activo'
              }
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isSupabaseConfigured ? (
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
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Hábito</span>
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Motivational Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-xs mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting} Convierte la constancia en tu superpoder.
            </h1>
            <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed">
              Cada pequeña acción repetida con disciplina transforma tu salud, mente y energía diaria. ¡Sigue construyendo tu mejor versión!
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center gap-3 self-start md:self-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center min-w-[120px]">
              <div className="text-2xl font-black text-emerald-300">
                {todayCompletedCount}/{habits.length}
              </div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-indigo-100">
                Logros de hoy
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs px-4 py-3.5 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Nuevo Reto</span>
            </button>
          </div>

          {/* Background decorative blur circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* 1. HabitStats: Tarjetas de estadísticas principales */}
        <section>
          <HabitStats
            habitsWithStats={habitsWithStats}
            todayCompletedCount={todayCompletedCount}
            totalHabitsCount={habits.length}
          />
        </section>

        {/* Filtros de Categoría */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filtrar:
            </span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'salud', label: 'Salud' },
              { id: 'fitness', label: 'Fitness' },
              { id: 'mente', label: 'Mente' },
              { id: 'productividad', label: 'Productividad' },
              { id: 'nutricion', label: 'Nutrición' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            title="Recargar datos"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>
        </div>

        {/* 2. Grid Semanal Interactivo con Checkboxes y Confeti */}
        <section>
          <WeeklyHabitGrid
            habits={habitsWithStats}
            logs={logs}
            weekDays={weekDays}
            weekLabel={weekRangeLabel}
            isCurrentWeek={isCurrentWeek}
            onToggleHabit={handleToggleHabit}
            onDeleteHabit={handleDeleteHabit}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onResetToCurrentWeek={handleResetToCurrentWeek}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        </section>

        {/* 3. Gráfico de Barras con Recharts */}
        <section>
          <HabitProgressBarChart
            data={chartData}
            weekRangeLabel={weekRangeLabel}
          />
        </section>

        {/* Modal de Creación de Hábito */}
        <AddHabitModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddHabit={handleAddHabit}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 mt-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xs text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              HabitPulse
            </span>
            <span>— Tu plataforma de salud y hábitos atómicos</span>
          </div>
          <div>
            Desarrollado con Next.js 14+, Tailwind CSS, Supabase & Recharts
          </div>
        </div>
      </footer>
    </div>
  );
}
