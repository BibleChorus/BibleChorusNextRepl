import axios from "axios";
import type { JourneyOriginal } from "@/types/journey";
import { ORIGINAL_FILE_LIMITS, validOriginalFile } from "@/lib/journey-originals-validation";

export type OriginalKind = JourneyOriginal["kind"];
export interface OriginalUpload {
  url: string;
  headers: Record<string, string>;
  expires_in: number;
}
export interface OriginalsResponse {
  originals: JourneyOriginal[];
  storage: { enabled: boolean; message?: string };
}

export const ORIGINAL_LIMITS = {
  audio: ORIGINAL_FILE_LIMITS.audio / (1024 * 1024),
  image: ORIGINAL_FILE_LIMITS.image / (1024 * 1024),
  pdf: ORIGINAL_FILE_LIMITS.pdf / (1024 * 1024),
};
export const ORIGINAL_ACCEPT = {
  audio: ".mp3,.wav,.ogg,.m4a,.flac",
  image: ".jpg,.jpeg,.png,.webp",
  pdf: ".pdf",
} as const;
const fileTypes = {
  mp3: ["audio/mpeg"],
  wav: ["audio/wav", "audio/x-wav"],
  ogg: ["audio/ogg"],
  m4a: ["audio/mp4", "audio/x-m4a"],
  flac: ["audio/flac"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  pdf: ["application/pdf"],
};

export function validateOriginalFile(file: File, kind: Exclude<OriginalKind, "journal">): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const allowedExtension = ORIGINAL_ACCEPT[kind].split(",").includes(`.${extension}`);
  const allowedMime = fileTypes[extension as keyof typeof fileTypes]?.includes(file.type);
  if (!allowedExtension || !allowedMime) return "Choose a supported file type. Its extension and file type must match.";
  if (!validOriginalFile(kind, file.type, file.size))
    return `Choose a file between 1 byte and ${ORIGINAL_LIMITS[kind]} MB.`;
  return null;
}

export function matchesOriginalFile(original: JourneyOriginal, file: File): boolean {
  return original.file_name === file.name && original.byte_size === file.size && original.mime_type === file.type;
}

export function originalError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error || error.response?.data?.message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export function originalFileSize(bytes: number | null): string {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Native audio/image/PDF requests use the existing HttpOnly session, never a URL token. */
export async function prepareOriginalSession(token: string | null, signal: AbortSignal) {
  if (token) await axios.get("/api/auth/session", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
}
