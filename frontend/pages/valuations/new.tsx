import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface ValuationForm {
  name: string;
  revenueCurrent: number | null;
  revenueGrowthRate: number | null;
  ebitdaMargin: number | null;
  taxRate: number | null;
  capexRate: number | null;
  workingCapitalDeltaRate: number | null;
  grossDebt: number | null;
  cash: number | null;
  wacc: number | null;
  perpetualGrowthRate: number | null;
  ebitdaMultipleConservative: number | null;
  ebitdaMultipleBase: number | null;
  ebitdaMultipleAggressive: number | null;
  tam: number | null;
  marketShareFuture: number | null;
  startupFutureMargin: number | null;
  vcDiscountRate: number | null;
  assetsTotal: number | null;
  liabilitiesTotal: number | null;
}

const defaultForm: ValuationForm = {
  name: '',
  revenueCurrent: null,
  revenueGrowthRate: null,
  ebitdaMargin: null,
  taxRate: null,
  capexRate: null,
  workingCapitalDeltaRate: null,
  grossDebt: null,
  cash: null,
  wacc: null,
  perpetualGrowthRate: null,
  ebitdaMultipleConservative: null,
  ebitdaMultipleBase: null,
  ebitdaMultipleAggressive: null,
  tam: null,
  marketShareFuture: null,
  startupFutureMargin: null,
  vcDiscountRate: null,
  assetsTotal: null,
  liabilitiesTotal: null
};

export default function NewValuationPage() {
  const [form, setForm] = useState<ValuationForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const updateField = (field: keyof ValuationForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (field === 'name') {
      setForm(prev => ({ ...prev, [field]: value }));
      return;
    }
    if (value === '') {
      setForm(prev => ({ ...prev, [field]: null }));
      return;
    }
    const parsed = Number(value);
    setForm(prev => ({ ...prev, [field]: Number.isNaN(parsed) ? null : parsed }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const numericFields: (keyof ValuationForm)[] = [
        'revenueCurrent',
        'revenueGrowthRate',
        'ebitdaMargin',
        'taxRate',
        'capexRate',
        'workingCapitalDeltaRate',
        'grossDebt',
        'cash',
        'wacc',
        'perpetualGrowthRate',
        'ebitdaMultipleConservative',
        'ebitdaMultipleBase',
        'ebitdaMultipleAggressive',
        'tam',
        'marketShareFuture',
        'startupFutureMargin',
        'vcDiscountRate',
        'assetsTotal',
        'liabilitiesTotal'
      ];

      const hasEmpty = numericFields.some((field) => form[field] === null);
      if (!form.name.trim() || hasEmpty) {
        setError('Preencha todos os campos obrigatorios.');
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        name: form.name.trim()
      } as Record<string, any>;

      numericFields.forEach((field) => {
        payload[field] = Number(form[field]);
      });

      const response = await api.post('/valuations', payload);
      router.push(`/valuations/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar valuation');
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Novo valuation">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Valuation', href: '/valuations' }, { label: 'Novo' }]} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-white mb-4">Novo valuation</h1>
          <Input id="name" label="Nome do processo" value={form.name} onChange={updateField('name')} required autoFocus />
          <p className="text-sm text-muted">Taxas devem ser informadas como decimais (ex.: 0.15 = 15%).</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Premissas estratégicas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="revenueCurrent" label="Receita Atual" type="number" step="0.01" value={form.revenueCurrent ?? ''} onChange={updateField('revenueCurrent')} required />
            <Input id="revenueGrowthRate" label="Crescimento Receita (%)" type="number" step="0.0001" value={form.revenueGrowthRate ?? ''} onChange={updateField('revenueGrowthRate')} required />
            <Input id="ebitdaMargin" label="Margem EBITDA (%)" type="number" step="0.0001" value={form.ebitdaMargin ?? ''} onChange={updateField('ebitdaMargin')} required />
            <Input id="taxRate" label="Imposto (%)" type="number" step="0.0001" value={form.taxRate ?? ''} onChange={updateField('taxRate')} required />
            <Input id="capexRate" label="CAPEX (% Receita)" type="number" step="0.0001" value={form.capexRate ?? ''} onChange={updateField('capexRate')} required />
            <Input id="workingCapitalDeltaRate" label="Δ Capital de Giro (% Receita)" type="number" step="0.0001" value={form.workingCapitalDeltaRate ?? ''} onChange={updateField('workingCapitalDeltaRate')} required />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Estrutura de capital</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="grossDebt" label="Dívida Bruta" type="number" step="0.01" value={form.grossDebt ?? ''} onChange={updateField('grossDebt')} required />
            <Input id="cash" label="Caixa" type="number" step="0.01" value={form.cash ?? ''} onChange={updateField('cash')} required />
            <Input id="wacc" label="WACC" type="number" step="0.0001" value={form.wacc ?? ''} onChange={updateField('wacc')} required />
            <Input id="perpetualGrowthRate" label="Crescimento Perpetuidade (g)" type="number" step="0.0001" value={form.perpetualGrowthRate ?? ''} onChange={updateField('perpetualGrowthRate')} required />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Múltiplos EBITDA</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Input id="ebitdaMultipleConservative" label="Múltiplo Conservador" type="number" step="0.01" value={form.ebitdaMultipleConservative ?? ''} onChange={updateField('ebitdaMultipleConservative')} required />
            <Input id="ebitdaMultipleBase" label="Múltiplo Base" type="number" step="0.01" value={form.ebitdaMultipleBase ?? ''} onChange={updateField('ebitdaMultipleBase')} required />
            <Input id="ebitdaMultipleAggressive" label="Múltiplo Agressivo" type="number" step="0.01" value={form.ebitdaMultipleAggressive ?? ''} onChange={updateField('ebitdaMultipleAggressive')} required />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Startup / TAM</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="tam" label="TAM" type="number" step="0.01" value={form.tam ?? ''} onChange={updateField('tam')} required />
            <Input id="marketShareFuture" label="Market Share Futuro" type="number" step="0.0001" value={form.marketShareFuture ?? ''} onChange={updateField('marketShareFuture')} required />
            <Input id="startupFutureMargin" label="Margem Futura Startup" type="number" step="0.0001" value={form.startupFutureMargin ?? ''} onChange={updateField('startupFutureMargin')} required />
            <Input id="vcDiscountRate" label="Taxa Desconto VC" type="number" step="0.0001" value={form.vcDiscountRate ?? ''} onChange={updateField('vcDiscountRate')} required />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Patrimonial</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="assetsTotal" label="Ativo Total" type="number" step="0.01" value={form.assetsTotal ?? ''} onChange={updateField('assetsTotal')} required />
            <Input id="liabilitiesTotal" label="Passivo Total" type="number" step="0.01" value={form.liabilitiesTotal ?? ''} onChange={updateField('liabilitiesTotal')} required />
          </div>
        </Card>

        {error && <p className="text-red-400">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={loading}>
            {loading ? 'Salvando...' : 'Calcular valuation'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
