// components/Socios.tsx
// Distribuição de lucro entre Geovanin e Paulo

import { useState } from 'react'
import { useResumoMensal } from '@/hooks/useResumoMensal'

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Últimos 6 meses
function ultimos6Meses(): string[] {
  const meses: string[] = []
  const d = new Date()
  for (let i = 0; i < 6; i++) {
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return meses
}

const MESES_PT: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

const labelMes = (mes: string) => {
  const [ano, m] = mes.split('-')
  return `${MESES_PT[m]}/${ano.slice(2)}`
}

const AVATARES = ['GE', 'PA']
const CORES = [
  { bg: 'bg-[color:var(--cl-badge-info-bg)]', text: 'text-[color:var(--cl-badge-info-fg)]', barVar: 'var(--cl-partner-bar-1)' },
  { bg: 'bg-[color:var(--cl-badge-success-bg)]', text: 'text-[color:var(--cl-badge-success-fg)]', barVar: 'var(--cl-partner-bar-2)' },
] as const

export default function Socios() {
  const mesCorrente = new Date().toISOString().slice(0, 7)
  const [mesSel, setMesSel] = useState(mesCorrente)
  const { resumo, loading } = useResumoMensal(mesSel)

  if (loading || !resumo) {
    return <div className="text-xs text-[color:var(--cl-t7)] py-8 text-center">Carregando…</div>
  }

  return (
    <div>

      {/* Seletor de mês */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-sm font-medium text-[color:var(--cl-th)]">Distribuição de lucro</h1>
          <p className="text-xs text-[color:var(--cl-t7)] mt-0.5">Geovanin & Paulo · 70 / 30</p>
        </div>
        <input
          type="month"
          value={mesSel}
          onChange={e => setMesSel(e.target.value)}
          className="px-2.5 py-1 text-xs border border-[color:var(--cl-bd)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--cl-bd5)]"
        />
      </div>

      {/* KPIs do mês */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { label: 'Receita total',  value: fmtBRL(resumo.receita),  sub: `${resumo.parcelas_pagas} parcelas pagas` },
          { label: 'Despesas',       value: fmtBRL(resumo.despesas), sub: 'gastos e custos' },
          { label: 'Lucro líquido',  value: fmtBRL(resumo.lucro),    sub: 'para distribuir', bold: true },
        ].map(c => (
          <div key={c.label} className="bg-[color:var(--cl-bgr)] rounded-lg px-3 py-2.5">
            <div className="text-xs text-[color:var(--cl-t7)] mb-1">{c.label}</div>
            <div className={`text-base font-medium ${c.bold ? 'text-[color:var(--cl-th)]' : 'text-[color:var(--cl-th)]'}`}>
              {c.value}
            </div>
            <div className="text-xs text-[color:var(--cl-t7)] mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Cards dos sócios */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {resumo.socios.map((s, i) => {
          const cor = CORES[i] ?? CORES[0]
          return (
            <div
              key={s.socio.id}
              className="border border-[color:var(--cl-bd)] rounded-xl p-4 flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${cor.bg} ${cor.text}`}>
                {AVATARES[i]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[color:var(--cl-th)]">{s.socio.nome}</div>
                <div className="text-xs text-[color:var(--cl-t7)] mt-0.5">{s.socio.percentual}% do lucro</div>
                <div className="h-1.5 rounded-full mt-2" style={{ width: `${s.socio.percentual}%`, background: cor.barVar }} />
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-semibold text-[color:var(--cl-th)]">{fmtBRL(s.valor)}</div>
                <div className="text-xs text-[color:var(--cl-t7)] mt-0.5">{labelMes(mesSel)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabela histórico */}
      <div className="border border-[color:var(--cl-bd)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--cl-bd4)] bg-[color:var(--cl-bgr)]">
          <span className="text-xs font-medium text-[color:var(--cl-t2)]">Histórico mensal</span>
        </div>
        <HistoricoTabela socios={resumo.socios.map(s => s.socio.nome)} />
      </div>
    </div>
  )
}

// Sub-componente que carrega cada mês do histórico
function HistoricoTabela({ socios }: { socios: string[] }) {
  const meses = ultimos6Meses()

  return (
    <table className="w-full text-xs">
      <thead className="bg-[color:var(--cl-bgr)] border-b border-[color:var(--cl-bd)]">
        <tr>
          <th className="text-left px-4 py-2 text-[color:var(--cl-t7)] font-normal">Mês</th>
          <th className="text-left px-4 py-2 text-[color:var(--cl-t7)] font-normal">Receita</th>
          <th className="text-left px-4 py-2 text-[color:var(--cl-t7)] font-normal">Despesas</th>
          <th className="text-left px-4 py-2 text-[color:var(--cl-t7)] font-normal">Lucro líquido</th>
          {socios.map(s => (
            <th key={s} className="text-left px-4 py-2 text-[color:var(--cl-t7)] font-normal">{s}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {meses.map(mes => (
          <HistoricoRow key={mes} mes={mes} socios={socios} />
        ))}
      </tbody>
    </table>
  )
}

function HistoricoRow({ mes, socios }: { mes: string; socios: string[] }) {
  const { resumo, loading } = useResumoMensal(mes)
  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <tr className="border-b border-[color:var(--cl-bd4)] hover:bg-[color:var(--cl-bgr)] transition-colors last:border-none">
      <td className="px-4 py-2.5 font-medium text-[color:var(--cl-t2)]">{labelMes(mes)}</td>
      {loading || !resumo ? (
        <td colSpan={3 + socios.length} className="px-4 py-2.5 text-[color:var(--cl-bd5)] text-xs">carregando…</td>
      ) : (
        <>
          <td className="px-4 py-2.5 text-[color:var(--cl-t4)]">{fmtBRL(resumo.receita)}</td>
          <td className="px-4 py-2.5 text-[color:var(--cl-t4)]">{fmtBRL(resumo.despesas)}</td>
          <td className="px-4 py-2.5 font-medium text-[color:var(--cl-th)]">{fmtBRL(resumo.lucro)}</td>
          {resumo.socios.map(s => (
            <td key={s.socio.id} className="px-4 py-2.5 text-[color:var(--cl-t4)]">{fmtBRL(s.valor)}</td>
          ))}
        </>
      )}
    </tr>
  )
}
