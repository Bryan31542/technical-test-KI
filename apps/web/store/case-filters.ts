"use client";

import { create } from "zustand";
import type { CaseStatus, CaseType } from "@/lib/types";

type CaseFilterState = {
  type?: CaseType;
  status?: CaseStatus;
  setType: (type?: CaseType) => void;
  setStatus: (status?: CaseStatus) => void;
  reset: () => void;
};

export const useCaseFilters = create<CaseFilterState>()((set) => ({
  type: undefined,
  status: undefined,
  setType: (type) => set({ type }),
  setStatus: (status) => set({ status }),
  reset: () => set({ type: undefined, status: undefined }),
}));
