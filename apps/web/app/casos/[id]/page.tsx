import { CaseDetailView } from "@/components/case-detail";
import { RequireAuth } from "@/components/require-auth";

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RequireAuth>
      <CaseDetailView id={id} />
    </RequireAuth>
  );
}
