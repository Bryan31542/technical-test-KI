import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  recordInbound,
  type RecordInboundInput,
  type RecordInboundResult,
} from './record-inbound';

@Injectable()
export class CasesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  recordInbound(input: RecordInboundInput): Promise<RecordInboundResult> {
    return recordInbound(this.prisma, input);
  }
}
