export function validateAuthHeader(authHeader: string | null, apiToken: string): boolean {
  if (!authHeader) return false;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return false;
  return parts[1] === apiToken;
}
