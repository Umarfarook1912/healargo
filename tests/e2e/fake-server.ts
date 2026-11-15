/** Starts the fake Cashfree / ST Courier / Brevo server for E2E runs. */
import { FAKE_SERVICES_PORT } from "../helpers/env";
import { startFakeServices } from "../helpers/fake-services";

startFakeServices(FAKE_SERVICES_PORT).then(({ url }) => {
  console.log(`[fake-services] listening on ${url}`);
});
