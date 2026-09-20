import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { authorizeBasicHeader, credentialsConfigured } from './basic-auth';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = this.config.get<string>('PANEL_USER')?.trim();
    const passwordHash = this.config.get<string>('PANEL_PASSWORD_HASH')?.trim();

    if (!user || !passwordHash || !credentialsConfigured(user, passwordHash)) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (
      await authorizeBasicHeader(
        request.headers.authorization,
        user,
        passwordHash,
      )
    ) {
      return true;
    }

    response.setHeader('WWW-Authenticate', 'Basic realm="Panel de casos"');
    throw new UnauthorizedException('Invalid credentials');
  }
}
