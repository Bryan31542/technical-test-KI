import { Inject, Injectable, Logger } from '@nestjs/common';
import { CasesService } from '../cases/cases.service';
import {
  MESSAGING_PORT,
  type MessagingPort,
} from '../messaging/messaging.port';
import { PrismaService } from '../prisma/prisma.service';
import {
  handleWhatsAppInbound,
  type WhatsAppInbound,
} from './handle-whatsapp';

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(
    @Inject(CasesService) private readonly cases: CasesService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MESSAGING_PORT) private readonly messaging: MessagingPort,
  ) {}

  handle(inbound: WhatsAppInbound) {
    return handleWhatsAppInbound(
      {
        recordInbound: (input) => this.cases.recordInbound(input),
        findKnowledge: async (intent) => {
          const entry = await this.prisma.knowledgeEntry.findUnique({
            where: { intent },
          });
          if (!entry) {
            return null;
          }
          return { title: entry.title, body: entry.body };
        },
        send: async (input) => {
          try {
            await this.messaging.send(input);
          } catch (error) {
            this.logger.error(
              'Failed to send outbound WhatsApp reply',
              error instanceof Error ? error.stack : String(error),
            );
            throw error;
          }
        },
      },
      inbound,
    );
  }
}
