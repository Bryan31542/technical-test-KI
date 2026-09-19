"use client";

import { CASE_STATUSES, CASE_TYPES, STATUS_LABEL, TYPE_LABEL } from "@/lib/labels";
import { useCaseFilters } from "@/store/case-filters";
import type { CaseStatus, CaseType } from "@/lib/types";

export function CaseFilters() {
  const type = useCaseFilters((state) => state.type);
  const status = useCaseFilters((state) => state.status);
  const setType = useCaseFilters((state) => state.setType);
  const setStatus = useCaseFilters((state) => state.setStatus);
  const reset = useCaseFilters((state) => state.reset);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-40 flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-600">Tipo</span>
        <select
          data-testid="filter-type"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none"
          value={type ?? ""}
          onChange={(event) =>
            setType((event.target.value || undefined) as CaseType | undefined)
          }
        >
          <option value="">Todos</option>
          {CASE_TYPES.map((value) => (
            <option key={value} value={value}>
              {TYPE_LABEL[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-40 flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-600">Estado</span>
        <select
          data-testid="filter-status"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none"
          value={status ?? ""}
          onChange={(event) =>
            setStatus(
              (event.target.value || undefined) as CaseStatus | undefined,
            )
          }
        >
          <option value="">Todos</option>
          {CASE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value]}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        onClick={reset}
      >
        Limpiar
      </button>
    </div>
  );
}
