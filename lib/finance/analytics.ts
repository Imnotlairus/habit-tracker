import { Transaction } from '@/types/finance';
import { getDaysInMonth, parseISO } from 'date-fns';

export interface AntExpenseGroup {
  key: string;
  category: string;
  description: string;
  totalAmount: number;
  count: number;
  averageAmount: number;
  transactions: Transaction[];
}

export interface AntExpenseAuditResult {
  totalAntExpenses: number;
  totalTransactionsCount: number;
  thresholdUsed: number;
  groups: AntExpenseGroup[];
  monthlyProjected: number;
  annualProjected: number;
}

export interface AnnualProjection {
  monthlyTotal: number;
  annualTotal: number;
  fiveYearsTotal: number;
  tenYearsTotal: number;
  fiveYearsInvested: number; // Proyección invertida al 8% E.A.
  tenYearsInvested: number;
}

export interface MonthlyMargin {
  monthKey: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  budget: number | null;
  remainingBudget: number | null;
  daysInMonth: number;
  dayOfMonth: number;
  daysRemaining: number;
  dailySpentAverage: number;
  dailyRemainingBudget: number | null;
}

export interface PurchaseSimulationResult {
  purchaseAmount: number;
  canAfford: boolean;
  recommendation: 'viable' | 'caution' | 'not_recommended';
  marginAfterPurchase: number;
  percentageOfRemainingBudget: number;
  explanation: string;
  suggestedDelayDays?: number;
}

export interface HabitSavingRule {
  habit_id: string;
  saving_per_completion: number;
  description?: string;
}

export interface HabitSavingsEstimate {
  totalEstimatedSavings: number;
  totalCompletionsCount: number;
  habitBreakdown: Array<{
    habit_id: string;
    completions: number;
    savingPerCompletion: number;
    subtotal: number;
    description?: string;
  }>;
}

/**
 * 1. Detecta y agrupa gastos hormiga (micropagos repetitivos por debajo de un umbral).
 */
export function detectAntExpenses(
  transactions: Transaction[],
  threshold: number = 20000
): AntExpenseAuditResult {
  const expenseTransactions = transactions.filter(
    (tx) => tx.type === 'gasto' && Number(tx.amount) <= threshold
  );

  const groupMap = new Map<string, AntExpenseGroup>();

  for (const tx of expenseTransactions) {
    // Normalizar clave de agrupación por descripción o categoría
    const descKey = (tx.description || tx.category).trim().toLowerCase();
    const key = `${tx.category.toLowerCase()}:${descKey}`;

    const existing = groupMap.get(key);
    if (!existing) {
      groupMap.set(key, {
        key,
        category: tx.category,
        description: tx.description || tx.category,
        totalAmount: Number(tx.amount),
        count: 1,
        averageAmount: Number(tx.amount),
        transactions: [tx],
      });
    } else {
      existing.totalAmount += Number(tx.amount);
      existing.count += 1;
      existing.averageAmount = Math.round(existing.totalAmount / existing.count);
      existing.transactions.push(tx);
    }
  }

  // Ordenar grupos por total acumulado descendente
  const groups = Array.from(groupMap.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );

  const totalAntExpenses = groups.reduce((sum, g) => sum + g.totalAmount, 0);
  const totalCount = groups.reduce((sum, g) => sum + g.count, 0);

  // Proyecciones
  const monthlyProjected = totalAntExpenses;
  const annualProjected = totalAntExpenses * 12;

  return {
    totalAntExpenses,
    totalTransactionsCount: totalCount,
    thresholdUsed: threshold,
    groups,
    monthlyProjected,
    annualProjected,
  };
}

/**
 * 2. Proyecta el impacto acumulado y costo de oportunidad a 1, 5 y 10 años (interés compuesto al 8% E.A.).
 */
export function projectAnnualImpact(monthlyTotal: number): AnnualProjection {
  const annualTotal = monthlyTotal * 12;
  const fiveYearsTotal = annualTotal * 5;
  const tenYearsTotal = annualTotal * 10;

  // Fórmula de anualidad ordinaria con interés compuesto (tasa mensual i = (1.08)^(1/12) - 1 ≈ 0.006434)
  const monthlyRate = Math.pow(1 + 0.08, 1 / 12) - 1;

  const calculateAnnuityFutureValue = (pmt: number, months: number): number => {
    if (monthlyRate === 0) return pmt * months;
    return pmt * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  };

  const fiveYearsInvested = Math.round(calculateAnnuityFutureValue(monthlyTotal, 60));
  const tenYearsInvested = Math.round(calculateAnnuityFutureValue(monthlyTotal, 120));

  return {
    monthlyTotal,
    annualTotal,
    fiveYearsTotal,
    tenYearsTotal,
    fiveYearsInvested,
    tenYearsInvested,
  };
}

/**
 * 3. Calcula el margen financiero mensual, presupuesto disponible y límites diarios.
 */
export function getMonthlyMargin(
  transactions: Transaction[],
  budget: number | null,
  todayDateStr: string // YYYY-MM-DD
): MonthlyMargin {
  const [yearStr, monthStr, dayStr] = todayDateStr.split('-');
  const monthKey = `${yearStr}-${monthStr}`;
  const dayOfMonth = parseInt(dayStr, 10) || 1;

  const todayDate = parseISO(todayDateStr);
  const daysInMonth = getDaysInMonth(todayDate);
  const daysRemaining = Math.max(1, daysInMonth - dayOfMonth + 1);

  const monthTx = transactions.filter((tx) => tx.date.startsWith(monthKey));

  const totalExpenses = monthTx
    .filter((tx) => tx.type === 'gasto')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalIncome = monthTx
    .filter((tx) => tx.type === 'ingreso')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const netBalance = totalIncome - totalExpenses;
  const remainingBudget = budget !== null ? budget - totalExpenses : null;

  const dailySpentAverage =
    dayOfMonth > 0 ? Math.round(totalExpenses / dayOfMonth) : totalExpenses;

  const dailyRemainingBudget =
    remainingBudget !== null
      ? Math.max(0, Math.round(remainingBudget / daysRemaining))
      : null;

  return {
    monthKey,
    totalIncome,
    totalExpenses,
    netBalance,
    budget,
    remainingBudget,
    daysInMonth,
    dayOfMonth,
    daysRemaining,
    dailySpentAverage,
    dailyRemainingBudget,
  };
}

/**
 * 4. Simula el impacto de una compra potencial en el presupuesto disponible.
 */
export function simulatePurchase(
  amount: number,
  margin: MonthlyMargin
): PurchaseSimulationResult {
  const effectiveMargin =
    margin.remainingBudget !== null ? margin.remainingBudget : margin.netBalance;

  const marginAfterPurchase = effectiveMargin - amount;

  if (effectiveMargin <= 0) {
    return {
      purchaseAmount: amount,
      canAfford: false,
      recommendation: 'not_recommended',
      marginAfterPurchase,
      percentageOfRemainingBudget: 100,
      explanation:
        'Tu margen disponible del mes es cero o negativo. Realizar esta compra te dejaría en sobregiro.',
      suggestedDelayDays: margin.daysRemaining,
    };
  }

  const percentageOfRemainingBudget = Math.round((amount / effectiveMargin) * 100);

  if (marginAfterPurchase < 0) {
    return {
      purchaseAmount: amount,
      canAfford: false,
      recommendation: 'not_recommended',
      marginAfterPurchase,
      percentageOfRemainingBudget,
      explanation: `Esta compra supera tu saldo disponible en ${Math.abs(
        marginAfterPurchase
      ).toLocaleString('es-CO')} COP. Se aconseja esperar al próximo corte.`,
      suggestedDelayDays: margin.daysRemaining,
    };
  }

  if (percentageOfRemainingBudget > 50) {
    return {
      purchaseAmount: amount,
      canAfford: true,
      recommendation: 'caution',
      marginAfterPurchase,
      percentageOfRemainingBudget,
      explanation: `La compra consume el ${percentageOfRemainingBudget}% de tu presupuesto restante. Te quedarían ${marginAfterPurchase.toLocaleString(
        'es-CO'
      )} COP para los ${margin.daysRemaining} días restantes del mes.`,
      suggestedDelayDays: 7,
    };
  }

  return {
    purchaseAmount: amount,
    canAfford: true,
    recommendation: 'viable',
    marginAfterPurchase,
    percentageOfRemainingBudget,
    explanation: `Compra completamente viable. Solo consume el ${percentageOfRemainingBudget}% de tu margen disponible y mantienes tu presupuesto seguro.`,
  };
}

/**
 * 5. Estima el ahorro financiero generado por hábitos saludables completados.
 */
export function estimateHabitSavings(
  habitLogs: Array<{ habit_id: string; completed_date: string }>,
  rules: HabitSavingRule[],
  dateRange?: { start: string; end: string }
): HabitSavingsEstimate {
  // Filtrar logs en el rango de fechas si se provee
  const filteredLogs = dateRange
    ? habitLogs.filter(
        (log) =>
          log.completed_date >= dateRange.start &&
          log.completed_date <= dateRange.end
      )
    : habitLogs;

  const countsByHabit = new Map<string, number>();
  for (const log of filteredLogs) {
    countsByHabit.set(log.habit_id, (countsByHabit.get(log.habit_id) || 0) + 1);
  }

  let totalEstimatedSavings = 0;
  let totalCompletionsCount = 0;

  const habitBreakdown: HabitSavingsEstimate['habitBreakdown'] = [];

  for (const rule of rules) {
    const completions = countsByHabit.get(rule.habit_id) || 0;
    const subtotal = completions * rule.saving_per_completion;

    totalEstimatedSavings += subtotal;
    totalCompletionsCount += completions;

    habitBreakdown.push({
      habit_id: rule.habit_id,
      completions,
      savingPerCompletion: rule.saving_per_completion,
      subtotal,
      description: rule.description,
    });
  }

  return {
    totalEstimatedSavings,
    totalCompletionsCount,
    habitBreakdown,
  };
}
