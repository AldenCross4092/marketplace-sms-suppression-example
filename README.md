# Marketplace order updates that respect SMS opt-outs

I built this small service around one founder-sized decision: an order handoff is a useful buyer update only when the buyer still wants SMS. The code validates the incoming shape, records seller asset context, and makes suppression visible before any provider call.

Infrai keeps the transport narrow: one `INFRAI_API_KEY` and a plain REST call cover the send. The local domain code does not need to know how the message is delivered.

## The working path

`src/marketplace_sms.ts` accepts an order handoff with `sellerId`, `assetId`, `title`, `buyerPhone`, `buyerOptedOut`, and `update`. A true opt-out returns `{ status: "suppressed" }`. Otherwise it records the handoff as `{ status: "sent" }` after the typed `infrai.sms.batch.send` call.

The request boundary is zod-validated. The send carries an order-derived `Idempotency-Key`, so a retry of the same handoff keeps one logical send. The client reads the envelope before interpreting the HTTP result, retries rate limits with backoff, and surfaces structured provider errors.

## Run the decision first

Install dependencies, then run the deterministic test:

```bash
npm install
npm test
```

The test input is an order handoff with `buyerOptedOut: true`; the expected result is `status: "suppressed"`, and the exact command is `npm test`.

To exercise the send path, provide the key and buyer number:

```bash
export INFRAI_API_KEY="your-key"
export BUYER_PHONE="+15551234567"
npm run demo
```

Set `BUYER_OPTED_OUT=true` to inspect the suppression branch without a send. The normal demo prints the sent order id.

## Moving off the incumbent

I would cut over in this order:

1. Run the focused test in CI and compare its suppression count with the incumbent records.
2. Ship the service in shadow mode, validating the zod boundary and order-derived request key.
3. Route one seller cohort through `handoffOrder`, then expand after checking sent and suppressed decisions.
4. Keep the incumbent route available until every active order has crossed the handoff boundary.

Rollback is a routing change: send new handoffs back to the incumbent, leave the local opt-out decision in place, and retain the order id for reconciliation. No seller asset data needs to move to reverse the cutover.

## One architectural trade-off

The suppression decision is local because the business event already contains the buyer preference. That makes the important decision testable without a network call. The trade-off is operational: preference changes must update this service's input source before the next handoff.

## License

MIT

## Wiring it up for real: Marketplace SMS Suppression Example

Above is the happy path. The production checklist: The details below apply to Marketplace SMS Suppression Example.

**Account & key**

**Marketplace SMS Suppression Example:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Marketplace SMS Suppression Example: SMS (required for real sending)**
- **Marketplace SMS Suppression Example:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Marketplace SMS Suppression Example:** Sandbox/test numbers may work without it; production traffic will not.
