import assert from "node:assert/strict";
import { test } from "node:test";
import { AxiosHeaders } from "axios";
import { attachApiToken } from "../lib/client-auth";

const token = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.signature`;
const expired = `header.${Buffer.from(JSON.stringify({ exp: 1 })).toString("base64url")}.signature`;
function browser(value: string | null) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { origin: "https://biblechorus.com" },
      localStorage: { getItem: () => value },
    },
  });
}
test("browser credentials attach only to same-origin API requests, including relative API bases", () => {
  browser(token);
  for (const config of [
    { url: "/api/songs", headers: new AxiosHeaders() },
    { baseURL: "/api/", url: "songs", headers: new AxiosHeaders() },
    {
      baseURL: "https://biblechorus.com",
      url: "/api/songs",
      headers: new AxiosHeaders(),
    },
  ])
    assert.equal(
      attachApiToken(config).headers.get("Authorization"),
      `Bearer ${token}`,
    );
  for (const url of [
    "https://bucket.s3.amazonaws.com/uploads/1/song.mp3",
    "https://other.example/api/songs",
    "/uploads/song.mp3",
  ])
    assert.equal(
      attachApiToken({ url, headers: new AxiosHeaders() }).headers.get(
        "Authorization",
      ),
      undefined,
    );
  delete (globalThis as any).window;
});
test("expired and malformed browser tokens cannot override cookie authentication; explicit valid headers remain intact", () => {
  for (const value of [expired, "invalid", null]) {
    browser(value);
    assert.equal(
      attachApiToken({
        url: "/api/songs",
        headers: new AxiosHeaders(),
      }).headers.get("Authorization"),
      undefined,
    );
  }
  browser(token);
  assert.equal(
    attachApiToken({
      url: "/api/songs",
      headers: new AxiosHeaders({ Authorization: "Bearer explicit" }),
    }).headers.get("Authorization"),
    "Bearer explicit",
  );
  delete (globalThis as any).window;
});
