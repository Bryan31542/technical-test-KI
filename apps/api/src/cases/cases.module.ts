import { Module } from '@nestjs/common';
import { BasicAuthGuard } from '../auth/basic-auth.guard';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

@Module({
  controllers: [CasesController],
  providers: [CasesService, BasicAuthGuard],
  exports: [CasesService],
})
export class CasesModule {}
