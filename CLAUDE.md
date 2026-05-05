@AGENTS.md

# Objetivo importante
Embora desenvolvendo customizado a ideia é generalizar tudo para ser adaptável a novos clientes


# Fall ERP

Sistema de gestão financeira de pagamentos de empreendimentos rurais.
Stack: Next.js 14, Supabase, Tailwind CSS, TypeScript.

## Domínio
- Vencimentos: dia 5, 10 ou 15 conforme contrato
- Pagamentos podem ser parciais, duplos ou com crédito
- Lucro dividido X/Y entre Geovanin e Paulo
- Índices de reajuste: IPCA ou IGP-M
- Uma chácara só pode ter uma venda ativa por vez
- Empreendimento atual: Rancho da Montanha (~52 contratos)

## Arquivos principais
- schema.sql → estrutura do banco Supabase
- types/database.ts → tipos TypeScript
- components/RegistrarPagamentos.tsx → tela de pagamento (1 clique)
- components/Gastos.tsx → gastos e despesas
- components/Socios.tsx → split Geovanin & Paulo
- hooks/useResumoMensal.ts → agregação mensal




# Fall ERP — Contexto do Projeto

## O que é
Sistema de gestão financeira e administrativa de empreendimento rural (condomínio com lotes/chácaras), substituindo uma planilha Excel manual com ~52 contratos ativos.

## Stack
- Next.js 14 (App Router)
- Supabase (Postgres + RLS)
- Tailwind CSS
- TypeScript

---

## Sócios
O lucro é dividido **50/50** entre **Geovanin** e **Paulo**.
A tela de Sócios mostra receita, despesas e o split mensal de cada um.

---

## Domínio — regras importantes

- Cada **chácara** só pode ter uma venda ativa por vez
- Vencimentos: **dia 5, 10 ou 15** conforme o contrato
- Pagamentos podem ser: normais, parciais, duplos (2 parcelas juntas) ou com crédito
- Índices de reajuste: sem índice, IPCA ou IGP-M (aplicado anualmente)
- Entrada pode ser à vista ou **dividida em parcelas**
- Status da venda: `em_dia`, `atrasado`, `cancelado`
- Clientes podem ter **múltiplas chácaras** (ex: Breno tem 3, Claudio Roberto tem 4)

---

## Arquivos do projeto

```
src/
├── app/
│   └── layout-app.tsx         # Shell principal com sidebar e roteamento
├── components/
│   ├── RegistrarPagamentos.tsx # Tela de pagamento rápido (1 clique)
│   ├── Gastos.tsx              # Gastos e despesas
│   └── Socios.tsx              # Split de lucro Geovanin & Paulo
├── hooks/
│   └── useResumoMensal.ts      # Agrega receita/despesa/split por mês
└── types/
    └── database.ts             # Tipos TypeScript espelhando o schema
schema.sql                      # Schema Supabase (já rodado)
```

---

## Telas implementadas

### RegistrarPagamentos ✅
- Tabela com todos os pagamentos do mês
- **1 clique** no botão "Pagar" → quita com valor exato
- **2 cliques** (lápis) → abre formulário inline na mesma linha para valor diferente
- Filtros: Todos / Atrasados / Pendentes / Pagos / Dia 5 / Dia 10 / Dia 15
- Resumo no topo: recebido, pendente, em atraso (atualiza em tempo real)
- Toast de confirmação após cada pagamento
- Botão "Desfazer" em linhas já pagas

### Gastos ✅
- Formulário sempre visível no topo (sem modal)
- Campos: categoria, valor, data, chácara (opcional), descrição
- Enter salva o formulário
- Filtro por categoria e por mês
- Total no rodapé da tabela

### Socios ✅
- KPIs: receita, despesas, lucro líquido
- Cards de Geovanin e Paulo com valor do mês
- Histórico dos últimos 6 meses em tabela

---

## Telas a implementar (próximos passos)

### Dashboard (prioridade alta)
KPIs: receita recebida no mês, pendente, atrasados, contratos ativos
Gráfico de receita mensal (últimos 5 meses)
Alertas: vencimentos desta semana, contratos em atraso
Grid visual de chácaras colorido por status (verde=em dia, vermelho=atrasado, cinza=disponível)
Distribuição rápida dos sócios

### Contratos (prioridade alta)
Tabela com todas as vendas
Colunas: chácara, cliente, valor total, entrada, parcelas, valor parcela, vencimento, índice, status
Filtro por status e dia de vencimento
Clique na linha abre o extrato do cliente

### Nova Venda (prioridade alta)
Formulário: cliente (select ou criar novo), chácara disponível, valor total, entrada, entrada dividida?, nº parcelas entrada, total parcelas, dia vencimento, índice, link contrato
Ao salvar: chama RPC `gerar_plano_pagamentos(venda_id)` que cria todas as linhas na tabela `pagamentos`

### Extrato do Cliente (prioridade média)
Cabeçalho: dados do contrato (valor total, entrada, parcelas, vencimento, índice)
Situação financeira: total pago, saldo devedor, barra de progresso
Histórico completo de parcelas com status por linha
Botão exportar PDF

### Clientes (prioridade média)
Lista de clientes com busca
Indicar quando cliente tem múltiplas chácaras
Status geral (em dia / atenção / atrasado)
Clique abre histórico

### Importar Planilha (prioridade média)
Script `scripts/importar-planilha.ts`
Lê CSV exportado da planilha original
Popula: clientes, chácaras, vendas e pagamentos históricos
Dados reais: ~52 contratos, vencimentos dias 5/10/15

---

## Banco de dados — tabelas principais

- `empreendimentos` — unidade administrativa
- `chacaras` — identificador ex: "06-I", pertence a empreendimento
- `clientes` — nome, telefone
- `vendas` — contrato completo (valor, parcelas, vencimento, índice, status)
- `pagamentos` — cada parcela individual (foi_pago, valor_pago, data_pagamento)
- `gastos` — despesas por categoria, opcionalmente ligadas a chácara
- `socios` — Geovanin 50% e Paulo 50%

### View útil
`v_pagamentos_mes` — join de pagamentos + venda + cliente + chácara, usada pela tela de pagamento

### RPCs Supabase
- `gerar_plano_pagamentos(venda_id)` — gera todas as parcelas ao criar venda
- `recalcular_status_venda(venda_id)` — atualiza status em_dia/atrasado após pagamento

---

## Decisões de UX importantes

1. **Pagamento é a ação mais frequente** — deve ser o mínimo de cliques possível
2. **Gastos**: formulário sempre visível no topo, sem abrir modal
3. **Formulários inline** — nunca abrir página nova para ações rápidas
4. **Filtros por dia de vencimento** — operador processa em lotes (dia 5, depois dia 10, depois dia 15)
5. **Toast de confirmação** — sempre mostrar feedback após ação

---

## Dados reais da planilha (referência)

Clientes com múltiplas chácaras:
- Breno Henrique de Souza: 01-H, 02-H, 09-B
- Claudio Roberto: 10-E, 11-E, 14-E, 15-E
- Diego Tavares: 15-I, 16-B
- Lucimara do Carmo: 01-I, 02-I
- Almir Rodrigues/Nilce: 07-D, 08-D
- Jose Batista Laia: 01-E, 02-E
- Deborah Cristina: 19-B, 20-B

Vencimentos:
- Dia 5: Christian Souza (06-I), Celina Cruz (03-I), Amanda Fernandes (10-A), Guanair Oliveira (07-A), Lucimara (01-I, 02-I)
- Dia 10: maioria dos contratos
- Dia 15: Diego Tavares, Bento Confessor, Afonso Rodrigues, Emanuel Costa, e outros