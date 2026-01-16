import { describe, it, expect } from 'vitest';
import { encodeBase62, decodeBase62 } from './utils/base62';
import { isValidUrl } from './utils/validation';
import { validateAuthHeader } from './utils/auth';
import { hashUrl } from './utils/hash';

describe('base62 encoding', () => {
  it('encodes 0 correctly', () => {
    expect(encodeBase62(0)).toBe('0');
  });

  it('encodes single digits', () => {
    expect(encodeBase62(9)).toBe('9');
  });

  it('encodes uppercase letters', () => {
    expect(encodeBase62(10)).toBe('A');
    expect(encodeBase62(35)).toBe('Z');
  });

  it('encodes lowercase letters', () => {
    expect(encodeBase62(36)).toBe('a');
    expect(encodeBase62(61)).toBe('z');
  });

  it('encodes multi-character codes', () => {
    expect(encodeBase62(62)).toBe('10');
    expect(encodeBase62(63)).toBe('11');
    expect(encodeBase62(3843)).toBe('zz');
    expect(encodeBase62(3844)).toBe('100');
  });

  it('decodes correctly', () => {
    expect(decodeBase62('0')).toBe(0);
    expect(decodeBase62('9')).toBe(9);
    expect(decodeBase62('A')).toBe(10);
    expect(decodeBase62('z')).toBe(61);
    expect(decodeBase62('10')).toBe(62);
    expect(decodeBase62('zz')).toBe(3843);
  });

  it('round trips correctly', () => {
    for (let i = 0; i < 10000; i++) {
      const encoded = encodeBase62(i);
      const decoded = decodeBase62(encoded);
      expect(decoded).toBe(i);
    }
  });
});

describe('URL validation', () => {
  it('accepts valid http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path')).toBe(true);
    expect(isValidUrl('http://example.com/path?query=value')).toBe(true);
  });

  it('accepts valid https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('https://example.com/path')).toBe(true);
    expect(isValidUrl('https://example.com/path#fragment')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

describe('auth validation', () => {
  const validToken = 'my-secret-token';

  it('accepts valid bearer token', () => {
    expect(validateAuthHeader('Bearer my-secret-token', validToken)).toBe(true);
    expect(validateAuthHeader('bearer my-secret-token', validToken)).toBe(true);
  });

  it('rejects invalid token', () => {
    expect(validateAuthHeader('Bearer wrong-token', validToken)).toBe(false);
    expect(validateAuthHeader('Basic abc', validToken)).toBe(false);
  });

  it('rejects missing header', () => {
    expect(validateAuthHeader(null, validToken)).toBe(false);
    expect(validateAuthHeader('', validToken)).toBe(false);
  });

  it('rejects malformed header', () => {
    expect(validateAuthHeader('Bearer', validToken)).toBe(false);
    expect(validateAuthHeader('my-secret-token', validToken)).toBe(false);
  });
});

describe('URL hashing', () => {
  it('produces consistent hash for same URL', async () => {
    const url = 'https://example.com/path?query=value';
    const hash1 = await hashUrl(url);
    const hash2 = await hashUrl(url);
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different URLs', async () => {
    const hash1 = await hashUrl('https://example.com/page1');
    const hash2 = await hashUrl('https://example.com/page2');
    expect(hash1).not.toBe(hash2);
  });

  it('produces 64 character hex string (SHA-256)', async () => {
    const hash = await hashUrl('https://example.com');
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('handles URLs with special characters', async () => {
    const url = 'https://example.com/path?query=value&other=test#fragment';
    const hash = await hashUrl(url);
    expect(hash.length).toBe(64);
  });

  it('handles long URLs', async () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(1000);
    const hash = await hashUrl(longUrl);
    expect(hash.length).toBe(64);
  });
});
