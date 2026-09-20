"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchCase, updateCaseStatus } from "@/lib/cases-api";
import { getErrorMessage } from "@/lib/api";
import { usePoll } from "@/hooks/use-poll";
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

const POLL_MS = 4000;

export function CaseDetailView({ id }: { id: string }) {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const threadRef = useRef<HTMLOListElement>(null);
  const messageCountRef = useRef(0);

  const load = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) {
        setLoading(true);
      }
      try {
        const row = await fetchCase(id);
        setDetail(row);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  usePoll(() => {
    void load(false);
  }, POLL_MS);

  useEffect(() => {
    const count = detail?.messages.length ?? 0;
    if (count > messageCountRef.current) {
      threadRef.current?.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: messageCountRef.current === 0 ? "auto" : "smooth",
      });
    }
    messageCountRef.current = count;
  }, [detail]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
        >
          ← Volver al listado
        </Link>
        <p className="text-xs text-zinc-500">Se actualiza cada 4 segundos</p>
      </div>

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
        <ol
          ref={threadRef}
          data-testid="case-thread"
          className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4"
        >
          {detail.messages.length === 0 ? (
            <li className="py-8 text-center text-sm text-zinc-500">
              Aún no hay mensajes en este caso.
            </li>
          ) : (
            detail.messages.map((message) => {
              const inbound = message.direction === "INBOUND";
              return (
                <li
                  key={message.id}
                  className={`flex ${inbound ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm ${
                      inbound
                        ? "rounded-bl-md bg-white text-zinc-900"
                        : "rounded-br-md bg-emerald-700 text-white"
                    }`}
                  >
                    <p
                      className={`text-[11px] font-medium uppercase tracking-wide ${
                        inbound ? "text-zinc-500" : "text-emerald-100"
                      }`}
                    >
                      {inbound ? "Entrante" : "Saliente"} ·{" "}
                      {formatDateTime(message.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-5">
                      {message.body}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ol>
      </section>
    </div>
  );
}
