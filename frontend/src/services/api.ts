import {
  IApiKey,
  CreateKeyPayload,
  UpdateKeyPayload,
  NewKeyResponse,
  RollKeyResponse,
  PlaygroundTestResult,
} from '../types/apiKey';

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    const cleaned = envUrl.replace(/\/$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();

export const apiService = {
  // Fetch all API keys
  async getKeys(): Promise<IApiKey[]> {
    const res = await fetch(`${API_BASE}/keys`);
    if (!res.ok) {
      throw new Error(`Failed to fetch API keys (${res.status})`);
    }
    const data = await res.json();
    return data.keys || [];
  },

  // Create a new API Key
  async createKey(payload: CreateKeyPayload): Promise<NewKeyResponse> {
    const res = await fetch(`${API_BASE}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create API key');
    }
    return data;
  },

  // Update existing API key
  async updateKey(id: string, payload: UpdateKeyPayload): Promise<IApiKey> {
    const res = await fetch(`${API_BASE}/keys/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update API key');
    }
    return data.key;
  },

  // Revoke key
  async revokeKey(id: string): Promise<IApiKey> {
    const res = await fetch(`${API_BASE}/keys/${id}/revoke`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to revoke API key');
    }
    return data.key;
  },

  // Roll / Regenerate key
  async rollKey(id: string): Promise<RollKeyResponse> {
    const res = await fetch(`${API_BASE}/keys/${id}/roll`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to roll API key');
    }
    return data;
  },

  // Delete key
  async deleteKey(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/keys/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to delete API key');
    }
  },

  // Test Protected Gemini AI Endpoint (with Rate Limit testing)
  async testAiEndpoint(rawApiKey: string, prompt: string = 'Test prompt'): Promise<PlaygroundTestResult> {
    const res = await fetch(`${API_BASE}/v1/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': rawApiKey,
      },
      body: JSON.stringify({ prompt }),
    });

    const headers: Record<string, string> = {
      'x-ratelimit-limit': res.headers.get('x-ratelimit-limit') || '10',
      'x-ratelimit-remaining': res.headers.get('x-ratelimit-remaining') || '0',
      'x-ratelimit-reset': res.headers.get('x-ratelimit-reset') || '60',
      'retry-after': res.headers.get('retry-after') || '',
    };

    const data = await res.json().catch(() => ({}));

    return {
      success: res.ok,
      status: res.status,
      timestamp: data.timestamp || new Date().toISOString(),
      service: data.service,
      prompt: data.prompt || prompt,
      result: data.result,
      error: data.error,
      message: data.message,
      keyContext: data.keyContext,
      quota: data.quota || {
        limit: Number(headers['x-ratelimit-limit']),
        remaining: Number(headers['x-ratelimit-remaining']),
        resetInSeconds: Number(headers['x-ratelimit-reset']),
      },
      headers,
    };
  },
};
