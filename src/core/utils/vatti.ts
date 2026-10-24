/**
 * Loan and Interest ("Vatti") Calculation Engine
 * Designed for Indian personal/informal loan realities (e.g. "2 rooba vatti" = 2% per month).
 */

export interface VattiCalculationResult {
  monthlyInterestAmount: number;
  annualInterestRatePercent: number;
  totalPerDayInterest: number;
}

/**
 * Calculates monthly interest based on principal and monthly percentage rate.
 * Example: Principal ₹2,00,000 at 2% monthly rate = ₹4,000/month.
 */
export function calculateMonthlyVatti(
  principal: number,
  monthlyRatePercent: number
): VattiCalculationResult {
  if (principal <= 0 || monthlyRatePercent <= 0) {
    return {
      monthlyInterestAmount: 0,
      annualInterestRatePercent: 0,
      totalPerDayInterest: 0,
    };
  }

  const monthlyInterestAmount = (principal * monthlyRatePercent) / 100;
  const annualInterestRatePercent = monthlyRatePercent * 12;
  const totalPerDayInterest = monthlyInterestAmount / 30;

  return {
    monthlyInterestAmount: Math.round(monthlyInterestAmount),
    annualInterestRatePercent,
    totalPerDayInterest: Math.round(totalPerDayInterest),
  };
}

/**
 * Recalculates new principal and adjusted next month interest after a partial repayment.
 * Example: Repaying ₹50,000 on ₹2,00,000 reduces principal to ₹1,50,000 and interest to ₹3,000.
 */
export function recalculateAfterPartPayment(
  currentPrincipal: number,
  partPaymentAmount: number,
  monthlyRatePercent: number
): { newPrincipal: number; newMonthlyInterest: number } {
  const newPrincipal = Math.max(0, currentPrincipal - partPaymentAmount);
  const { monthlyInterestAmount } = calculateMonthlyVatti(newPrincipal, monthlyRatePercent);

  return {
    newPrincipal,
    newMonthlyInterest: monthlyInterestAmount,
  };
}

/**
 * Calculates Gold net worth given grams, purity, and current market price per gram.
 * 1 Sovereign (Savaran / Pavan) = 8 Grams.
 */
export function calculateGoldWorth(
  grams: number,
  marketPricePerGram: number = 7500
): { totalValue: number; sovereigns: number } {
  const sovereigns = Number((grams / 8).toFixed(2));
  const totalValue = Math.round(grams * marketPricePerGram);
  return { totalValue, sovereigns };
}
