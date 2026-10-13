import type { InternalAxiosRequestConfig } from "axios";

export function isUsableToken(token: string | null): token is string {
  if (!token) return false;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Never forward app credentials to presigned storage URLs or third-party services. */
export function attachApiToken(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  if (typeof window === "undefined") return config;
  const url = new URL(
    config.url || "",
    new URL(config.baseURL || "/", window.location.origin),
  );
  if (
    url.origin !== window.location.origin ||
    !url.pathname.startsWith("/api/")
  )
    return config;
  try {
    const token = window.localStorage.getItem("token");
    if (
      isUsableToken(token) &&
      (!config.headers.has("Authorization") ||
        config.headers.get("Authorization") === "Bearer null")
    )
      config.headers.set("Authorization", `Bearer ${token}`);
  } catch {
    /* Cookie authentication remains available when storage is disabled. */
  }
  return config;
}
