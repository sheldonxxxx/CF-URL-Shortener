/// <reference types="@cloudflare/workers-types" />
import { hashUrl } from '../utils/hash';

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

export async function getUrlByOriginalUrl(kv: KVNamespace, url: string): Promise<string | null> {
  const urlHash = await hashUrl(url);
  const shortCode = await kv.get(`url:${urlHash}`);
  return shortCode;
}

export async function setUrlMapping(kv: KVNamespace, url: string, shortCode: string): Promise<void> {
  const urlHash = await hashUrl(url);
  await kv.put(`url:${urlHash}`, shortCode);
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
  await setUrlMapping(kv, originalUrl, shortCode);
}

export async function shortCodeExists(kv: KVNamespace, shortCode: string): Promise<boolean> {
  const data = await kv.get(`short:${shortCode}`);
  return data !== null;
}

export function generateShortCode(): string {
  return generateRandomCode(6);
}
