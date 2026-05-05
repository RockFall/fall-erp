'use client'

import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { initials, colorFromString, textColorFromString } from '@/lib/data'

// ── Style constants ────────────────────────────────────────────
export const TH: CSSProperties = {
  textAlign: 'left', padding: '8px 12px',
  color: 'var(--cl-t6)', fontWeight: 500, fontSize: 11,
}
export const TD: CSSProperties = { padding: '8px 12px', color: 'var(--cl-t2)' }

// ── Avatar ─────────────────────────────────────────────────────
export function Avatar({ nome, size = 28 }: { nome: string; size?: number }) {
  const bg = colorFromString(nome)
  const text = textColorFromString(nome)
  const fontSize = Math.round(size * 0.38)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: text,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 600, flexShrink: 0, letterSpacing: '-0.02em',
    }}>
      {initials(nome)}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────
type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'muted'
const BADGE_TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: 'var(--cl-badge-neutral-bg)', fg: 'var(--cl-badge-neutral-fg)' },
  success: { bg: 'var(--cl-badge-success-bg)',  fg: 'var(--cl-badge-success-fg)' },
  danger:  { bg: 'var(--cl-badge-danger-bg)',   fg: 'var(--cl-badge-danger-fg)' },
  warning: { bg: 'var(--cl-badge-warning-bg)', fg: 'var(--cl-badge-warning-fg)' },
  info:    { bg: 'var(--cl-badge-info-bg)',    fg: 'var(--cl-badge-info-fg)' },
  muted:   { bg: 'var(--cl-bgh)',              fg: 'var(--cl-t7)' },
}
export function Badge({ children, tone = 'neutral', size = 'sm' }: {
  children: ReactNode; tone?: BadgeTone; size?: 'sm' | 'md'
}) {
  const t = BADGE_TONES[tone]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: t.bg, color: t.fg,
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: 999, fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 500, lineHeight: 1.2, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

// ── Sparkline ──────────────────────────────────────────────────
export function Sparkline({ data, width = 80, height = 24, color = 'currentColor' }: {
  data: number[]; width?: number; height?: number; color?: string
}) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const last = data[data.length - 1]
  const lastX = width
  const lastY = height - ((last - min) / range) * height
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.2" fill={color} />
    </svg>
  )
}

// ── ProgressBar ────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'var(--cl-chart-stroke-receita)', height = 4 }: {
  value: number; max?: number; color?: string; height?: number
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ width: '100%', height, background: 'var(--cl-bd3)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  )
}

// ── StatusDot ──────────────────────────────────────────────────
import { STATUS_CHACARA, type StatusChacara } from '@/lib/data'
export function StatusDot({ status }: { status: StatusChacara }) {
  const s = STATUS_CHACARA[status]
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: s.color, flexShrink: 0,
    }} />
  )
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, padding = 16, style = {} }: {
  children: ReactNode; padding?: number; style?: CSSProperties
}) {
  return (
    <div style={{
      border: '1px solid var(--cl-bd)', borderRadius: 12,
      background: 'var(--cl-bg)', padding, ...style,
    }}>
      {children}
    </div>
  )
}

// ── KpiTile ────────────────────────────────────────────────────
export function KpiTile({ label, value, sub, sparkline, tone, icon }: {
  label: string; value: string; sub?: string;
  sparkline?: number[]; tone?: 'success' | 'danger'; icon?: ReactNode
}) {
  const valueColor = tone === 'danger' ? 'var(--cl-text-danger)'
    : tone === 'success' ? 'var(--cl-btn-success-fg)' : 'var(--cl-t1)'
  return (
    <div style={{ background: 'var(--cl-bgr)', borderRadius: 10, padding: '12px 14px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--cl-t7)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, color: valueColor, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 4 }}>{sub}</div>}
      {sparkline && (
        <div style={{ marginTop: 8, color: tone === 'danger' ? 'var(--cl-text-danger)' : 'var(--cl-sparkline-neutral)' }}>
          <Sparkline data={sparkline} width={120} height={22} />
        </div>
      )}
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────
export const Icon = {
  grid:        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  plus:        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 8h12M8 2v12"/></svg>,
  list:        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h12M2 8h8M2 12h5"/></svg>,
  cash:        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="3" width="14" height="10" rx="1.5"/><circle cx="8" cy="8" r="2"/></svg>,
  users:       <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="5" cy="5" r="2.5"/><circle cx="11" cy="5" r="2.5"/><path d="M1 14c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5"/><path d="M10 10.5c1 0 3.5.8 3.5 3.5"/></svg>,
  person:      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5"/></svg>,
  upload:      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 11V2M4 6l4-4 4 4M2 11v3h12v-3"/></svg>,
  building:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M5 5h2M5 8h2M5 11h2M9 5h2M9 8h2M9 11h2"/></svg>,
  arrowRight:  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h6M6 3l3 3-3 3"/></svg>,
  phone:       <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 3a1 1 0 011-1h1.5L6 4.5l-1.5 1A6 6 0 008 9l1-1.5L11.5 9V10.5a1 1 0 01-1 1A8.5 8.5 0 012 3z"/></svg>,
  whatsapp:    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.6 0 0 3.6 0 8c0 1.4.4 2.7 1 3.9L0 16l4.2-1.1C5.4 15.6 6.7 16 8 16c4.4 0 8-3.6 8-8s-3.6-8-8-8zm4.4 11.4c-.2.5-1 .9-1.4 1-.4.1-.8.1-1.3-.1-.3-.1-.7-.2-1.2-.4-2.1-.9-3.4-3-3.5-3.2-.1-.1-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.9.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4.2.4.6 1.5.7 1.6.1.1.1.2 0 .4-.1.1-.1.2-.2.4-.1.1-.2.3-.3.4-.1.1-.2.2-.1.4.1.2.5.8 1.1 1.3.7.6 1.4.8 1.6.9.2.1.3.1.4-.1.1-.2.5-.5.6-.7.1-.2.3-.2.4-.1.2.1 1.1.5 1.3.6.2.1.3.2.4.2 0 .2 0 .8-.2 1.5z"/></svg>,
  search:      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>,
  download:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 2v9M4 7l4 4 4-4M2 14h12"/></svg>,
  check:       <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6.5L4.5 9 10 3"/></svg>,
  alert:       <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1l5 9H1z"/><path d="M6 5v2M6 8.5v.5"/></svg>,
  clock:       <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="6" cy="6" r="5"/><path d="M6 3v3l2 1.5"/></svg>,
  pencil:      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"/></svg>,
  x:           <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l6 6M9 3l-6 6"/></svg>,
  chevronR:    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3.5 2L7 5 3.5 8"/></svg>,
  externalLink:<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 2H2v8h8V7M7 2h3v3M10 2L5.5 6.5"/></svg>,
  moon:        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M13 10A6 6 0 016 3a6 6 0 100 10 6 6 0 007-3z"/></svg>,
  sun:         <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>,
}

// ── Button ─────────────────────────────────────────────────────
type BtnVariant = 'default' | 'primary' | 'accent' | 'success' | 'ghost' | 'danger'
const BTN_VARIANTS: Record<BtnVariant, CSSProperties> = {
  default: { background: 'var(--cl-bg)', color: 'var(--cl-t1)', border: '1px solid var(--cl-bdi)' },
  primary: { background: 'var(--cl-pb)', color: 'var(--cl-pf)' },
  accent:  { background: 'oklch(0.62 0.13 250)', color: 'white' },
  success: { background: 'var(--cl-btn-success-bg)', color: 'var(--cl-btn-success-fg)' },
  ghost:   { background: 'transparent', color: 'var(--cl-t5)' },
  danger:  { background: 'var(--cl-btn-danger-bg)', color: 'var(--cl-btn-danger-fg)' },
}
export function Button({ children, variant = 'default', size = 'sm', onClick, disabled, style = {}, type = 'button' }: {
  children: ReactNode; variant?: BtnVariant; size?: 'sm' | 'md';
  onClick?: () => void; disabled?: boolean; style?: CSSProperties; type?: 'button' | 'submit'
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      fontSize: size === 'sm' ? 12 : 13,
      padding: size === 'sm' ? '6px 12px' : '8px 14px',
      borderRadius: 8, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: '1px solid transparent',
      opacity: disabled ? 0.5 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      lineHeight: 1.2, fontFamily: 'inherit',
      ...BTN_VARIANTS[variant], ...style,
    }}>
      {children}
    </button>
  )
}

// ── Input ──────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = 'text', autoFocus, style = {}, onKeyDown }: {
  value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; autoFocus?: boolean;
  style?: CSSProperties; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      autoFocus={autoFocus} onKeyDown={onKeyDown}
      style={{
        width: '100%', padding: '7px 10px', fontSize: 12,
        border: '1px solid var(--cl-bdi)', borderRadius: 8,
        outline: 'none', background: 'var(--cl-bg)', fontFamily: 'inherit', ...style,
      }}
    />
  )
}

// ── Select ─────────────────────────────────────────────────────
export function Select({ value, onChange, children, style = {} }: {
  value: string | number; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode; style?: CSSProperties
}) {
  return (
    <select value={value} onChange={onChange} style={{
      width: '100%', padding: '7px 10px', fontSize: 12,
      border: '1px solid var(--cl-bdi)', borderRadius: 8,
      outline: 'none', background: 'var(--cl-bg)', fontFamily: 'inherit', ...style,
    }}>
      {children}
    </select>
  )
}

// ── FieldLabel ─────────────────────────────────────────────────
export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 11, color: 'var(--cl-t6)', marginBottom: 4, fontWeight: 500 }}>
      {children}
    </label>
  )
}

// ── SectionHeader ──────────────────────────────────────────────
export function SectionHeader({ title, subtitle, right }: {
  title: string; subtitle?: ReactNode; right?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--cl-th)', letterSpacing: '-0.015em', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--cl-t6)', margin: '3px 0 0 0' }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────
export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, 2800)
    return () => clearTimeout(t)
  }, [message, onClose])
  if (!message) return null
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
      background: 'var(--cl-pb)', color: 'var(--cl-pf)',
      padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 500,
      boxShadow: '0 8px 24px -8px rgba(0,0,0,0.3)',
    }}>
      {message}
    </div>
  )
}

// ── FilterPill ─────────────────────────────────────────────────
export function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', fontSize: 11.5, borderRadius: 999, cursor: 'pointer',
      background: active ? 'var(--cl-pb)' : 'var(--cl-bg)',
      color: active ? 'var(--cl-pf)' : 'var(--cl-t5)',
      border: '1px solid ' + (active ? 'var(--cl-pb)' : 'var(--cl-bds)'),
      fontFamily: 'inherit',
    }}>
      {label}
    </button>
  )
}
