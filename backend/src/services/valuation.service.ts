import { Decimal } from '@prisma/client/runtime/library';

export type ValuationInputs = {
  revenueCurrent: number | Decimal;
  revenueGrowthRate: number | Decimal;
  ebitdaMargin: number | Decimal;
  taxRate: number | Decimal;
  capexRate: number | Decimal;
  workingCapitalDeltaRate: number | Decimal;
  grossDebt: number | Decimal;
  cash: number | Decimal;
  wacc: number | Decimal;
  perpetualGrowthRate: number | Decimal;
  ebitdaMultipleConservative: number | Decimal;
  ebitdaMultipleBase: number | Decimal;
  ebitdaMultipleAggressive: number | Decimal;
  tam: number | Decimal;
  marketShareFuture: number | Decimal;
  startupFutureMargin: number | Decimal;
  vcDiscountRate: number | Decimal;
  assetsTotal: number | Decimal;
  liabilitiesTotal: number | Decimal;
};

export type ProjectionRow = {
  year: number;
  revenue: number;
  ebitda: number;
  tax: number;
  capex: number;
  workingCapitalDelta: number;
  freeCashFlow: number;
};

export type SensitivityRow = {
  wacc: number;
  enterpriseValue: number;
};

export type ValuationResults = {
  projection: ProjectionRow[];
  ebitda: {
    year1: number;
    netDebt: number;
    scenarios: {
      conservative: { multiple: number; enterpriseValue: number; equityValue: number };
      base: { multiple: number; enterpriseValue: number; equityValue: number };
      aggressive: { multiple: number; enterpriseValue: number; equityValue: number };
    };
  };
  fcd: {
    presentValueOfFlows: number;
    terminalValue: number;
    presentValueTerminal: number;
    enterpriseValue: number;
    equityValue: number;
  };
  startup: {
    revenueYear5: number;
    ebitdaFuture: number;
    enterpriseValueFuture: number;
    presentValue: number;
  };
  patrimonial: {
    assetsTotal: number;
    liabilitiesTotal: number;
    equityValue: number;
  };
  sensitivity: SensitivityRow[];
};

const DEFAULT_SENSITIVITY_WACC = [0.1, 0.12, 0.14, 0.16];

const toDecimal = (value: number | Decimal) => (value instanceof Decimal ? value : new Decimal(value));

const toNumber = (value: Decimal, decimals = 2) => Number(value.toFixed(decimals));

const decimalPow = (base: Decimal, exponent: number) => base.pow(exponent);

export function calculateValuation(inputs: ValuationInputs): ValuationResults {
  const revenueCurrent = toDecimal(inputs.revenueCurrent);
  const revenueGrowthRate = toDecimal(inputs.revenueGrowthRate);
  const ebitdaMargin = toDecimal(inputs.ebitdaMargin);
  const taxRate = toDecimal(inputs.taxRate);
  const capexRate = toDecimal(inputs.capexRate);
  const workingCapitalDeltaRate = toDecimal(inputs.workingCapitalDeltaRate);
  const grossDebt = toDecimal(inputs.grossDebt);
  const cash = toDecimal(inputs.cash);
  const wacc = toDecimal(inputs.wacc);
  const perpetualGrowthRate = toDecimal(inputs.perpetualGrowthRate);
  const ebitdaMultipleConservative = toDecimal(inputs.ebitdaMultipleConservative);
  const ebitdaMultipleBase = toDecimal(inputs.ebitdaMultipleBase);
  const ebitdaMultipleAggressive = toDecimal(inputs.ebitdaMultipleAggressive);
  const tam = toDecimal(inputs.tam);
  const marketShareFuture = toDecimal(inputs.marketShareFuture);
  const startupFutureMargin = toDecimal(inputs.startupFutureMargin);
  const vcDiscountRate = toDecimal(inputs.vcDiscountRate);
  const assetsTotal = toDecimal(inputs.assetsTotal);
  const liabilitiesTotal = toDecimal(inputs.liabilitiesTotal);

  const projection: ProjectionRow[] = [];
  const projectionDecimals: Array<{
    revenue: Decimal;
    ebitda: Decimal;
    tax: Decimal;
    capex: Decimal;
    workingCapitalDelta: Decimal;
    freeCashFlow: Decimal;
  }> = [];

  let revenue = revenueCurrent.mul(new Decimal(1).plus(revenueGrowthRate));
  for (let year = 1; year <= 5; year += 1) {
    if (year > 1) {
      revenue = revenue.mul(new Decimal(1).plus(revenueGrowthRate));
    }
    const ebitda = revenue.mul(ebitdaMargin);
    const tax = ebitda.mul(taxRate);
    const capex = revenue.mul(capexRate);
    const workingCapitalDelta = revenue.mul(workingCapitalDeltaRate);
    const freeCashFlow = ebitda.minus(tax).minus(capex).minus(workingCapitalDelta);

    projectionDecimals.push({
      revenue,
      ebitda,
      tax,
      capex,
      workingCapitalDelta,
      freeCashFlow
    });

    projection.push({
      year,
      revenue: toNumber(revenue),
      ebitda: toNumber(ebitda),
      tax: toNumber(tax),
      capex: toNumber(capex),
      workingCapitalDelta: toNumber(workingCapitalDelta),
      freeCashFlow: toNumber(freeCashFlow)
    });
  }

  const ebitdaYear1 = projectionDecimals[0].ebitda;
  const netDebt = grossDebt.minus(cash);

  const ebitdaConservativeEnterprise = ebitdaYear1.mul(ebitdaMultipleConservative);
  const ebitdaBaseEnterprise = ebitdaYear1.mul(ebitdaMultipleBase);
  const ebitdaAggressiveEnterprise = ebitdaYear1.mul(ebitdaMultipleAggressive);

  const fclDecimals = projectionDecimals.map((row) => row.freeCashFlow);

  const vpFluxos = fclDecimals.reduce((acc, fcl, index) => {
    const year = index + 1;
    const discount = decimalPow(new Decimal(1).plus(wacc), year);
    return acc.plus(fcl.div(discount));
  }, new Decimal(0));

  const terminalValue = fclDecimals[4].mul(new Decimal(1).plus(perpetualGrowthRate)).div(wacc.minus(perpetualGrowthRate));
  const vpTerminal = terminalValue.div(decimalPow(new Decimal(1).plus(wacc), 5));
  const fcdEnterprise = vpFluxos.plus(vpTerminal);
  const fcdEquity = fcdEnterprise.minus(netDebt);

  const revenueYear5 = tam.mul(marketShareFuture);
  const ebitdaFuture = revenueYear5.mul(startupFutureMargin);
  const enterpriseValueFuture = ebitdaFuture.mul(ebitdaMultipleBase);
  const presentValue = enterpriseValueFuture.div(decimalPow(new Decimal(1).plus(vcDiscountRate), 5));

  const patrimonialEquity = assetsTotal.minus(liabilitiesTotal);

  const sensitivity: SensitivityRow[] = DEFAULT_SENSITIVITY_WACC.map((rate) => {
    const waccRate = new Decimal(rate);
    const pvFlows = fclDecimals.reduce((acc, fcl, index) => {
      const year = index + 1;
      const discount = decimalPow(new Decimal(1).plus(waccRate), year);
      return acc.plus(fcl.div(discount));
    }, new Decimal(0));
    const terminal = fclDecimals[4].mul(new Decimal(1).plus(perpetualGrowthRate)).div(waccRate.minus(perpetualGrowthRate));
    const pvTerminal = terminal.div(decimalPow(new Decimal(1).plus(waccRate), 5));
    return {
      wacc: rate,
      enterpriseValue: toNumber(pvFlows.plus(pvTerminal))
    };
  });

  return {
    projection,
    ebitda: {
      year1: toNumber(ebitdaYear1),
      netDebt: toNumber(netDebt),
      scenarios: {
        conservative: {
          multiple: toNumber(ebitdaMultipleConservative, 4),
          enterpriseValue: toNumber(ebitdaConservativeEnterprise),
          equityValue: toNumber(ebitdaConservativeEnterprise.minus(netDebt))
        },
        base: {
          multiple: toNumber(ebitdaMultipleBase, 4),
          enterpriseValue: toNumber(ebitdaBaseEnterprise),
          equityValue: toNumber(ebitdaBaseEnterprise.minus(netDebt))
        },
        aggressive: {
          multiple: toNumber(ebitdaMultipleAggressive, 4),
          enterpriseValue: toNumber(ebitdaAggressiveEnterprise),
          equityValue: toNumber(ebitdaAggressiveEnterprise.minus(netDebt))
        }
      }
    },
    fcd: {
      presentValueOfFlows: toNumber(vpFluxos),
      terminalValue: toNumber(terminalValue),
      presentValueTerminal: toNumber(vpTerminal),
      enterpriseValue: toNumber(fcdEnterprise),
      equityValue: toNumber(fcdEquity)
    },
    startup: {
      revenueYear5: toNumber(revenueYear5),
      ebitdaFuture: toNumber(ebitdaFuture),
      enterpriseValueFuture: toNumber(enterpriseValueFuture),
      presentValue: toNumber(presentValue)
    },
    patrimonial: {
      assetsTotal: toNumber(assetsTotal),
      liabilitiesTotal: toNumber(liabilitiesTotal),
      equityValue: toNumber(patrimonialEquity)
    },
    sensitivity
  };
}
