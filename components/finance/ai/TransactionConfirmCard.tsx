'use client';

import React, { useState } from 'react';
import {
  Check,
  Trash2,
  Calendar,
  Utensils,
  Car,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Category,
  PaymentMethod,
  CATEGORIES,
  PAYMENT_METHODS,
  NewTransactionInput,
  CATEGORY_CONFIG,
} from '@/types/finance';

export interface ProposedTransaction {
  amount: number;
  type: 'gasto' | 'ingreso';
  category: Category;
  payment_method: PaymentMethod;
  description: string;
  date: string; // YYYY-MM-DD
  merchant?: string;
}

interface TransactionConfirmCardProps {
  proposal: ProposedTransaction;
  onConfirm: (tx: NewTransactionInput) => Promise<unknown>;
  onDiscard: () => void;
  soundEnabled?: boolean;
}

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  Alimentación: Utensils,
  Transporte: Car,
  'Servicios/Hogar': Home,
  'Ocio/Salidas': Film,
  Salud: HeartPulse,
  Educación: GraduationCap,
  Imprevistos: AlertTriangle,
};

export const TransactionConfirmCard: React.FC<TransactionConfirmCardProps> = ({
  proposal,
  onConfirm,
  onDiscard,
  soundEnabled = false,
}) => {
  const [amount, setAmount] = useState<number>(proposal.amount);
  const [type, setType] = useState<'gasto' | 'ingreso'>(proposal.type);
  const [category, setCategory] = useState<Category>(proposal.category);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    proposal.payment_method
  );
  const [description, setDescription] = useState<string>(proposal.description);
  const [date, setDate] = useState<string>(proposal.date);

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDiscarded, setIsDiscarded] = useState<boolean>(false);

  if (isDiscarded) return null;

  const handleSave = async () => {
    if (amount <= 0) return;
    try {
      setIsSaving(true);
      await onConfirm({
        amount,
        type,
        category,
        payment_method: paymentMethod,
        description: description.trim() || undefined,
        date,
      });

      setIsSaved(true);

      // Confeti si no hay preferencia de movimiento reducido
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (!prefersReducedMotion) {
        try {
          confetti({
            particleCount: 35,
            spread: 55,
            origin: { y: 0.8 },
            colors: ['#10b981', '#6366f1', '#06b6d4', '#f59e0b'],
          });
        } catch {
          // Ignorar fallo de confetti
        }
      }

      // Sonido opcional sutil con Web Audio API (solo si está activado en ajustes)
      if (soundEnabled && typeof window !== 'undefined' && 'AudioContext' in window) {
        try {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          }
        } catch {
          // Ignorar fallo de audio
        }
      }
    } catch (err) {
      console.error('Error al confirmar transacción:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const IconComponent = CATEGORY_ICONS[category] || AlertTriangle;
  const config = CATEGORY_CONFIG[category];

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-300 ${
        isSaved
          ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20'
          : 'border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-800/95 shadow-md'
      }`}
    >
      {/* Encabezado de la Tarjeta */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-700/60">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg text-white shrink-0 shadow-xs"
            style={{ backgroundColor: config.color }}
          >
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {isSaved ? 'Transacción Registrada' : 'Transacción Sugerida'}
          </span>
        </div>

        {isSaved ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            Guardado
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                type === 'gasto'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {type}
            </span>
          </div>
        )}
      </div>

      {/* Campos Editables */}
      <div className="space-y-2.5 text-xs">
        {/* Monto y Tipo */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
              Monto (COP)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                $
              </span>
              <input
                type="number"
                disabled={isSaved}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-hidden focus:border-indigo-500 disabled:opacity-75"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
              Tipo
            </label>
            <select
              disabled={isSaved}
              value={type}
              onChange={(e) => setType(e.target.value as 'gasto' | 'ingreso')}
              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-hidden disabled:opacity-75"
            >
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </div>
        </div>

        {/* Categoría y Método de Pago */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
              Categoría
            </label>
            <select
              disabled={isSaved}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden disabled:opacity-75"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
              Método
            </label>
            <select
              disabled={isSaved}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden disabled:opacity-75"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fecha y Descripción */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400" />
              Fecha
            </label>
            <input
              type="date"
              disabled={isSaved}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden disabled:opacity-75"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-zinc-400" />
              Descripción
            </label>
            <input
              type="text"
              disabled={isSaved}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle..."
              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden disabled:opacity-75"
            />
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      {!isSaved && (
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setIsDiscarded(true);
              onDiscard();
            }}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Descartar</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{isSaving ? 'Guardando...' : 'Confirmar y Guardar'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
