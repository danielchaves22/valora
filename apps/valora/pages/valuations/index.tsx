import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface ValuationSummary {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  summary: {
    ebitdaBaseEquity: number;
    fcdEquity: number;
    startupValue: number;
    patrimonialValue: number;
  };
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export default function ValuationListPage() {
  const [items, setItems] = useState<ValuationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchValuations = async () => {
      try {
        const response = await api.get('/valuations');
        setItems(response.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao carregar valuations');
      } finally {
        setLoading(false);
      }
    };

    fetchValuations();
  }, []);

  return (
    <DashboardLayout title="Processos">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Valuation' }]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Processos de valuation</h1>
        <Link href="/valuations/new">
          <Button variant="accent">Novo valuation</Button>
        </Link>
      </div>

      {loading && <p className="text-muted">Carregando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && (
        <Card className="p-4">
          {items.length === 0 ? (
            <p className="text-muted">Nenhum valuation criado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-soft">
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">EBITDA Base</th>
                    <th className="py-2 pr-4">FCD</th>
                    <th className="py-2 pr-4">Startup</th>
                    <th className="py-2 pr-4">Patrimonial</th>
                    <th className="py-2">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-soft hover:bg-elevated">
                      <td className="py-2 pr-4">
                        <Link href={`/valuations/${item.id}`} className="text-accent hover:underline">
                          {item.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{currency.format(item.summary.ebitdaBaseEquity)}</td>
                      <td className="py-2 pr-4">{currency.format(item.summary.fcdEquity)}</td>
                      <td className="py-2 pr-4">{currency.format(item.summary.startupValue)}</td>
                      <td className="py-2 pr-4">{currency.format(item.summary.patrimonialValue)}</td>
                      <td className="py-2">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </DashboardLayout>
  );
}
