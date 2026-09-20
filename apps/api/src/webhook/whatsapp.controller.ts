import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';
import { toTwimlMessage } from './twiml';

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
  async whatsapp(
    @Body() payload: TwilioWhatsAppPayload,
    @Res() res: Response,
  ) {
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

    if (result.replyViaTwiml && result.reply) {
      res.status(200);
      res.setHeader('Content-Type', 'text/xml');
      res.send(toTwimlMessage(result.reply));
      return;
    }

    const { replyViaTwiml, ...publicResult } = result;
    void replyViaTwiml;
    res.status(200).json({ ok: true, ...publicResult });
  }
}
