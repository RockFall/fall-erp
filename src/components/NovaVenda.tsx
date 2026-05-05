'use client'

import { useState } from 'react'
import { fmtBRL } from '@/lib/domain'
import {
  Avatar, Badge, Card, Icon, Button,
  Input, Select, FieldLabel, SectionHeader,
} from '@/components/ui'
import { useRuntimeData } from '@/hooks/useRuntimeData'

type Variant = 'wizard' | 'single'

const STEPS = ['Cliente', 'Chácara', 'Valores', 'Confirmação']

interface Form {
  cliente_id: string
  cliente_novo: string
  telefone: string
  chacara_id: string
  valor_total: string
  valor_entrada: string
  entrada_dividida: boolean
  parcelas_entrada: number
  total_parcelas: number
  valor_parcela: string
  dia_vencimento: number
  indice: string
}

function NovaVendaWizard() {
  const { clientes, chacaras, vendas } = useRuntimeData()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>({
    cliente_id: '', cliente_novo: '', telefone: '',
    chacara_id: '',
    valor_total: '85000', valor_entrada: '8500',
    entrada_dividida: false, parcelas_entrada: 1,
    total_parcelas: 96, valor_parcela: '796.88',
    dia_vencimento: 10, indice: 'IPCA',
  })
  const update = <K extends keyof Form>(k: K, v: Form[K]) => setForm(p => ({ ...p, [k]: v }))

  const disponiveis = chacaras.filter(c => c.status === 'disponivel')
  const chacaraSel = chacaras.find(c => c.id === form.chacara_id)
  const clienteSel = clientes.find(c => c.id === form.cliente_id)

  return (
    <div>
      <SectionHeader title="Nova venda" subtitle="Cadastrar contrato e gerar plano de pagamentos" />

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, padding: '4px', background: 'var(--cl-bgr)', borderRadius: 10 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 500,
            background: step === i ? 'var(--cl-bg)' : 'transparent',
            color: step === i ? 'var(--cl-t1)' : i < step ? 'var(--cl-btn-success-fg)' : 'var(--cl-t7)',
            borderRadius: 8, boxShadow: step === i ? '0 1px 3px oklch(0.20 0 0 / 0.12)' : 'none',
            cursor: i <= step ? 'pointer' : 'default',
          }} onClick={() => i <= step && setStep(i)}>
            <span style={{
              display: 'inline-flex', width: 18, height: 18, borderRadius: '50%', marginRight: 8,
              background: step === i ? 'var(--cl-solid)' : i < step ? 'oklch(0.62 0.13 145)' : 'var(--cl-step-idle)',
              color: step === i ? 'var(--cl-solid-fg)' : i < step ? 'white' : 'var(--cl-t7)', alignItems: 'center', justifyContent: 'center', fontSize: 10,
            }}>{i < step ? '✓' : i + 1}</span>
            {label}
          </div>
        ))}
      </div>

      <Card padding={24}>
        {step === 0 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cl-th)', marginBottom: 4 }}>Quem está comprando?</div>
            <div style={{ fontSize: 12, color: 'var(--cl-t7)', marginBottom: 18 }}>Selecione um cliente existente ou cadastre um novo</div>
            <div>
              <FieldLabel>Cliente</FieldLabel>
              <Select value={form.cliente_id} onChange={e => update('cliente_id', e.target.value)}>
                <option value="">— Selecionar —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                <option value="novo">+ Novo cliente</option>
              </Select>
            </div>
            {form.cliente_id === 'novo' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <div><FieldLabel>Nome completo</FieldLabel><Input value={form.cliente_novo} onChange={e => update('cliente_novo', e.target.value)} placeholder="Nome do cliente" /></div>
                <div><FieldLabel>Telefone</FieldLabel><Input value={form.telefone} onChange={e => update('telefone', e.target.value)} placeholder="(35) 99999-9999" /></div>
              </div>
            )}
            {clienteSel && (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--cl-bgr)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar nome={clienteSel.nome} size={36} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{clienteSel.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--cl-t7)' }}>{clienteSel.telefone}</div>
                </div>
                <div style={{ flex: 1 }} />
                {vendas.filter(v => v.cliente_id === clienteSel.id).length > 0 && (
                  <Badge tone="info">{vendas.filter(v => v.cliente_id === clienteSel.id).length} contratos ativos</Badge>
                )}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cl-th)', marginBottom: 4 }}>Qual chácara?</div>
            <div style={{ fontSize: 12, color: 'var(--cl-t7)', marginBottom: 14 }}>{disponiveis.length} chácaras disponíveis</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {disponiveis.map(c => (
                <button key={c.id} onClick={() => update('chacara_id', c.id)} style={{
                  padding: '14px 10px', borderRadius: 10, cursor: 'pointer',
                  background: form.chacara_id === c.id ? 'var(--cl-solid)' : 'var(--cl-bg)',
                  color: form.chacara_id === c.id ? 'var(--cl-solid-fg)' : 'var(--cl-t1)',
                  border: '1.5px solid ' + (form.chacara_id === c.id ? 'var(--cl-solid)' : 'var(--cl-border-soft)'),
                  fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
                }}>
                  {c.identificador}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cl-th)', marginBottom: 4 }}>Valores e condições</div>
            <div style={{ fontSize: 12, color: 'var(--cl-t7)', marginBottom: 18 }}>Define o plano de pagamento</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><FieldLabel>Valor total (R$)</FieldLabel><Input type="number" value={form.valor_total} onChange={e => update('valor_total', e.target.value)} /></div>
              <div><FieldLabel>Valor da entrada (R$)</FieldLabel><Input type="number" value={form.valor_entrada} onChange={e => update('valor_entrada', e.target.value)} /></div>
              <div><FieldLabel>Total de parcelas</FieldLabel><Input type="number" value={form.total_parcelas} onChange={e => update('total_parcelas', parseInt(e.target.value) || 0)} /></div>
              <div><FieldLabel>Valor da parcela (R$)</FieldLabel><Input type="number" value={form.valor_parcela} onChange={e => update('valor_parcela', e.target.value)} /></div>
              <div>
                <FieldLabel>Dia do vencimento</FieldLabel>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[5, 10, 15].map(d => (
                    <button key={d} onClick={() => update('dia_vencimento', d)} style={{
                      flex: 1, padding: '7px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer',
                      background: form.dia_vencimento === d ? 'var(--cl-solid)' : 'var(--cl-bg)',
                      color: form.dia_vencimento === d ? 'var(--cl-solid-fg)' : 'var(--cl-t4)',
                      border: '1px solid ' + (form.dia_vencimento === d ? 'var(--cl-solid)' : 'var(--cl-border-soft)'),
                      fontFamily: 'inherit',
                    }}>Dia {d}</button>
                  ))}
                </div>
              </div>
              <div><FieldLabel>Índice de reajuste</FieldLabel>
                <Select value={form.indice} onChange={e => update('indice', e.target.value)}>
                  <option value="nenhum">Sem reajuste</option>
                  <option value="IPCA">IPCA</option>
                  <option value="IGP-M">IGP-M</option>
                </Select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.entrada_dividida} onChange={e => update('entrada_dividida', e.target.checked)} />
              Dividir entrada em parcelas
            </label>
            {form.entrada_dividida && (
              <div style={{ width: 200 }}>
                <FieldLabel>Nº de parcelas da entrada</FieldLabel>
                <Input type="number" value={form.parcelas_entrada} onChange={e => update('parcelas_entrada', parseInt(e.target.value) || 1)} />
              </div>
            )}

            <div style={{ marginTop: 16, padding: 12, background: 'var(--cl-callout-info-bg)', borderRadius: 10, fontSize: 12, color: 'var(--cl-callout-info-fg)' }}>
              <strong>Plano gerado:</strong> entrada de {fmtBRL(parseFloat(form.valor_entrada))}
              {form.entrada_dividida ? ` em ${form.parcelas_entrada}×` : ''} + {form.total_parcelas} parcelas de {fmtBRL(parseFloat(form.valor_parcela))} no dia {form.dia_vencimento} · reajuste {form.indice}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cl-th)', marginBottom: 14 }}>Confirmar contrato</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 12 }}>
              {[
                ['Cliente', clienteSel?.nome || form.cliente_novo],
                ['Telefone', clienteSel?.telefone || form.telefone],
                ['Chácara', chacaraSel?.identificador],
                ['Valor total', fmtBRL(parseFloat(form.valor_total))],
                ['Entrada', fmtBRL(parseFloat(form.valor_entrada)) + (form.entrada_dividida ? ` em ${form.parcelas_entrada}×` : '')],
                ['Parcelas', `${form.total_parcelas}× ${fmtBRL(parseFloat(form.valor_parcela))}`],
                ['Vencimento', `Dia ${form.dia_vencimento}`],
                ['Reajuste', form.indice],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: 'var(--cl-t7)', marginBottom: 2, fontSize: 11 }}>{k}</div>
                  <div style={{ fontWeight: 500 }}>{v || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--cl-bd4)' }}>
          <Button variant="ghost" onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}>← Voltar</Button>
          {step < STEPS.length - 1
            ? <Button variant="primary" onClick={() => setStep(step + 1)}>Próximo →</Button>
            : <Button variant="primary">Criar venda e gerar parcelas</Button>}
        </div>
      </Card>
    </div>
  )
}

function NovaVendaSinglePage() {
  const { clientes, chacaras } = useRuntimeData()
  const [form, setForm] = useState({
    cliente_id: '', chacara_id: '',
    valor_total: 85000, valor_entrada: 8500,
    total_parcelas: 96, valor_parcela: 796.88,
    dia_vencimento: 10, indice: 'IPCA',
    entrada_dividida: false, parcelas_entrada: 1,
  })
  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(p => ({ ...p, [k]: v }))
  const disponiveis = chacaras.filter(c => c.status === 'disponivel')

  return (
    <div>
      <SectionHeader title="Nova venda" subtitle="Tudo em uma tela" />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card padding={18}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-th)', marginBottom: 12 }}>Cliente e chácara</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <FieldLabel>Cliente</FieldLabel>
                <Select value={form.cliente_id} onChange={e => update('cliente_id', e.target.value)}>
                  <option value="">— Selecionar —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
              </div>
              <div>
                <FieldLabel>Chácara disponível</FieldLabel>
                <Select value={form.chacara_id} onChange={e => update('chacara_id', e.target.value)}>
                  <option value="">— Selecionar —</option>
                  {disponiveis.map(c => <option key={c.id} value={c.id}>{c.identificador}</option>)}
                </Select>
              </div>
            </div>
          </Card>

          <Card padding={18}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-th)', marginBottom: 12 }}>Valores</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><FieldLabel>Valor total</FieldLabel><Input type="number" value={form.valor_total} onChange={e => update('valor_total', parseFloat(e.target.value) || 0)} /></div>
              <div><FieldLabel>Entrada</FieldLabel><Input type="number" value={form.valor_entrada} onChange={e => update('valor_entrada', parseFloat(e.target.value) || 0)} /></div>
              <div><FieldLabel>Nº parcelas</FieldLabel><Input type="number" value={form.total_parcelas} onChange={e => update('total_parcelas', parseInt(e.target.value) || 0)} /></div>
              <div><FieldLabel>Valor parcela</FieldLabel><Input type="number" value={form.valor_parcela} onChange={e => update('valor_parcela', parseFloat(e.target.value) || 0)} /></div>
            </div>
          </Card>

          <Card padding={18}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-th)', marginBottom: 12 }}>Condições</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <FieldLabel>Dia vencimento</FieldLabel>
                <Select value={form.dia_vencimento} onChange={e => update('dia_vencimento', parseInt(e.target.value))}>
                  <option value={5}>Dia 5</option>
                  <option value={10}>Dia 10</option>
                  <option value={15}>Dia 15</option>
                </Select>
              </div>
              <div>
                <FieldLabel>Reajuste</FieldLabel>
                <Select value={form.indice} onChange={e => update('indice', e.target.value)}>
                  <option value="nenhum">Sem reajuste</option>
                  <option value="IPCA">IPCA</option>
                  <option value="IGP-M">IGP-M</option>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        <Card padding={18} style={{ alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-th)', marginBottom: 12 }}>Resumo</div>
          {[
            ['Total', fmtBRL(form.valor_total)],
            ['Entrada', fmtBRL(form.valor_entrada)],
            ['Saldo financiado', fmtBRL(form.valor_total - form.valor_entrada)],
            ['Parcelas', `${form.total_parcelas}× ${fmtBRL(form.valor_parcela)}`],
            ['Vencimento', `Dia ${form.dia_vencimento}`],
            ['Reajuste', form.indice],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid var(--cl-bd4)' }}>
              <span style={{ color: 'var(--cl-t7)' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <Button variant="primary" size="md" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
            Criar venda
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default function NovaVenda({ variant = 'wizard' }: { variant?: Variant }) {
  return variant === 'wizard' ? <NovaVendaWizard /> : <NovaVendaSinglePage />
}
