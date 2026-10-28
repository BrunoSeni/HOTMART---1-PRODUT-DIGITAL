# Arquitetura e crescimento

Hoje o produto é só a calculadora. Este documento registra como a base atual já comporta o que vem depois (site próprio, agenda, mensagens) sem refazer nada.

## Endereços (com domínio próprio)

| Endereço | O que é | Onde roda |
| --- | --- | --- |
| `lashempresaria.com.br` | Site de vendas: página do produto, inscrição do semente, depoimentos | Vercel (projeto separado ou página estática) |
| `app.lashempresaria.com.br` | O app da compradora: calculadora hoje, agenda depois | Vercel, este repositório |
| `acesso@lashempresaria.com.br` | Remetente do e-mail com o código de login | Resend |

O domínio exato depende da checagem da LP-48.

## O que já está pronto para crescer

- **Conta da compradora (Supabase Auth):** o login é por pessoa, não por produto. A agenda usa o mesmo login.
- **Acessos por produto:** a tabela `acessos` tem uma linha por e-mail e produto. A agenda entra como produto `agenda`, vendida como upgrade ou em combo, sem mexer na calculadora.
- **Dados na conta:** cada tabela nova (clientes, agendamentos) segue o mesmo padrão de `calculadoras`: uma coluna `user_id` e uma regra que só deixa a dona ler e escrever.
- **Funções no servidor (`api/`):** o webhook da Hotmart é a primeira. Lembretes e mensagens entram como novas funções, e as tarefas agendadas (ex.: lembrete na véspera) usam Vercel Cron.

## Quando a agenda vier (épico LP-46)

1. Tabelas `clientes` e `agendamentos` no Supabase, ligadas à `user_id`.
2. Novas abas no app, liberadas só para quem tem acesso ao produto `agenda`.
3. Link público para a cliente final marcar horário (ex.: `app.lashempresaria.com.br/agendar/studiojaclash`).
4. Mensagens: e-mail pelo Resend logo de início; WhatsApp pela API oficial da Meta ou por um provedor, que tem custo por mensagem e precisa de aprovação dos modelos de mensagem.

Nada disso muda o escopo do lançamento semente: a calculadora continua sendo o produto.
