import crypto from 'node:crypto';

export interface GeneratedKeyData {
  rawKey: string;
  keyHash: string;
  displayPrefix: string;
}

/**
 * Generates a production-level Google Gemini style API Key.
 * Format: AQ.AIzaSy<32 random bytes encoded in url-safe base64/hex>
 */
export const generateApiKey = (customPrefix: string = 'AQ.AIzaSy'): GeneratedKeyData => {
  // Generate 32 cryptographically secure random bytes
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const rawKey = `${customPrefix}${randomBytes}`;

  // Compute SHA-256 hash for database indexing & secure storage
  const keyHash = hashApiKey(rawKey);

  // Masked display representation (e.g. AQ.AIzaSy8f...e1b9)
  const displayPrefix = maskApiKey(rawKey);

  return {
    rawKey,
    keyHash,
    displayPrefix,
  };
};

/**
 * Computes SHA-256 hash of an API key
 */
export const hashApiKey = (rawKey: string): string => {
  return crypto.createHash('sha256').update(rawKey.trim()).digest('hex');
};

/**
 * Masks raw key for safe UI display (e.g. AQ.AIzaSy9a...3f2c)
 */
export const maskApiKey = (key: string): string => {
  if (!key || key.length < 12) return 'AQ.***';
  const start = key.slice(0, 10);
  const end = key.slice(-4);
  return `${start}...${end}`;
};
