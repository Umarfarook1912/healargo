/**
 * One local HTTP server that impersonates Cashfree PG, ST Courier tracking and
 * Brevo SMTP for tests. The app talks to it through the test-only env
 * overrides CASHFREE_BASE_URL, ST_COURIER_BASE_URL and BREVO_API_URL.
 *
 * In-process (API tests) the `state` object is changed directly. Out of
 * process (E2E) the /__fake/* control endpoints do the same over HTTP.
 */
import http from "node:http";
import type { AddressInfo } from "node:net";

export type FakeCashfreeOrder = {
  order_id: string;
  order_amount: number;
  order_status: string;
  payment_session_id: string;
  cf_order_id: number;
  return_url?: string;
  notify_url?: string;
  customer_details?: Record<string, unknown>;
};

export type FakeEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type FakeState = {
  cashfree: {
    orders: Map<string, FakeCashfreeOrder>;
    /** When set, POST /pg/orders answers with this instead of creating an order. */
    createFailure: { status: number; body: unknown } | null;
    requests: Array<{ method: string; path: string; headers: http.IncomingHttpHeaders; body: unknown }>;
  };
  stcourier: {
    /** AWB -> result page HTML. Unknown AWBs make doCheck answer code 400. */
    pages: Map<string, string>;
    sessions: Map<string, string>;
    hits: number;
  };
  emails: FakeEmail[];
  /** E2E: what the fake hosted checkout does next ("PAID" or "CANCEL"). */
  nextCheckoutOutcome?: string;
};

export function createFakeState(): FakeState {
  return {
    cashfree: { orders: new Map(), createFailure: null, requests: [] },
    stcourier: { pages: new Map(), sessions: new Map(), hits: 0 },
    emails: [],
  };
}

export function resetFakeState(state: FakeState) {
  state.cashfree.orders.clear();
  state.cashfree.createFailure = null;
  state.cashfree.requests.length = 0;
  state.stcourier.pages.clear();
  state.stcourier.sessions.clear();
  state.stcourier.hits = 0;
  state.emails.length = 0;
  state.nextCheckoutOutcome = undefined;
}

/** Builds an ST Courier result page in the shape parseStCourierResultPage reads. */
export function stCourierResultHtml(opts: {
  awb: string;
  status: string;
  events?: Array<{ date: string; time: string; status: string; location: string }>;
}) {
  const events = opts.events ?? [
    { date: "10-11-2026", time: "10:15", status: opts.status, location: "CHENNAI -to- COIMBATORE" },
  ];
  const timeline = events
    .map(
      (e) =>
        `<div style="margin-top:0px">${e.date}<br>${e.time}</div>` +
        `<div style="margin-top:0px">${e.status}<br>${e.location}<br></div>`,
    )
    .join("");
  return `<html><body><table>
<tr><td>Current Status</td><td>${opts.status}</td></tr>
<tr><td>Orgin Src</td><td>CHENNAI</td></tr>
<tr><td>Destination</td><td>COIMBATORE</td></tr>
<tr><td>Consignment</td><td>${opts.awb}</td></tr>
<tr><td>Book Date/Time</td><td>09-11-2026 18:00</td></tr>
</table>
<h4>Status of AWB No. ${opts.awb}</h4>${timeline}
<div id="complaintModal"></div><footer></footer></body></html>`;
}

/** Minimal stand-in for https://sdk.cashfree.com/js/v3/cashfree.js (E2E only). */
export function fakeCashfreeSdk(fakeUrl: string) {
  return `window.Cashfree = function () {
  return {
    checkout: async function (opts) {
      var res = await fetch(${JSON.stringify(fakeUrl)} + "/__fake/checkout?session=" + encodeURIComponent(opts.paymentSessionId));
      var json = await res.json();
      window.location.href = json.returnUrl;
    }
  };
};`;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function send(res: http.ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  const isText = typeof body === "string";
  res.writeHead(status, {
    "content-type": isText ? "text/html; charset=utf-8" : "application/json",
    "access-control-allow-origin": "*",
    ...headers,
  });
  res.end(isText ? body : JSON.stringify(body));
}

let cfCounter = 1000;

export async function startFakeServices(port = 0, state = createFakeState()) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://fake.local");
    const raw = await readBody(req);
    let json: unknown = undefined;
    try {
      json = raw ? JSON.parse(raw) : undefined;
    } catch {
      json = undefined;
    }

    try {
      /* ------------------------------ Cashfree ----------------------------- */
      if (url.pathname.startsWith("/pg/orders")) {
        state.cashfree.requests.push({ method: req.method ?? "", path: url.pathname, headers: req.headers, body: json });
        if (!req.headers["x-client-id"] || !req.headers["x-client-secret"]) {
          return send(res, 401, { message: "authentication Failed", code: "request_failed" });
        }
        if (req.method === "POST" && url.pathname === "/pg/orders") {
          if (state.cashfree.createFailure) {
            return send(res, state.cashfree.createFailure.status, state.cashfree.createFailure.body);
          }
          const body = json as {
            order_id: string;
            order_amount: number;
            order_meta?: { return_url?: string; notify_url?: string };
            customer_details?: Record<string, unknown>;
          };
          if (state.cashfree.orders.has(body.order_id)) {
            return send(res, 409, { message: "order with same id is already present", code: "order_already_exists" });
          }
          const order: FakeCashfreeOrder = {
            order_id: body.order_id,
            order_amount: body.order_amount,
            order_status: "ACTIVE",
            payment_session_id: `session_${body.order_id}`,
            cf_order_id: ++cfCounter,
            return_url: body.order_meta?.return_url,
            notify_url: body.order_meta?.notify_url,
            customer_details: body.customer_details,
          };
          state.cashfree.orders.set(order.order_id, order);
          return send(res, 200, order);
        }
        if (req.method === "GET") {
          const id = decodeURIComponent(url.pathname.slice("/pg/orders/".length));
          const order = state.cashfree.orders.get(id);
          if (!order) return send(res, 404, { message: "order not found", code: "order_not_found" });
          return send(res, 200, order);
        }
      }

      /* ----------------------------- ST Courier ---------------------------- */
      if (url.pathname === "/track/shipment" && req.method === "GET") {
        state.stcourier.hits += 1;
        const cookie = /ci_session=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
        const awb = cookie ? state.stcourier.sessions.get(cookie) : undefined;
        if (cookie && awb) {
          return send(res, 200, state.stcourier.pages.get(awb) ?? "<html></html>");
        }
        const sid = `sess${Math.random().toString(36).slice(2)}`;
        return send(res, 200, "<html><form></form></html>", {
          "set-cookie": `ci_session=${sid}; path=/; HttpOnly`,
        });
      }
      if (url.pathname === "/track/doCheck" && req.method === "POST") {
        const cookie = /ci_session=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
        const awb = new URLSearchParams(raw).get("awb_no") ?? "";
        if (!cookie || !state.stcourier.pages.has(awb)) return send(res, 200, { code: 400 });
        state.stcourier.sessions.set(cookie, awb);
        return send(res, 200, { code: 200 });
      }

      /* -------------------------------- Brevo ------------------------------ */
      if (url.pathname === "/v3/smtp/email" && req.method === "POST") {
        if (!req.headers["api-key"]) return send(res, 401, { message: "Key not found" });
        const body = json as {
          to: Array<{ email: string }>;
          subject: string;
          textContent: string;
          htmlContent?: string;
          replyTo?: { email: string };
        };
        state.emails.push({
          to: body.to?.[0]?.email ?? "",
          subject: body.subject,
          text: body.textContent,
          html: body.htmlContent,
          replyTo: body.replyTo?.email,
        });
        return send(res, 201, { messageId: `<fake-${state.emails.length}@brevo>` });
      }

      /* ------------------------ Control (E2E helpers) ---------------------- */
      if (url.pathname === "/__fake/reset" && req.method === "POST") {
        resetFakeState(state);
        return send(res, 200, { ok: true });
      }
      if (url.pathname === "/__fake/emails") {
        return send(res, 200, { emails: state.emails });
      }
      if (url.pathname === "/__fake/cashfree/orders") {
        return send(res, 200, { orders: [...state.cashfree.orders.values()] });
      }
      if (url.pathname.startsWith("/__fake/cashfree/status/") && req.method === "POST") {
        const id = decodeURIComponent(url.pathname.slice("/__fake/cashfree/status/".length));
        const order = state.cashfree.orders.get(id);
        if (!order) return send(res, 404, { error: "unknown order" });
        order.order_status = String((json as { status?: string })?.status ?? "PAID");
        return send(res, 200, order);
      }
      if (url.pathname.startsWith("/__fake/stcourier/") && req.method === "POST") {
        const awb = url.pathname.slice("/__fake/stcourier/".length);
        const status = String((json as { status?: string })?.status ?? "In Transit");
        state.stcourier.pages.set(awb, stCourierResultHtml({ awb, status }));
        return send(res, 200, { ok: true });
      }
      if (url.pathname === "/__fake/checkout") {
        // Fake hosted checkout: pays (or not) and returns where Cashfree would redirect.
        const sessionId = url.searchParams.get("session") ?? "";
        const order = [...state.cashfree.orders.values()].find((o) => o.payment_session_id === sessionId);
        if (!order) return send(res, 404, { error: "unknown session" });
        const outcome = url.searchParams.get("outcome") ?? state.nextCheckoutOutcome ?? "PAID";
        // "PAID" pays; "EXPIRED"/"TERMINATED" etc. end the order; "CANCEL" leaves it ACTIVE.
        if (outcome !== "CANCEL") order.order_status = outcome;
        const returnUrl = (order.return_url ?? "/").replace("{order_id}", encodeURIComponent(order.order_id));
        return send(res, 200, { returnUrl, status: order.order_status });
      }
      if (url.pathname === "/__fake/next-checkout" && req.method === "POST") {
        state.nextCheckoutOutcome = String((json as { outcome?: string })?.outcome ?? "PAID");
        return send(res, 200, { ok: true });
      }
      if (url.pathname === "/__fake/sdk.js") {
        res.writeHead(200, { "content-type": "application/javascript" });
        return res.end(fakeCashfreeSdk(`http://${req.headers.host}`));
      }
      if (url.pathname === "/__fake/health") return send(res, 200, { ok: true });

      return send(res, 404, { error: `fake: no route for ${req.method} ${url.pathname}` });
    } catch (error) {
      return send(res, 500, { error: error instanceof Error ? error.message : "fake error" });
    }
  });

  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${address.port}`;
  return {
    url,
    state,
    stop: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
