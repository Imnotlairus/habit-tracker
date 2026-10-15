'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus, Droplets, Dumbbell, Brain, Moon, BookOpen, Apple } from 'lucide-react';
import { Habit, HabitCategory, HabitTemplate } from '@/types/habit';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habitData: Omit<Habit, 'id'>) => void;
}

const PRESET_TEMPLATES: (HabitTemplate & { icon: React.ComponentType<{ className?: string }> })[] = [
  {
    name: 'Beber 2L de Agua',
    description: 'Tomar al menos 8 vasos de agua al día para mantener energía y salud',
    category: 'salud',
    color: '#0284c7', // Sky blue
    target_days_per_week: 7,
    iconName: 'Droplets',
    icon: Droplets,
  },
  {
    name: 'Ejercicio Físico 30 min',
    description: 'Entrenamiento de fuerza, cardio o caminata intensa',
    category: 'fitness',
    color: '#10b981', // Emerald
    target_days_per_week: 5,
    iconName: 'Dumbbell',
    icon: Dumbbell,
  },
  {
    name: 'Meditación y Mindfulness',
    description: '10 a 15 minutos de respiración y serenidad mental',
    category: 'mente',
    color: '#8b5cf6', // Violet
    target_days_per_week: 6,
    iconName: 'Brain',
    icon: Brain,
  },
  {
    name: 'Dormir 7 a 8 Horas',
    description: 'Rutina nocturna saludable y descanso reparador',
    category: 'salud',
    color: '#6366f1', // Indigo
    target_days_per_week: 7,
    iconName: 'Moon',
    icon: Moon,
  },
  {
    name: 'Lectura Diaria 20 min',
    description: 'Leer libros que nutran la mente y el desarrollo personal',
    category: 'productividad',
    color: '#f59e0b', // Amber
    target_days_per_week: 5,
    iconName: 'BookOpen',
    icon: BookOpen,
  },
  {
    name: 'Comer Porción de Fruta y Verdura',
    description: 'Incluir nutrientes frescos en las comidas del día',
    category: 'nutricion',
    color: '#ec4899', // Pink
    target_days_per_week: 7,
    iconName: 'Apple',
    icon: Apple,
  },
];

const COLOR_PALETTE = [
  '#10b981', // Emerald
  '#0284c7', // Sky
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#ef4444', // Red
  '#14b8a6', // Teal
];

const CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'salud', label: 'Salud' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'mente', label: 'Mente' },
  { value: 'productividad', label: 'Productividad' },
  { value: 'nutricion', label: 'Nutrición' },
  { value: 'otro', label: 'Otro' },
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onAddHabit,
}) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'templates'>('custom');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('salud');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [targetDays, setTargetDays] = useState(7);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor ingresa un nombre para el hábito.');
      return;
    }

    onAddHabit({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      color,
      target_days_per_week: targetDays,
    });

    handleClose();
  };

  const handleSelectTemplate = (template: HabitTemplate) => {
    setName(template.name);
    setDescription(template.description);
    setCategory(template.category);
    setColor(template.color);
    setTargetDays(template.target_days_per_week);
    setActiveTab('custom');
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCategory('salud');
    setColor(COLOR_PALETTE[0]);
    setTargetDays(7);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Nuevo Hábito Saludable
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Diseña tu rutina o elige una plantilla verificada
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de pestañas */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-6 pt-2">
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors mr-6 ${
              activeTab === 'custom'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            Personalizado
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Plantillas Saludables
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'templates' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_TEMPLATES.map((tmpl) => {
                const IconComponent = tmpl.icon;
                return (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="p-2 rounded-xl text-white shadow-xs"
                        style={{ backgroundColor: tmpl.color }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {tmpl.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {tmpl.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                      <span>{tmpl.category}</span>
                      <span>{tmpl.target_days_per_week} días/semana</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <form id="habit-form" onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nombre del Hábito *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Beber 2L de agua, Caminar 30m..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 8 vasos distribuidos durante el día"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                />
              </div>

              {/* Categoría y Objetivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as HabitCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Meta Semanal: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{targetDays} días</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={targetDays}
                    onChange={(e) => setTargetDays(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>1 día</span>
                    <span>Diario (7)</span>
                  </div>
                </div>
              </div>

              {/* Selector de Color */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Color Identificador
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c
                          ? 'scale-115 ring-2 ring-offset-2 ring-indigo-500'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Cancelar
          </button>
          {activeTab === 'custom' ? (
            <button
              type="submit"
              form="habit-form"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Guardar Hábito
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold shadow-sm transition"
            >
              Crear desde cero
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
