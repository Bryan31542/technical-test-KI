# Bot de WhatsApp + panel de casos

Prototipo para una universidad: un backend NestJS recibe mensajes al estilo Twilio, clasifica la intención, responde desde una base de conocimiento y abre casos. Un panel Next.js permite listar, filtrar y gestionar esos casos.

Las decisiones de alcance están en [DECISIONES.md](./DECISIONES.md).

## Requisitos

- Node.js 22 y npm
- Docker y Docker Compose
- Para Playwright: Chromium (`npx playwright install chromium` desde `apps/web`)

## Arranque rápido (Docker Compose)

Esto levanta Postgres, la API y el panel. Postgres arranca primero, la API espera a que esté sano, y el frontend espera a la API.

```bash
cp .env.example .env
```

Completá **`.env` en la raíz**. Es el único archivo de entorno: lo leen Compose, Nest, Prisma y Next. Un ejemplo para correr el prototipo **sin Twilio**:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=casos
POSTGRES_PORT=5432

CORS_ORIGIN=http://localhost:3000
API_PORT=8080
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8080

MESSAGING_DRIVER=db
TWILIO_WHATSAPP_FROM=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_CONTENT_SID=

PANEL_USER=panel
PANEL_PASSWORD_HASH=JDJiJDEwJG1pWFV4Wnh2Z1pSQkdNeHZCcm1hUWU5SnRqYzN4dzE4QUFwTERLZ1lFZFFzS3BFQmpJME8y
```

`PANEL_PASSWORD_HASH` es el bcrypt de la contraseña `panel`, en base64. Un hash crudo `$2b$…` en este archivo lo interpola Docker Compose y se rompe. La API acepta `$2b$…` o base64; para Compose usá base64. `DATABASE_URL` es opcional: si falta o todavía tiene `${…}`, la API la arma con `POSTGRES_*` hacia `localhost`. En Docker el entrypoint la reconstruye hacia el host `postgres`.

Después:

```bash
docker compose up --build
```

| Qué | URL |
| --- | --- |
| Panel | http://localhost:3000 |
| API | http://localhost:8080 |
| Health | http://localhost:8080/health |

Login del panel: usuario `panel` / contraseña `panel`.

El entrypoint de la API corre `prisma migrate deploy` y el seed de la base de conocimiento en cada arranque. No subas archivos `.env` al repo.

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` | Postgres en Compose y, en local, para armar `DATABASE_URL` |
| `DATABASE_URL` | Opcional. Override de Prisma. En Docker se reconstruye hacia el host `postgres` |
| `CORS_ORIGIN` | Origen del panel (`http://localhost:3000`) |
| `API_PORT` / `WEB_PORT` | Puertos publicados por Compose |
| `NEXT_PUBLIC_API_URL` | URL de la API que consume el panel. En la imagen del frontend se hornea en el build |
| `MESSAGING_DRIVER` | `db` (default): persiste el saliente y no llama a Twilio. `twilio`: segunda implementación del puerto |
| `TWILIO_*` | Solo si `MESSAGING_DRIVER=twilio` |
| `PANEL_USER` | Usuario HTTP Basic del panel. El webhook y `/health` no piden auth |
| `PANEL_PASSWORD_HASH` | Hash bcrypt `$2b$…` o el mismo valor en base64. Si falta, `/cases` queda abierto |

Para generar otro hash, desde `apps/api` después de `npm ci`:

```bash
node -e "const bcrypt=require('bcryptjs'); const h=bcrypt.hashSync('tu-clave', 10); console.log(h); console.log(Buffer.from(h).toString('base64'))"
```

## Desarrollo local (API y web en el host)

Útil para Jest, Playwright y `start:dev`. Postgres puede seguir en Docker. API y web van en **dos terminales**; `start:dev` no vuelve al prompt.

```bash
docker compose up -d postgres

cd apps/api
npm ci
npx prisma generate
npm run prisma:deploy
npm run prisma:seed
npm run start:dev
```

```bash
cd apps/web
npm ci
npm run dev
```

Los usuarios de Postgres de `.env` y del volumen de Compose tienen que coincidir: si el volumen ya se creó con otras credenciales, o bien usá esas mismas en `.env`, o borralo con `docker compose down -v` (borra datos locales).

## Pruebas

**Unitarias (Jest)** — no necesitan Postgres; las dependencias externas están mockeadas:

```bash
cd apps/api
npm ci
npm test
```

Cubren clasificación de intención, apertura de casos / reclamos e idempotencia del webhook (`MessageSid` repetido).

**End-to-end (Playwright)** — el flujo del panel: llega un reclamo por el webhook, aparece en la lista, sobrevive el filtro `ABIERTO` y se ve el hilo.

Hace falta Postgres arriba y el hash de la contraseña `panel` en `.env` (o `PANEL_USER` / `PANEL_PASSWORD` en el entorno del test). Playwright levanta API y web si no están corriendo.

```bash
cd apps/web
npm ci
npx playwright install chromium
npm run test:e2e
```

## Probar el bot sin Twilio

El webhook acepta el mismo POST form-encoded que Twilio (`From`, `Body`, `MessageSid`):

```bash
curl -s -X POST http://localhost:8080/webhook/whatsapp \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'From=whatsapp:+50370000000' \
  --data-urlencode 'Body=quiero poner un reclamo' \
  --data-urlencode 'MessageSid=SM-prueba-1'
```

Con `MESSAGING_DRIVER=db` la respuesta queda guardada en el caso y se ve en el panel. El mismo `MessageSid` una segunda vez no duplica el hilo ni vuelve a responder.

## Twilio (opcional)

No es requisito. Si lo usás: `MESSAGING_DRIVER=twilio` y las credenciales. Es otra implementación de la misma interfaz de mensajería; el webhook no cambia.

La cuenta de prueba de Twilio no deja mandar el texto libre que el bot arma (el body guardado en la base). Exige plantillas (`ContentSid`) y no acepta un `body` custom por la API REST. El fallback TwiML tampoco alcanza: Twilio no entrega ese XML como el mensaje de la base en WhatsApp. El saliente sí se persiste y se ve en el panel; el usuario de WhatsApp no recibe ese texto. Es una limitante de la versión de prueba, no del prototipo. El camino soportado para evaluar el bot es `MESSAGING_DRIVER=db` más `curl` o Playwright.

## Estructura

```
apps/api    NestJS, Prisma, Postgres
apps/web    Next.js (App Router), panel y Playwright
```
