'use client'

import { useState, useMemo } from 'react'
import { STATUS_CHACARA, type StatusChacara } from '@/lib/domain'
import { Badge, StatusDot, TH, TD, FilterPill } from '@/components/ui'
import { useRuntimeData } from '@/hooks/useRuntimeData'

type ChacaraView = {
  id: string
  identificador: string
  quadra: string
  numero: number
  status: StatusChacara
  cliente_id: string | null
}
type ClienteLite = { id: string; nome: string; telefone: string | null }

// ── Mapa (agrupado por quadra) ─────────────────────────────────
function ChacarasMapa({ lista }: { lista: ChacaraView[] }) {
  const quadras = useMemo(() => {
    const map: Record<string, ChacaraView[]> = {}
    lista.forEach(c => {
      if (!map[c.quadra]) map[c.quadra] = []
      map[c.quadra].push(c)
    })
    return Object.entries(map).sort()
  }, [lista])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
      {quadras.map(([q, items]) => (
        <div key={q} style={{ flex: '0 0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.05em' }}>
            QUADRA {q}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {[...items].sort((a, b) => a.numero - b.numero).map(c => {
              const s = STATUS_CHACARA[c.status]
              return (
                <div key={c.id} title={`${c.identificador} · ${s.label}`}
                  style={{
                    width: 38, height: 38, borderRadius: 6,
                    background: s.bg, border: '1px solid ' + s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, color: s.text,
                    cursor: 'pointer', transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                  {c.numero}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Card grid ──────────────────────────────────────────────────
function ChacarasCardGrid({ lista, clientes }: { lista: ChacaraView[]; clientes: ClienteLite[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
      {lista.map(c => {
        const s = STATUS_CHACARA[c.status]
        const cliente = clientes.find(cl => cl.id === c.cliente_id)
        const tone: Parameters<typeof Badge>[0]['tone'] =
          c.status === 'em_dia' ? 'success' : c.status === 'atrasado' ? 'danger'
          : c.status === 'disponivel' ? 'muted' : c.status === 'em_construcao' ? 'warning' : 'info'
        return (
          <div key={c.id} style={{ border: '1px solid var(--cl-bd)', borderRadius: 10, padding: 12, background: 'var(--cl-bg)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cl-th)' }}>{c.identificador}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, marginTop: 5, display: 'inline-block' }} />
            </div>
            <Badge tone={tone} size="sm">{s.label}</Badge>
            {cliente && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--cl-t5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cliente.nome}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Lista ──────────────────────────────────────────────────────
function ChacarasLista({ lista, clientes }: { lista: ChacaraView[]; clientes: ClienteLite[] }) {
  return (
    <div style={{ border: '1px solid var(--cl-bd)', borderRadius: 10, overflow: 'hidden' }}>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead style={{ background: 'var(--cl-bgr)', borderBottom: '1px solid var(--cl-bd)' }}>
          <tr>
            <th style={TH}>Chácara</th>
            <th style={TH}>Status</th>
            <th style={TH}>Cliente</th>
            <th style={TH}>Telefone</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(c => {
            const cliente = clientes.find(cl => cl.id === c.cliente_id)
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--cl-bd4)' }}>
                <td style={TD}><strong>{c.identificador}</strong></td>
                <td style={TD}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <StatusDot status={c.status} /> {STATUS_CHACARA[c.status].label}
                  </span>
                </td>
                <td style={TD}>{cliente?.nome || <span style={{ color: 'var(--cl-t8)' }}>—</span>}</td>
                <td style={{ ...TD, color: 'var(--cl-t7)' }}>{cliente?.telefone || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function ChacarasComponent({ compact = false }: { compact?: boolean }) {
  const { chacaras, clientes } = useRuntimeData()
  const [vis, setVis] = useState<'mapa' | 'grid' | 'lista'>('mapa')
  const [filtro, setFiltro] = useState<StatusChacara | 'todas'>('todas')

  const lista = useMemo(() => {
    if (filtro === 'todas') return chacaras
    return chacaras.filter(c => c.status === filtro)
  }, [filtro, chacaras])

  return (
    <div>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['mapa', 'grid', 'lista'] as const).map(v => (
              <button key={v} onClick={() => setVis(v)} style={{
                padding: '5px 12px', fontSize: 12, fontWeight: 500,
                background: vis === v ? 'var(--cl-solid)' : 'var(--cl-bg)',
                color: vis === v ? 'var(--cl-solid-fg)' : 'var(--cl-t4)',
                border: '1px solid ' + (vis === v ? 'var(--cl-solid)' : 'var(--cl-border-soft)'),
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              ['todas', 'Todas'],
              ['em_dia', 'Em dia'],
              ['atrasado', 'Atrasado'],
              ['disponivel', 'Disponível'],
              ['em_construcao', 'Pendente'],
              ['reservada', 'Reservada'],
            ] as const).map(([v, l]) => (
              <FilterPill key={v} label={l} active={filtro === v} onClick={() => setFiltro(v)} />
            ))}
          </div>
        </div>
      )}

      {vis === 'mapa' && <ChacarasMapa lista={lista} />}
      {vis === 'grid' && <ChacarasCardGrid lista={lista} clientes={clientes} />}
      {vis === 'lista' && <ChacarasLista lista={lista} clientes={clientes} />}
    </div>
  )
}
