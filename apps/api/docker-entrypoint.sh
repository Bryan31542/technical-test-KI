#!/bin/sh
set -eu

export DATABASE_URL="$(node -e '
  const user = process.env.POSTGRES_USER;
  const password = encodeURIComponent(process.env.POSTGRES_PASSWORD ?? "");
  const db = process.env.POSTGRES_DB;
  if (!user || !db) {
    console.error("POSTGRES_USER and POSTGRES_DB are required");
    process.exit(1);
  }
  process.stdout.write(`postgresql://${user}:${password}@postgres:5432/${db}`);
')"

npx prisma migrate deploy
npx prisma db seed
exec node dist/main.js
