import { classifyIntent } from '../intent/classify-intent';
import type { DetectedIntent } from '../intent/intent.rules';
import type {
  RecordInboundInput,
  RecordInboundResult,
} from '../cases/record-inbound';
import type { SendMessageInput } from '../messaging/messaging.port';
import { buildReply } from './build-reply';

export type WhatsAppInbound = {
  from: string;
  body: string;
  messageSid: string;
};

export type WhatsAppHandlerDeps = {
  recordInbound: (input: RecordInboundInput) => Promise<RecordInboundResult>;
  findKnowledge: (
    intent: Exclude<DetectedIntent, 'RECLAMO' | 'DESCONOCIDA'>,
  ) => Promise<{ title: string; body: string } | null>;
  send: (input: SendMessageInput) => Promise<void>;
};

export type WhatsAppHandlerResult = {
  duplicated: boolean;
  sendFailed: boolean;
  intent: DetectedIntent;
  reply?: string;
};

export async function handleWhatsAppInbound(
  deps: WhatsAppHandlerDeps,
  inbound: WhatsAppInbound,
): Promise<WhatsAppHandlerResult> {
  const intent = classifyIntent(inbound.body);
  const recorded = await deps.recordInbound({
    phone: inbound.from,
    body: inbound.body,
    intent,
    providerSid: inbound.messageSid,
  });

  if (recorded.duplicated) {
    return { duplicated: true, sendFailed: false, intent };
  }

  const reply = await buildReply(intent, deps.findKnowledge);

  try {
    await deps.send({
      to: inbound.from,
      body: reply,
      caseId: recorded.case.id,
    });
    return { duplicated: false, sendFailed: false, intent, reply };
  } catch {
    return { duplicated: false, sendFailed: true, intent, reply };
  }
}
