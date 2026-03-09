import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

interface ValuationDetail {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  inputs: Record<string, number>;
  results: {
    projection: Array<{
      year: number;
      revenue: number;
      ebitda: number;
      tax: number;
      capex: number;
      workingCapitalDelta: number;
      freeCashFlow: number;
    }>;
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
    sensitivity: Array<{ wacc: number; enterpriseValue: number }>;
  };
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export default function ValuationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<ValuationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchValuation = async () => {
      try {
        const response = await api.get(`/valuations/${id}`);
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao carregar valuation');
      } finally {
        setLoading(false);
      }
    };

    fetchValuation();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Valuation">
        <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Valuation', href: '/valuations' }, { label: 'Carregando...' }]} />
        <p className="text-muted">Carregando...</p>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Valuation">
        <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Valuation', href: '/valuations' }, { label: 'Erro' }]} />
        <p className="text-red-400">{error || 'Valuation não encontrado.'}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={data.name}>
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Valuation', href: '/valuations' }, { label: data.name }]} />

      <div className="space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-white mb-2">{data.name}</h1>
          <p className="text-muted">Criado em {new Date(data.createdAt).toLocaleDateString('pt-BR')}</p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-muted">EBITDA (Base)</p>
            <p className="text-lg font-semibold text-white">{currency.format(data.results.ebitda.scenarios.base.equityValue)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">FCD</p>
            <p className="text-lg font-semibold text-white">{currency.format(data.results.fcd.equityValue)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Startup</p>
            <p className="text-lg font-semibold text-white">{currency.format(data.results.startup.presentValue)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Patrimonial</p>
            <p className="text-lg font-semibold text-white">{currency.format(data.results.patrimonial.equityValue)}</p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Cenários EBITDA</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-soft">
                  <th className="py-2 pr-4">Cenário</th>
                  <th className="py-2 pr-4">Múltiplo</th>
                  <th className="py-2 pr-4">Enterprise Value</th>
                  <th className="py-2">Equity Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.results.ebitda.scenarios).map(([key, value]) => (
                  <tr key={key} className="border-b border-soft">
                    <td className="py-2 pr-4 capitalize">{key}</td>
                    <td className="py-2 pr-4">{value.multiple.toFixed(2)}x</td>
                    <td className="py-2 pr-4">{currency.format(value.enterpriseValue)}</td>
                    <td className="py-2">{currency.format(value.equityValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Projeção (5 anos)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-soft">
                  <th className="py-2 pr-3">Ano</th>
                  <th className="py-2 pr-3">Receita</th>
                  <th className="py-2 pr-3">EBITDA</th>
                  <th className="py-2 pr-3">Imposto</th>
                  <th className="py-2 pr-3">CAPEX</th>
                  <th className="py-2 pr-3">ΔCG</th>
                  <th className="py-2">FCL</th>
                </tr>
              </thead>
              <tbody>
                {data.results.projection.map(row => (
                  <tr key={row.year} className="border-b border-soft">
                    <td className="py-2 pr-3">{row.year}</td>
                    <td className="py-2 pr-3">{currency.format(row.revenue)}</td>
                    <td className="py-2 pr-3">{currency.format(row.ebitda)}</td>
                    <td className="py-2 pr-3">{currency.format(row.tax)}</td>
                    <td className="py-2 pr-3">{currency.format(row.capex)}</td>
                    <td className="py-2 pr-3">{currency.format(row.workingCapitalDelta)}</td>
                    <td className="py-2">{currency.format(row.freeCashFlow)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Sensibilidade (FCD)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-soft">
                  <th className="py-2 pr-4">WACC</th>
                  <th className="py-2">Enterprise Value</th>
                </tr>
              </thead>
              <tbody>
                {data.results.sensitivity.map(row => (
                  <tr key={row.wacc} className="border-b border-soft">
                    <td className="py-2 pr-4">{percent.format(row.wacc)}</td>
                    <td className="py-2">{currency.format(row.enterpriseValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
