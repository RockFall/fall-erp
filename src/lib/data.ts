// Mock data — Rancho da Montanha
// Mirrors the design prototype data layer

export const CURRENT_MONTH = '2026-05'
export const TODAY_ISO = '2026-05-04'

export interface Cliente {
  id: string
  nome: string
  telefone: string
}

export const CLIENTES: Cliente[] = [
  { id: 'c1',  nome: 'Breno Henrique de Souza',  telefone: '(35) 99812-4031' },
  { id: 'c2',  nome: 'Claudio Roberto Pereira',  telefone: '(35) 98823-1100' },
  { id: 'c3',  nome: 'Diego Tavares Lima',        telefone: '(35) 99410-2218' },
  { id: 'c4',  nome: 'Lucimara do Carmo',         telefone: '(35) 99001-9933' },
  { id: 'c5',  nome: 'Almir Rodrigues',           telefone: '(35) 99812-7741' },
  { id: 'c6',  nome: 'Jose Batista Laia',         telefone: '(35) 98232-1100' },
  { id: 'c7',  nome: 'Deborah Cristina Alves',    telefone: '(35) 99221-4400' },
  { id: 'c8',  nome: 'Christian Souza',           telefone: '(35) 99511-2233' },
  { id: 'c9',  nome: 'Celina Cruz Mendes',        telefone: '(35) 99876-1100' },
  { id: 'c10', nome: 'Amanda Fernandes',          telefone: '(35) 98101-2233' },
  { id: 'c11', nome: 'Guanair Oliveira',          telefone: '(35) 99812-3300' },
  { id: 'c12', nome: 'Bento Confessor',           telefone: '(35) 99441-2200' },
  { id: 'c13', nome: 'Afonso Rodrigues',          telefone: '(35) 99221-1133' },
  { id: 'c14', nome: 'Emanuel Costa',             telefone: '(35) 98823-9911' },
  { id: 'c15', nome: 'Marina Vasconcelos',        telefone: '(35) 99812-4422' },
  { id: 'c16', nome: 'Rogério Silva',             telefone: '(35) 99411-2200' },
  { id: 'c17', nome: 'Patricia Andrade',          telefone: '(35) 99001-7733' },
  { id: 'c18', nome: 'Elaine Moreira',            telefone: '(35) 98232-4400' },
]

export type StatusChacara = 'em_dia' | 'atrasado' | 'disponivel' | 'em_construcao' | 'reservada'

export interface Chacara {
  id: string
  identificador: string
  quadra: string
  numero: number
  status: StatusChacara
  cliente_id: string | null
}

const CHACARAS_RAW: [string, StatusChacara, string | null][] = [
  ['01-A', 'em_dia', null], ['02-A', 'em_dia', null], ['03-A', 'disponivel', null], ['04-A', 'em_dia', null],
  ['05-A', 'em_construcao', null], ['06-A', 'em_dia', null], ['07-A', 'em_dia', 'c11'], ['08-A', 'reservada', null],
  ['09-A', 'em_dia', null], ['10-A', 'em_dia', 'c10'],
  ['01-B', 'em_dia', null], ['02-B', 'disponivel', null], ['03-B', 'em_dia', null], ['04-B', 'em_dia', null],
  ['05-B', 'atrasado', null], ['06-B', 'em_dia', null], ['07-B', 'em_dia', null], ['08-B', 'em_dia', null],
  ['09-B', 'em_dia', 'c1'], ['10-B', 'em_construcao', null], ['11-B', 'em_dia', null], ['12-B', 'disponivel', null],
  ['13-B', 'em_dia', null], ['14-B', 'em_dia', null], ['15-B', 'em_dia', null], ['16-B', 'em_dia', 'c3'],
  ['17-B', 'em_dia', null], ['18-B', 'em_dia', null], ['19-B', 'em_dia', 'c7'], ['20-B', 'atrasado', 'c7'],
  ['01-D', 'em_dia', null], ['02-D', 'em_dia', null], ['03-D', 'disponivel', null], ['04-D', 'em_dia', null],
  ['05-D', 'em_construcao', null], ['06-D', 'em_dia', null], ['07-D', 'em_dia', 'c5'], ['08-D', 'em_dia', 'c5'],
  ['01-E', 'em_dia', 'c6'], ['02-E', 'em_dia', 'c6'], ['03-E', 'disponivel', null], ['04-E', 'reservada', null],
  ['05-E', 'em_dia', null], ['06-E', 'em_dia', null], ['07-E', 'em_dia', null], ['08-E', 'em_dia', null],
  ['10-E', 'em_dia', 'c2'], ['11-E', 'atrasado', 'c2'], ['12-E', 'em_dia', null], ['13-E', 'em_dia', null],
  ['14-E', 'em_dia', 'c2'], ['15-E', 'em_dia', 'c2'],
  ['01-H', 'em_dia', 'c1'], ['02-H', 'atrasado', 'c1'], ['03-H', 'em_dia', null], ['04-H', 'em_dia', null],
  ['05-H', 'em_construcao', null], ['06-H', 'disponivel', null],
  ['01-I', 'em_dia', 'c4'], ['02-I', 'em_dia', 'c4'], ['03-I', 'em_dia', 'c9'], ['04-I', 'em_dia', null],
  ['05-I', 'em_dia', null], ['06-I', 'em_dia', 'c8'], ['07-I', 'em_dia', null], ['08-I', 'em_dia', null],
  ['09-I', 'em_construcao', null], ['10-I', 'reservada', null], ['11-I', 'em_dia', null], ['12-I', 'em_dia', null],
  ['13-I', 'em_dia', null], ['14-I', 'em_dia', null], ['15-I', 'em_dia', 'c3'], ['16-I', 'disponivel', null],
]

export const CHACARAS: Chacara[] = CHACARAS_RAW.map(([id, status, cliente_id], i) => ({
  id: `ch_${i}`,
  identificador: id,
  quadra: id.split('-')[1],
  numero: parseInt(id.split('-')[0]),
  status,
  cliente_id,
}))

export interface Venda {
  id: string
  cliente_id: string
  chacara_id: string
  chacara: string
  data_venda: string
  valor_total: number
  valor_entrada: number
  entrada_dividida: boolean
  numero_parcelas_entrada: number
  total_parcelas: number
  valor_parcela: number
  dia_vencimento: number
  indice_ajuste: string
  link_contrato: null
  status: 'em_dia' | 'atrasado'
  parcelas_pagas: number
  inicio_meses_atras: number
}

function makeVenda(chacara: Chacara, idx: number): Venda {
  const valoresParcela = [780, 850, 920, 1100, 1250, 1400, 1500]
  const totaisParc = [60, 84, 96, 120, 144]
  const dias = [5, 10, 15]
  const valor_parcela = valoresParcela[idx % valoresParcela.length]
  const total_parcelas = totaisParc[idx % totaisParc.length]
  const valor_entrada = valor_parcela * 8
  const valor_total = valor_entrada + valor_parcela * total_parcelas
  const dia_vencimento = dias[idx % 3]
  const indices = ['nenhum', 'IPCA', 'IGP-M']
  const inicio_meses_atras = 6 + (idx % 30)
  const startDate = new Date('2026-05-01')
  startDate.setMonth(startDate.getMonth() - inicio_meses_atras)
  const data_venda = startDate.toISOString().slice(0, 10)

  return {
    id: `v_${chacara.id}`,
    cliente_id: chacara.cliente_id!,
    chacara_id: chacara.id,
    chacara: chacara.identificador,
    data_venda,
    valor_total,
    valor_entrada,
    entrada_dividida: idx % 3 === 0,
    numero_parcelas_entrada: idx % 3 === 0 ? 3 : 1,
    total_parcelas,
    valor_parcela,
    dia_vencimento,
    indice_ajuste: indices[idx % 3],
    link_contrato: null,
    status: chacara.status === 'atrasado' ? 'atrasado' : 'em_dia',
    parcelas_pagas: Math.min(inicio_meses_atras, total_parcelas) - (chacara.status === 'atrasado' ? 2 : 0),
    inicio_meses_atras,
  }
}

export const VENDAS: Venda[] = CHACARAS
  .filter(ch => ch.cliente_id)
  .map((ch, i) => makeVenda(ch, i))

export interface PagamentoMes {
  id: string
  venda_id: string
  numero_parcela: number
  tipo: string
  valor_referencia: number
  data_vencimento: string
  dia_vencimento: number
  foi_pago: boolean
  valor_pago: number | null
  data_pagamento: string | null
  observacao: null
  nome_cliente: string
  telefone: string
  chacara: string
  status_venda: string
}

function makePagamentos(): PagamentoMes[] {
  const out: PagamentoMes[] = []
  VENDAS.forEach(v => {
    const dataVenc = `${CURRENT_MONTH}-${String(v.dia_vencimento).padStart(2, '0')}`
    const numParcela = v.parcelas_pagas + 1
    const cliente = CLIENTES.find(c => c.id === v.cliente_id)!
    const isAtrasado = v.status === 'atrasado'
    const dataVenc_d = new Date(dataVenc)
    const hoje_d = new Date(TODAY_ISO)
    const venceuPassou = dataVenc_d <= hoje_d
    const chId = parseInt(v.chacara_id.replace('ch_', ''))
    const foiPago = !isAtrasado && venceuPassou && (chId % 100) % 4 !== 0
    out.push({
      id: `p_${v.id}_${numParcela}`,
      venda_id: v.id,
      numero_parcela: numParcela,
      tipo: 'parcela',
      valor_referencia: v.valor_parcela,
      data_vencimento: dataVenc,
      dia_vencimento: v.dia_vencimento,
      foi_pago: foiPago,
      valor_pago: foiPago ? v.valor_parcela : null,
      data_pagamento: foiPago ? dataVenc : null,
      observacao: null,
      nome_cliente: cliente.nome,
      telefone: cliente.telefone,
      chacara: v.chacara,
      status_venda: v.status,
    })
  })
  return out
}

export const PAGAMENTOS_MES: PagamentoMes[] = makePagamentos()

export interface HistoricoMes {
  mes: string
  receita: number
  despesas: number
}

export const HISTORICO_MENSAL: HistoricoMes[] = [
  { mes: '2025-12', receita: 38420, despesas: 8120 },
  { mes: '2026-01', receita: 41890, despesas: 6230 },
  { mes: '2026-02', receita: 39550, despesas: 9410 },
  { mes: '2026-03', receita: 42100, despesas: 7820 },
  { mes: '2026-04', receita: 44830, despesas: 8950 },
  { mes: '2026-05', receita: 0,     despesas: 0 },
]

export interface Gasto {
  id: string
  tipo: string
  valor: number
  descricao: string
  data_gasto: string
  chacara_id: string | null
}

export const GASTOS: Gasto[] = [
  { id: 'g1', tipo: 'manutencao',     valor: 1850, descricao: 'Roçada e limpeza geral das ruas internas',  data_gasto: '2026-05-02', chacara_id: null },
  { id: 'g2', tipo: 'imposto',        valor: 2340, descricao: 'ITR exercício 2026 — guia 1/4',             data_gasto: '2026-05-01', chacara_id: null },
  { id: 'g3', tipo: 'infraestrutura', valor: 4200, descricao: 'Cerca elétrica perímetro norte',            data_gasto: '2026-04-28', chacara_id: null },
  { id: 'g4', tipo: 'documentacao',   valor: 680,  descricao: 'Registro de averbação 06-I',                data_gasto: '2026-04-25', chacara_id: 'ch_60' },
  { id: 'g5', tipo: 'manutencao',     valor: 320,  descricao: 'Reparo no portão automático',              data_gasto: '2026-04-22', chacara_id: null },
  { id: 'g6', tipo: 'comissao_venda', valor: 1500, descricao: 'Comissão venda 19-B / Deborah',            data_gasto: '2026-04-18', chacara_id: 'ch_28' },
  { id: 'g7', tipo: 'outros',         valor: 240,  descricao: 'Material escritório + correios',           data_gasto: '2026-04-15', chacara_id: null },
  { id: 'g8', tipo: 'infraestrutura', valor: 890,  descricao: 'Manutenção da bomba de água — área comum', data_gasto: '2026-04-10', chacara_id: null },
]

// Update current month totals
HISTORICO_MENSAL[5].receita = PAGAMENTOS_MES.filter(p => p.foi_pago).reduce((a, p) => a + (p.valor_pago ?? 0), 0)
HISTORICO_MENSAL[5].despesas = GASTOS.filter(g => g.data_gasto.startsWith(CURRENT_MONTH)).reduce((a, g) => a + g.valor, 0)

export interface Socio {
  id: string
  nome: string
  percentual: number
  ativo: boolean
}

export const SOCIOS: Socio[] = [
  { id: 's1', nome: 'Geovanin', percentual: 70, ativo: true },
  { id: 's2', nome: 'Paulo',    percentual: 30, ativo: true },
]

/** Cores via CSS vars em globals.css — claras no :root, escuras em [data-theme="dark"] */
export const STATUS_CHACARA: Record<StatusChacara, { label: string; color: string; bg: string; text: string }> = {
  em_dia:        { label: 'Em dia',        color: 'var(--st-em_dia-dot)', bg: 'var(--st-em_dia-bg)', text: 'var(--st-em_dia-fg)' },
  atrasado:      { label: 'Atrasado',      color: 'var(--st-atrasado-dot)', bg: 'var(--st-atrasado-bg)', text: 'var(--st-atrasado-fg)' },
  disponivel:    { label: 'Disponível',    color: 'var(--st-disponivel-dot)', bg: 'var(--st-disponivel-bg)', text: 'var(--st-disponivel-fg)' },
  em_construcao: { label: 'Pendente',      color: 'var(--st-em_construcao-dot)', bg: 'var(--st-em_construcao-bg)', text: 'var(--st-em_construcao-fg)' },
  reservada:     { label: 'Reservada',     color: 'var(--st-reservada-dot)', bg: 'var(--st-reservada-bg)', text: 'var(--st-reservada-fg)' },
}

export const TIPO_GASTO: Record<string, { label: string; hue: number }> = {
  manutencao:     { label: 'Manutenção',        hue: 250 },
  documentacao:   { label: 'Documentação',      hue: 75 },
  imposto:        { label: 'Imposto / ITR',     hue: 305 },
  infraestrutura: { label: 'Infraestrutura',    hue: 145 },
  comissao_venda: { label: 'Comissão de venda', hue: 0 },
  outros:         { label: 'Outros',            hue: 220 },
}

// ── Formatters ─────────────────────────────────────────────────

export const fmtBRL = (v: number) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const fmtDate = (iso: string) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export const fmtDateLong = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`
}

const MESES_PT: Record<string, string> = {
  '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun',
  '07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez',
}

export const labelMes = (mes: string) => {
  const [ano, m] = mes.split('-')
  return `${MESES_PT[m]}/${ano.slice(2)}`
}

export const initials = (nome: string) => {
  const parts = nome.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const colorFromString = (str: string) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
  return `oklch(0.85 0.06 ${h})`
}

export const textColorFromString = (str: string) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
  return `oklch(0.42 0.12 ${h})`
}
