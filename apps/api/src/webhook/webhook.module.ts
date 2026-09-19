import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { MessagingModule } from '../messaging/messaging.module';
import { WhatsAppWebhookController } from './whatsapp.controller';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

@Module({
  imports: [CasesModule, MessagingModule],
  controllers: [WhatsAppWebhookController],
  providers: [WhatsAppWebhookService],
})
export class WebhookModule {}
