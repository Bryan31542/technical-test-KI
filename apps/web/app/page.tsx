import { CaseList } from "@/components/case-list";
import { RequireAuth } from "@/components/require-auth";

export default function Home() {
  return (
    <RequireAuth>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Casos
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Consultas y reclamos que llegan por WhatsApp.
          </p>
        </div>
        <CaseList />
      </div>
    </RequireAuth>
  );
}
