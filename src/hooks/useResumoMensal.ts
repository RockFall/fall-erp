// hooks/useResumoMensal.ts
// Hook que agrega receita, despesas e split dos sócios por mês

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Socio } from '@/types/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export interface ResumoMes {
  mes: string           // "2026-05"
  receita: number
  despesas: number
  lucro: number
  parcelas_pagas: number
  parcelas_pendentes: number
  parcelas_atrasadas: number
  socios: { socio: Socio; valor: number }[]
}

export function useResumoMensal(mes: string) {
  const [resumo,  setResumo]  = useState<ResumoMes | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro,    setErro]    = useState<string | null>(null)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      setErro(null)

      const inicio = `${mes}-01`
      const fim    = `${mes}-31`

      const [pgRes, gastoRes, socioRes] = await Promise.all([
        supabase
          .from('pagamentos')
          .select('foi_pago, valor_pago, valor_referencia, data_vencimento')
          .gte('data_vencimento', inicio)
          .lte('data_vencimento', fim),
        supabase
          .from('gastos')
          .select('valor')
          .gte('data_gasto', inicio)
          .lte('data_gasto', fim),
        supabase
          .from('socios')
          .select('*')
          .eq('ativo', true)
          .order('nome'),
      ])

      if (pgRes.error || gastoRes.error || socioRes.error) {
        setErro('Erro ao carregar dados')
        setLoading(false)
        return
      }

      const pagamentos = pgRes.data ?? []
      const gastos     = gastoRes.data ?? []
      const socios     = (socioRes.data ?? []) as Socio[]

      const pagas     = pagamentos.filter(p => p.foi_pago)
      const pendentes = pagamentos.filter(p => !p.foi_pago)
      const atrasadas = pendentes.filter(p => new Date(p.data_vencimento) < new Date())

      const receita  = pagas.reduce((a, p) => a + (p.valor_pago ?? 0), 0)
      const despesas = gastos.reduce((a, g) => a + g.valor, 0)
      const lucro    = receita - despesas

      const totalPercentual = socios.reduce((a, s) => a + s.percentual, 0)
      const splitSocios = socios.map(s => ({
        socio: s,
        valor: lucro > 0 ? (lucro * s.percentual) / totalPercentual : 0,
      }))

      setResumo({
        mes,
        receita,
        despesas,
        lucro,
        parcelas_pagas:     pagas.length,
        parcelas_pendentes: pendentes.length,
        parcelas_atrasadas: atrasadas.length,
        socios:             splitSocios,
      })
      setLoading(false)
    }

    carregar()
  }, [mes])

  return { resumo, loading, erro }
}
