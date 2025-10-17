const MIME_TYPE_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
}

export function getExtensionFromMimeType(mimeType?: string): string {
  if (!mimeType) return 'png'
  const normalized = mimeType.toLowerCase()
  if (MIME_TYPE_EXTENSION_MAP[normalized]) {
    return MIME_TYPE_EXTENSION_MAP[normalized]
  }
  const match = normalized.match(/\/([^/;,+]+)(?:[;+].*)?$/)
  if (match && match[1]) {
    return match[1]
  }
  return 'png'
}

export function stripFileExtension(fileName?: string): string {
  if (!fileName) return ''
  return fileName.replace(/\.[^/.]+$/, '')
}

export function extractFileExtension(fileName?: string): string | undefined {
  if (!fileName) return undefined
  const match = fileName.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : undefined
}
