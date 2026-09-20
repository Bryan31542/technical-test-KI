import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../auth/basic-auth.guard';
import { CasesService } from './cases.service';
import { isCaseStatus } from './case-status';
import type { CaseType } from './case-type';

type PatchCaseBody = {
  status?: string;
};

@Controller('cases')
@UseGuards(BasicAuthGuard)
export class CasesController {
  constructor(@Inject(CasesService) private readonly cases: CasesService) {}

  @Get()
  list(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.cases.list({
      type: parseType(type),
      status: parseOptionalStatus(status),
    });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.cases.getById(id);
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() body: PatchCaseBody) {
    if (!body.status) {
      throw new BadRequestException('status is required');
    }

    return this.cases.updateStatus(id, parseStatus(body.status));
  }
}

function parseType(value?: string): CaseType | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (value === 'CONSULTA' || value === 'RECLAMO') {
    return value;
  }

  throw new BadRequestException('type must be CONSULTA or RECLAMO');
}

function parseOptionalStatus(value?: string) {
  if (value === undefined || value === '') {
    return undefined;
  }

  return parseStatus(value);
}

function parseStatus(value: string) {
  if (!isCaseStatus(value)) {
    throw new BadRequestException(
      'status must be ABIERTO, EN_PROCESO, or CERRADO',
    );
  }

  return value;
}
