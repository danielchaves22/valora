import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Skeleton } from '@/components/ui/Skeleton'
import { AccessGuard } from '@/components/ui/AccessGuard'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useToast } from '@/components/ui/ToastContext'
import { Plus, Users as UsersIcon, Edit2, Trash2 } from 'lucide-react'
import api from '@/lib/api'

type Role = 'USER' | 'SUPERUSER' | 'ADMIN'

interface Company {
  id: number
  name: string
  code: number
}

interface UserCompany {
  company: Company
  role: Role
}

interface User {
  id: number
  name: string
  email: string
  companies: UserCompany[]
}

export default function UsersPage() {
  const router = useRouter()
  const confirmation = useConfirmation()
  const { addToast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao carregar Usuarios'
      setError(errorMsg)
      addToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  function openNewForm() {
    router.push('/admin/users/new')
  }

  function openEditForm(user: User) {
    router.push(`/admin/users/${user.id}`)
  }

  async function handleDelete(user: User) {
    confirmation.confirm(
      {
        title: 'Confirmar Exclusao',
        message: `Tem certeza que deseja excluir o Usuario "${user.name}"? Esta acao nao pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger',
      },
      async () => {
        try {
          await api.delete(`/users/${user.id}`)
          addToast('Usuario excluido com sucesso', 'success')
          fetchUsers()
        } catch (err: any) {
          addToast(err.response?.data?.error || 'Erro ao excluir Usuario', 'error')
          throw err
        }
      }
    )
  }

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Usuarios' }]} />

      <AccessGuard requiredRole="SUPERUSER">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Usuarios</h1>
          <Button variant="accent" onClick={openNewForm} className="flex items-center gap-2" disabled={formLoading}>
            <Plus size={16} />
            Novo Usuario
          </Button>
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
              <Button variant="outline" onClick={fetchUsers}>Tentar Novamente</Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              <UsersIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400 mb-4">Nenhum Usuario encontrado</p>
              <Button variant="accent" onClick={openNewForm} className="inline-flex items-center gap-2">
                <Plus size={16} />
                Criar Primeiro Usuario
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-muted bg-elevated uppercase text-xs border-b border-soft">
                  <tr>
                    <th className="px-4 py-3 text-center w-24">Acoes</th>
                    <th className="px-4 py-3 text-left">Nome</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Empresas</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-soft hover:bg-elevated">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-center">
                          <button onClick={() => openEditForm(u)} className="p-1 text-gray-300 hover:text-[#2563eb]" title="Editar" disabled={formLoading}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(u)} className="p-1 text-gray-300 hover:text-red-400" title="Excluir" disabled={formLoading}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-300">{u.email}</td>
                      <td className="px-4 py-3 text-gray-300">{u.companies.map(uc => uc.company.name).join(', ')}</td>
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
      </AccessGuard>
    </DashboardLayout>
  )
}
