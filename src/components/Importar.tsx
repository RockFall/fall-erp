'use client'

import { useState } from 'react'
import { VENDAS, CLIENTES, fmtBRL } from '@/lib/data'
import { Badge, Icon, Button, SectionHeader, Card, TH, TD } from '@/components/ui'

type Step = 'upload' | 'preview' | 'done'

export default function Importar() {
  const [step, setStep] = useState<Step>('upload')

  return (
    <div>
      <SectionHeader title="Importar planilha" subtitle="Importe contratos da planilha Excel original (CSV)" />

      <Card padding={28} style={{ textAlign: step === 'upload' ? 'center' : 'left' }}>
        {step === 'upload' && (
          <>
            <div style={{
              padding: 40, border: '2px dashed var(--cl-bd5)', borderRadius: 14,
              background: 'var(--cl-bgr)', cursor: 'pointer',
            }} onClick={() => setStep('preview')}>
              <div style={{ fontSize: 28, marginBottom: 8, display: 'flex', justifyContent: 'center', color: 'var(--cl-t6)' }}>{Icon.upload}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cl-th)', marginBottom: 4 }}>Arraste um arquivo CSV ou clique para selecionar</div>
              <div style={{ fontSize: 12, color: 'var(--cl-t7)' }}>Aceita .csv exportado da planilha original (até 10MB)</div>
            </div>
            <div style={{ marginTop: 18, fontSize: 11, color: 'var(--cl-t7)', textAlign: 'left' }}>
              <div style={{ fontWeight: 500, marginBottom: 4, color: 'var(--cl-t4)' }}>Colunas esperadas:</div>
              chácara · cliente · telefone · valor_total · entrada · n_parcelas · valor_parcela · dia_vencimento · indice
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cl-th)' }}>Pré-visualização — contratos.csv</div>
                <div style={{ fontSize: 12, color: 'var(--cl-t7)', marginTop: 2 }}>52 linhas detectadas · 0 erros · 3 clientes novos</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" onClick={() => setStep('upload')}>Cancelar</Button>
                <Button variant="primary" onClick={() => setStep('done')}>Importar 52 contratos</Button>
              </div>
            </div>
            <div style={{ border: '1px solid var(--cl-bd)', borderRadius: 10, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--cl-bgr)', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={TH}>Chácara</th>
                    <th style={TH}>Cliente</th>
                    <th style={TH}>Telefone</th>
                    <th style={TH}>Valor</th>
                    <th style={TH}>Parcelas</th>
                    <th style={TH}>Venc.</th>
                    <th style={TH}></th>
                  </tr>
                </thead>
                <tbody>
                  {VENDAS.slice(0, 12).map((v, i) => {
                    const c = CLIENTES.find(cl => cl.id === v.cliente_id)!
                    const novo = i % 5 === 0
                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--cl-bd4)' }}>
                        <td style={{ ...TD, fontWeight: 500 }}>{v.chacara}</td>
                        <td style={TD}>{c.nome}</td>
                        <td style={{ ...TD, color: 'var(--cl-t7)' }}>{c.telefone}</td>
                        <td style={TD}>{fmtBRL(v.valor_total)}</td>
                        <td style={TD}>{v.total_parcelas}× {fmtBRL(v.valor_parcela)}</td>
                        <td style={{ ...TD, color: 'var(--cl-t7)' }}>Dia {v.dia_vencimento}</td>
                        <td style={TD}>
                          {novo ? <Badge tone="info">Cliente novo</Badge> : <Badge tone="success">{Icon.check} OK</Badge>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--cl-btn-success-bg)', color: 'var(--cl-btn-success-fg)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>52 contratos importados!</div>
            <div style={{ fontSize: 12, color: 'var(--cl-t7)', marginBottom: 18 }}>
              3 clientes novos cadastrados · plano de pagamentos gerado
            </div>
            <Button variant="primary" onClick={() => setStep('upload')}>Importar outra planilha</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
