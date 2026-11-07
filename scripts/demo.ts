import { handoffOrder } from "../src/marketplace_sms.ts";

const buyerOptedOut = process.env.BUYER_OPTED_OUT === "true";
const result = await handoffOrder({
  orderId: process.env.ORDER_ID ?? "order-1042",
  buyerPhone: process.env.BUYER_PHONE ?? "+15551234567",
  buyerOptedOut,
  update: "Your seller has handed the order to the carrier.",
  asset: { sellerId: "seller-7", assetId: "asset-22", title: "Handmade mug" },
});
console.log(result);
