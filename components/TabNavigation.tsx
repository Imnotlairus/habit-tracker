'use client';

import React from 'react';
import { Heart, Wallet } from 'lucide-react';

export type ActiveTab = 'habitos' | 'finanzas';

interface TabNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Secciones principales"
      className="inline-flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs"
    >
      <button
        type="button"
        role="tab"
        id="tab-habitos"
        aria-controls="panel-habitos"
        aria-selected={activeTab === 'habitos'}
        tabIndex={activeTab === 'habitos' ? 0 : -1}
        onClick={() => onTabChange('habitos')}
        className={`relative flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
          activeTab === 'habitos'
            ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs scale-100'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
        }`}
      >
        <Heart
          className={`w-3.5 h-3.5 transition-transform ${
            activeTab === 'habitos' ? 'fill-indigo-500 text-indigo-500 scale-110' : ''
          }`}
        />
        <span>Hábitos Saludables</span>
      </button>

      <button
        type="button"
        role="tab"
        id="tab-finanzas"
        aria-controls="panel-finanzas"
        aria-selected={activeTab === 'finanzas'}
        tabIndex={activeTab === 'finanzas' ? 0 : -1}
        onClick={() => onTabChange('finanzas')}
        className={`relative flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
          activeTab === 'finanzas'
            ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs scale-100'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
        }`}
      >
        <Wallet
          className={`w-3.5 h-3.5 transition-transform ${
            activeTab === 'finanzas' ? 'fill-emerald-500 text-emerald-500 scale-110' : ''
          }`}
        />
        <span>Finanzas Personales</span>
      </button>
    </div>
  );
};
