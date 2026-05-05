// types/database.ts
// Tipos gerados do schema — manter em sync com o Supabase

export type IndiceReajuste = 'nenhum' | 'IPCA' | 'IGP-M'
export type StatusVenda    = 'em_dia' | 'atrasado' | 'cancelado'
export type TipoParcela    = 'entrada' | 'parcela'
export type TipoGasto      =
  | 'manutencao'
  | 'documentacao'
  | 'imposto'
  | 'infraestrutura'
  | 'comissao_venda'
  | 'outros'

// ── Tabelas base ──────────────────────────────────────────────

export interface Empreendimento {
  id: string
  nome: string
  valor_investimento_inicial: number | null
  created_at: string
}

export interface Chacara {
  id: string
  empreendimento_id: string
  identificador: string        // "06-I"
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  telefone: string | null
  created_at: string
}

export interface Venda {
  id: string
  cliente_id: string
  chacara_id: string
  data_venda: string           // ISO date

  valor_total: number
  valor_entrada: number
  entrada_dividida: boolean
  numero_parcelas_entrada: number

  total_parcelas: number
  valor_parcela: number
  dia_vencimento: number       // 5 | 10 | 15

  indice_ajuste: IndiceReajuste
  link_contrato: string | null
  status: StatusVenda

  created_at: string
  updated_at: string
}

export interface Pagamento {
  id: string
  venda_id: string
  numero_parcela: number
  tipo: TipoParcela

  valor_referencia: number
  data_vencimento: string      // ISO date

  foi_pago: boolean
  valor_pago: number | null
  data_pagamento: string | null
  observacao: string | null

  created_at: string
  updated_at: string
}

export interface Gasto {
  id: string
  tipo: TipoGasto
  valor: number
  descricao: string | null
  data_gasto: string
  chacara_id: string | null
  cliente_id: string | null
  created_at: string
}

export interface Socio {
  id: string
  nome: string
  percentual: number
  ativo: boolean
  created_at: string
}

// ── Views / joins úteis ────────────────────────────────────────

/** Retorno da view v_pagamentos_mes + joins */
export interface PagamentoComDetalhe extends Pagamento {
  dia_vencimento: number
  status_venda: StatusVenda
  nome_cliente: string
  telefone: string | null
  chacara: string              // "06-I"
  saldo: number | null         // positivo = crédito, negativo = ainda deve
}

/** Venda com cliente e chácara resolvidos (para listas) */
export interface VendaComDetalhe extends Venda {
  cliente: Pick<Cliente, 'id' | 'nome' | 'telefone'>
  chacara: Pick<Chacara, 'id' | 'identificador'>
  parcelas_pagas: number
  ultima_parcela_paga: string | null
}

// ── Payloads de criação (sem campos gerados) ───────────────────

export type NovaVenda = Omit<Venda,
  'id' | 'status' | 'created_at' | 'updated_at'>

export type NovoPagamento = Omit<Pagamento,
  'id' | 'foi_pago' | 'valor_pago' | 'data_pagamento' | 'observacao' | 'created_at' | 'updated_at'>

export type NovoGasto = Omit<Gasto, 'id' | 'created_at'>

// ── Payload para registrar um pagamento ───────────────────────

export interface RegistrarPagamentoPayload {
  pagamento_id: string
  valor_pago: number
  data_pagamento: string       // ISO date "YYYY-MM-DD"
  observacao?: string
}

// ── Tipos de UI ────────────────────────────────────────────────

export type FiltroMes = 'todos' | 'pendente' | 'atrasado' | 'pago' | 5 | 10 | 15

export interface ResumoMensal {
  mes: string                  // "2026-05"
  receita_total: number
  despesas_total: number
  lucro_liquido: number
  parcelas_pagas: number
  parcelas_pendentes: number
  parcelas_atrasadas: number
}

export interface SplitSocio {
  socio: Socio
  valor: number
}
