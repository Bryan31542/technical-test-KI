"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCases } from "@/lib/cases-api";
import { getErrorMessage } from "@/lib/api";
import { clearBasicToken, isLoggedIn, setBasicToken } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/");
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      setBasicToken(user, password);
      await fetchCases({});
      router.replace("/");
    } catch (err) {
      clearBasicToken();
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className="mx-auto max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      data-testid="login-form"
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Acceso al panel de consultas y reclamos.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          data-testid="login-error"
        >
          {error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-600">Usuario</span>
        <input
          name="username"
          autoComplete="username"
          data-testid="login-user"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none"
          value={user}
          onChange={(event) => setUser(event.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-600">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          data-testid="login-password"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      <button
        type="submit"
        data-testid="login-submit"
        disabled={submitting}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {submitting ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
