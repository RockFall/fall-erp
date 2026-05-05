#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const args = process.argv.slice(2)
const arg = (name, fallback = null) => {
  const idx = args.indexOf(name)
  if (idx === -1) return fallback
  return args[idx + 1] ?? fallback
}
const has = (name) => args.includes(name)

const filePath = arg('--file')
const truncate = has('--truncate')
const dryRun = has('--dry-run')

if (!filePath) {
  console.error('Uso: node scripts/importar-planilha.mjs --file "/caminho/arquivo.csv" [--truncate] [--dry-run]')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
let supabase = null
if (!dryRun) {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
    process.exit(1)
  }
  supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    realtime: { transport: ws },
  })
}

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out
}

function normalizeSpaces(v) {
  return (v ?? '').replace(/\s+/g, ' ').trim()
}

function parseMoney(raw) {
  const txt = normalizeSpaces(raw)
    .replace(/R\$/gi, '')
    .replace(/\$/g, '')
    .replace(/[^\d,.\-]/g, '')
  if (!txt) return null

  let normalized = txt
  if (txt.includes(',') && txt.includes('.')) {
    if (txt.lastIndexOf('.') > txt.lastIndexOf(',')) {
      normalized = txt.replace(/,/g, '')
    } else {
      normalized = txt.replace(/\./g, '').replace(',', '.')
    }
  } else if (txt.includes(',') && !txt.includes('.')) {
    normalized = txt.replace(',', '.')
  }

  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function parseIntSafe(raw) {
  const m = String(raw ?? '').match(/\d+/)
  return m ? Number(m[0]) : null
}

function parseMes(raw) {
  const t = normalizeSpaces(raw)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (!t) return null
  if (t.startsWith('jan')) return 1
  if (t.startsWith('fev')) return 2
  if (t.startsWith('mar')) return 3
  if (t.startsWith('abr')) return 4
  if (t.startsWith('mai')) return 5
  if (t.startsWith('jun')) return 6
  if (t.startsWith('jul')) return 7
  if (t.startsWith('ago')) return 8
  if (t.startsWith('set')) return 9
  if (t.startsWith('out')) return 10
  if (t.startsWith('nov')) return 11
  if (t.startsWith('dez')) return 12
  return null
}

function parseAnoFromHeader(raw) {
  const t = normalizeSpaces(raw)
  if (!t) return null
  const m = t.match(/(?:\/|-)(\d{2,4})$/)
  if (!m) return null
  let y = Number(m[1])
  if (y < 100) y += 2000
  return y
}

function toIsoDate(raw, fallbackYear = null) {
  const txt = normalizeSpaces(raw).replace(/"/g, '')
  if (!txt) return null
  const m = txt.match(/^(\d{1,2})[/-](\d{1,2})[/-]?(\d{2,4})?$/)
  if (!m) return null

  const dd = Number(m[1])
  const mm = Number(m[2])
  let yyyy = m[3] ? Number(m[3]) : fallbackYear
  if (!yyyy) return null
  if (yyyy < 100) yyyy += 2000
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null

  return `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

function buildPaymentTriplets(headerMeses, headerCampos) {
  const triplets = []
  let currentMonth = null
  let currentYear = null
  let anchorFound = false

  for (let i = 0; i < headerCampos.length; i += 1) {
    const monthRaw = normalizeSpaces(headerMeses[i])
    if (monthRaw) {
      const maybeMonth = parseMes(monthRaw)
      if (maybeMonth) {
        currentMonth = maybeMonth
        const explicitYear = parseAnoFromHeader(monthRaw)
        if (explicitYear) {
          currentYear = explicitYear
          anchorFound = true
        } else if (anchorFound && currentYear != null) {
          // Só avança o ano quando voltamos de dezembro para janeiro.
          // Sem ano explícito, mantemos o último ano conhecido.
        }
      }
    }

    const campo = normalizeSpaces(headerCampos[i]).toLowerCase()
    const prox = normalizeSpaces(headerCampos[i + 1]).toLowerCase()
    const prox2 = normalizeSpaces(headerCampos[i + 2]).toLowerCase()
    const isValor = campo === 'valor' || campo === 'valor '
    const isParcela = prox === 'parcela' || prox === 'paecela'
    const isData = prox2 === 'data'

    if (isValor && isParcela && isData) {
      triplets.push({
        start: i,
        month: currentMonth,
        year: currentYear,
      })
    }
  }

  // Preenche anos faltantes olhando o primeiro bloco com ano conhecido.
  const firstWithYear = triplets.findIndex((t) => t.year != null)
  if (firstWithYear !== -1) {
    for (let i = firstWithYear - 1; i >= 0; i -= 1) {
      const next = triplets[i + 1]
      const cur = triplets[i]
      if (cur.year != null) continue
      if (cur.month == null || next.year == null || next.month == null) continue
      cur.year = cur.month > next.month ? next.year - 1 : next.year
    }
    for (let i = firstWithYear + 1; i < triplets.length; i += 1) {
      const prev = triplets[i - 1]
      const cur = triplets[i]
      if (cur.year != null) continue
      if (cur.month == null || prev.year == null || prev.month == null) continue
      cur.year = cur.month < prev.month ? prev.year + 1 : prev.year
    }
  }

  return triplets
}

function parseParcelaNumbers(raw, totalParcelas) {
  const txt = normalizeSpaces(raw)
  if (!txt) return []
  const nums = (txt.match(/\d+/g) ?? []).map(Number).filter((n) => Number.isFinite(n) && n > 0)
  if (!nums.length) return []

  let out = nums
  // Caso "6/96" (parcela/total), descartamos o total quando bate com total_parcelas.
  if (out.length === 2 && out[1] === totalParcelas && out[0] < out[1]) {
    out = [out[0]]
  }

  const dedup = []
  for (const n of out) {
    if (n > totalParcelas) continue
    if (!dedup.includes(n)) dedup.push(n)
  }
  return dedup
}

function inferTotalParcelasFromPagamentos(cols, triplets) {
  let maxParcela = null
  let hintedTotal = null

  for (const t of triplets) {
    const txt = normalizeSpaces(cols[t.start + 1])
    if (!txt) continue
    const nums = (txt.match(/\d+/g) ?? []).map(Number).filter((n) => Number.isFinite(n) && n > 0)
    if (!nums.length) continue

    if (nums.length >= 2) {
      const [first, second] = nums
      // Formato comum na planilha: "6/96" (parcela atual / total do contrato).
      if (second > first && second <= 360) {
        hintedTotal = Math.max(hintedTotal ?? 0, second)
      }
    }

    for (const n of nums) {
      if (n <= 360) maxParcela = Math.max(maxParcela ?? 0, n)
    }
  }

  return hintedTotal ?? maxParcela
}

function extractPagamentosFromRow(cols, triplets, totalParcelas) {
  const out = []
  for (const t of triplets) {
    const valorRaw = cols[t.start]
    const parcelaRaw = cols[t.start + 1]
    const dataRaw = cols[t.start + 2]
    const valor = parseMoney(valorRaw)
    const parcelas = parseParcelaNumbers(parcelaRaw, totalParcelas)
    const data = toIsoDate(dataRaw, t.year ?? null)

    if (valor == null || valor <= 0) continue
    if (!parcelas.length) continue

    out.push({ valor, parcelas, data })
  }
  return out
}

function splitAmount(total, parts) {
  if (parts <= 1) return [Number(total.toFixed(2))]
  const base = Number((total / parts).toFixed(2))
  const arr = Array.from({ length: parts }, () => base)
  const sumBase = Number(arr.reduce((a, b) => a + b, 0).toFixed(2))
  arr[arr.length - 1] = Number((arr[arr.length - 1] + (total - sumBase)).toFixed(2))
  return arr
}

function normalizeTelefone(raw) {
  const t = normalizeSpaces(raw)
  if (!t) return null
  return t
}

function parseIndice(raw) {
  const t = normalizeSpaces(raw).toUpperCase()
  if (t.includes('IPCA')) return 'IPCA'
  if (t.includes('IGP')) return 'IGP-M'
  return 'nenhum'
}

function normalizeDiaVencimento(day) {
  // A RPC gera datas mês a mês; dias > 28 quebram em fevereiro.
  // Mantemos o comportamento consistente usando no máximo 28.
  const d = Number(day ?? 10)
  if (!Number.isFinite(d) || d < 1) return 10
  return Math.min(d, 28)
}

function safeIdentificador(raw) {
  return normalizeSpaces(raw).toUpperCase().replace(/\s+/g, '')
}

function shouldSkipRow(cols) {
  const chacara = safeIdentificador(cols[1])
  const nome = normalizeSpaces(cols[7])
  if (!chacara || !nome) return true
  if (chacara === 'CHACARRA' || nome.toUpperCase() === 'RESPONSAVEL') return true
  return false
}

async function getEmpreendimentoId() {
  const { data: found, error: qErr } = await supabase
    .from('empreendimentos')
    .select('id,nome')
    .limit(1)
  if (qErr) throw qErr
  if (found?.length) return found[0].id

  const { data: created, error: cErr } = await supabase
    .from('empreendimentos')
    .insert({ nome: 'Rancho da Montanha' })
    .select('id')
    .single()
  if (cErr) throw cErr
  return created.id
}

async function clearData() {
  const tables = ['gastos', 'pagamentos', 'vendas', 'chacaras', 'clientes']
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().not('id', 'is', null)
    if (error) throw new Error(`Falha ao limpar ${t}: ${error.message}`)
  }
}

async function insertRows(rows, triplets) {
  const empreendimentoId = await getEmpreendimentoId()
  const chacaraById = new Map()
  const clienteByKey = new Map()
  let vendasCriadas = 0
  let pagamentosAplicados = 0
  const seenByChacara = new Map()

  for (const cols of rows) {
    if (shouldSkipRow(cols)) continue
    const chacaraIdent = safeIdentificador(cols[1])
    const dataVenda = toIsoDate(cols[0]) ?? '1900-01-01'
    const current = seenByChacara.get(chacaraIdent)
    if (!current || dataVenda >= current.dataVenda) {
      seenByChacara.set(chacaraIdent, { cols, dataVenda })
    }
  }

  const dedupedRows = Array.from(seenByChacara.values()).map((x) => x.cols)

  for (const cols of dedupedRows) {
    if (shouldSkipRow(cols)) continue

    const dataVenda = toIsoDate(cols[0]) ?? new Date().toISOString().slice(0, 10)
    const vendaYear = Number(dataVenda.slice(0, 4))
    const chacaraIdent = safeIdentificador(cols[1])
    const nomeCliente = normalizeSpaces(cols[7])
    const telefone = normalizeTelefone(cols[8])

    const valorTotal = parseMoney(cols[2]) ?? 0
    const valorEntrada = parseMoney(cols[3]) ?? 0
    const totalParcelasColuna = parseIntSafe(cols[4])
    const totalParcelasInferido = inferTotalParcelasFromPagamentos(cols, triplets)
    const totalParcelas = totalParcelasColuna
      ?? totalParcelasInferido
      ?? 1
    const valorParcelaRaw = parseMoney(cols[5])
    const valorParcela = valorParcelaRaw ?? ((valorTotal - valorEntrada) > 0 ? Number(((valorTotal - valorEntrada) / Math.max(1, totalParcelas)).toFixed(2)) : 0)

    const primeiraParcela = toIsoDate(cols[6], vendaYear)
    let diaVenc = parseIntSafe(cols[10]) ?? null
    if (!diaVenc && primeiraParcela) diaVenc = Number(primeiraParcela.slice(8, 10))
    if (!diaVenc) diaVenc = 10
    diaVenc = normalizeDiaVencimento(diaVenc)

    let chacaraId = chacaraById.get(chacaraIdent)
    if (!chacaraId) {
      const { data, error } = await supabase
        .from('chacaras')
        .insert({ empreendimento_id: empreendimentoId, identificador: chacaraIdent })
        .select('id')
        .single()
      if (error) throw new Error(`Erro inserindo chácara ${chacaraIdent}: ${error.message}`)
      chacaraId = data.id
      chacaraById.set(chacaraIdent, chacaraId)
    }

    const clienteKey = `${nomeCliente.toLowerCase()}|${telefone ?? ''}`
    let clienteId = clienteByKey.get(clienteKey)
    if (!clienteId) {
      const { data, error } = await supabase
        .from('clientes')
        .insert({ nome: nomeCliente, telefone })
        .select('id')
        .single()
      if (error) throw new Error(`Erro inserindo cliente ${nomeCliente}: ${error.message}`)
      clienteId = data.id
      clienteByKey.set(clienteKey, clienteId)
    }

    const vendaPayload = {
      cliente_id: clienteId,
      chacara_id: chacaraId,
      data_venda: dataVenda,
      valor_total: valorTotal,
      valor_entrada: valorEntrada,
      entrada_dividida: false,
      numero_parcelas_entrada: 1,
      total_parcelas: totalParcelas,
      valor_parcela: valorParcela,
      dia_vencimento: diaVenc,
      indice_ajuste: parseIndice(cols[9]),
      link_contrato: null,
      status: 'em_dia',
    }

    const { data: venda, error: vErr } = await supabase
      .from('vendas')
      .insert(vendaPayload)
      .select('id')
      .single()
    if (vErr) throw new Error(`Erro inserindo venda ${chacaraIdent}/${nomeCliente}: ${vErr.message}`)
    vendasCriadas += 1

    let rpcErr = null
    {
      const { error } = await supabase.rpc('gerar_plano_pagamentos', { venda_id: venda.id })
      rpcErr = error
    }
    if (rpcErr) {
      const { error } = await supabase.rpc('gerar_plano_pagamentos', { p_venda_id: venda.id })
      rpcErr = error
    }
    if (rpcErr) {
      throw new Error(`Venda ${venda.id} criada, mas falhou gerar plano_pagamentos: ${rpcErr.message}`)
    }

    const pagamentosExtraidos = extractPagamentosFromRow(cols, triplets, totalParcelas)
    if (pagamentosExtraidos.length) {
      const { data: parcelasDb, error: pErr } = await supabase
        .from('pagamentos')
        .select('id,numero_parcela,valor_referencia')
        .eq('venda_id', venda.id)
      if (pErr) throw new Error(`Erro consultando pagamentos da venda ${venda.id}: ${pErr.message}`)

      const byNumero = new Map((parcelasDb ?? []).map((p) => [Number(p.numero_parcela), p]))
      const updates = []

      for (const registro of pagamentosExtraidos) {
        const parcelasAlvo = registro.parcelas.filter((n) => byNumero.has(n))
        if (!parcelasAlvo.length) continue
        const valores = splitAmount(registro.valor, parcelasAlvo.length)
        for (let i = 0; i < parcelasAlvo.length; i += 1) {
          const numero = parcelasAlvo[i]
          const row = byNumero.get(numero)
          updates.push({
            id: row.id,
            foi_pago: true,
            valor_pago: valores[i],
            data_pagamento: registro.data,
          })
        }
      }

      // Mantém apenas a atualização mais recente por parcela/id.
      const latestById = new Map()
      for (const u of updates) latestById.set(u.id, u)
      for (const u of latestById.values()) {
        const { error } = await supabase
          .from('pagamentos')
          .update({
            foi_pago: u.foi_pago,
            valor_pago: u.valor_pago,
            data_pagamento: u.data_pagamento,
          })
          .eq('id', u.id)
        if (error) throw new Error(`Erro atualizando pagamento ${u.id}: ${error.message}`)
        pagamentosAplicados += 1
      }
    }
  }

  return {
    chacaras: chacaraById.size,
    clientes: clienteByKey.size,
    vendas: vendasCriadas,
    pagamentos_aplicados: pagamentosAplicados,
    linhas_apos_dedupe: dedupedRows.length,
  }
}

async function main() {
  const abs = path.resolve(filePath)
  if (!fs.existsSync(abs)) {
    console.error(`Arquivo não encontrado: ${abs}`)
    process.exit(1)
  }

  const content = fs.readFileSync(abs, 'utf8')
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const rows = lines.map(parseCsvLine)
  const headerMeses = rows[0] ?? []
  const headerCampos = rows[1] ?? []
  const triplets = buildPaymentTriplets(headerMeses, headerCampos)
  const dataRows = rows.slice(2)

  if (dryRun) {
    const valid = dataRows.filter((r) => !shouldSkipRow(r))
    console.log(`Dry-run OK. Linhas totais: ${dataRows.length} | Linhas válidas: ${valid.length} | Blocos pagamento: ${triplets.length}`)
    process.exit(0)
  }

  if (!truncate) {
    console.error('Importação bloqueada por segurança. Use --truncate para limpar e recarregar os dados.')
    process.exit(1)
  }

  console.log('Limpando dados existentes...')
  await clearData()
  console.log('Importando CSV...')
  const result = await insertRows(dataRows, triplets)
  console.log('Importação concluída:')
  console.log(result)
}

main().catch((err) => {
  console.error('Falha na importação:', err.message)
  process.exit(1)
})
