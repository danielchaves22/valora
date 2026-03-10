import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/ToastContext'
import { Save, X } from 'lucide-react'
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

interface UserFormProps {
  mode: 'create' | 'edit'
  userId?: string | number
}

export function UserForm({ mode, userId }: UserFormProps) {
  const router = useRouter()
  const { userRole } = useAuth()
  const { isAdmin } = usePermissions()
  const { addToast } = useToast()

  const isEdit = mode === 'edit'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [companiesError, setCompaniesError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', newRole: 'USER' as Role })
  const [companyConfigs, setCompanyConfigs] = useState<Array<{ companyId: number; role: Role }>>([])

  useEffect(() => {
    if (isEdit && (userId === undefined || userId === null)) {
      return
    }
    const load = async () => {
      setLoading(true)
      setError(null)
      await fetchCompanies()
      if (isEdit) {
        await fetchUser()
      } else {
        setFormData({ name: '', email: '', password: '', newRole: (userRole === 'ADMIN' ? 'SUPERUSER' : 'USER') })
        setCompanyConfigs([])
      }
      setLoading(false)
    }
    load()
  }, [isEdit, userId, userRole])

  function allowedRolesByCurrentUser(): Role[] {
    if (userRole === 'ADMIN') return ['ADMIN', 'SUPERUSER', 'USER']
    if (userRole === 'SUPERUSER') return ['SUPERUSER', 'USER']
    return ['USER']
  }

  async function fetchCompanies() {
    try {
      const response = await api.get('/companies')
      setCompanies(response.data)
      setCompaniesError(null)
    } catch (err: any) {
      if (err.response?.status === 403) {
        setCompaniesError('Sem permissao para listar empresas.')
      } else {
        setCompaniesError('Erro ao carregar lista de empresas')
      }
    }
  }

  async function fetchUser() {
    if (userId === undefined || userId === null) {
      return
    }
    const id = Number(userId)
    if (isNaN(id)) {
      setError('ID de usuario invalido.')
      return
    }
    try {
      const response = await api.get(`/users/${id}`)
      const user: User = response.data
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        newRole: user.companies[0]?.role || 'USER'
      })
      setCompanyConfigs(user.companies.map(uc => ({ companyId: uc.company.id, role: uc.role })))
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao carregar usuario'
      setError(errorMsg)
    }
  }

  function toggleCompany(companyId: number) {
    const exists = companyConfigs.find(c => c.companyId === companyId)
    if (exists) {
      setCompanyConfigs(companyConfigs.filter(c => c.companyId !== companyId))
    } else {
      const role = allowedRolesByCurrentUser()[allowedRolesByCurrentUser().length - 1]
      setCompanyConfigs([...companyConfigs, { companyId, role }])
    }
  }

  function updateCompanyRole(companyId: number, role: Role) {
    setCompanyConfigs(companyConfigs.map(c => (c.companyId === companyId ? { ...c, role } : c)))
  }

  function handleCancel() {
    router.push('/admin/users')
  }

  async function handleSubmit() {
    try {
      setFormLoading(true)
      if (!formData.name.trim() || !formData.email.trim()) {
        addToast('Nome e email sao obrigatorios', 'error')
        setFormLoading(false)
        return
      }

      if (isAdmin() && companyConfigs.length === 0) {
        addToast('Selecione ao menos uma empresa', 'error')
        setFormLoading(false)
        return
      }

      if (isEdit) {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          newRole: formData.newRole,
          companies: companyConfigs,
        }
        if (formData.password) payload.password = formData.password
        await api.put(`/users/${userId}`, payload)
        addToast('Usuario atualizado com sucesso', 'success')
      } else {
        if (!formData.password) {
          addToast('Senha e obrigatoria para novos usuarios', 'error')
          setFormLoading(false)
          return
        }
        const payload: any = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          newRole: formData.newRole,
          companies: companyConfigs,
        }
        await api.post('/users', payload)
        addToast('Usuario criado com sucesso', 'success')
      }

      router.push('/admin/users')
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Erro ao salvar usuario', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded bg-elevated" />
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-10">
          <div className="text-red-400 mb-4">{error}</div>
          <Button variant="outline" onClick={handleCancel}>Voltar</Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">
          {isEdit ? 'Editar usuario' : 'Novo usuario'}
        </h1>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={formLoading} className="flex items-center gap-2">
            <X size={16} />
            Cancelar
          </Button>
          <Button variant="accent" onClick={handleSubmit} disabled={formLoading} className="flex items-center gap-2">
            <Save size={16} />
            {formLoading ? 'Salvando...' : isEdit ? 'Salvar alteracoes' : 'Criar usuario'}
          </Button>
        </div>
      </div>

      {companiesError && (
        <Card className="mb-6">
          <p className="text-sm text-red-400">{companiesError}</p>
        </Card>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nome</label>
            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome" autoFocus={!isEdit} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@dominio.com" />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Senha</label>
              <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Senha" />
            </div>
          )}
          {isEdit && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Nova senha (opcional)</label>
              <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Nova senha" />
            </div>
          )}
          <div>
            <label className="block text-sm text-muted mb-1">Papel (global)</label>
            <select
              value={formData.newRole}
              onChange={e => setFormData({ ...formData, newRole: e.target.value as Role })}
              className="px-2 py-2 bg-background border border-soft text-base-color rounded w-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              {allowedRolesByCurrentUser().map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm text-muted mb-2">Empresas</label>
          <div className="space-y-3">
            {companies.map(comp => {
              const cfg = companyConfigs.find(c => c.companyId === comp.id)
              const checked = !!cfg
              return (
                <div key={comp.id} className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-accent bg-background border-soft rounded focus:ring-accent"
                      checked={checked}
                      onChange={() => toggleCompany(comp.id)}
                    />
                    <span className="text-base-color">{comp.name}</span>
                  </label>
                  {checked && (
                    <select
                      value={cfg?.role || 'USER'}
                      onChange={e => updateCompanyRole(comp.id, e.target.value as Role)}
                      className="px-2 py-1 bg-background border border-soft text-base-color rounded focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    >
                      {allowedRolesByCurrentUser().map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </>
  )
}

export default UserForm
