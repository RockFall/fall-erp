'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { StatusChacara } from '@/lib/domain'

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
      const [{ data: c }, { data: ch }, { data: v }, { data: p }, { data: g }] = await Promise.all([
        supabase.from('clientes').select('id,nome,telefone').order('nome'),
        supabase.from('chacaras').select('id,identificador').order('identificador'),
        supabase.from('vendas').select('id,cliente_id,chacara_id,data_venda,valor_total,valor_entrada,total_parcelas,valor_parcela,dia_vencimento,indice_ajuste,status'),
        supabase.from('pagamentos').select('id,venda_id,numero_parcela,valor_referencia,foi_pago,valor_pago,data_vencimento,data_pagamento'),
        supabase.from('gastos').select('id,valor,data_gasto'),
      ])
      if (!active) return
      setClientes((c ?? []) as Cliente[])
      setChacaras((ch ?? []) as Chacara[])
      setVendas((v ?? []) as Venda[])
      setPagamentos((p ?? []) as Pagamento[])
      setGastos((g ?? []) as Gasto[])
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

  const vendasView = useMemo(() => {
    return vendas.map((v) => ({
      ...v,
      chacara: chacaras.find((c) => c.id === v.chacara_id)?.identificador ?? '—',
      parcelas_pagas: parcelasPagasByVenda.get(v.id) ?? 0,
    }))
  }, [vendas, chacaras, parcelasPagasByVenda])

  const chacarasView = useMemo(() => {
    const vendaByChacara = new Map(vendas.map((v) => [v.chacara_id, v]))
    return chacaras.map((c) => {
      const venda = vendaByChacara.get(c.id)
      let status: StatusChacara = 'disponivel'
      let cliente_id: string | null = null
      if (venda) {
        status = venda.status === 'atrasado' ? 'atrasado' : 'em_dia'
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
  }, [chacaras, vendas])

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
