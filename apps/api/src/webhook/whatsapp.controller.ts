import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
} from '@nestjs/common';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';

type TwilioWhatsAppPayload = {
  From?: string;
  Body?: string;
  MessageSid?: string;
};

@Controller('webhook')
export class WhatsAppWebhookController {
  constructor(
    @Inject(WhatsAppWebhookService)
    private readonly webhook: WhatsAppWebhookService,
  ) {}

  @Post('whatsapp')
  @HttpCode(200)
  async whatsapp(@Body() payload: TwilioWhatsAppPayload) {
    const from = payload.From?.trim();
    const messageSid = payload.MessageSid?.trim();

    if (!from || !messageSid) {
      throw new BadRequestException('From and MessageSid are required');
    }

    const result = await this.webhook.handle({
      from,
      body: payload.Body ?? '',
      messageSid,
    });

    return { ok: true, ...result };
  }
}
