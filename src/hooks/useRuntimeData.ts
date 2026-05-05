'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { StatusChacara } from '@/lib/domain'

const PAGE_SIZE = 2000
const MAX_RETRIES = 2

type SelectAllResult = { data: unknown[] | null; error: { message: string } | null }

async function selectAll(table: string, query: string, orderBy?: string): Promise<SelectAllResult> {
  let lastId: string | null = null
  const out: unknown[] = []
  while (true) {
    let attempt = 0
    let data: unknown[] | null = null
    let error: { message: string } | null = null
    while (attempt <= MAX_RETRIES) {
      let req = supabase.from(table).select(query).order('id').limit(PAGE_SIZE)
      if (lastId) req = req.gt('id', lastId)
      const res = await req
      if (!res.error) {
        data = res.data ?? []
        error = null
        break
      }
      error = { message: res.error.message }
      attempt += 1
    }
    if (error) return { data: null, error }

    const batch = data ?? []
    if (!batch.length) break
    out.push(...batch)
    const last = batch[batch.length - 1] as Record<string, unknown>
    const cursor = String(last.id ?? '')
    if (!cursor) break
    lastId = cursor
  }

  if (orderBy) {
    out.sort((a, b) => {
      const av = (a as Record<string, unknown>)[orderBy]
      const bv = (b as Record<string, unknown>)[orderBy]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return String(av).localeCompare(String(bv))
    })
  }

  return { data: out, error: null }
}

type Cliente = { id: string; nome: string; telefone: string | null }
type Chacara = { id: string; identificador: string }
type Venda = {
  id: string
  cliente_id: string
  chacara_id: string
  data_venda: string
  valor_total: number
  valor_entrada: number
  total_parcelas: number
  valor_parcela: number
  dia_vencimento: number
  indice_ajuste: string
  status: 'em_dia' | 'atrasado' | 'cancelado'
}
type Pagamento = {
  id: string
  venda_id: string
  numero_parcela: number
  valor_referencia: number
  foi_pago: boolean
  valor_pago: number | null
  data_vencimento: string
  data_pagamento: string | null
}
type Gasto = { id: string; valor: number; data_gasto: string }
type PagamentoView = Pagamento & {
  nome_cliente?: string | null
  telefone?: string | null
  chacara?: string | null
  status_venda?: 'em_dia' | 'atrasado' | 'cancelado'
  dia_vencimento?: number | null
  cliente_id?: string | null
  chacara_id?: string | null
}

const slugId = (value: string, prefix: string) =>
  `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sem-id'}`

function buildFallbackFromPagamentoView(rows: PagamentoView[]) {
  const clientesMap = new Map<string, Cliente>()
  const chacarasMap = new Map<string, Chacara>()
  const vendasMap = new Map<string, Venda>()
  const pagamentos: Pagamento[] = []
  const parcelasPagasPorVenda = new Map<string, number>()
  const totalParcelasPorVenda = new Map<string, number>()
  const primeiroVencPorVenda = new Map<string, string>()

  for (const row of rows) {
    const nomeCliente = row.nome_cliente?.trim() || 'Cliente'
    const telefone = row.telefone ?? null
    const clienteId = row.cliente_id || slugId(`${nomeCliente}-${telefone ?? ''}`, 'cli')
    if (!clientesMap.has(clienteId)) {
      clientesMap.set(clienteId, { id: clienteId, nome: nomeCliente, telefone })
    }

    const identificadorChacara = row.chacara?.trim() || '—'
    const chacaraId = row.chacara_id || slugId(identificadorChacara, 'cha')
    if (!chacarasMap.has(chacaraId)) {
      chacarasMap.set(chacaraId, { id: chacaraId, identificador: identificadorChacara })
    }

    const valorReferencia = Number(row.valor_referencia) || 0
    const numeroParcela = Number(row.numero_parcela) || 1
    pagamentos.push({
      id: row.id,
      venda_id: row.venda_id,
      numero_parcela: numeroParcela,
      valor_referencia: valorReferencia,
      foi_pago: !!row.foi_pago,
      valor_pago: row.valor_pago ?? null,
      data_vencimento: row.data_vencimento,
      data_pagamento: row.data_pagamento ?? null,
    })

    if (row.foi_pago) {
      parcelasPagasPorVenda.set(row.venda_id, (parcelasPagasPorVenda.get(row.venda_id) ?? 0) + 1)
    }
    totalParcelasPorVenda.set(row.venda_id, Math.max(totalParcelasPorVenda.get(row.venda_id) ?? 0, numeroParcela))
    const primeiro = primeiroVencPorVenda.get(row.venda_id)
    if (!primeiro || row.data_vencimento < primeiro) {
      primeiroVencPorVenda.set(row.venda_id, row.data_vencimento)
    }

    if (!vendasMap.has(row.venda_id)) {
      const diaVencimento = row.dia_vencimento ?? (Number(row.data_vencimento.slice(8, 10)) || 10)
      vendasMap.set(row.venda_id, {
        id: row.venda_id,
        cliente_id: clienteId,
        chacara_id: chacaraId,
        data_venda: row.data_vencimento,
        valor_total: 0,
        valor_entrada: 0,
        total_parcelas: 1,
        valor_parcela: valorReferencia,
        dia_vencimento: diaVencimento,
        indice_ajuste: 'nenhum',
        status: row.status_venda ?? 'em_dia',
      })
    }
  }

  const vendas = Array.from(vendasMap.values()).map((venda) => {
    const totalParcelas = totalParcelasPorVenda.get(venda.id) ?? 1
    const parcela = pagamentos.find((p) => p.venda_id === venda.id)?.valor_referencia ?? venda.valor_parcela
    const primeiroVenc = primeiroVencPorVenda.get(venda.id)
    let dataVenda = venda.data_venda
    if (primeiroVenc) {
      const [yyyy, mm, dd] = primeiroVenc.split('-').map(Number)
      if (yyyy && mm && dd) {
        const base = new Date(Date.UTC(yyyy, mm - 2, dd))
        dataVenda = `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}-${String(base.getUTCDate()).padStart(2, '0')}`
      }
    }
    return {
      ...venda,
      total_parcelas: totalParcelas,
      valor_parcela: parcela,
      valor_total: parcela * totalParcelas,
      data_venda: dataVenda,
    }
  })

  return {
    clientes: Array.from(clientesMap.values()),
    chacaras: Array.from(chacarasMap.values()),
    vendas,
    pagamentos,
  }
}

export function useRuntimeData() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [chacaras, setChacaras] = useState<Chacara[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const [clientesRes, chacarasRes, vendasRes, pagamentosRes, gastosRes] = await Promise.all([
        selectAll('clientes', 'id,nome,telefone', 'nome'),
        selectAll('chacaras', 'id,identificador', 'identificador'),
        selectAll('vendas', 'id,cliente_id,chacara_id,data_venda,valor_total,valor_entrada,total_parcelas,valor_parcela,dia_vencimento,indice_ajuste,status'),
        selectAll('pagamentos', 'id,venda_id,numero_parcela,valor_referencia,foi_pago,valor_pago,data_vencimento,data_pagamento'),
        selectAll('gastos', 'id,valor,data_gasto'),
      ])
      if (!active) return

      const coreClientes = (clientesRes.data ?? []) as Cliente[]
      const coreChacaras = (chacarasRes.data ?? []) as Chacara[]
      const coreVendas = (vendasRes.data ?? []) as Venda[]
      const corePagamentos = (pagamentosRes.data ?? []) as Pagamento[]
      const hasCoreErrors = Boolean(
        clientesRes.error || chacarasRes.error || vendasRes.error || pagamentosRes.error,
      )

      const corePareceVazio =
        coreClientes.length === 0 &&
        coreChacaras.length === 0 &&
        coreVendas.length === 0 &&
        corePagamentos.length === 0

      let pagamentosView: PagamentoView[] = []
      if (hasCoreErrors || corePareceVazio) {
        const { data } = await selectAll('v_pagamentos_mes', '*', 'data_vencimento')
        pagamentosView = (data ?? []) as PagamentoView[]
      }

      const usarFallback = hasCoreErrors || (corePareceVazio && pagamentosView.length > 0)

      if (usarFallback) {
        const fallback = buildFallbackFromPagamentoView(pagamentosView)
        setClientes(fallback.clientes)
        setChacaras(fallback.chacaras)
        setVendas(fallback.vendas)
        setPagamentos(fallback.pagamentos)
      } else {
        setClientes(coreClientes)
        setChacaras(coreChacaras)
        setVendas(coreVendas)
        setPagamentos(corePagamentos)
      }

      setGastos((gastosRes.data ?? []) as Gasto[])
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const pagamentosMes = useMemo(() => {
    const mes = new Date().toISOString().slice(0, 7)
    return pagamentos.filter((p) => p.data_vencimento.startsWith(mes))
  }, [pagamentos])

  const pagamentosMesView = useMemo(() => {
    return pagamentosMes.map((p) => {
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
  }, [pagamentosMes, vendas, clientes, chacaras])

  const parcelasPagasByVenda = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of pagamentos) {
      if (!p.foi_pago) continue
      map.set(p.venda_id, (map.get(p.venda_id) ?? 0) + 1)
    }
    return map
  }, [pagamentos])

  const statusByVenda = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10)
    const hasAtraso = new Map<string, boolean>()
    for (const p of pagamentos) {
      if (p.foi_pago) continue
      if (p.data_vencimento < hoje) hasAtraso.set(p.venda_id, true)
    }
    const map = new Map<string, 'em_dia' | 'atrasado' | 'cancelado'>()
    for (const v of vendas) {
      if (v.status === 'cancelado') {
        map.set(v.id, 'cancelado')
        continue
      }
      // Prioriza o status oficial da venda; usa cálculo por pagamentos só como fallback.
      if (v.status === 'atrasado' || v.status === 'em_dia') {
        map.set(v.id, v.status)
        continue
      }
      map.set(v.id, hasAtraso.get(v.id) ? 'atrasado' : 'em_dia')
    }
    return map
  }, [pagamentos, vendas])

  const vendasView = useMemo(() => {
    return vendas.map((v) => ({
      ...v,
      status: statusByVenda.get(v.id) ?? v.status,
      chacara: chacaras.find((c) => c.id === v.chacara_id)?.identificador ?? '—',
      parcelas_pagas: parcelasPagasByVenda.get(v.id) ?? 0,
    }))
  }, [vendas, chacaras, parcelasPagasByVenda, statusByVenda])

  const chacarasView = useMemo(() => {
    const vendaByChacara = new Map(vendas.map((v) => [v.chacara_id, v]))
    return chacaras.map((c) => {
      const venda = vendaByChacara.get(c.id)
      let status: StatusChacara = 'disponivel'
      let cliente_id: string | null = null
      if (venda) {
        const vendaStatus = statusByVenda.get(venda.id) ?? venda.status
        status = vendaStatus === 'atrasado' ? 'atrasado' : 'em_dia'
        cliente_id = venda.cliente_id
      }
      const [numeroRaw, quadra = ''] = c.identificador.split('-')
      return {
        id: c.id,
        identificador: c.identificador,
        quadra,
        numero: Number(numeroRaw) || 0,
        status,
        cliente_id,
      }
    })
  }, [chacaras, vendas, statusByVenda])

  return {
    loading,
    clientes,
    chacaras: chacarasView,
    vendas: vendasView,
    pagamentos,
    pagamentosMes: pagamentosMesView,
    gastos,
  }
}
