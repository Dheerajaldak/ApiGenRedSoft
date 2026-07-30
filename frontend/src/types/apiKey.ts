export type KeyStatus = 'active' | 'revoked' | 'expired';

export interface IApiKey {
  _id: string;
  name: string;
  displayPrefix: string;
  status: KeyStatus;
  rateLimit: number;
  usageCount: number;
  lastUsedAt?: string;
  scopes: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateKeyPayload {
  name: string;
  rateLimit: number;
  scopes: string[];
  customPrefix?: string;
}

export interface UpdateKeyPayload {
  name?: string;
  rateLimit?: number;
  scopes?: string[];
  status?: KeyStatus;
}

export interface NewKeyResponse {
  success: boolean;
  message: string;
  rawKey: string;
  key: IApiKey;
}

export interface RollKeyResponse {
  success: boolean;
  message: string;
  rawKey: string;
  oldKeyId: string;
  newKey: IApiKey;
}

export interface PlaygroundTestResult {
  success: boolean;
  status: number;
  timestamp?: string;
  service?: string;
  prompt?: string;
  result?: string;
  error?: string;
  message?: string;
  keyContext?: {
    keyId: string;
    name: string;
    displayPrefix: string;
    scopes: string[];
    totalUsageCount: number;
  };
  quota?: {
    limit: number;
    remaining: number;
    resetInSeconds: number;
  };
  headers?: Record<string, string>;
}
