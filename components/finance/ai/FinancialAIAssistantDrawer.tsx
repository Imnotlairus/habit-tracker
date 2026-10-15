'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Volume2,
  VolumeX,
  ExternalLink,
  Shield,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { VoiceInputButton } from '@/components/finance/ai/VoiceInputButton';
import {
  TransactionConfirmCard,
  ProposedTransaction,
} from '@/components/finance/ai/TransactionConfirmCard';
import { NewTransactionInput } from '@/types/finance';
import { format } from 'date-fns';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  transactions?: ProposedTransaction[];
  timestamp?: Date | string;
  isError?: boolean;
}

interface FinancialAIAssistantDrawerProps {
  onAddTransaction: (input: NewTransactionInput) => Promise<unknown>;
  todayTotal?: number;
  monthExpensesTotal?: number;
  budget?: number | null;
}

const QUICK_PROMPTS = [
  '🍔 Gasté $28.000 en almuerzo hoy',
  '🚕 $14.500 en taxi con tarjeta débito',
  '💡 Consejos para controlar mis gastos',
  '📊 ¿Cómo optimizo mi presupuesto este mes?',
];

export const FinancialAIAssistantDrawer: React.FC<
  FinancialAIAssistantDrawerProps
> = ({ onAddTransaction, todayTotal, monthExpensesTotal, budget }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        '¡Hola! Soy tu Coach Financiero y Asistente Personal con IA. Puedo registrar tus gastos por texto o voz, darte sugerencias de ahorro y resolver tus dudas financieras.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [missingApiKey, setMissingApiKey] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final del chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Manejar foco inicial y Escape
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = React.useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputMessage).trim();
      if (!text || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputMessage('');
      setIsLoading(true);

      try {
        const todayDateStr = format(new Date(), 'yyyy-MM-dd');

        // Historial para contexto
        const historyPayload = messages.slice(-5).map((m) => ({
          role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
          content: m.content,
        }));

        const res = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            intent: 'chat',
            clientDate: todayDateStr,
            history: historyPayload,
            context: {
              todayTotal,
              monthlyExpenses: monthExpensesTotal,
              budget,
            },
          }),
        });

        const data = await res.json();

        if (data.missingApiKey) {
          setMissingApiKey(true);
        }

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'He procesado tu solicitud.',
          transactions:
            data.transactions && data.transactions.length > 0
              ? data.transactions
              : undefined,
          timestamp: new Date(),
          isError: res.status >= 400,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content:
              'No fue posible conectar con el asistente de IA. Verifica tu conexión de red o intenta de nuevo.',
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [inputMessage, isLoading, messages, todayTotal, monthExpensesTotal, budget]
  );

  const handleVoiceTranscript = React.useCallback(
    (transcript: string) => {
      setInputMessage(transcript);
      // Enviar de inmediato para máxima fluidez
      void handleSendMessage(transcript);
    },
    [handleSendMessage]
  );

  return (
    <>
      {/* Botón Flotante Animado (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Abrir Asistente AI"
        title="Abrir Asistente Financiero y de Hábitos con IA"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-linear-to-r from-indigo-600 via-indigo-700 to-emerald-600 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="hidden sm:inline tracking-tight font-extrabold">
          Coach AI
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        />
      )}

      {/* Drawer Deslizante */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Asistente Financiero y de Hábitos"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header del Drawer */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-linear-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Coach Financiero AI
                </h2>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Registro asistido por voz y texto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle de Sonido */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              title={
                soundEnabled
                  ? 'Efectos de sonido activados'
                  : 'Efectos de sonido desactivados'
              }
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-500" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Cerrar Drawer */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aviso de Privacidad Breve */}
        <div className="px-4 py-2 bg-indigo-500/5 border-b border-indigo-500/10 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>
            Tus datos se procesan como información confidencial. Nunca se guarda nada sin tu confirmación explícita.
          </span>
        </div>

        {/* Tarjeta de advertencia cuando falta GEMINI_API_KEY */}
        {missingApiKey && (
          <div className="m-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Configuración de Google Gemini Requerida</span>
            </div>
            <p className="leading-relaxed">
              Para desbloquear el análisis inteligente y la comprensión de voz, agrega tu clave gratuita de Google AI Studio:
            </p>
            <div className="p-2 rounded-lg bg-white/70 dark:bg-black/30 font-mono text-[11px] select-all">
              GEMINI_API_KEY=tu_clave_aqui
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
            >
              <span>Obtener API Key gratis en Google AI Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Lista de Mensajes */}
        <div
          role="region"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                      : msg.isError
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-bl-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Tarjetas de Confirmación de Transacción generadas */}
                {msg.transactions && msg.transactions.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                      {msg.transactions.length === 1
                        ? '1 Transacción detectada — Revisa y confirma:'
                        : `${msg.transactions.length} Transacciones detectadas — Confirma cada una:`}
                    </span>
                    {msg.transactions.map((tx, idx) => (
                      <TransactionConfirmCard
                        key={`${msg.id}-tx-${idx}`}
                        proposal={tx}
                        onConfirm={onAddTransaction}
                        onDiscard={() => {}}
                        soundEnabled={soundEnabled}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Indicador de escritura animado */}
          {isLoading && (
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3.5 py-2.5 w-fit rounded-bl-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] font-semibold text-zinc-500 ml-1">
                Analizando con Gemini...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chips de Acciones Rápidas */}
        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto flex items-center gap-1.5">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Barra de Entrada Inferior con Texto y Voz */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="flex items-center gap-1.5"
          >
            {/* Botón de Entrada por Voz */}
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              disabled={isLoading}
            />

            {/* Input de Texto */}
            <input
              ref={inputRef}
              type="text"
              placeholder="Habla o escribe (ej: 'Gasté 25k en mercado')..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition placeholder:text-zinc-400"
            />

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Enviar mensaje"
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
