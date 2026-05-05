// components/RegistrarPagamentos.tsx
// Tela de pagamento rápido: 1 clique para pagar, 2 cliques para valor diferente

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Fragment } from 'react'
import { createClient } from '@supabase/supabase-js'
import type {
  PagamentoComDetalhe,
  FiltroMes,
  RegistrarPagamentoPayload,
} from '@/types/database'
import { fetchAllByRange } from '@/lib/supabase-paginate'

// ── Supabase client (instanciar no topo do app, não aqui) ──────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// ── Utilitários ────────────────────────────────────────────────
const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

const hoje = () => new Date().toISOString().split('T')[0]

const shiftMonth = (mes: string, delta: number) => {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(y, (m - 1) + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

const formatMes = (mes: string) => {
  const [y, m] = mes.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1))
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// ── Tipos locais ───────────────────────────────────────────────
type FormState = {
  valor: string
  tipo: string
  observacao: string
}

// ── Hooks ──────────────────────────────────────────────────────
function usePagamentosMes(mes: string) {
  const [dados, setDados] = useState<PagamentoComDetalhe[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [recebidoMes, setRecebidoMes] = useState({ valor: 0, parcelas: 0 })

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const inicio = `${mes}-01`
    const fim    = `${mes}-31`

    const { data, error } = await fetchAllByRange<PagamentoComDetalhe>(async (from, to) => (
      await supabase
        .from('v_pagamentos_mes')
        .select('*')
        .gte('data_vencimento', inicio)
        .lte('data_vencimento', fim)
        .order('dia_vencimento')
        .order('nome_cliente')
        .range(from, to)
    ))

    if (error) {
      setErro(error.message)
    } else {
      setDados(data as PagamentoComDetalhe[])
    }

    // "Recebido" deve refletir caixa do mês (data de pagamento), não mês de vencimento.
    const { data: pagosMes, error: erroPagosMes } = await fetchAllByRange<{ valor_pago: number | null }>(async (from, to) => (
      await supabase
        .from('pagamentos')
        .select('valor_pago')
        .eq('foi_pago', true)
        .gte('data_pagamento', inicio)
        .lte('data_pagamento', fim)
        .range(from, to)
    ))

    if (erroPagosMes) {
      setErro(erroPagosMes.message)
      setRecebidoMes({ valor: 0, parcelas: 0 })
    } else {
      const arr = pagosMes ?? []
      setRecebidoMes({
        valor: arr.reduce((a, p) => a + (p.valor_pago ?? 0), 0),
        parcelas: arr.length,
      })
    }
    setLoading(false)
  }, [mes])

  return { dados, loading, erro, carregar, recebidoMes }
}

// ── Componente principal ───────────────────────────────────────
interface Props {
  mes?: string   // "2026-05" — default: mês corrente
}

export default function RegistrarPagamentos({ mes }: Props) {
  const [mesInterno, setMesInterno] = useState(new Date().toISOString().slice(0, 7))
  const mesSelecionado = mes ?? mesInterno

  const { dados, loading, erro, carregar, recebidoMes } = usePagamentosMes(mesSelecionado)

  const [filtro, setFiltro]         = useState<FiltroMes>('todos')
  const [formAberto, setFormAberto] = useState<string | null>(null)  // pagamento_id
  const [forms, setForms]           = useState<Record<string, FormState>>({})
  const [salvando, setSalvando]     = useState<string | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  // ── Carregar ao montar ────────────────────────────────────────
  useEffect(() => { carregar() }, [carregar])

  // ── Filtro ────────────────────────────────────────────────────
  const lista = useMemo(() => {
    return dados.filter(p => {
      if (filtro === 'pendente') return !p.foi_pago
      if (filtro === 'atrasado') return !p.foi_pago && new Date(p.data_vencimento) < new Date()
      if (filtro === 'pago')     return p.foi_pago
      if (filtro === 5)          return p.dia_vencimento === 5
      if (filtro === 10)         return p.dia_vencimento === 10
      if (filtro === 15)         return p.dia_vencimento === 15
      return true
    })
  }, [dados, filtro])

  // ── Resumo ────────────────────────────────────────────────────
  const resumo = useMemo(() => {
    const pendentes = dados.filter(p => !p.foi_pago)
    const atrasadas = pendentes.filter(p => new Date(p.data_vencimento) < new Date())
    return {
      recebido:  recebidoMes.valor,
      pagas:     recebidoMes.parcelas,
      pendente:  pendentes.reduce((a, p) => a + p.valor_referencia, 0),
      pendentes: pendentes.length,
      atraso:    atrasadas.reduce((a, p) => a + p.valor_referencia, 0),
      atrasadas: atrasadas.length,
    }
  }, [dados, recebidoMes])

  // ── Exibir toast ──────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  // ── Pagar com valor exato — 1 clique ──────────────────────────
  const pagar = async (p: PagamentoComDetalhe) => {
    setSalvando(p.id)
    const payload: RegistrarPagamentoPayload = {
      pagamento_id:    p.id,
      valor_pago:      p.valor_referencia,
      data_pagamento:  hoje(),
    }
    await salvarPagamento(payload, p)
    setSalvando(null)
  }

  // ── Pagar com valor customizado — 2 cliques ───────────────────
  const abrirForm = (p: PagamentoComDetalhe) => {
    setFormAberto(prev => prev === p.id ? null : p.id)
    setForms(prev => ({
      ...prev,
      [p.id]: prev[p.id] ?? {
        valor:      p.valor_referencia.toFixed(2),
        tipo:       'Parcela normal',
        observacao: '',
      },
    }))
  }

  const pagarCustom = async (p: PagamentoComDetalhe) => {
    const f = forms[p.id]
    if (!f) return
    const valor = parseFloat(f.valor)
    if (isNaN(valor) || valor <= 0) return

    setSalvando(p.id)
    const payload: RegistrarPagamentoPayload = {
      pagamento_id:   p.id,
      valor_pago:     valor,
      data_pagamento: hoje(),
      observacao:     [f.tipo !== 'Parcela normal' ? f.tipo : '', f.observacao]
                        .filter(Boolean).join(' — ') || undefined,
    }
    await salvarPagamento(payload, p)
    setFormAberto(null)
    setSalvando(null)
  }

  // ── Persistência ──────────────────────────────────────────────
  const salvarPagamento = async (
    payload: RegistrarPagamentoPayload,
    p: PagamentoComDetalhe,
  ) => {
    const res = await fetch('/api/pagamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'registrar',
        pagamento_id: payload.pagamento_id,
        venda_id: p.venda_id,
        valor_pago: payload.valor_pago,
        data_pagamento: payload.data_pagamento,
        observacao: payload.observacao,
      }),
    })
    const json = await res.json()
    if (!res.ok || !json?.ok) {
      showToast(`Erro: ${json?.message ?? 'Falha ao registrar pagamento'}`)
      return
    }

    showToast(`${p.chacara} · ${p.nome_cliente} — ${fmtBRL(payload.valor_pago)} registrado!`)
    await carregar()
  }

  const desfazer = async (p: PagamentoComDetalhe) => {
    const res = await fetch('/api/pagamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'desfazer',
        pagamento_id: p.id,
        venda_id: p.venda_id,
      }),
    })
    const json = await res.json()
    if (!res.ok || !json?.ok) {
      showToast(`Erro ao desfazer: ${json?.message ?? 'Falha ao desfazer pagamento'}`)
      return
    }

    showToast(`Pagamento de ${p.nome_cliente} desfeito`)
    await carregar()
  }

  // ── Hint de saldo inline ──────────────────────────────────────
  const hintSaldo = (p: PagamentoComDetalhe, valorStr: string) => {
    const v    = parseFloat(valorStr) || 0
    const diff = v - p.valor_referencia
    if (Math.abs(diff) < 0.05) return { texto: 'Valor exato', cor: 'text-[color:var(--cl-btn-success-fg)] bg-[color:var(--cl-btn-success-bg)]' }
    if (diff < 0) return {
      texto: `Falta ${fmtBRL(Math.abs(diff))}`,
      cor: 'text-[color:var(--cl-badge-warning-fg)] bg-[color:var(--cl-badge-warning-bg)]',
    }
    return {
      texto: `Crédito ${fmtBRL(diff)}`,
      cor: 'text-[color:var(--cl-badge-info-fg)] bg-[color:var(--cl-badge-info-bg)]',
    }
  }

  // ── Render ────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-48 text-sm text-[color:var(--cl-t7)]">
      Carregando pagamentos…
    </div>
  )

  if (erro) return (
    <div className="text-sm text-[color:var(--cl-badge-danger-fg)] p-4 bg-[color:var(--cl-badge-danger-bg)] rounded-lg">{erro}</div>
  )

  const filtros: { label: string; value: FiltroMes; cls?: string }[] = [
    { label: `Todos (${dados.length})`,       value: 'todos' },
    { label: `Atrasados (${resumo.atrasadas})`, value: 'atrasado', cls: 'border-[color:var(--cl-badge-danger-bg)] text-[color:var(--cl-badge-danger-fg)]' },
    { label: `Pendentes (${resumo.pendentes})`, value: 'pendente', cls: 'border-[color:var(--cl-badge-warning-bg)] text-[color:var(--cl-badge-warning-fg)]' },
    { label: `Pagos (${resumo.pagas})`,        value: 'pago' },
    { label: 'Dia 5',  value: 5 },
    { label: 'Dia 10', value: 10 },
    { label: 'Dia 15', value: 15 },
  ]

  return (
    <div className="relative">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[color:var(--cl-pb)] text-[color:var(--cl-pf)] text-xs font-medium px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Cabeçalho + filtros */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-sm font-medium text-[color:var(--cl-th)]">Registrar pagamentos</h1>
          <p className="text-xs text-[color:var(--cl-t7)] mt-0.5">
            Clique em <strong>Pagar</strong> para quitar · lápis para valor diferente
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filtros.map(f => (
            <button
              key={String(f.value)}
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                filtro === f.value
                  ? 'bg-[color:var(--cl-pb)] text-[color:var(--cl-pf)] border-[color:var(--cl-pb)]'
                  : `bg-[color:var(--cl-bg)] border-[color:var(--cl-bd)] text-[color:var(--cl-t5)] hover:border-[color:var(--cl-bd5)] ${f.cls ?? ''}`
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <div className="mb-3 flex items-center justify-center gap-3">
        <button
          onClick={() => setMesInterno((prev) => shiftMonth(mes ?? prev, -1))}
          className="px-2 py-1 rounded-md text-xs border border-[color:var(--cl-bd)] text-[color:var(--cl-t5)] hover:border-[color:var(--cl-bd5)]"
          title="Mês anterior"
        >
          ←
        </button>
        <div className="min-w-44 text-center text-sm font-medium text-[color:var(--cl-th)] capitalize">
          {formatMes(mesSelecionado)}
        </div>
        <button
          onClick={() => setMesInterno((prev) => shiftMonth(mes ?? prev, 1))}
          className="px-2 py-1 rounded-md text-xs border border-[color:var(--cl-bd)] text-[color:var(--cl-t5)] hover:border-[color:var(--cl-bd5)]"
          title="Próximo mês"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { label: 'Recebido',       value: fmtBRL(resumo.recebido),  sub: `${resumo.pagas} parcelas` },
          { label: 'Pendente',       value: fmtBRL(resumo.pendente),  sub: `${resumo.pendentes} parcelas abertas` },
          { label: 'Em atraso',      value: fmtBRL(resumo.atraso),    sub: `${resumo.atrasadas} contratos`, danger: true },
        ].map(c => (
          <div key={c.label} className="bg-[color:var(--cl-bgr)] rounded-lg px-3 py-2.5">
            <div className="text-xs text-[color:var(--cl-t7)] mb-1">{c.label}</div>
            <div className={`text-base font-medium ${c.danger ? 'text-[color:var(--cl-badge-danger-fg)]' : 'text-[color:var(--cl-th)]'}`}>
              {c.value}
            </div>
            <div className="text-xs text-[color:var(--cl-t7)] mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="border border-[color:var(--cl-bd)] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[color:var(--cl-bgr)] border-b border-[color:var(--cl-bd)]">
            <tr>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-14">Venc.</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-16">Chácara</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal">Cliente</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-16">Parcela</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-24">Valor ref.</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-20">Status</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-28">Pago em</th>
              <th className="px-3 py-2 w-36"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map(p => {
              const isPago     = p.foi_pago
              const isAtrasado = !isPago && new Date(p.data_vencimento) < new Date()
              const formOpen   = formAberto === p.id
              const f          = forms[p.id]

              return (
                <Fragment key={p.id}>
                  {/* Linha principal */}
                  <tr
                    className={`border-b border-[color:var(--cl-bd4)] transition-colors ${
                      isPago ? 'bg-[color:var(--cl-bgr)] opacity-60' : 'hover:bg-[color:var(--cl-bgr)]'
                    }`}
                  >
                    <td className="px-3 py-2.5 text-[color:var(--cl-t5)]">Dia {p.dia_vencimento}</td>
                    <td className="px-3 py-2.5 font-medium text-[color:var(--cl-th)]">{p.chacara}</td>
                    <td className="px-3 py-2.5 text-[color:var(--cl-t2)]">{p.nome_cliente}</td>
                    <td className="px-3 py-2.5 text-[color:var(--cl-t5)]">{p.numero_parcela}ª</td>
                    <td className="px-3 py-2.5 text-[color:var(--cl-t2)]">{fmtBRL(p.valor_referencia)}</td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      {isPago ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[color:var(--cl-badge-success-bg)] text-[color:var(--cl-badge-success-fg)]">Pago</span>
                      ) : isAtrasado ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[color:var(--cl-badge-danger-bg)] text-[color:var(--cl-badge-danger-fg)]">Atrasado</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[color:var(--cl-badge-warning-bg)] text-[color:var(--cl-badge-warning-fg)]">Pendente</span>
                      )}
                    </td>

                    {/* Data / valor pago */}
                    <td className="px-3 py-2.5 text-[color:var(--cl-t5)]">
                      {isPago && p.data_pagamento && (
                        <span>
                          {fmtDate(p.data_pagamento)}
                          {p.valor_pago !== p.valor_referencia && (
                            <span className="ml-1 text-[color:var(--cl-badge-info-fg)]">{fmtBRL(p.valor_pago!)}</span>
                          )}
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        {isPago ? (
                          <button
                            onClick={() => desfazer(p)}
                            className="px-2.5 py-1 rounded-md text-xs border border-[color:var(--cl-bd)] text-[color:var(--cl-t7)] hover:text-[color:var(--cl-t4)] hover:border-[color:var(--cl-bd5)] transition-colors"
                          >
                            Desfazer
                          </button>
                        ) : (
                          <>
                            {/* BOTÃO PRINCIPAL — 1 clique */}
                            <button
                              onClick={() => pagar(p)}
                              disabled={salvando === p.id}
                              className="px-3 py-1 rounded-md text-xs font-medium bg-[color:var(--cl-btn-success-bg)] text-[color:var(--cl-btn-success-fg)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                            >
                              {salvando === p.id ? '…' : 'Pagar'}
                            </button>

                            {/* LÁPIS — abre form inline (2º clique) */}
                            <button
                              onClick={() => abrirForm(p)}
                              className={`p-1 rounded-md border transition-colors ${
                                formOpen
                                  ? 'border-[color:var(--cl-bd5)] bg-[color:var(--cl-bgh)]'
                                  : 'border-[color:var(--cl-bd)] text-[color:var(--cl-t7)] hover:text-[color:var(--cl-t4)] hover:border-[color:var(--cl-bd5)]'
                              }`}
                              title="Valor diferente"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Formulário inline — expande abaixo da linha */}
                  {formOpen && f && (
                    <tr className="border-b border-[color:var(--cl-bd4)] bg-[color:var(--cl-bgr)]">
                      <td colSpan={8} className="px-3 py-3">
                        <div className="flex items-end gap-3 flex-wrap">

                          {/* Valor */}
                          <div className="w-32">
                            <label className="block text-xs text-[color:var(--cl-t7)] mb-1">Valor recebido</label>
                            <input
                              type="number"
                              step="0.01"
                              value={f.valor}
                              autoFocus
                              onChange={e =>
                                setForms(prev => ({ ...prev, [p.id]: { ...f, valor: e.target.value } }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-[color:var(--cl-bdi)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)] bg-[color:var(--cl-bg)]"
                            />
                          </div>

                          {/* Tipo */}
                          <div className="w-44">
                            <label className="block text-xs text-[color:var(--cl-t7)] mb-1">Tipo</label>
                            <select
                              value={f.tipo}
                              onChange={e =>
                                setForms(prev => ({ ...prev, [p.id]: { ...f, tipo: e.target.value } }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-[color:var(--cl-bdi)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)] bg-[color:var(--cl-bg)]"
                            >
                              <option>Parcela normal</option>
                              <option>Pagamento parcial</option>
                              <option>Pagamento duplo</option>
                              <option>Crédito / adiantamento</option>
                            </select>
                          </div>

                          {/* Observação */}
                          <div className="flex-1 min-w-32">
                            <label className="block text-xs text-[color:var(--cl-t7)] mb-1">Observação (opcional)</label>
                            <input
                              type="text"
                              value={f.observacao}
                              placeholder="Ex: pagou junto parcela anterior"
                              onChange={e =>
                                setForms(prev => ({ ...prev, [p.id]: { ...f, observacao: e.target.value } }))
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-[color:var(--cl-bdi)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)] bg-[color:var(--cl-bg)]"
                            />
                          </div>

                          {/* Hint saldo */}
                          {(() => {
                            const h = hintSaldo(p, f.valor)
                            return (
                              <span className={`text-xs px-2 py-1 rounded-md font-medium mb-0.5 ${h.cor}`}>
                                {h.texto}
                              </span>
                            )
                          })()}

                          {/* Confirmar */}
                          <button
                            onClick={() => pagarCustom(p)}
                            disabled={salvando === p.id}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-[color:var(--cl-btn-success-bg)] text-[color:var(--cl-btn-success-fg)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 mb-0.5"
                          >
                            {salvando === p.id ? 'Salvando…' : 'Confirmar'}
                          </button>

                          <button
                            onClick={() => setFormAberto(null)}
                            className="px-2.5 py-1.5 rounded-md text-xs border border-[color:var(--cl-bd)] text-[color:var(--cl-t7)] hover:text-[color:var(--cl-t4)] mb-0.5"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}

            {lista.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-xs text-[color:var(--cl-t7)]">
                  Nenhum pagamento encontrado para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
