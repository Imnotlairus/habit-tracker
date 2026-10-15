'use client';

import React, { useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { TabNavigation, ActiveTab } from '@/components/TabNavigation';
import { Activity } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';

const HabitTrackerDashboard = dynamic(
  () => import('@/components/HabitTrackerDashboard'),
  {
    ssr: false,
    loading: () => <DashboardSkeleton text="Cargando Hábitos Saludables..." />,
  }
);

const FinancePanel = dynamic(
  () => import('@/components/finance/FinancePanel').then((mod) => mod.FinancePanel),
  {
    ssr: false,
    loading: () => <DashboardSkeleton text="Cargando Finanzas Personales..." />,
  }
);

const FinancialAIAssistantDrawer = dynamic(
  () =>
    import('@/components/finance/ai/FinancialAIAssistantDrawer').then(
      (mod) => mod.FinancialAIAssistantDrawer
    ),
  { ssr: false }
);

function DashboardSkeleton({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white animate-pulse">
          <Activity className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {text}
        </span>
      </div>
    </div>
  );
}

const TAB_STORAGE_KEY = 'habitpulse_active_tab';

const emptySubscribe = () => () => {};

function getInitialTab(): ActiveTab {
  if (typeof window === 'undefined') return 'habitos';
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'finanzas' || tabParam === 'habitos') {
      return tabParam;
    }
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    if (stored === 'finanzas' || stored === 'habitos') {
      return stored;
    }
  } catch {
    // fallback
  }
  return 'habitos';
}

export default function Page() {
  const isClientReady = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);

  // Hook de finanzas para persistir transacciones propuestas por la IA
  const { addTransaction, todayTotal, monthExpensesTotal, budget } =
    useTransactions();

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignorar en modo privado estricto
    }
  };

  const navSlot = (
    <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
  );

  if (!isClientReady) {
    return <DashboardSkeleton text="Cargando HabitPulse..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 relative">
      {activeTab === 'habitos' ? (
        <div role="tabpanel" id="panel-habitos" aria-labelledby="tab-habitos">
          <HabitTrackerDashboard headerNav={navSlot} />
        </div>
      ) : (
        <div role="tabpanel" id="panel-finanzas" aria-labelledby="tab-finanzas">
          <FinancePanel headerNav={navSlot} />
        </div>
      )}

      {/* Asistente y Coach AI Flotante disponible en toda la app */}
      <FinancialAIAssistantDrawer
        onAddTransaction={addTransaction}
        todayTotal={todayTotal}
        monthExpensesTotal={monthExpensesTotal}
        budget={budget}
      />
    </div>
  );
}
