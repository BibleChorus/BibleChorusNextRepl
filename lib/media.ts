/** Stored media may be a full CDN URL or an object key from older uploads. */
export function mediaUrl(value?: string | null, fallback = ""): string {
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;
  return cdn
    ? `${cdn.replace(/\/$/, "")}/${value.replace(/^\//, "")}`
    : `/${value}`;
}
