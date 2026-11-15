/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON in test helpers */
/** Small helpers to call Next.js route handlers directly. */
import crypto from "node:crypto";

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response> | Response;

export type CallResult<T = any> = { status: number; json: T; response: Response; text: string };

export async function call<T = any>(
  handler: Handler,
  opts: {
    method?: string;
    path?: string;
    body?: unknown;
    rawBody?: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  } = {},
): Promise<CallResult<T>> {
  const url = `http://localhost:3100${opts.path ?? "/api/test"}`;
  const headers: Record<string, string> = { host: "localhost:3100", ...(opts.headers ?? {}) };
  let body: string | undefined;
  if (opts.rawBody !== undefined) body = opts.rawBody;
  else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["content-type"] ??= "application/json";
  }
  const method = opts.method ?? (body !== undefined ? "POST" : "GET");
  const request = new Request(url, { method, headers, body });
  const response = await handler(request, { params: Promise.resolve(opts.params ?? {}) });
  const text = await response.clone().text();
  let json: any = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: response.status, json: json as T, response, text };
}

/** Signs a Cashfree webhook body the way Cashfree does. */
export function signWebhook(rawBody: string, secret = process.env.CASHFREE_SECRET_KEY ?? "", timestamp = String(Date.now())) {
  const signature = crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
  return { "x-webhook-signature": signature, "x-webhook-timestamp": timestamp, "content-type": "application/json" };
}

export function webhookBody(opts: {
  cashfreeOrderId: string;
  type?: string;
  paymentStatus?: string;
  orderStatus?: string;
  cfPaymentId?: string | number;
  amount?: number;
}) {
  return JSON.stringify({
    type: opts.type ?? "PAYMENT_SUCCESS_WEBHOOK",
    data: {
      order: { order_id: opts.cashfreeOrderId, order_status: opts.orderStatus },
      payment: {
        cf_payment_id: opts.cfPaymentId ?? 987654,
        payment_status: opts.paymentStatus ?? "SUCCESS",
        payment_amount: opts.amount ?? 0,
      },
    },
  });
}

/** Waits for fire-and-forget work (emails) started by a handler. */
export const settle = (ms = 150) => new Promise((r) => setTimeout(r, ms));
