'use client'

import { useState, useMemo } from 'react'
import { fmtBRL } from '@/lib/domain'
import {
  Avatar, Badge, ProgressBar, Card, Icon, Button,
  Input, Select, FieldLabel, SectionHeader, Toast, FilterPill, TH, TD,
} from '@/components/ui'
import { useRuntimeData } from '@/hooks/useRuntimeData'

interface Props {
  onOpenExtrato: (vendaId: string) => void
}

export default function Contratos({ onOpenExtrato }: Props) {
  const { vendas, clientes, pagamentosMes } = useRuntimeData()
  const [selected, setSelected] = useState(new Set<string>())
  const [filtro, setFiltro] = useState<'todos' | 'em_dia' | 'atrasado'>('todos')
  const [busca, setBusca] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const vendasFull = useMemo(() => vendas.map(v => {
    const cliente = clientes.find(c => c.id === v.cliente_id)
    if (!cliente) return null
    const pagaAtual = pagamentosMes.find(p => p.venda_id === v.id)
    return {
      ...v, cliente,
      pago_mes: pagaAtual?.foi_pago ?? false,
      pagamento_id: pagaAtual?.id,
      valor_mes: pagaAtual?.valor_referencia ?? v.valor_parcela,
      pct_pago: (v.parcelas_pagas / v.total_parcelas) * 100,
    }
  }).filter(Boolean), [vendas, clientes, pagamentosMes]) as any[]

  const lista = useMemo(() => {
    let l = vendasFull
    if (filtro !== 'todos') l = l.filter(v => v.status === filtro)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      l = l.filter(v => v.cliente.nome.toLowerCase().includes(q) || v.chacara.toLowerCase().includes(q))
    }
    return l
  }, [vendasFull, filtro, busca])

  const toggleAll = () => {
    if (selected.size === lista.filter(v => !v.pago_mes).length) setSelected(new Set())
    else setSelected(new Set(lista.filter(v => !v.pago_mes).map(v => v.id)))
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const selecionados = lista.filter(v => selected.has(v.id) && !v.pago_mes)
  const totalSel = selecionados.reduce((a, v) => a + v.valor_mes, 0)

  const aplicarBulk = () => {
    setToast(`${selecionados.length} pagamentos registrados · ${fmtBRL(totalSel)}`)
    setSelected(new Set())
    setBulkOpen(false)
  }

  return (
    <div>
      <Toast message={toast} onClose={() => setToast(null)} />
      <SectionHeader title="Contratos"
        subtitle={`${vendas.length} contratos ativos · Rancho da Montanha`}
        right={<Button variant="primary" size="md">{Icon.plus} Nova venda</Button>}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cl-t7)' }}>{Icon.search}</span>
          <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente ou chácara…" style={{ paddingLeft: 30 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <FilterPill label="Todos" active={filtro === 'todos'} onClick={() => setFiltro('todos')} />
          <FilterPill label="Em dia" active={filtro === 'em_dia'} onClick={() => setFiltro('em_dia')} />
          <FilterPill label="Atrasados" active={filtro === 'atrasado'} onClick={() => setFiltro('atrasado')} />
        </div>
      </div>

      {selected.size > 0 && (
        <div style={{
          padding: '10px 16px', background: 'var(--cl-callout-info-bg)', border: '1px solid var(--cl-callout-info-border)',
          borderRadius: 10, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--cl-callout-info-fg)' }}>
            {selecionados.length} contratos selecionados · {fmtBRL(totalSel)}
          </span>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
          <Button variant="primary" onClick={() => setBulkOpen(true)}>Registrar pagamento em lote</Button>
        </div>
      )}

      <div style={{ border: '1px solid var(--cl-bd)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--cl-bgr)', borderBottom: '1px solid var(--cl-bd)' }}>
            <tr>
              <th style={{ ...TH, width: 36 }}>
                <input type="checkbox"
                  checked={selected.size > 0 && selected.size === lista.filter(v => !v.pago_mes).length}
                  onChange={toggleAll}
                />
              </th>
              <th style={{ ...TH, width: 70 }}>Chácara</th>
              <th style={TH}>Cliente</th>
              <th style={{ ...TH, width: 90 }}>Venc.</th>
              <th style={{ ...TH, width: 100 }}>Parcela</th>
              <th style={{ ...TH, width: 130 }}>Progresso</th>
              <th style={{ ...TH, width: 90 }}>Status</th>
              <th style={{ ...TH, width: 90 }}>Mês atual</th>
              <th style={{ ...TH, width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {lista.map(v => (
              <tr key={v.id}
                onClick={() => onOpenExtrato(v.id)}
                style={{ borderBottom: '1px solid var(--cl-bd4)', cursor: 'pointer' }}>
                <td style={TD} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(v.id)} disabled={v.pago_mes} onChange={() => toggle(v.id)} />
                </td>
                <td style={{ ...TD, fontWeight: 600, color: 'var(--cl-th)' }}>{v.chacara}</td>
                <td style={TD}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar nome={v.cliente.nome} size={22} />
                    <span>
                      {v.cliente.nome}
                      <span style={{ fontSize: 10, color: 'var(--cl-t7)', marginLeft: 6 }}>
                        {v.indice_ajuste !== 'nenhum' ? v.indice_ajuste : ''}
                      </span>
                    </span>
                  </span>
                </td>
                <td style={{ ...TD, color: 'var(--cl-t5)' }}>Dia {v.dia_vencimento}</td>
                <td style={TD}>{fmtBRL(v.valor_parcela)}</td>
                <td style={TD}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={v.pct_pago} color={v.status === 'atrasado' ? 'var(--cl-chart-stroke-despesa)' : 'var(--cl-chart-stroke-receita)'} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--cl-t7)', minWidth: 48 }}>{v.parcelas_pagas}/{v.total_parcelas}</span>
                  </div>
                </td>
                <td style={TD}>
                  {v.status === 'em_dia' ? <Badge tone="success">Em dia</Badge> : <Badge tone="danger">Atrasado</Badge>}
                </td>
                <td style={TD}>
                  {v.pago_mes ? <Badge tone="success">{Icon.check} Pago</Badge> : <Badge tone="muted">Pendente</Badge>}
                </td>
                <td style={{ ...TD, color: 'var(--cl-t7)' }}>{Icon.chevronR}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk modal */}
      {bulkOpen && (
        <div onClick={() => setBulkOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'oklch(0 0 0 / 0.55)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--cl-bg)', borderRadius: 14, padding: 22, width: 460,
            boxShadow: '0 24px 48px -12px oklch(0 0 0 / 0.35)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--cl-th)' }}>Registrar {selecionados.length} pagamentos</h2>
            <p style={{ fontSize: 12, color: 'var(--cl-t6)', margin: '4px 0 16px 0' }}>
              Total a registrar: <strong style={{ color: 'var(--cl-t1)' }}>{fmtBRL(totalSel)}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <FieldLabel>Data de pagamento</FieldLabel>
                <Input type="date" value={new Date().toISOString().slice(0, 10)} onChange={() => {}} />
              </div>
              <div>
                <FieldLabel>Tipo</FieldLabel>
                <Select value="normal" onChange={() => {}}>
                  <option>Parcela normal</option>
                  <option>Valor exato de cada</option>
                </Select>
              </div>
            </div>

            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--cl-bd)', borderRadius: 10, marginBottom: 14 }}>
              {selecionados.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--cl-bd4)' }}>
                  <Avatar nome={v.cliente.nome} size={22} />
                  <span style={{ flex: 1, fontSize: 12 }}>{v.chacara} · {v.cliente.nome}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--cl-th)' }}>{fmtBRL(v.valor_mes)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={() => setBulkOpen(false)}>Cancelar</Button>
              <Button variant="primary" onClick={aplicarBulk}>Registrar tudo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
