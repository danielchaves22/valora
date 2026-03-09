import { ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';

export default function CompaniesRedirectPage() {
  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Empresas' }]} />

      <Card className="p-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-white">Gestão de empresas</h1>
          <p className="text-gray-300">
            A gestão de empresas seguirá evoluindo por aqui. Neste MVP, usamos este espaço como referência e,
            em breve, adicionaremos o CRUD completo.
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="inline-flex items-center gap-2 rounded-md bg-elevated px-4 py-2 text-sm font-medium text-muted">
              <ExternalLink size={16} />
              Em breve
            </div>
            <span className="text-sm text-gray-400">Disponível apenas para usuários ADMIN.</span>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
