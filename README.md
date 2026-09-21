# Bot de WhatsApp + panel de casos

Backend NestJS: webhook al estilo Twilio, intención por reglas, respuestas desde un seed y casos en Postgres. Frontend Next.js: listar, filtrar y gestionar esos casos.

Cómo se decidió el alcance: [DECISIONES.md](./DECISIONES.md).

## Cómo correrlo

Hace falta **Docker Compose** (Docker Desktop o equivalente). Node.js 22 solo si vas a correr tests o el modo local, más abajo.

```bash
git clone <url-del-repo>
cd <carpeta-del-repo>
cp .env.example .env
docker compose up --build
```

`.env.example` ya trae valores de demo. **No lo dejes con `POSTGRES_USER` vacío**: Compose no levanta Postgres.

La primera vez tarda (build de las imágenes). Cuando `api` y `web` estén up:

| Qué | Dónde |
| --- | --- |
| Panel | http://localhost:3000 |
| Usuario / contraseña | `panel` / `panel` |
| API | http://localhost:8080 |
| Health | http://localhost:8080/health |

Hay un solo `.env`, en la raíz. No lo subas al repo.

Si 3000, 8080 o 5432 están ocupados, cambiá `WEB_PORT`, `API_PORT` o `POSTGRES_PORT` en `.env`. Si Postgres ya tenía un volumen con otras credenciales: o usás esas en `.env`, o `docker compose down -v` (borra datos locales).

## Probar el bot (sin cuenta Twilio)

Con el stack arriba:

```bash
curl -s -X POST "http://localhost:8080/webhook/whatsapp" -H "Content-Type: application/x-www-form-urlencoded" --data-urlencode "From=whatsapp:+50370000000" --data-urlencode "Body=quiero poner un reclamo" --data-urlencode "MessageSid=SM-prueba-1"
```

El reclamo aparece en el panel. El mismo `MessageSid` otra vez no duplica el hilo.

## Tests

**Jest** (no necesita Postgres):

```bash
cd apps/api
npm ci
npm test
```

**Playwright** (Postgres arriba, login `panel` / `panel`). Instala Chromium una vez:

```bash
cd apps/web
npm ci
npx playwright install chromium
npm run test:e2e
```

Para verlo: `npx playwright test --headed` abre el navegador; `npx playwright test --ui` abre el runner interactivo.

Cubre: llega un reclamo por el webhook → se ve en la lista → sigue visible con filtro `ABIERTO` → el detalle muestra el hilo.

## Desarrollo local (opcional)

API y web en el host, Postgres en Docker. **Dos terminales** (`start:dev` no vuelve).

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

## Variables

| Variable | Uso |
| --- | --- |
| `POSTGRES_*` | Usuario, clave, base y puerto de Postgres |
| `DATABASE_URL` | Opcional. Si falta, se arma con `POSTGRES_*` |
| `CORS_ORIGIN` | Origen del panel (`http://localhost:3000`) |
| `API_PORT` / `WEB_PORT` | Puertos publicados por Compose |
| `NEXT_PUBLIC_API_URL` | URL de la API. Next solo lee claves `NEXT_PUBLIC_*` |
| `MESSAGING_DRIVER` | `db` (default) o `twilio` |
| `TWILIO_*` | Solo si `MESSAGING_DRIVER=twilio` |
| `PANEL_USER` | Usuario del panel |
| `PANEL_PASSWORD_HASH` | bcrypt de la clave, en **base64**. Un hash `$2b$…` crudo lo rompe Compose. Si falta, `/cases` queda sin auth. Webhook y `/health` no piden login |

Otra contraseña, desde `apps/api` después de `npm ci` (usá la línea base64 en `.env`):

```bash
node -e "const bcrypt=require('bcryptjs'); const h=bcrypt.hashSync('tu-clave', 10); console.log(h); console.log(Buffer.from(h).toString('base64'))"
```

## Twilio (opcional)

No hace falta para evaluar el prototipo. Si lo usás: `MESSAGING_DRIVER=twilio` y las credenciales. El webhook sigue siendo el mismo.

La cuenta **trial** no envía el texto libre a WhatsApp (pide plantilla `ContentSid`; TwiML tampoco entrega el body). El mensaje sí queda en el panel. Camino soportado: `MESSAGING_DRIVER=db` + curl o Playwright.

## Estructura

```
apps/api    NestJS, Prisma, Postgres
apps/web    Next.js (App Router), panel y Playwright
```
