import { api } from "./api";
import type {
  CaseDetail,
  CaseFilters,
  CaseListItem,
  CaseStatus,
} from "./types";

export async function fetchCases(filters: CaseFilters): Promise<CaseListItem[]> {
  const { data } = await api.get<CaseListItem[]>("/cases", {
    params: {
      type: filters.type,
      status: filters.status,
    },
  });
  return data;
}

export async function fetchCase(id: string): Promise<CaseDetail> {
  const { data } = await api.get<CaseDetail>(`/cases/${id}`);
  return data;
}

export async function updateCaseStatus(
  id: string,
  status: CaseStatus,
): Promise<CaseListItem> {
  const { data } = await api.patch<CaseListItem>(`/cases/${id}`, { status });
  return data;
}
