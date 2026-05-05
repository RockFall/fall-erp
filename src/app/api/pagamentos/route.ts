import { createClient } from '@supabase/supabase-js'

type Body =
  | {
      action: 'registrar'
      pagamento_id: string
      venda_id: string
      valor_pago: number
      data_pagamento: string
      observacao?: string
    }
  | {
      action: 'desfazer'
      pagamento_id: string
      venda_id: string
    }

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Env do Supabase não configurada no servidor.')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function callRpcUntyped(
  supabase: any,
  fn: string,
  args: Record<string, unknown>,
) {
  const client = supabase as unknown as {
    rpc: (name: string, params?: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
  }
  return client.rpc(fn, args)
}

async function updateVendaStatusUntyped(
  supabase: any,
  vendaId: string,
  status: 'em_dia' | 'atrasado',
) {
  const client = supabase as unknown as {
    from: (table: string) => {
      update: (payload: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
  }
  return client
    .from('vendas')
    .update({ status })
    .eq('id', vendaId)
}

async function recalculateVendaStatus(
  supabase: any,
  vendaId: string,
) {
  let rpcError = null
  {
    const { error } = await callRpcUntyped(supabase, 'recalcular_status_venda', { p_venda_id: vendaId })
    rpcError = error
  }
  if (rpcError) {
    const { error } = await callRpcUntyped(supabase, 'recalcular_status_venda', { venda_id: vendaId })
    rpcError = error
  }
  if (!rpcError) return { ok: true as const, message: null }

  const msg = String(rpcError.message ?? '')
  const missingFn =
    msg.includes('Could not find the function') ||
    msg.includes('schema cache')

  // Fallback quando a RPC não está instalada: status por regra simples.
  if (missingFn) {
    const hoje = new Date().toISOString().slice(0, 10)
    const { data: pendentes, error: qErr } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('venda_id', vendaId)
      .eq('foi_pago', false)
      .lt('data_vencimento', hoje)
      .limit(1)
    if (qErr) return { ok: false as const, message: qErr.message }

    const novoStatus = (pendentes?.length ?? 0) > 0 ? 'atrasado' : 'em_dia'
    const { error: uErr } = await updateVendaStatusUntyped(supabase, vendaId, novoStatus)
    if (uErr) return { ok: false as const, message: uErr.message }
    return { ok: true as const, message: null }
  }

  return { ok: false as const, message: rpcError.message }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const supabase = getAdminClient()

    if (body.action === 'registrar') {
      const { data, error } = await supabase
        .from('pagamentos')
        .update({
          foi_pago: true,
          valor_pago: body.valor_pago,
          data_pagamento: body.data_pagamento,
          observacao: body.observacao ?? null,
        })
        .eq('id', body.pagamento_id)
        .select('id')

      if (error) return Response.json({ ok: false, message: error.message }, { status: 400 })
      if (!data?.length) return Response.json({ ok: false, message: 'Pagamento não encontrado para atualização.' }, { status: 404 })

      const recalc = await recalculateVendaStatus(supabase, body.venda_id)
      if (!recalc.ok) {
        return Response.json({ ok: false, message: `Pagamento salvo, mas falhou recalcular status: ${recalc.message}` }, { status: 400 })
      }

      return Response.json({ ok: true })
    }

    if (body.action === 'desfazer') {
      const { data, error } = await supabase
        .from('pagamentos')
        .update({
          foi_pago: false,
          valor_pago: null,
          data_pagamento: null,
          observacao: null,
        })
        .eq('id', body.pagamento_id)
        .select('id')

      if (error) return Response.json({ ok: false, message: error.message }, { status: 400 })
      if (!data?.length) return Response.json({ ok: false, message: 'Pagamento não encontrado para desfazer.' }, { status: 404 })

      const recalc = await recalculateVendaStatus(supabase, body.venda_id)
      if (!recalc.ok) {
        return Response.json({ ok: false, message: `Pagamento desfeito, mas falhou recalcular status: ${recalc.message}` }, { status: 400 })
      }

      return Response.json({ ok: true })
    }

    return Response.json({ ok: false, message: 'Ação inválida.' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado.'
    return Response.json({ ok: false, message }, { status: 500 })
  }
}
