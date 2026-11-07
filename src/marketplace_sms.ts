import { z } from "zod";
import { infrai } from "./infrai.ts";

const sellerAsset = z.object({
  sellerId: z.string().min(1),
  assetId: z.string().min(1),
  title: z.string().min(1),
});

export const handoffRequest = z.object({
  orderId: z.string().min(1),
  buyerPhone: z.string().min(7),
  buyerOptedOut: z.boolean(),
  update: z.string().min(1),
  asset: sellerAsset,
});

export type HandoffRequest = z.infer<typeof handoffRequest>;
export type HandoffResult =
  | { status: "suppressed"; orderId: string }
  | { status: "sent"; orderId: string; messageId?: string };

export async function handoffOrder(input: unknown): Promise<HandoffResult> {
  const request = handoffRequest.parse(input);
  if (request.buyerOptedOut) return { status: "suppressed", orderId: request.orderId };

  await infrai.sms.batch.send(
    { messages: [{ to: request.buyerPhone, body: request.update }] },
    `order-handoff:${request.orderId}`,
  );
  return { status: "sent", orderId: request.orderId };
}
