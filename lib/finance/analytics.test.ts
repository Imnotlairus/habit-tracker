import { describe, it, expect } from 'vitest';
import {
  detectAntExpenses,
  projectAnnualImpact,
  getMonthlyMargin,
  simulatePurchase,
  estimateHabitSavings,
} from './analytics';
import { Transaction } from '@/types/finance';

describe('Analytics - detectAntExpenses', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      amount: 15000,
      type: 'gasto',
      category: 'Alimentación',
      payment_method: 'Efectivo',
      description: 'Café de la mañana',
      date: '2026-10-10',
    },
    {
      id: '2',
      amount: 15000,
      type: 'gasto',
      category: 'Alimentación',
      payment_method: 'Tarjeta Débito',
      description: 'Café de la mañana',
      date: '2026-10-11',
    },
    {
      id: '3',
      amount: 12000,
      type: 'gasto',
      category: 'Transporte',
      payment_method: 'Efectivo',
      description: 'Pasaje bus',
      date: '2026-10-11',
    },
    {
      id: '4',
      amount: 250000, // Supera umbral
      type: 'gasto',
      category: 'Servicios/Hogar',
      payment_method: 'Transferencia',
      description: 'Internet mensual',
      date: '2026-10-05',
    },
    {
      id: '5',
      amount: 1500000,
      type: 'ingreso',
      category: 'Servicios/Hogar',
      payment_method: 'Transferencia',
      description: 'Salario',
      date: '2026-10-01',
    },
  ];

  it('debe filtrar transacciones bajo el umbral y agrupar por descripción', () => {
    const result = detectAntExpenses(sampleTransactions, 20000);
    expect(result.thresholdUsed).toBe(20000);
    expect(result.totalTransactionsCount).toBe(3);
    expect(result.totalAntExpenses).toBe(42000); // 15k + 15k + 12k
    expect(result.groups.length).toBe(2);

    const cafeGroup = result.groups.find((g) => g.description.includes('Café'));
    expect(cafeGroup).toBeDefined();
    expect(cafeGroup?.count).toBe(2);
    expect(cafeGroup?.totalAmount).toBe(30000);
  });
});

describe('Analytics - projectAnnualImpact', () => {
  it('debe calcular proyecciones lineales e inversión compuesta', () => {
    const projection = projectAnnualImpact(100000); // 100k al mes
    expect(projection.monthlyTotal).toBe(100000);
    expect(projection.annualTotal).toBe(1200000);
    expect(projection.fiveYearsTotal).toBe(6000000);
    expect(projection.tenYearsTotal).toBe(12000000);
    // Con 8% de rendimiento compuesto debe superar la suma lineal
    expect(projection.fiveYearsInvested).toBeGreaterThan(6000000);
    expect(projection.tenYearsInvested).toBeGreaterThan(12000000);
  });
});

describe('Analytics - getMonthlyMargin & simulatePurchase', () => {
  const transactions: Transaction[] = [
    {
      id: '1',
      amount: 500000,
      type: 'gasto',
      category: 'Alimentación',
      payment_method: 'Tarjeta Débito',
      date: '2026-10-05',
    },
    {
      id: '2',
      amount: 2000000,
      type: 'ingreso',
      category: 'Servicios/Hogar',
      payment_method: 'Transferencia',
      date: '2026-10-01',
    },
  ];

  it('debe calcular el margen del mes y límites diarios', () => {
    const margin = getMonthlyMargin(transactions, 1500000, '2026-10-15');
    expect(margin.totalExpenses).toBe(500000);
    expect(margin.totalIncome).toBe(2000000);
    expect(margin.netBalance).toBe(1500000);
    expect(margin.remainingBudget).toBe(1000000); // 1.5M - 500k
    expect(margin.daysRemaining).toBe(17); // Octubre tiene 31 días: 31 - 15 + 1 = 17
    expect(margin.dailyRemainingBudget).toBe(Math.round(1000000 / 17));
  });

  it('debe simular compras y clasificar viabilidad adecuadamente', () => {
    const margin = getMonthlyMargin(transactions, 1000000, '2026-10-15'); // quedan 500k de presupuesto

    // Compra pequeña (100k vs 500k restante = 20%) -> viable
    const sim1 = simulatePurchase(100000, margin);
    expect(sim1.canAfford).toBe(true);
    expect(sim1.recommendation).toBe('viable');

    // Compra grande (350k vs 500k restante = 70%) -> caution
    const sim2 = simulatePurchase(350000, margin);
    expect(sim2.canAfford).toBe(true);
    expect(sim2.recommendation).toBe('caution');

    // Compra que excede el margen (600k vs 500k) -> not_recommended
    const sim3 = simulatePurchase(600000, margin);
    expect(sim3.canAfford).toBe(false);
    expect(sim3.recommendation).toBe('not_recommended');
  });
});

describe('Analytics - estimateHabitSavings', () => {
  it('debe calcular los ahorros estimados basados en reglas de hábitos', () => {
    const habitLogs = [
      { habit_id: 'agua-1', completed_date: '2026-10-01' },
      { habit_id: 'agua-1', completed_date: '2026-10-02' },
      { habit_id: 'agua-1', completed_date: '2026-10-03' },
      { habit_id: 'cocinar-1', completed_date: '2026-10-01' },
      { habit_id: 'cocinar-1', completed_date: '2026-10-02' },
    ];

    const rules = [
      {
        habit_id: 'agua-1',
        saving_per_completion: 4000, // $4.000 COP al evitar comprar botellas plásticas
        description: 'Llevar termo de agua en vez de comprar embotellada',
      },
      {
        habit_id: 'cocinar-1',
        saving_per_completion: 18000, // $18.000 COP al cocinar en casa vs delivery
        description: 'Cocinar almuerzo en casa',
      },
    ];

    const estimate = estimateHabitSavings(habitLogs, rules);
    expect(estimate.totalCompletionsCount).toBe(5);
    // (3 * 4000) + (2 * 18000) = 12000 + 36000 = 48000 COP
    expect(estimate.totalEstimatedSavings).toBe(48000);
    expect(estimate.habitBreakdown.length).toBe(2);
  });
});
