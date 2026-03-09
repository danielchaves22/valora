// frontend/pages/index.tsx
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PlusCircle, FolderOpen } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Dashboard">
      <Breadcrumb items={[{ label: 'Início' }]} />

      <div className="space-y-6">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent" />
          <div className="relative p-6">
            <h2 className="text-2xl font-semibold text-white">Bem-vindo, {user?.name}</h2>
            <p className="text-muted mt-1">Pronto para iniciar um novo valuation?</p>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/valuations/new" className="block">
            <Card className="p-5 hover:shadow-accent hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent rounded-lg">
                  <PlusCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Novo valuation</p>
                  <p className="text-sm text-muted">Preencher inputs e gerar resultados</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/valuations" className="block">
            <Card className="p-5 hover:shadow-accent hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-elevated rounded-lg">
                  <FolderOpen size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Processos</p>
                  <p className="text-sm text-muted">Consultar valuations já criados</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
