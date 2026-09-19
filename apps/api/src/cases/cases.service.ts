import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getCase } from './get-case';
import { listCases, type ListCasesFilters } from './list-cases';
import {
  recordInbound,
  type RecordInboundInput,
  type RecordInboundResult,
} from './record-inbound';
import { updateCaseStatus } from './update-case-status';
import type { CaseStatus } from './case-status';
import type { CaseDetail, CaseListItem } from './case-view';

@Injectable()
export class CasesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  recordInbound(input: RecordInboundInput): Promise<RecordInboundResult> {
    return recordInbound(this.prisma, input);
  }

  list(filters: ListCasesFilters): Promise<CaseListItem[]> {
    return listCases(this.prisma, filters);
  }

  async getById(id: string): Promise<CaseDetail> {
    const found = await getCase(this.prisma, id);
    if (!found) {
      throw new NotFoundException(`Case ${id} not found`);
    }
    return found;
  }

  async updateStatus(id: string, status: CaseStatus): Promise<CaseListItem> {
    const result = await updateCaseStatus(this.prisma, { id, status });

    if (result.kind === 'not_found') {
      throw new NotFoundException(`Case ${id} not found`);
    }

    if (result.kind === 'invalid_transition') {
      throw new BadRequestException(
        `Cannot change status from ${result.from} to ${result.to}`,
      );
    }

    return result.case;
  }
}
