'use client'

import { useState, useMemo } from 'react'
import { fmtBRL } from '@/lib/domain'
import { Avatar, Badge, Icon, Button, Input, SectionHeader } from '@/components/ui'
import { useRuntimeData } from '@/hooks/useRuntimeData'

interface Props {
  onOpenExtrato: (vendaId: string) => void
}

export default function Clientes({ onOpenExtrato }: Props) {
  const [busca, setBusca] = useState('')
  const { clientes, vendas } = useRuntimeData()

  const lista = useMemo(() => {
    const enrich = clientes.map(c => {
      const vendasCliente = vendas.filter(v => v.cliente_id === c.id)
      const atrasado = vendasCliente.some(v => v.status === 'atrasado')
      return {
        ...c,
        chacaras: vendasCliente.map(v => v.chacara),
        n_contratos: vendasCliente.length,
        primeira_venda: vendasCliente[0]?.id,
        status: atrasado ? 'atrasado' : vendasCliente.length ? 'em_dia' : 'sem_contrato',
        valor_total: vendasCliente.reduce((a, v) => a + v.valor_total, 0),
      }
    })
    if (!busca.trim()) return enrich
    const q = busca.toLowerCase()
    return enrich.filter(c => c.nome.toLowerCase().includes(q))
  }, [busca, clientes, vendas])

  const comMultiplas = clientes.filter(c => vendas.filter(v => v.cliente_id === c.id).length > 1).length

  return (
    <div>
      <SectionHeader
        title="Clientes"
        subtitle={`${clientes.length} cadastrados · ${comMultiplas} com múltiplas chácaras`}
        right={<Button variant="primary" size="md">{Icon.plus} Novo cliente</Button>}
      />

      <div style={{ position: 'relative', marginBottom: 12, maxWidth: 320 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cl-t7)' }}>{Icon.search}</span>
        <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente…" style={{ paddingLeft: 30 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {lista.map(c => (
          <div key={c.id}
            onClick={() => c.primeira_venda && onOpenExtrato(c.primeira_venda)}
            style={{
              border: '1px solid var(--cl-bd)', borderRadius: 12, padding: 14,
              cursor: c.primeira_venda ? 'pointer' : 'default', background: 'var(--cl-bg)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <Avatar nome={c.nome} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cl-th)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--cl-t7)', marginTop: 2 }}>{c.telefone}</div>
              </div>
              {c.status === 'atrasado' ? <Badge tone="danger">Atenção</Badge>
                : c.status === 'em_dia' ? <Badge tone="success">Em dia</Badge>
                : <Badge tone="muted">Sem contrato</Badge>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--cl-t7)' }}>
              <span>
                {c.n_contratos} {c.n_contratos === 1 ? 'contrato' : 'contratos'} · {c.chacaras.join(', ') || 'nenhuma chácara'}
              </span>
              <span style={{ fontWeight: 500, color: 'var(--cl-t3)' }}>{fmtBRL(c.valor_total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
