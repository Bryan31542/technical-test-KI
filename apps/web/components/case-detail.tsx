"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCase, updateCaseStatus } from "@/lib/cases-api";
import { getErrorMessage } from "@/lib/api";
import {
  formatDateTime,
  formatPhone,
  INTENT_LABEL,
  nextStatuses,
  STATUS_LABEL,
  TYPE_LABEL,
} from "@/lib/labels";
import type { CaseDetail, CaseStatus } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export function CaseDetailView({ id }: { id: string }) {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const row = await fetchCase(id);
        if (!cancelled) {
          setDetail(row);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onStatusChange(status: CaseStatus) {
    if (!detail) {
      return;
    }

    setUpdating(true);
    setError(null);
    try {
      const updated = await updateCaseStatus(detail.id, status);
      setDetail({ ...detail, ...updated });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-zinc-500" data-testid="case-loading">
        Cargando caso…
      </p>
    );
  }

  if (!detail) {
    return (
      <p
        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        data-testid="case-error"
      >
        {error ?? "No se encontró el caso."}
      </p>
    );
  }

  const allowed = nextStatuses(detail.status);

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
      >
        ← Volver al listado
      </Link>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <header className="space-y-3">
        <p className="text-sm text-zinc-500">{formatPhone(detail.phone)}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {TYPE_LABEL[detail.type]} · {INTENT_LABEL[detail.lastIntent]}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={detail.status} />
          <span className="text-sm text-zinc-500">
            Actualizado {formatDateTime(detail.updatedAt)}
          </span>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-700">Cambiar estado</h2>
        {allowed.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Este caso está cerrado y no se reabre desde el panel.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allowed.map((status) => (
              <button
                key={status}
                type="button"
                data-testid={`status-${status}`}
                disabled={updating}
                className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
                onClick={() => void onStatusChange(status)}
              >
                Pasar a {STATUS_LABEL[status]}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-700">Hilo de mensajes</h2>
        <ol className="space-y-3" data-testid="case-thread">
          {detail.messages.map((message) => {
            const inbound = message.direction === "INBOUND";
            return (
              <li
                key={message.id}
                className={`rounded-lg border px-4 py-3 ${
                  inbound
                    ? "border-zinc-200 bg-white"
                    : "border-zinc-900/10 bg-zinc-50"
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {inbound ? "Entrante" : "Saliente"} ·{" "}
                  {formatDateTime(message.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
                  {message.body}
                </p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
