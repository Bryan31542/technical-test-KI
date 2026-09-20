export type OutboundDb = {
  message: {
    create: (args: {
      data: {
        caseId: string;
        direction: 'OUTBOUND';
        body: string;
        providerSid: string | null;
      };
    }) => Promise<unknown>;
  };
};

export async function sendOutboundToDb(
  db: OutboundDb,
  input: { caseId: string; body: string; providerSid?: string | null },
): Promise<void> {
  await db.message.create({
    data: {
      caseId: input.caseId,
      direction: 'OUTBOUND',
      body: input.body,
      providerSid: input.providerSid ?? null,
    },
  });
}
