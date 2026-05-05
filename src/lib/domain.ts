export type StatusChacara = 'em_dia' | 'atrasado' | 'disponivel' | 'em_construcao' | 'reservada'

export const STATUS_CHACARA: Record<StatusChacara, { label: string; color: string; bg: string; text: string }> = {
  em_dia:        { label: 'Em dia',        color: 'var(--st-em_dia-dot)', bg: 'var(--st-em_dia-bg)', text: 'var(--st-em_dia-fg)' },
  atrasado:      { label: 'Atrasado',      color: 'var(--st-atrasado-dot)', bg: 'var(--st-atrasado-bg)', text: 'var(--st-atrasado-fg)' },
  disponivel:    { label: 'Disponível',    color: 'var(--st-disponivel-dot)', bg: 'var(--st-disponivel-bg)', text: 'var(--st-disponivel-fg)' },
  em_construcao: { label: 'Pendente',      color: 'var(--st-em_construcao-dot)', bg: 'var(--st-em_construcao-bg)', text: 'var(--st-em_construcao-fg)' },
  reservada:     { label: 'Reservada',     color: 'var(--st-reservada-dot)', bg: 'var(--st-reservada-bg)', text: 'var(--st-reservada-fg)' },
}

const MESES_PT: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

export const labelMes = (mes: string) => {
  const [ano, m] = mes.split('-')
  return `${MESES_PT[m]}/${ano.slice(2)}`
}

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
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${parseInt(d, 10)} ${meses[parseInt(m, 10) - 1]} ${y}`
}

export const initials = (nome: string) => {
  const parts = nome.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const colorFromString = (str: string) => {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360
  return `oklch(0.85 0.06 ${h})`
}

export const textColorFromString = (str: string) => {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360
  return `oklch(0.42 0.12 ${h})`
}
