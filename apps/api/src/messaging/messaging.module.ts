import twilio from 'twilio';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DbMessagingAdapter } from './db-messaging.adapter';
import { TwilioMessagingAdapter } from './twilio-messaging.adapter';
import { MESSAGING_PORT } from './messaging.port';

const log = new Logger('MessagingModule');

@Module({
  providers: [
    {
      provide: MESSAGING_PORT,
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, config: ConfigService) => {
        const driver = (
          config.get<string>('MESSAGING_DRIVER') ?? 'db'
        ).toLowerCase();

        if (driver === 'db') {
          return new DbMessagingAdapter(prisma);
        }

        if (driver === 'twilio') {
          const contentSid = config.get<string>('TWILIO_CONTENT_SID')?.trim();
          if (!contentSid) {
            log.warn(
              'TWILIO_CONTENT_SID is empty. Replies are saved in the panel but not sent to WhatsApp. Trial accounts cannot create templates via API; copy an HX… SID from a message log if you have a usable template.',
            );
            return new DbMessagingAdapter(prisma);
          }

          return new TwilioMessagingAdapter(
            twilio(
              required(config, 'TWILIO_ACCOUNT_SID'),
              required(config, 'TWILIO_AUTH_TOKEN'),
            ),
            prisma,
            required(config, 'TWILIO_WHATSAPP_FROM'),
            contentSid,
          );
        }

        throw new Error(
          `Unsupported MESSAGING_DRIVER="${driver}". Use "db" or "twilio".`,
        );
      },
    },
  ],
  exports: [MESSAGING_PORT],
})
export class MessagingModule {}

function required(config: ConfigService, key: string): string {
  const value = config.get<string>(key)?.trim();
  if (!value) {
    throw new Error(`${key} is required when MESSAGING_DRIVER=twilio`);
  }
  return value;
}
