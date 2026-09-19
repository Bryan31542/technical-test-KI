import { CaseList } from "@/components/case-list";

export default function Home() {
  return (
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
  );
}
