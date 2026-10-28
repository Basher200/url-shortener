import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const RATE = Number(__ENV.RATE || 500);
const CODE = "bench-link";

export const options = {
  scenarios: {
    redirects: {
      executor: "constant-arrival-rate",
      rate: RATE,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 100,
      maxVUs: 1000,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<50"],
  },
};

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/v1/links`,
    JSON.stringify({ longUrl: "https://example.com/benchmark", alias: CODE }),
    { headers: { "Content-Type": "application/json" } },
  );

  if (res.status !== 201 && res.status !== 409) {
    throw new Error(`Could not prepare the test link, got status ${res.status}`);
  }
}

export default function () {
  const res = http.get(`${BASE_URL}/${CODE}`, { redirects: 0 });
  check(res, { "is 302": (r) => r.status === 302 });
}