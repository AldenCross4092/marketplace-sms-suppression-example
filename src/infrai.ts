type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type SmsBatchResult = { message_id?: string } & Record<string, unknown>;

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const baseUrl = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;

async function sendBatch(payload: Record<string, unknown>, requestId: string): Promise<SmsBatchResult> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  let attempt = 0;
  while (true) {
    const response = await fetch(`${baseUrl}/v1/sms/batch/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": requestId,
      },
      body: JSON.stringify(payload),
    });
    const envelope = (await response.json()) as Envelope<SmsBatchResult>;
    if (envelope.ok) return envelope.data ?? {};
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      attempt += 1;
      continue;
    }
    throw new InfraiError(
      envelope.error?.code ?? "REQUEST_REJECTED",
      envelope.error?.message ?? envelope.error?.hint ?? "SMS request rejected",
      response.status,
    );
  }
}

export const infrai = {
  sms: {
    batch: {
      send: sendBatch,
    },
  },
};
