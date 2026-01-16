import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUrl, setUrl, shortCodeExists, generateShortCode, getUrlByOriginalUrl, setUrlMapping } from './storage/url';

describe('URL storage', () => {
  let mockKv: any;

  beforeEach(() => {
    mockKv = {
      get: vi.fn(),
      put: vi.fn(),
    };
  });

  describe('getUrl', () => {
    it('returns null for non-existent code', async () => {
      mockKv.get.mockResolvedValue(null);
      const result = await getUrl(mockKv, 'abc123');
      expect(result).toBeNull();
    });

    it('returns parsed URL record', async () => {
      const record = { originalUrl: 'https://example.com', createdAt: '2026-01-15', trackClicks: true };
      mockKv.get.mockResolvedValue(JSON.stringify(record));
      const result = await getUrl(mockKv, 'abc123');
      expect(result).toEqual(record);
    });
  });

  describe('setUrl', () => {
    it('stores URL with metadata', async () => {
      await setUrl(mockKv, 'abc123', 'https://example.com', true);
      expect(mockKv.put).toHaveBeenCalledWith(
        'short:abc123',
        expect.stringContaining('"originalUrl":"https://example.com"')
      );
    });
  });

  describe('shortCodeExists', () => {
    it('returns false for non-existent code', async () => {
      mockKv.get.mockResolvedValue(null);
      const result = await shortCodeExists(mockKv, 'abc123');
      expect(result).toBe(false);
    });

    it('returns true for existing code', async () => {
      mockKv.get.mockResolvedValue('{"originalUrl":"https://example.com"}');
      const result = await shortCodeExists(mockKv, 'abc123');
      expect(result).toBe(true);
    });
  });

  describe('generateShortCode', () => {
    it('generates 6 character codes', () => {
      const code = generateShortCode();
      expect(code.length).toBe(6);
    });

    it('generates valid base62 characters', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateShortCode();
        expect(code).toMatch(/^[0-9A-Za-z]+$/);
      }
    });

    it('generates unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 1000; i++) {
        codes.add(generateShortCode());
      }
      expect(codes.size).toBe(1000);
    });
  });

  describe('getUrlByOriginalUrl', () => {
    it('returns null for non-existent URL', async () => {
      mockKv.get.mockResolvedValue(null);
      const result = await getUrlByOriginalUrl(mockKv, 'https://example.com');
      expect(result).toBeNull();
    });

    it('returns short code for existing URL', async () => {
      mockKv.get.mockResolvedValue('abc123');
      const result = await getUrlByOriginalUrl(mockKv, 'https://example.com');
      expect(result).toBe('abc123');
    });
  });

  describe('setUrlMapping', () => {
    it('stores URL to short code mapping', async () => {
      await setUrlMapping(mockKv, 'https://example.com', 'abc123');
      expect(mockKv.put).toHaveBeenCalledWith(
        expect.stringContaining('url:'),
        'abc123'
      );
    });
  });
});
