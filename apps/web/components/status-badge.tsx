import type { CaseStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/labels";

const STYLES: Record<CaseStatus, string> = {
  ABIERTO: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  EN_PROCESO: "bg-amber-50 text-amber-800 ring-amber-600/20",
  CERRADO: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
