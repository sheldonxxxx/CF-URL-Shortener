/// <reference types="@cloudflare/workers-types" />

export interface UrlRecord {
  originalUrl: string;
  createdAt: string;
  trackClicks: boolean;
}

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateRandomCode(length: number = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => CHARS[byte % CHARS.length]).join('');
}

export async function getUrl(kv: KVNamespace, shortCode: string): Promise<UrlRecord | null> {
  const data = await kv.get(`short:${shortCode}`);
  if (!data) return null;
  return JSON.parse(data) as UrlRecord;
}

export async function setUrl(
  kv: KVNamespace,
  shortCode: string,
  originalUrl: string,
  trackClicks: boolean
): Promise<void> {
  const record: UrlRecord = {
    originalUrl,
    createdAt: new Date().toISOString(),
    trackClicks,
  };
  await kv.put(`short:${shortCode}`, JSON.stringify(record));
}

export async function shortCodeExists(kv: KVNamespace, shortCode: string): Promise<boolean> {
  const data = await kv.get(`short:${shortCode}`);
  return data !== null;
}

export function generateShortCode(): string {
  return generateRandomCode(6);
}
