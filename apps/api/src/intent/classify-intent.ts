import {
  INTENT_RULES,
  type DetectedIntent,
  normalizeMessage,
} from './intent.rules';

export function classifyIntent(text: string): DetectedIntent {
  const normalized = normalizeMessage(text);

  if (!normalized) {
    return 'DESCONOCIDA';
  }

  const match = INTENT_RULES.find((rule) => rule.pattern.test(normalized));
  return match?.intent ?? 'DESCONOCIDA';
}
