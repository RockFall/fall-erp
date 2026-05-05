// components/Gastos.tsx
// Tela de gastos — formulário sempre visível no topo, lista abaixo

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Gasto, TipoGasto, Chacara } from '@/types/database'
import { fetchAllByRange } from '@/lib/supabase-paginate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

const TIPOS: { value: TipoGasto; label: string }[] = [
  { value: 'manutencao',     label: 'Manutenção' },
  { value: 'documentacao',   label: 'Documentação' },
  { value: 'imposto',        label: 'Imposto / ITR' },
  { value: 'infraestrutura', label: 'Infraestrutura' },
  { value: 'comissao_venda', label: 'Comissão de venda' },
  { value: 'outros',         label: 'Outros' },
]

const TIPO_LABEL: Record<TipoGasto, string> = Object.fromEntries(
  TIPOS.map(t => [t.value, t.label])
) as Record<TipoGasto, string>

const TIPO_COR: Record<TipoGasto, string> = {
  manutencao:     'bg-[color:var(--cl-badge-info-bg)] text-[color:var(--cl-badge-info-fg)]',
  documentacao:   'bg-[color:var(--cl-badge-warning-bg)] text-[color:var(--cl-badge-warning-fg)]',
  imposto:        'bg-[color:var(--cl-badge-neutral-bg)] text-[color:var(--cl-badge-neutral-fg)]',
  infraestrutura: 'bg-[color:var(--cl-badge-success-bg)] text-[color:var(--cl-badge-success-fg)]',
  comissao_venda: 'bg-[color:var(--cl-badge-danger-bg)] text-[color:var(--cl-badge-danger-fg)]',
  outros:         'bg-[color:var(--cl-bgh)] text-[color:var(--cl-t4)]',
}

const hoje = () => new Date().toISOString().split('T')[0]

interface FormGasto {
  tipo: TipoGasto
  valor: string
  descricao: string
  data_gasto: string
  chacara_id: string
}

type GastoRow = Gasto & { chacara?: { identificador: string } | null }

const FORM_VAZIO: FormGasto = {
  tipo:       'manutencao',
  valor:      '',
  descricao:  '',
  data_gasto: hoje(),
  chacara_id: '',
}

export default function Gastos() {
  const [gastos,   setGastos]   = useState<GastoRow[]>([])
  const [chacaras, setChacaras] = useState<Chacara[]>([])
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [form,     setForm]     = useState<FormGasto>(FORM_VAZIO)
  const [toast,    setToast]    = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<TipoGasto | 'todos'>('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>(
    new Date().toISOString().slice(0, 7)  // "2026-05"
  )

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const carregar = useCallback(async () => {
    setLoading(true)
    const [{ data: g }, { data: c }] = await Promise.all([
      fetchAllByRange<GastoRow>((from, to) =>
        supabase
          .from('gastos')
          .select('*, chacara:chacaras(identificador)')
          .gte('data_gasto', `${filtroPeriodo}-01`)
          .lte('data_gasto', `${filtroPeriodo}-31`)
          .order('data_gasto', { ascending: false })
          .range(from, to),
      ),
      fetchAllByRange<Chacara>((from, to) =>
        supabase
          .from('chacaras')
          .select('id, identificador')
          .order('identificador')
          .range(from, to),
      ),
    ])
    setGastos((g as GastoRow[]) ?? [])
    setChacaras((c as Chacara[]) ?? [])
    setLoading(false)
  }, [filtroPeriodo])

  useEffect(() => {
    queueMicrotask(() => { void carregar() })
  }, [carregar])

  const lista = useMemo(() =>
    filtroTipo === 'todos'
      ? gastos
      : gastos.filter(g => g.tipo === filtroTipo),
    [gastos, filtroTipo]
  )

  const totais = useMemo(() => {
    const total = gastos.reduce((a, g) => a + g.valor, 0)
    const porTipo = TIPOS.map(t => ({
      ...t,
      valor: gastos.filter(g => g.tipo === t.value).reduce((a, g) => a + g.valor, 0),
    })).filter(t => t.valor > 0).sort((a, b) => b.valor - a.valor)
    return { total, porTipo }
  }, [gastos])

  const salvar = async () => {
    const valor = parseFloat(form.valor)
    if (!form.descricao.trim() || isNaN(valor) || valor <= 0) {
      showToast('Preencha descrição e valor')
      return
    }
    setSalvando(true)
    const { error } = await supabase.from('gastos').insert({
      tipo:       form.tipo,
      valor,
      descricao:  form.descricao.trim(),
      data_gasto: form.data_gasto,
      chacara_id: form.chacara_id || null,
    })
    if (error) {
      showToast(`Erro: ${error.message}`)
    } else {
      showToast(`Gasto de ${fmtBRL(valor)} registrado!`)
      setForm({ ...FORM_VAZIO, data_gasto: form.data_gasto })
      await carregar()
    }
    setSalvando(false)
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir este gasto?')) return
    await supabase.from('gastos').delete().eq('id', id)
    await carregar()
  }

  const setF = (k: keyof FormGasto, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="relative">

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[color:var(--cl-pb)] text-[color:var(--cl-pf)] text-xs font-medium px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* KPIs rápidos */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        <div className="bg-[color:var(--cl-bgr)] rounded-lg px-3 py-2.5 col-span-1">
          <div className="text-xs text-[color:var(--cl-t7)] mb-1">Total no mês</div>
          <div className="text-base font-medium text-[color:var(--cl-th)]">{fmtBRL(totais.total)}</div>
          <div className="text-xs text-[color:var(--cl-t7)] mt-0.5">{gastos.length} lançamentos</div>
        </div>
        {totais.porTipo.slice(0, 3).map(t => (
          <div key={t.value} className="bg-[color:var(--cl-bgr)] rounded-lg px-3 py-2.5">
            <div className="text-xs text-[color:var(--cl-t7)] mb-1">{t.label}</div>
            <div className="text-base font-medium text-[color:var(--cl-th)]">{fmtBRL(t.valor)}</div>
            <div className="text-xs text-[color:var(--cl-t7)] mt-0.5">
              {totais.total > 0 ? Math.round(t.valor / totais.total * 100) : 0}% do total
            </div>
          </div>
        ))}
      </div>

      {/* Formulário novo gasto — sempre visível */}
      <div className="border-2 border-[color:var(--cl-bd)] rounded-xl p-4 mb-4 bg-[color:var(--cl-bg)]">
        <div className="text-xs font-medium text-[color:var(--cl-t2)] mb-3">Novo gasto</div>
        <div className="grid grid-cols-2 gap-3 mb-3">

          <div>
            <label className="block text-xs text-[color:var(--cl-t7)] mb-1">Categoria</label>
            <select
              value={form.tipo}
              onChange={e => setF('tipo', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-[color:var(--cl-bd)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)] bg-[color:var(--cl-bg)]"
            >
              {TIPOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[color:var(--cl-t7)] mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={form.valor}
              onChange={e => setF('valor', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-[color:var(--cl-bd)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[color:var(--cl-t7)] mb-1">Data</label>
            <input
              type="date"
              value={form.data_gasto}
              onChange={e => setF('data_gasto', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-[color:var(--cl-bd)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[color:var(--cl-t7)] mb-1">Chácara (opcional)</label>
            <select
              value={form.chacara_id}
              onChange={e => setF('chacara_id', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-[color:var(--cl-bd)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)] bg-[color:var(--cl-bg)]"
            >
              <option value="">— Geral (sem chácara) —</option>
              {chacaras.map(c => (
                <option key={c.id} value={c.id}>{c.identificador}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs text-[color:var(--cl-t7)] mb-1">Descrição</label>
          <input
            type="text"
            placeholder="Ex: limpeza de terreno, cerca elétrica, registro cartório..."
            value={form.descricao}
            onChange={e => setF('descricao', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && salvar()}
            className="w-full px-2.5 py-1.5 text-xs border border-[color:var(--cl-bd)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)]"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={salvar}
            disabled={salvando}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[color:var(--cl-pb)] text-[color:var(--cl-pf)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar gasto'}
          </button>
          <button
            onClick={() => setForm({ ...FORM_VAZIO, data_gasto: form.data_gasto })}
            className="px-3 py-1.5 rounded-lg text-xs border border-[color:var(--cl-bd)] text-[color:var(--cl-t7)] hover:text-[color:var(--cl-t4)]"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Filtros da lista */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex gap-1.5 flex-1 flex-wrap">
          <button
            onClick={() => setFiltroTipo('todos')}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              filtroTipo === 'todos'
                ? 'bg-[color:var(--cl-pb)] text-[color:var(--cl-pf)] border-[color:var(--cl-pb)]'
                : 'border-[color:var(--cl-bd)] text-[color:var(--cl-t5)] hover:border-[color:var(--cl-bd5)]'
            }`}
          >
            Todos
          </button>
          {TIPOS.map(t => (
            <button
              key={t.value}
              onClick={() => setFiltroTipo(t.value)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                filtroTipo === t.value
                  ? 'bg-[color:var(--cl-pb)] text-[color:var(--cl-pf)] border-[color:var(--cl-pb)]'
                  : 'border-[color:var(--cl-bd)] text-[color:var(--cl-t5)] hover:border-[color:var(--cl-bd5)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Seletor de mês */}
        <input
          type="month"
          value={filtroPeriodo}
          onChange={e => setFiltroPeriodo(e.target.value)}
          className="px-2.5 py-1 text-xs border border-[color:var(--cl-bd)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)]"
        />
      </div>

      {/* Lista */}
      <div className="border border-[color:var(--cl-bd)] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[color:var(--cl-bgr)] border-b border-[color:var(--cl-bd)]">
            <tr>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-16">Data</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-32">Categoria</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal">Descrição</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-16">Chácara</th>
              <th className="text-left px-3 py-2 text-[color:var(--cl-t7)] font-normal w-24">Valor</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-xs text-[color:var(--cl-t7)]">Carregando…</td>
              </tr>
            ) : lista.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-xs text-[color:var(--cl-t7)]">
                  Nenhum gasto encontrado.
                </td>
              </tr>
            ) : lista.map(g => (
              <tr key={g.id} className="border-b border-[color:var(--cl-bd4)] hover:bg-[color:var(--cl-bgr)] transition-colors">
                <td className="px-3 py-2.5 text-[color:var(--cl-t5)]">{fmtDate(g.data_gasto)}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COR[g.tipo]}`}>
                    {TIPO_LABEL[g.tipo]}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-[color:var(--cl-t2)]">{g.descricao ?? '—'}</td>
                <td className="px-3 py-2.5 text-[color:var(--cl-t5)]">
                  {g.chacara?.identificador ?? '—'}
                </td>
                <td className="px-3 py-2.5 font-medium text-[color:var(--cl-th)]">{fmtBRL(g.valor)}</td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => excluir(g.id)}
                    className="text-[color:var(--cl-bd5)] hover:text-[color:var(--cl-badge-danger-fg)] transition-colors"
                    title="Excluir"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 3h10M4 3V2h4v1M2 3l1 8h6l1-8"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

          {lista.length > 0 && (
            <tfoot className="border-t border-[color:var(--cl-bd)] bg-[color:var(--cl-bgr)]">
              <tr>
                <td colSpan={4} className="px-3 py-2 text-xs text-[color:var(--cl-t7)] text-right font-medium">Total</td>
                <td className="px-3 py-2 text-xs font-semibold text-[color:var(--cl-th)]">
                  {fmtBRL(lista.reduce((a, g) => a + g.valor, 0))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
