import { Injectable } from '@nestjs/common';
import { classifyIntent } from './classify-intent';
import type { DetectedIntent } from './intent.rules';

@Injectable()
export class IntentService {
  classify(text: string): DetectedIntent {
    return classifyIntent(text);
  }
}
