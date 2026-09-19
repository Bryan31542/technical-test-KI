import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DbMessagingAdapter } from './db-messaging.adapter';
import { MESSAGING_PORT } from './messaging.port';

@Module({
  providers: [
    {
      provide: MESSAGING_PORT,
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, config: ConfigService) => {
        const driver = config.get<string>('MESSAGING_DRIVER') ?? 'db';

        if (driver !== 'db') {
          throw new Error(
            `Unsupported MESSAGING_DRIVER="${driver}". Use "db" for now.`,
          );
        }

        return new DbMessagingAdapter(prisma);
      },
    },
  ],
  exports: [MESSAGING_PORT],
})
export class MessagingModule {}
