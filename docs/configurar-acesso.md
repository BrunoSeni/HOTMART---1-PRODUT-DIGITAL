# Configurar o acesso pago

Passo a passo para ligar o login e a liberação pela compra na Hotmart. Enquanto as variáveis do Supabase não estiverem na Vercel, o app continua abrindo sem login, como hoje.

Ordem: Supabase → e-mail → Vercel → Hotmart → teste.

## 1. Supabase (banco de dados e login)

1. Crie uma conta em supabase.com e um projeto novo. Região: **South America (São Paulo)**. Guarde a senha do banco num lugar seguro.
2. No menu **SQL Editor**, clique em **New query**, cole o conteúdo de `supabase/001_acesso.sql` e clique em **Run**.
3. Em **Authentication → Sign In / Providers → Email**: deixe **Email** ligado, **Confirm email** ligado e o tamanho mínimo da senha em **8**.
4. Em **Authentication → Emails → Templates**, traduza os dois e-mails que a compradora recebe:

   - **Confirm signup** (primeiro acesso). Assunto: `Confirme seu e-mail na Lash Empresária`. Corpo: `<p>Falta só um passo para usar a Lash Empresária.</p><p><a href="{{ .ConfirmationURL }}">Confirmar meu e-mail</a></p><p>Se não foi você, ignore este e-mail.</p>`
   - **Reset Password** (esqueci minha senha). Assunto: `Crie sua nova senha da Lash Empresária`. Corpo: `<p>Recebemos um pedido para trocar sua senha.</p><p><a href="{{ .ConfirmationURL }}">Criar nova senha</a></p><p>Se não foi você, ignore este e-mail.</p>`

5. Em **Authentication → URL Configuration**, coloque o endereço do app em **Site URL** e também em **Redirect URLs**. É para lá que os links dos e-mails levam.
6. Em **Project Settings → API**, copie: **Project URL**, a chave **anon public** e a chave **service_role** (essa é secreta).

## 2. E-mails de confirmação e de nova senha (Resend)

O e-mail padrão do Supabase só envia para os membros do projeto e poucas vezes por hora. Serve para você testar com o seu e-mail, mas não para as compradoras. Para o lançamento:

1. Crie uma conta em resend.com.
2. Em **Domains**, adicione o domínio do produto e cadastre os registros DNS que o Resend mostrar. **Precisa do domínio próprio** (tarefa LP-48 no Jira).
3. Em **API Keys**, crie uma chave.
4. No Supabase, em **Authentication → Emails → SMTP Settings**, ligue o SMTP próprio:
   - Host `smtp.resend.com`, porta `465`, usuário `resend`, senha = a chave do Resend
   - Remetente: `acesso@seudominio.com.br`, nome `Lash Empresária`

## 3. Vercel (variáveis de ambiente)

Em **Settings → Environment Variables** do projeto, adicione:

| Nome | Valor |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | chave anon public |
| `VITE_LINK_COMPRA` | link do checkout da Hotmart |
| `SUPABASE_URL` | Project URL do Supabase (de novo) |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service_role (secreta) |
| `HOTMART_HOTTOK` | Hottok da Hotmart (passo 4) |
| `HOTMART_OFERTAS_VITALICIO` | códigos das ofertas do vitalício, separados por vírgula |

Depois, em **Deployments**, clique nos três pontinhos do último deploy e em **Redeploy**. A partir daí o app pede login.

> A chave service_role dá acesso total ao banco. Ela só vai na Vercel, nunca com `VITE_` na frente e nunca no código.

## 4. Hotmart (aviso de compra)

1. Cadastre o produto e as ofertas (anual e vitalício). O código de cada oferta aparece no link de pagamento, depois de `off=`. Os códigos das ofertas do vitalício vão em `HOTMART_OFERTAS_VITALICIO`; qualquer outra oferta vira plano anual.
2. Em **Ferramentas → Webhook (API e notificações)**, cadastre uma configuração:
   - URL: `https://ENDEREÇO-DO-APP/api/hotmart`
   - Versão: **2.0.0**
   - Eventos: compra aprovada, compra completa, compra reembolsada, chargeback e compra cancelada
3. Copie o **Hottok** dessa tela para `HOTMART_HOTTOK` na Vercel e faça o Redeploy.

## 5. Testar antes de abrir o carrinho

1. Na tela do webhook da Hotmart, use o envio de teste. No Supabase, em **Table Editor → acessos**, deve aparecer uma linha.
2. Faça uma compra real de teste com o seu e-mail. No app, toque em **Primeiro acesso**, crie a senha, confirme pelo e-mail, entre e confira a data de vencimento no rodapé da aba Preços.
3. Peça o reembolso dessa compra: ao reabrir o app, ele deve mostrar "Não achamos sua compra".

## Liberar acesso sem compra (esposa, betas, cortesias)

No Supabase, em **Table Editor → acessos → Insert row**:

- `email`: o e-mail da pessoa, em minúsculas
- `produto`: `calculadora`
- `plano`: `vitalicio`
- `status`: `ativo`
- `transacao`: `cortesia`

Deixe `vence_em` vazio. Para tirar o acesso, mude `status` para `cancelado`.

## Como funciona

- `api/hotmart.ts` recebe o aviso da Hotmart, confere o Hottok e grava em `acessos`: compra aprovada libera (anual = 365 dias a partir da compra; a renovação soma a partir do vencimento atual), reembolso e chargeback revogam aquela compra. Uma compra anual nunca rebaixa quem já é vitalícia.
- A compradora entra com e-mail e senha (Supabase Auth). No primeiro acesso ela cria a senha e confirma o e-mail uma vez; se esquecer, recebe um link para criar outra. O aparelho fica conectado. A compradora só lê a própria linha de `acessos`.
- Os números da calculadora ficam no celular e também na tabela `calculadoras`, ligada à conta. Ao entrar em outro aparelho, os dados da conta substituem os do aparelho.
