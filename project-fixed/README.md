# Engecampo Login — Vercel

Sistema de login seguro com **bcrypt + JWT**, hospedado no Vercel.
Sem banco de dados. Sem Google Sheets. Credenciais ficam em variáveis de ambiente.

---

## Estrutura

```
engecampo-login/
├── api/
│   ├── login.js       ← endpoint POST /api/login
│   └── verify.js      ← endpoint POST /api/verify
├── public/
│   └── index.html     ← frontend (seu design original)
├── scripts/
│   └── gerar-hash.js  ← gera hashes bcrypt localmente
├── package.json
└── vercel.json
```

---

## Setup em 4 passos

### 1. Instale as dependências
```bash
npm install
```

### 2. Gere os hashes das senhas
Para cada usuário, rode:
```bash
node scripts/gerar-hash.js SUA_SENHA_AQUI
```
Copie o hash gerado.

### 3. Configure as variáveis de ambiente no Vercel
No painel do Vercel → **Settings → Environment Variables**, adicione:

| Nome da variável | Valor |
|---|---|
| `JWT_SECRET` | Uma string longa e aleatória (ex: rode `openssl rand -hex 32`) |
| `HASH_ADMIN` | Hash bcrypt do usuário `admin` |
| `HASH_MARINHA` | Hash bcrypt do usuário `marinha` |
| `ALLOWED_ORIGIN` | URL do seu site (ex: `https://engecampo.vercel.app`) |

> Para adicionar um novo usuário:
> 1. Gere o hash com `node scripts/gerar-hash.js senha`
> 2. Adicione `HASH_NOMEUSUARIO=hash` nas env vars do Vercel
> 3. Adicione `nomeusuario: process.env.HASH_NOMEUSUARIO` em `api/login.js`
> 4. Faça redeploy

### 4. Deploy
```bash
npm i -g vercel   # instale a CLI se ainda não tiver
vercel            # siga as instruções
```

Ou conecte o repositório GitHub no painel do Vercel para deploy automático.

---

## Segurança

| Camada | Proteção |
|---|---|
| **bcrypt (cost 12)** | Senhas nunca ficam em texto puro — nem no código, nem em logs |
| **JWT (8h)** | Token assinado no servidor, expira automaticamente |
| **Rate limiting** | Bloqueia IPs após 5 tentativas erradas por 1 minuto |
| **Timing-safe** | Delay constante mesmo para usuários inexistentes |
| **Env vars** | Hashes ficam no Vercel, nunca no repositório |
| **Headers de segurança** | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |

---

## Gerar JWT_SECRET
```bash
# macOS / Linux
openssl rand -hex 32

# ou com Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
