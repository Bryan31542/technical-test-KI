export const MESSAGING_PORT = 'MESSAGING_PORT';

export type SendMessageInput = {
  to: string;
  body: string;
  caseId: string;
};

export type MessagingPort = {
  send(input: SendMessageInput): Promise<void>;
};
