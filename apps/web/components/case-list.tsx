"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCases } from "@/lib/cases-api";
import { getErrorMessage } from "@/lib/api";
import {
  formatDateTime,
  formatPhone,
  INTENT_LABEL,
  TYPE_LABEL,
} from "@/lib/labels";
import { useCaseFilters } from "@/store/case-filters";
import type { CaseListItem } from "@/lib/types";
import { CaseFilters } from "./case-filters";
import { StatusBadge } from "./status-badge";

export function CaseList() {
  const type = useCaseFilters((state) => state.type);
  const status = useCaseFilters((state) => state.status);
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchCases({ type, status });
        if (!cancelled) {
          setCases(rows);
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
  }, [type, status]);

  return (
    <section className="space-y-6">
      <CaseFilters />

      {loading ? (
        <p className="text-sm text-zinc-500" data-testid="cases-loading">
          Cargando casos…
        </p>
      ) : null}

      {error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          data-testid="cases-error"
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && cases.length === 0 ? (
        <p className="text-sm text-zinc-500" data-testid="cases-empty">
          No hay casos con esos filtros.
        </p>
      ) : null}

      {!loading && !error && cases.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm" data-testid="cases-table">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Intención</th>
                <th className="px-4 py-3 font-medium">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr
                  key={item.id}
                  data-testid={`case-row-${item.id}`}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/casos/${item.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {formatPhone(item.phone)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {TYPE_LABEL[item.type]}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {INTENT_LABEL[item.lastIntent]}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {formatDateTime(item.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
