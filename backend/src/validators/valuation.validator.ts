import { z } from 'zod';

const percentage = z.number().min(0).max(1);
const nonNegative = z.number().min(0);
const multiple = z.number().min(0);

export const valuationSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório.' }),
  revenueCurrent: nonNegative,
  revenueGrowthRate: percentage,
  ebitdaMargin: percentage,
  taxRate: percentage,
  capexRate: percentage,
  workingCapitalDeltaRate: percentage,
  grossDebt: nonNegative,
  cash: nonNegative,
  wacc: percentage,
  perpetualGrowthRate: percentage,
  ebitdaMultipleConservative: multiple,
  ebitdaMultipleBase: multiple,
  ebitdaMultipleAggressive: multiple,
  tam: nonNegative,
  marketShareFuture: percentage,
  startupFutureMargin: percentage,
  vcDiscountRate: percentage,
  assetsTotal: nonNegative,
  liabilitiesTotal: nonNegative
}).superRefine((data, ctx) => {
  if (data.wacc <= data.perpetualGrowthRate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'WACC deve ser maior que o crescimento de perpetuidade.',
      path: ['wacc']
    });
  }
});
