'use client'

import { useMemo } from 'react'
import { fmtBRL, fmtDate, labelMes, STATUS_CHACARA } from '@/lib/domain'
import {
  Avatar, Sparkline, ProgressBar, Card, KpiTile,
  Icon, Button,
} from '@/components/ui'
import ChacarasComponent from '@/components/Chacaras'
import { useRuntimeData } from '@/hooks/useRuntimeData'

// ── Shared stats hook ──────────────────────────────────────────
function useDashStats() {
  const { pagamentosMes, gastos, vendas, chacaras, pagamentos, clientes } = useRuntimeData()
  const TODAY_ISO = new Date().toISOString().slice(0, 10)
  return useMemo(() => {
    const pagamentoComDetalhe = pagamentos.map((p) => {
      const venda = vendas.find((v) => v.id === p.venda_id)
      const cliente = venda ? clientes.find((c) => c.id === venda.cliente_id) : null
      const chacara = venda ? chacaras.find((c) => c.id === venda.chacara_id) : null
      return {
        ...p,
        nome_cliente: cliente?.nome ?? 'Cliente',
        chacara: chacara?.identificador ?? '—',
        dia_vencimento: venda?.dia_vencimento ?? Number(p.data_vencimento.slice(8, 10)),
      }
    })

    const recebidoParcelas = pagamentos
      .filter((p) => p.foi_pago)
      .reduce((a, p) => a + (p.valor_pago ?? 0), 0)
    const recebidoEntradas = vendas.reduce((a, v) => a + (v.valor_entrada ?? 0), 0)
    const recebido = recebidoEntradas + recebidoParcelas
    const pendente = pagamentosMes.filter(p => !p.foi_pago).reduce((a, p) => a + p.valor_referencia, 0)
    const atrasados = pagamentoComDetalhe.filter(p => {
      if (p.foi_pago) return false
      return p.data_vencimento < TODAY_ISO
    })
    const vencendoEssaSemana = pagamentoComDetalhe.filter(p => {
      if (p.foi_pago) return false
      const venc = new Date(p.data_vencimento)
      const hoje = new Date(TODAY_ISO)
      const diff = (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 7
    })
    const despesas = gastos.reduce((a, g) => a + g.valor, 0)
    const lucro = recebido - despesas
    const splitGeo = lucro > 0 ? lucro * 0.7 : 0
    const splitPaulo = lucro > 0 ? lucro * 0.3 : 0
    const contratosAtivos = vendas.length
    const chacarasDisponiveis = chacaras.filter(c => c.status === 'disponivel').length
    const receitaSeries = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      const m = d.toISOString().slice(0, 7)
      return pagamentos.filter(p => p.foi_pago && p.data_pagamento?.startsWith(m)).reduce((a, p) => a + (p.valor_pago ?? 0), 0)
    })
    const despesaSeries = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      const m = d.toISOString().slice(0, 7)
      return gastos.filter(g => g.data_gasto.startsWith(m)).reduce((a, g) => a + g.valor, 0)
    })
    return {
      recebido, pendente, atrasados, vencendoEssaSemana, despesas, lucro,
      splitGeo, splitPaulo, contratosAtivos, chacarasDisponiveis,
      receitaSeries, despesaSeries,
    }
  }, [pagamentosMes, gastos, vendas, chacaras, pagamentos, clientes, TODAY_ISO])
}

function Greeting() {
  const hora = new Date().getHours()
  const sauda = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--cl-th)', letterSpacing: '-0.02em', margin: 0 }}>
        {sauda}, Geovanin
      </h1>
      <p style={{ fontSize: 12, color: 'var(--cl-t6)', margin: '4px 0 0 0' }}>
        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })} — em andamento
      </p>
    </div>
  )
}

// ── Variação A — KPI cards no topo, atrasos no centro ─────────
function DashboardA() {
  const s = useDashStats()
  const todayIso = new Date().toISOString().slice(0, 10)
  return (
    <div>
      <div style={{ marginBottom: 20 }}><Greeting /></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <KpiTile label="Recebido total" value={fmtBRL(s.recebido)}
          sub={`${s.recebido > 0 ? 'Entradas + parcelas pagas' : 'Sem recebimentos'}`}
          sparkline={s.receitaSeries} tone="success" />
        <KpiTile label="Pendente" value={fmtBRL(s.pendente)}
          sub={`${s.vencendoEssaSemana.length} vencendo nesta semana`} />
        <KpiTile label="A receber" value={fmtBRL(s.atrasados.reduce((a, p) => a + p.valor_referencia, 0))}
          sub={`${s.atrasados.length} contratos a cobrar`} tone="danger" />
        <KpiTile label="Lucro líquido" value={fmtBRL(s.lucro)}
          sub={`Despesas ${fmtBRL(s.despesas)}`}
          sparkline={s.receitaSeries.map((r, i) => r - s.despesaSeries[i])} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 12 }}>
        <Card padding={0}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--cl-bd4)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-th)' }}>Cobrar hoje</div>
              <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 2 }}>
                {s.atrasados.length} contratos a receber · {fmtBRL(s.atrasados.reduce((a, p) => a + p.valor_referencia, 0))}
              </div>
            </div>
            <Button variant="default" size="sm">Ver todos {Icon.arrowRight}</Button>
          </div>
          <div>
            {s.atrasados.slice(0, 5).map(p => {
              const diasAtraso = Math.floor((new Date(todayIso).getTime() - new Date(p.data_vencimento).getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--cl-bd4)' }}>
                  <Avatar nome={p.nome_cliente} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--cl-th)' }}>{p.nome_cliente}</div>
                    <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 2 }}>
                      {p.chacara} · {p.numero_parcela}ª parcela · venceu {fmtDate(p.data_vencimento)} ({diasAtraso}d)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--cl-text-danger)' }}>{fmtBRL(p.valor_referencia)}</div>
                  </div>
                  <Button variant="default" size="sm" style={{ padding: '5px 8px' }}>{Icon.whatsapp}</Button>
                  <Button variant="primary" size="sm">Cobrar</Button>
                </div>
              )
            })}
          </div>
        </Card>

        <Card padding={16}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-th)', marginBottom: 4 }}>Distribuição do mês</div>
          <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginBottom: 14 }}>70/30 · Geovanin & Paulo</div>
          {[
            { nome: 'Geovanin', valor: s.splitGeo, hue: 250 },
            { nome: 'Paulo',    valor: s.splitPaulo, hue: 145 },
          ].map(soc => (
            <div key={soc.nome} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar nome={soc.nome} size={26} />
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--cl-t1)' }}>{soc.nome}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cl-t1)' }}>{fmtBRL(soc.valor)}</span>
              </div>
              <ProgressBar value={soc.nome === 'Geovanin' ? 70 : 30} color={`oklch(0.65 0.13 ${soc.hue})`} height={5} />
            </div>
          ))}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--cl-bd4)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--cl-t7)' }}>Receita {fmtBRL(s.recebido)}</span>
            <span style={{ color: 'var(--cl-t7)' }}>− Despesas {fmtBRL(s.despesas)}</span>
          </div>
        </Card>
      </div>

      <Card padding={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-th)' }}>Receita vs Despesas</div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 2 }}>Últimos 6 meses</div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cl-text-receita)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--cl-chart-stroke-receita)', display: 'inline-block' }} /> Receita
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cl-text-despesa)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--cl-chart-stroke-despesa)', display: 'inline-block' }} /> Despesas
            </span>
          </div>
        </div>
        <ChartReceitaDespesa />
      </Card>
    </div>
  )
}

// ── Variação B — Foco operacional ─────────────────────────────
function DashboardB() {
  const s = useDashStats()
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <Greeting />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="default" size="md">{Icon.download} Relatório</Button>
          <Button variant="primary" size="md">{Icon.plus} Nova venda</Button>
        </div>
      </div>

      <div style={{
        background: 'var(--cl-banner-danger-bg)', border: '1px solid var(--cl-banner-danger-bd)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'oklch(0.62 0.18 28)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.alert}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-banner-danger-fg)' }}>
            {s.atrasados.length} pagamentos a receber · {fmtBRL(s.atrasados.reduce((a, p) => a + p.valor_referencia, 0))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--cl-banner-danger-sub)', marginTop: 2 }}>
            Você costuma processar cobranças por dia de vencimento — comece pelo dia 5
          </div>
        </div>
        <Button variant="primary" size="md">Cobrar agora</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <KpiTile label="Recebido" value={fmtBRL(s.recebido)} sparkline={s.receitaSeries} tone="success" />
        <KpiTile label="Despesas" value={fmtBRL(s.despesas)} sparkline={s.despesaSeries} tone="danger" />
        <KpiTile label="Lucro líquido" value={fmtBRL(s.lucro)}
          sub={`Geovanin ${fmtBRL(s.splitGeo)} · Paulo ${fmtBRL(s.splitPaulo)}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card padding={0}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cl-bd4)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--cl-th)' }}>Vencendo essa semana</div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 2 }}>{s.vencendoEssaSemana.length} parcelas na próxima semana</div>
          </div>
          {s.vencendoEssaSemana.slice(0, 6).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--cl-bd4)' }}>
              <div style={{ width: 36, fontSize: 11, color: 'var(--cl-t7)' }}>Dia {p.dia_vencimento}</div>
              <div style={{ width: 44, fontSize: 11.5, fontWeight: 500 }}>{p.chacara}</div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--cl-t3)' }}>{p.nome_cliente}</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{fmtBRL(p.valor_referencia)}</div>
            </div>
          ))}
        </Card>

        <Card padding={0}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cl-bd4)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--cl-th)' }}>Receita por dia de vencimento</div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 2 }}>{labelMes(new Date().toISOString().slice(0, 7))}</div>
          </div>
          <div style={{ padding: 16 }}>
            {[5, 10, 15].map(dia => {
              const ps = s.vencendoEssaSemana.concat(s.atrasados).concat([]).filter(p => p.dia_vencimento === dia)
              const pagas = ps.filter(p => p.foi_pago)
              const total = ps.reduce((a, p) => a + p.valor_referencia, 0)
              const pago = pagas.reduce((a, p) => a + (p.valor_pago ?? 0), 0)
              const pct = total ? (pago / total) * 100 : 0
              return (
                <div key={dia} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ fontWeight: 500 }}>Dia {dia} · {ps.length} contratos</span>
                    <span style={{ color: 'var(--cl-t7)' }}>{fmtBRL(pago)} / {fmtBRL(total)}</span>
                  </div>
                  <ProgressBar value={pct} color={`oklch(0.62 0.13 ${dia === 5 ? 250 : dia === 10 ? 145 : 75})`} height={6} />
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Variação C — Visual + mapa ─────────────────────────────────
function DashboardC() {
  const s = useDashStats()
  return (
    <div>
      <div style={{ marginBottom: 20 }}><Greeting /></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 12 }}>
        <Card padding={20} style={{
          background: 'var(--cl-hero-gradient)',
          color: 'white', border: 'none',
        }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Lucro líquido acumulado
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{fmtBRL(s.lucro)}</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 16, fontSize: 11, opacity: 0.85 }}>
            {[
              { label: 'Receita',        value: s.recebido },
              { label: 'Despesas',       value: s.despesas },
              { label: 'Geovanin (70%)', value: s.splitGeo },
              { label: 'Paulo (30%)',    value: s.splitPaulo },
            ].map(item => (
              <div key={item.label}>
                <div style={{ opacity: 0.7 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{fmtBRL(item.value)}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, opacity: 0.9 }}>
            <Sparkline data={s.receitaSeries} width={300} height={30} color="var(--cl-hero-sparkline)" />
          </div>
        </Card>

        <Card padding={16}>
          <div style={{ fontSize: 12, color: 'var(--cl-t7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>A receber</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--cl-text-danger)', letterSpacing: '-0.02em' }}>
            {fmtBRL(s.atrasados.reduce((a, p) => a + p.valor_referencia, 0))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 4 }}>{s.atrasados.length} contratos a cobrar</div>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--cl-bd4)' }}>
            {s.atrasados.slice(0, 3).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <Avatar nome={p.nome_cliente} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome_cliente}</div>
                  <div style={{ fontSize: 10, color: 'var(--cl-t7)' }}>{p.chacara} · venc. {fmtDate(p.data_vencimento)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--cl-text-danger)' }}>{fmtBRL(p.valor_referencia)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-th)' }}>Mapa do empreendimento</div>
            <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 2 }}>
              {s.chacarasDisponiveis + s.contratosAtivos} chácaras · {s.contratosAtivos} contratos ativos
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
            {(Object.entries(STATUS_CHACARA) as [string, typeof STATUS_CHACARA[keyof typeof STATUS_CHACARA]][]).map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color, display: 'inline-block' }} />
                <span style={{ color: 'var(--cl-t5)' }}>{v.label}</span>
              </span>
            ))}
          </div>
        </div>
        <ChacarasComponent compact />
      </Card>
    </div>
  )
}

// ── Chart ──────────────────────────────────────────────────────
function ChartReceitaDespesa() {
  const W = 800, H = 180, PAD_L = 50, PAD_B = 24, PAD_T = 10, PAD_R = 10
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const { pagamentos, gastos } = useRuntimeData()
  const history = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const mes = d.toISOString().slice(0, 7)
    const receita = pagamentos.filter(p => p.foi_pago && p.data_pagamento?.startsWith(mes)).reduce((a, p) => a + (p.valor_pago ?? 0), 0)
    const despesas = gastos.filter(g => g.data_gasto.startsWith(mes)).reduce((a, g) => a + g.valor, 0)
    return { mes, receita, despesas }
  })
  const max = Math.max(...history.flatMap(h => [h.receita, h.despesas]), 1) * 1.1
  const xStep = innerW / (history.length - 1)
  const y = (v: number) => PAD_T + innerH - (v / max) * innerH
  const x = (i: number) => PAD_L + i * xStep
  const linePath = (key: 'receita' | 'despesas') =>
    history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(h[key])}`).join(' ')
  const areaPath = (key: 'receita' | 'despesas') =>
    `${linePath(key)} L ${x(history.length - 1)} ${PAD_T + innerH} L ${PAD_L} ${PAD_T + innerH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 200 }}>
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={PAD_L} x2={W - PAD_R} y1={PAD_T + innerH * p} y2={PAD_T + innerH * p} stroke="var(--cl-bd4)" strokeWidth="1" />
      ))}
      {[0, 0.5, 1].map(p => (
        <text key={p} x={PAD_L - 6} y={PAD_T + innerH * (1 - p) + 4} textAnchor="end" fontSize="10" fill="var(--cl-t7)">
          {(max * p / 1000).toFixed(0)}k
        </text>
      ))}
      <path d={areaPath('receita')} fill="var(--cl-chart-fill-receita)" opacity="0.55" />
      <path d={linePath('receita')} fill="none" stroke="var(--cl-chart-stroke-receita)" strokeWidth="2" strokeLinejoin="round" />
      <path d={linePath('despesas')} fill="none" stroke="var(--cl-chart-stroke-despesa)" strokeWidth="2" strokeLinejoin="round" />
      {history.map((h, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(h.receita)} r="3" fill="var(--cl-chart-stroke-receita)" />
          <circle cx={x(i)} cy={y(h.despesas)} r="3" fill="var(--cl-chart-stroke-despesa)" />
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--cl-t7)">{labelMes(h.mes)}</text>
        </g>
      ))}
    </svg>
  )
}

// ── Export ─────────────────────────────────────────────────────
type DashVariant = 'A' | 'B' | 'C'

export default function Dashboard({ variation = 'C' }: { variation?: DashVariant }) {
  if (variation === 'B') return <DashboardB />
  if (variation === 'A') return <DashboardA />
  return <DashboardC />
}
