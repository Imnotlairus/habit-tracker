'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Utensils,
  Car,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  AlertTriangle,
  Calendar,
  FileText,
} from 'lucide-react';
import {
  Category,
  PaymentMethod,
  TransactionType,
  NewTransactionInput,
  CATEGORIES,
  PAYMENT_METHODS,
  SUGGESTED_AMOUNTS,
  CATEGORY_CONFIG,
} from '@/types/finance';
import { format } from 'date-fns';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (input: NewTransactionInput) => Promise<unknown>;
}

// Mapeo estricto de iconos por categoría
const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  Alimentación: Utensils,
  Transporte: Car,
  'Servicios/Hogar': Home,
  'Ocio/Salidas': Film,
  Salud: HeartPulse,
  Educación: GraduationCap,
  Imprevistos: AlertTriangle,
};

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [type, setType] = useState<TransactionType>('gasto');
  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<Category>('Alimentación');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tarjeta Débito');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Foco inicial accesible al abrir
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setAmountStr('');
    setDescription('');
    setErrorMessage('');
    setIsSubmitting(false);
    onClose();
  };

  // Cierre con la tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  const handleSuggestedAmount = (val: number) => {
    setAmountStr(String(val));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));

    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setErrorMessage('Por favor ingresa un monto válido mayor a 0.');
      inputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onAddTransaction({
        amount: cleanAmount,
        type,
        category,
        payment_method: paymentMethod,
        description: description.trim() || undefined,
        date,
      });
      handleClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar la transacción'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Registrar Transacción"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in p-0 sm:p-4"
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-transform"
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
          {/* Toggle Gasto / Ingreso */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('gasto');
                if (errorMessage) setErrorMessage('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                type === 'gasto'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => {
                setType('ingreso');
                if (errorMessage) setErrorMessage('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                type === 'ingreso'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Ingreso
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario Scrolleable */}
        <form
          id="transaction-form"
          onSubmit={handleSubmit}
          className="p-5 overflow-y-auto space-y-4"
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Input Grande de Monto */}
          <div className="text-center py-2">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              Monto en Pesos Colombianos (COP)
            </label>
            <div className="relative inline-flex items-center justify-center w-full">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-400 mr-1.5">
                $
              </span>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                placeholder="0"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmountStr(val);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-48 sm:w-56 text-3xl sm:text-4xl font-black text-center text-zinc-900 dark:text-zinc-100 bg-transparent border-b-2 border-indigo-500 focus:outline-hidden focus:border-indigo-600 transition placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              />
            </div>
          </div>

          {/* Botones de Montos Sugeridos */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
            {SUGGESTED_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSuggestedAmount(amt)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                +{amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>

          {/* Selector Rápido de Categorías con Iconos */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const IconComponent = CATEGORY_ICONS[cat];
                const config = CATEGORY_CONFIG[cat];
                const isSelected = category === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div
                      className="p-1.5 rounded-lg text-white shrink-0"
                      style={{ backgroundColor: config.color }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Método de Pago y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Método de Pago
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Fecha (Hora Local)
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Descripción Opcional */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Descripción (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Mercado de la semana, taxi aeropuerto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>
        </form>

        {/* Footer con Acciones */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="transaction-form"
            disabled={isSubmitting}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer ${
              type === 'gasto'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Guardando...'
                : type === 'gasto'
                ? 'Registrar Gasto (+)'
                : 'Registrar Ingreso (+)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
