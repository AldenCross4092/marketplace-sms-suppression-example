import assert from "node:assert/strict";
import { handoffOrder } from "../src/marketplace_sms.ts";

const request = {
  orderId: "order-test",
  buyerPhone: "+15551234567",
  buyerOptedOut: true,
  update: "Ready for pickup.",
  asset: { sellerId: "seller-test", assetId: "asset-test", title: "Blue bowl" },
};

const decision = await handoffOrder(request);
assert.deepEqual(decision, { status: "suppressed", orderId: "order-test" });
console.log("suppression decision: passed");
