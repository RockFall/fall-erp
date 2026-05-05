'use client'

import { useMemo } from 'react'
import { fmtBRL, fmtDate, fmtDateLong } from '@/lib/domain'
import {
  Avatar, Badge, ProgressBar, Card, Icon, Button, SectionHeader, TH, TD,
} from '@/components/ui'
import { useRuntimeData } from '@/hooks/useRuntimeData'

type ExtratoVariant = 'timeline' | 'tabela' | 'cards'

interface Parcela {
  numero: number
  data_vencimento: string
  valor: number
  foi_pago: boolean
  valor_pago: number | null
  data_pagamento: string | null
  atrasada: boolean
}

function ExtratoTimeline({ parcelas }: { parcelas: Parcela[] }) {
  const visiveis = parcelas.slice(0, 24)
  return (
    <Card padding={20}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Timeline de pagamentos</div>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: 'var(--cl-timeline-track)' }} />
        {visiveis.map(p => {
          const cor = p.foi_pago ? 'oklch(0.62 0.13 145)' : p.atrasada ? 'oklch(0.62 0.18 28)' : 'var(--cl-timeline-pending)'
          return (
            <div key={p.numero} style={{ position: 'relative', paddingBottom: 14 }}>
              <div style={{
                position: 'absolute', left: -22, top: 4, width: 16, height: 16, borderRadius: '50%',
                background: 'var(--cl-bg)', border: `2px solid ${cor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: cor,
              }}>
                {p.foi_pago && <span style={{ fontSize: 9 }}>✓</span>}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                background: p.atrasada ? 'var(--cl-surface-atraso)' : 'var(--cl-bgr)', borderRadius: 8,
              }}>
                <span style={{ fontSize: 11, color: 'var(--cl-t7)', width: 60 }}>{p.numero}ª parcela</span>
                <span style={{ fontSize: 12, fontWeight: 500, width: 90 }}>{fmtDate(p.data_vencimento)}/{p.data_vencimento.slice(0, 4)}</span>
                <span style={{ fontSize: 12 }}>{fmtBRL(p.valor)}</span>
                <div style={{ flex: 1 }} />
                {p.foi_pago
                  ? <Badge tone="success">Pago em {fmtDate(p.data_pagamento!)}</Badge>
                  : p.atrasada ? <Badge tone="danger">Atrasado</Badge>
                  : <Badge tone="muted">Aguardando</Badge>}
              </div>
            </div>
          )
        })}
      </div>
      {parcelas.length > 24 && (
        <div style={{ textAlign: 'center', paddingTop: 12, fontSize: 12, color: 'var(--cl-t7)' }}>
          + {parcelas.length - 24} parcelas futuras
        </div>
      )}
    </Card>
  )
}

function ExtratoTabela({ parcelas }: { parcelas: Parcela[] }) {
  return (
    <div style={{ border: '1px solid var(--cl-bd)', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead style={{ background: 'var(--cl-bgr)', borderBottom: '1px solid var(--cl-bd)' }}>
          <tr>
            <th style={{ ...TH, width: 80 }}>Parcela</th>
            <th style={{ ...TH, width: 100 }}>Vencimento</th>
            <th style={{ ...TH, width: 120 }}>Valor</th>
            <th style={{ ...TH, width: 100 }}>Status</th>
            <th style={{ ...TH, width: 100 }}>Pago em</th>
            <th style={TH}>Observação</th>
          </tr>
        </thead>
        <tbody>
          {parcelas.slice(0, 30).map(p => (
            <tr key={p.numero} style={{ borderBottom: '1px solid var(--cl-bd4)' }}>
              <td style={TD}>{p.numero}ª</td>
              <td style={{ ...TD, color: 'var(--cl-t5)' }}>{fmtDate(p.data_vencimento)}/{p.data_vencimento.slice(0, 4)}</td>
              <td style={TD}>{fmtBRL(p.valor)}</td>
              <td style={TD}>
                {p.foi_pago ? <Badge tone="success">Pago</Badge>
                  : p.atrasada ? <Badge tone="danger">Atrasado</Badge>
                  : <Badge tone="muted">Pendente</Badge>}
              </td>
              <td style={{ ...TD, color: 'var(--cl-t7)' }}>{p.data_pagamento ? fmtDate(p.data_pagamento) : '—'}</td>
              <td style={{ ...TD, color: 'var(--cl-t9)' }}>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExtratoCards({ parcelas }: { parcelas: Parcela[] }) {
  const porAno = useMemo(() => {
    const map: Record<string, Parcela[]> = {}
    parcelas.forEach(p => {
      const ano = p.data_vencimento.slice(0, 4)
      if (!map[ano]) map[ano] = []
      map[ano].push(p)
    })
    return Object.entries(map).sort()
  }, [parcelas])

  return (
    <Card padding={18}>
      {porAno.map(([ano, ps]) => (
        <div key={ano} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cl-t4)', marginBottom: 8 }}>{ano}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
            {Array.from({ length: 12 }, (_, m) => {
              const p = ps.find(x => parseInt(x.data_vencimento.slice(5, 7)) === m + 1)
              if (!p) return <div key={m} style={{ height: 36, borderRadius: 6, background: 'var(--cl-cal-empty)' }} />
              const tone = p.foi_pago
                ? { bg: 'var(--cl-badge-success-bg)', text: 'var(--cl-badge-success-fg)' }
                : p.atrasada ? { bg: 'var(--cl-badge-danger-bg)', text: 'var(--cl-badge-danger-fg)' }
                : { bg: 'var(--cl-cal-pending-cell)', text: 'var(--cl-t6)' }
              return (
                <div key={m} title={`${p.numero}ª · ${fmtBRL(p.valor)}`} style={{
                  height: 36, borderRadius: 6, background: tone.bg, color: tone.text,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 600,
                }}>
                  <div>{['J','F','M','A','M','J','J','A','S','O','N','D'][m]}</div>
                  <div style={{ fontSize: 8, opacity: 0.7 }}>{p.numero}</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </Card>
  )
}

interface Props {
  vendaId: string | null
  variant?: ExtratoVariant
  onBack: () => void
}

export default function ExtratoCliente({ vendaId, variant = 'timeline', onBack }: Props) {
  const { vendas, clientes, chacaras, pagamentos } = useRuntimeData()
  const venda = vendas.find(v => v.id === vendaId) ?? vendas[0]

  const parcelas = useMemo((): Parcela[] => {
    if (!venda) return []
    const hoje = new Date().toISOString().slice(0, 10)
    const reais = pagamentos
      .filter((p) => p.venda_id === venda.id)
      .sort((a, b) => a.numero_parcela - b.numero_parcela)
      .map((p) => ({
        numero: p.numero_parcela,
        data_vencimento: p.data_vencimento,
        valor: p.valor_referencia,
        foi_pago: p.foi_pago,
        valor_pago: p.valor_pago,
        data_pagamento: p.data_pagamento,
        atrasada: !p.foi_pago && p.data_vencimento < hoje,
      }))

    if (reais.length) return reais

    // Fallback defensivo caso pagamentos ainda não tenham carregado.
    const out: Parcela[] = []
    const baseDate = new Date(`${venda.data_venda}T00:00:00Z`)
    for (let i = 1; i <= venda.total_parcelas; i++) {
      const d = new Date(baseDate)
      d.setUTCMonth(d.getUTCMonth() + i)
      d.setUTCDate(venda.dia_vencimento)
      const venc = d.toISOString().slice(0, 10)
      const passada = i <= venda.parcelas_pagas
      out.push({
        numero: i,
        data_vencimento: venc,
        valor: venda.valor_parcela,
        foi_pago: passada,
        valor_pago: passada ? venda.valor_parcela : null,
        data_pagamento: passada ? venc : null,
        atrasada: !passada && venc < hoje,
      })
    }
    return out
  }, [pagamentos, venda])

  if (!venda) return null
  const cliente = clientes.find(c => c.id === venda.cliente_id)
  const chacara = chacaras.find(c => c.id === venda.chacara_id)
  if (!cliente || !chacara) return null

  const totalPago = parcelas.filter(p => p.foi_pago).reduce((a, p) => a + (p.valor_pago ?? 0), 0) + venda.valor_entrada
  const totalDevido = venda.valor_total > 0 ? venda.valor_total : (venda.valor_entrada + venda.valor_parcela * venda.total_parcelas)
  const saldoDevedor = totalDevido - totalPago
  const pct = totalDevido > 0 ? Math.min(100, (totalPago / totalDevido) * 100) : 0

  const Visual = variant === 'tabela' ? ExtratoTabela : variant === 'cards' ? ExtratoCards : ExtratoTimeline

  return (
    <div>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', fontSize: 12, color: 'var(--cl-t5)',
        marginBottom: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0,
        fontFamily: 'inherit',
      }}>
        ← Voltar para contratos
      </button>

      <Card padding={20} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar nome={cliente.nome} size={56} />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.01em', color: 'var(--cl-th)' }}>{cliente.nome}</h1>
            <div style={{ fontSize: 12, color: 'var(--cl-t7)', marginTop: 4, display: 'flex', gap: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{Icon.phone} {cliente.telefone}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{Icon.building} Chácara {chacara.identificador}</span>
              <span>Contrato desde {fmtDateLong(venda.data_venda)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="default">{Icon.whatsapp} WhatsApp</Button>
            <Button variant="default">{Icon.download} Exportar PDF</Button>
          </div>
        </div>
      </Card>

      <Card padding={20} style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progresso do contrato</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: 'var(--cl-th)' }}>{pct.toFixed(1)}%</div>
            <ProgressBar value={pct} color={venda.status === 'atrasado' ? 'var(--cl-chart-stroke-despesa)' : 'var(--cl-chart-stroke-receita)'} height={6} />
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 6 }}>{venda.parcelas_pagas} de {venda.total_parcelas} parcelas pagas</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total pago</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cl-btn-success-fg)' }}>{fmtBRL(totalPago)}</div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 4 }}>de {fmtBRL(totalDevido)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo devedor</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cl-text-danger)' }}>{fmtBRL(saldoDevedor)}</div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 4 }}>{venda.total_parcelas - venda.parcelas_pagas} parcelas restantes</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Próximo venc.</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cl-th)' }}>Dia {venda.dia_vencimento}</div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 4 }}>{fmtBRL(venda.valor_parcela)} · {venda.indice_ajuste}</div>
          </div>
        </div>
      </Card>

      <Visual parcelas={parcelas} />
    </div>
  )
}
