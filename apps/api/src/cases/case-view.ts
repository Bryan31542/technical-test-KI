import type { DetectedIntent } from '../intent/intent.rules';
import type { CaseType } from './case-type';
import type { CaseStatus } from './case-status';

export type CaseListItem = {
  id: string;
  phone: string;
  type: CaseType;
  status: CaseStatus;
  lastIntent: DetectedIntent;
  createdAt: Date;
  updatedAt: Date;
};

export type CaseMessageView = {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  body: string;
  createdAt: Date;
};

export type CaseDetail = CaseListItem & {
  messages: CaseMessageView[];
};

export type CaseWithContact = {
  id: string;
  type: CaseType;
  status: CaseStatus;
  lastIntent: DetectedIntent;
  createdAt: Date;
  updatedAt: Date;
  contact: { phone: string };
};

export function toCaseListItem(row: CaseWithContact): CaseListItem {
  return {
    id: row.id,
    phone: row.contact.phone,
    type: row.type,
    status: row.status,
    lastIntent: row.lastIntent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
