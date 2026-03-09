import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateValuation, ValuationInputs } from '../services/valuation.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

function getUserContext(req: Request): { userId: number; companyId: number } {
  // @ts-ignore - preenchido pelo authMiddleware/tenantMiddleware
  return {
    userId: req.user.userId as number,
    companyId: req.user.companyId as number
  };
}

function toInputs(data: any): ValuationInputs {
  return {
    revenueCurrent: data.revenueCurrent,
    revenueGrowthRate: data.revenueGrowthRate,
    ebitdaMargin: data.ebitdaMargin,
    taxRate: data.taxRate,
    capexRate: data.capexRate,
    workingCapitalDeltaRate: data.workingCapitalDeltaRate,
    grossDebt: data.grossDebt,
    cash: data.cash,
    wacc: data.wacc,
    perpetualGrowthRate: data.perpetualGrowthRate,
    ebitdaMultipleConservative: data.ebitdaMultipleConservative,
    ebitdaMultipleBase: data.ebitdaMultipleBase,
    ebitdaMultipleAggressive: data.ebitdaMultipleAggressive,
    tam: data.tam,
    marketShareFuture: data.marketShareFuture,
    startupFutureMargin: data.startupFutureMargin,
    vcDiscountRate: data.vcDiscountRate,
    assetsTotal: data.assetsTotal,
    liabilitiesTotal: data.liabilitiesTotal
  };
}

function normalizeInputs(record: any): ValuationInputs {
  return {
    revenueCurrent: Number(record.revenueCurrent),
    revenueGrowthRate: Number(record.revenueGrowthRate),
    ebitdaMargin: Number(record.ebitdaMargin),
    taxRate: Number(record.taxRate),
    capexRate: Number(record.capexRate),
    workingCapitalDeltaRate: Number(record.workingCapitalDeltaRate),
    grossDebt: Number(record.grossDebt),
    cash: Number(record.cash),
    wacc: Number(record.wacc),
    perpetualGrowthRate: Number(record.perpetualGrowthRate),
    ebitdaMultipleConservative: Number(record.ebitdaMultipleConservative),
    ebitdaMultipleBase: Number(record.ebitdaMultipleBase),
    ebitdaMultipleAggressive: Number(record.ebitdaMultipleAggressive),
    tam: Number(record.tam),
    marketShareFuture: Number(record.marketShareFuture),
    startupFutureMargin: Number(record.startupFutureMargin),
    vcDiscountRate: Number(record.vcDiscountRate),
    assetsTotal: Number(record.assetsTotal),
    liabilitiesTotal: Number(record.liabilitiesTotal)
  };
}

export async function createValuation(req: Request, res: Response) {
  const { userId, companyId } = getUserContext(req);

  try {
    const created = await prisma.valuationProcess.create({
      data: {
        name: req.body.name,
        companyId,
        createdBy: userId,
        ...toInputs(req.body)
      }
    });

    const inputs = normalizeInputs(created);
    const results = calculateValuation(inputs);

    return res.status(201).json({
      id: created.id,
      name: created.name,
      companyId: created.companyId,
      createdBy: created.createdBy,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      inputs,
      results
    });
  } catch (error) {
    logger.error('Erro ao criar valuation:', error);
    return res.status(500).json({ error: 'Erro interno ao criar valuation.' });
  }
}

export async function listValuations(req: Request, res: Response) {
  const { companyId } = getUserContext(req);

  try {
    const valuations = await prisma.valuationProcess.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    const items = valuations.map((valuation) => {
      const inputs = normalizeInputs(valuation);
      const results = calculateValuation(inputs);
      return {
        id: valuation.id,
        name: valuation.name,
        createdAt: valuation.createdAt,
        updatedAt: valuation.updatedAt,
        summary: {
          ebitdaBaseEquity: results.ebitda.scenarios.base.equityValue,
          fcdEquity: results.fcd.equityValue,
          startupValue: results.startup.presentValue,
          patrimonialValue: results.patrimonial.equityValue
        }
      };
    });

    return res.status(200).json(items);
  } catch (error) {
    logger.error('Erro ao listar valuations:', error);
    return res.status(500).json({ error: 'Erro interno ao listar valuations.' });
  }
}

export async function getValuationById(req: Request, res: Response) {
  const { companyId } = getUserContext(req);
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const valuation = await prisma.valuationProcess.findFirst({
      where: { id, companyId }
    });

    if (!valuation) {
      return res.status(404).json({ error: 'Valuation não encontrado.' });
    }

    const inputs = normalizeInputs(valuation);
    const results = calculateValuation(inputs);

    return res.status(200).json({
      id: valuation.id,
      name: valuation.name,
      companyId: valuation.companyId,
      createdBy: valuation.createdBy,
      createdAt: valuation.createdAt,
      updatedAt: valuation.updatedAt,
      inputs,
      results
    });
  } catch (error) {
    logger.error('Erro ao buscar valuation:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar valuation.' });
  }
}

export async function updateValuation(req: Request, res: Response) {
  const { companyId } = getUserContext(req);
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const existing = await prisma.valuationProcess.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Valuation não encontrado.' });
    }

    const updated = await prisma.valuationProcess.update({
      where: { id },
      data: {
        name: req.body.name,
        ...toInputs(req.body)
      }
    });

    const inputs = normalizeInputs(updated);
    const results = calculateValuation(inputs);

    return res.status(200).json({
      id: updated.id,
      name: updated.name,
      companyId: updated.companyId,
      createdBy: updated.createdBy,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      inputs,
      results
    });
  } catch (error) {
    logger.error('Erro ao atualizar valuation:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar valuation.' });
  }
}

export async function deleteValuation(req: Request, res: Response) {
  const { companyId } = getUserContext(req);
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const existing = await prisma.valuationProcess.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Valuation não encontrado.' });
    }

    await prisma.valuationProcess.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    logger.error('Erro ao excluir valuation:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir valuation.' });
  }
}
