// src/app/layout-app.tsx — Shell principal com sidebar e roteamento
'use client'

import { useState, useCallback, useEffect } from 'react'
import RegistrarPagamentos from '@/components/RegistrarPagamentos'
import Gastos              from '@/components/Gastos'
import Socios              from '@/components/Socios'
import Dashboard           from '@/components/Dashboard'
import Contratos           from '@/components/Contratos'
import NovaVenda           from '@/components/NovaVenda'
import ExtratoCliente      from '@/components/ExtratoCliente'
import Clientes            from '@/components/Clientes'
import ChacarasComponent   from '@/components/Chacaras'
import Importar            from '@/components/Importar'
import { Avatar, Icon, Card, SectionHeader } from '@/components/ui'
import { labelMes } from '@/lib/domain'
import { useRuntimeData } from '@/hooks/useRuntimeData'

const THEME_KEY = 'fall-erp-theme'

function applyTheme(mode: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', mode)
}

type Tela =
  | 'dashboard' | 'pagamentos' | 'contratos' | 'novavenda'
  | 'extrato'   | 'gastos'     | 'socios'    | 'clientes'
  | 'chacaras'  | 'importar'

interface NavItem {
  id: Tela
  label: string
  icon: React.ReactNode
  section?: string
}

const NAV: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',           icon: Icon.grid,     section: 'Principal' },
  { id: 'pagamentos', label: 'Registrar pagamento', icon: Icon.plus },
  { id: 'contratos',  label: 'Contratos',           icon: Icon.list },
  { id: 'novavenda',  label: 'Nova venda',          icon: Icon.plus },
  { id: 'gastos',     label: 'Gastos e despesas',   icon: Icon.cash,     section: 'Financeiro' },
  { id: 'socios',     label: 'Sócios',              icon: Icon.users },
  { id: 'clientes',   label: 'Clientes',            icon: Icon.person,   section: 'Cadastros' },
  { id: 'chacaras',   label: 'Mapa de chácaras',    icon: Icon.building },
  { id: 'importar',   label: 'Importar planilha',   icon: Icon.upload },
]

export default function AppShell() {
  const { chacaras } = useRuntimeData()
  const [tela, setTela]       = useState<Tela>('dashboard')
  const [extrato, setExtrato] = useState<string | null>(null)
  const [dark, setDark]       = useState(false)

  const mesCorrente = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    const isDark = stored === 'dark'
    // Hidrata preferência do localStorage (client-only); estado inicial é light no SSR
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync theme after mount
    setDark(isDark)
    applyTheme(isDark ? 'dark' : 'light')
  }, [])

  const openExtrato = useCallback((vendaId: string) => {
    setExtrato(vendaId)
    setTela('extrato')
  }, [])

  const toggleDark = () => {
    setDark(prev => {
      const next = !prev
      const mode = next ? 'dark' : 'light'
      localStorage.setItem(THEME_KEY, mode)
      applyTheme(mode)
      return next
    })
  }

  const navTo = (id: Tela) => {
    setTela(id)
    if (id !== 'extrato') setExtrato(null)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--cl-bg)' }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid var(--cl-bd)',
        background: 'var(--cl-bgr)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--cl-bd)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, oklch(0.40 0.13 145), oklch(0.55 0.15 145))',
              color: 'var(--cl-na)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em',
            }}>RM</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.1, color: 'var(--cl-th)' }}>Rancho da Montanha</div>
              <div style={{ fontSize: 10.5, color: 'var(--cl-t7)', marginTop: 2 }}>Fall ERP</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto' }}>
          {NAV.map(item => (
            <div key={item.id}>
              {item.section && (
                <div style={{
                  padding: '10px 12px 4px 12px', fontSize: 9.5,
                  color: 'var(--cl-t8)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {item.section}
                </div>
              )}
              <button
                onClick={() => navTo(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 11px', borderRadius: 7,
                  background: tela === item.id ? 'var(--cl-bg)' : 'transparent',
                  color: tela === item.id ? 'var(--cl-th)' : 'var(--cl-t4)',
                  fontWeight: tela === item.id ? 500 : 400,
                  fontSize: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                  boxShadow: tela === item.id ? '0 1px 2px oklch(0.20 0 0 / 0.08)' : 'none',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ color: tela === item.id ? 'var(--cl-t2)' : 'var(--cl-t7)' }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        {/* Footer: avatar + dark mode toggle */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--cl-bd)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Avatar nome="Geovanin" size={28} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--cl-th)' }}>Geovanin</div>
              <div style={{ fontSize: 10, color: 'var(--cl-t7)' }}>Sócio · {labelMes(new Date().toISOString().slice(0, 7))}</div>
            </div>
            <button
              onClick={toggleDark}
              title={dark ? 'Modo claro' : 'Modo escuro'}
              type="button"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: 'var(--cl-t7)', display: 'flex', alignItems: 'center',
                borderRadius: 6, fontFamily: 'inherit',
              }}
            >
              {dark ? Icon.sun : Icon.moon}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Conteúdo principal ──────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 60px 28px' }}>
          <TelaAtiva
            tela={tela}
            mes={mesCorrente}
            extrato={extrato}
            openExtrato={openExtrato}
            goBack={() => navTo('contratos')}
          />
        </div>
      </main>
    </div>
  )
}

function TelaAtiva({
  tela, mes, extrato, openExtrato, goBack,
}: {
  tela: Tela
  mes: string
  extrato: string | null
  openExtrato: (id: string) => void
  goBack: () => void
}) {
  const { chacaras } = useRuntimeData()
  switch (tela) {
    case 'dashboard':
      return <Dashboard variation="C" />
    case 'pagamentos':
      return <RegistrarPagamentos mes={mes} />
    case 'contratos':
      return <Contratos onOpenExtrato={openExtrato} />
    case 'novavenda':
      return <NovaVenda variant="wizard" />
    case 'extrato':
      return <ExtratoCliente vendaId={extrato} variant="timeline" onBack={goBack} />
    case 'gastos':
      return <Gastos />
    case 'socios':
      return <Socios />
    case 'clientes':
      return <Clientes onOpenExtrato={openExtrato} />
    case 'chacaras':
      return (
        <div>
          <SectionHeader
            title="Mapa de chácaras"
            subtitle={`${chacaras.length} chácaras · ${chacaras.filter(c => c.status === 'disponivel').length} disponíveis · 0 em construção`}
          />
          <Card padding={18}>
            <ChacarasComponent />
          </Card>
        </div>
      )
    case 'importar':
      return <Importar />
    default:
      return null
  }
}
