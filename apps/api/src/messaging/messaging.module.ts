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
          log.log('Outbound replies will be sent through Twilio WhatsApp.');
          return new TwilioMessagingAdapter(
            twilio(
              required(config, 'TWILIO_ACCOUNT_SID'),
              required(config, 'TWILIO_AUTH_TOKEN'),
            ),
            prisma,
            required(config, 'TWILIO_WHATSAPP_FROM'),
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
