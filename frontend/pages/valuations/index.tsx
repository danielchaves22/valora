import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useToast } from '@/components/ui/ToastContext'
import { TrendingUp, Eye, Trash2 } from 'lucide-react'
import api from '@/lib/api'

interface ValuationSummary {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  summary: {
    ebitdaBaseEquity: number
    fcdEquity: number
    startupValue: number
    patrimonialValue: number
  }
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

export default function ValuationListPage() {
  const confirmation = useConfirmation()
  const { addToast } = useToast()
  const [items, setItems] = useState<ValuationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchValuations() {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/valuations')
      setItems(response.data || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar valuations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchValuations()
  }, [])

  function handleDelete(item: ValuationSummary) {
    confirmation.confirm(
      {
        title: 'Confirmar Exclusao',
        message: `Tem certeza que deseja excluir o valuation \"${item.name}\"? Esta acao nao pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger',
      },
      async () => {
        try {
          await api.delete(`/valuations/${item.id}`)
          addToast('Valuation excluido com sucesso', 'success')
          fetchValuations()
        } catch (err: any) {
          addToast(err.response?.data?.error || 'Erro ao excluir valuation', 'error')
          throw err
        }
      }
    )
  }

  return (
    <DashboardLayout title="Processos">
      <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Valuation' }]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Processos de valuation</h1>
        <Link href="/valuations/new">
          <Button variant="accent">Novo valuation</Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded bg-elevated" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <div className="text-red-400 mb-4">{error}</div>
            <Button variant="outline" onClick={fetchValuations}>Tentar Novamente</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-400 mb-4">Nenhum valuation criado ainda.</p>
            <Link href="/valuations/new">
              <Button variant="accent" className="inline-flex items-center gap-2">Criar Primeiro Valuation</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-muted bg-elevated uppercase text-xs border-b border-soft">
                <tr>
                  <th className="px-4 py-3 text-center w-24">Acoes</th>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">EBITDA Base</th>
                  <th className="px-4 py-3 text-left">FCD</th>
                  <th className="px-4 py-3 text-left">Startup</th>
                  <th className="px-4 py-3 text-left">Patrimonial</th>
                  <th className="px-4 py-3 text-left">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-soft hover:bg-elevated">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-center">
                        <Link href={`/valuations/${item.id}`} className="p-1 text-gray-300 hover:text-accent" title="Abrir">
                          <Eye size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1 text-gray-300 hover:text-red-400"
                          title="Excluir"
                          disabled={confirmation.loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{item.name}</span>
                    </td>
                    <td className="px-4 py-3">{currency.format(item.summary.ebitdaBaseEquity)}</td>
                    <td className="px-4 py-3">{currency.format(item.summary.fcdEquity)}</td>
                    <td className="px-4 py-3">{currency.format(item.summary.startupValue)}</td>
                    <td className="px-4 py-3">{currency.format(item.summary.patrimonialValue)}</td>
                    <td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={confirmation.handleClose}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.options.title}
        message={confirmation.options.message}
        confirmText={confirmation.options.confirmText}
        cancelText={confirmation.options.cancelText}
        type={confirmation.options.type}
        loading={confirmation.loading}
      />
    </DashboardLayout>
  )
}
