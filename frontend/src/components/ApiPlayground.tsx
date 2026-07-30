import React, { useState } from 'react';
import { IApiKey, PlaygroundTestResult } from '../types/apiKey';
import { apiService } from '../services/api';
import {
  Activity,
  Play,
  Zap,
  AlertTriangle,
  Terminal,
  RefreshCw,
} from 'lucide-react';

interface ApiPlaygroundProps {
  keys: IApiKey[];
  selectedRawKey?: string | null;
  selectedKeyData?: IApiKey | null;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({
  keys,
  selectedRawKey: initialRawKey,
  selectedKeyData: initialKeyData,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(initialRawKey || '');
  const [selectedKeyId, setSelectedKeyId] = useState<string>(initialKeyData?._id || '');
  const [prompt, setPrompt] = useState<string>('Explain how sliding-window rate limiting works in 1 sentence.');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<PlaygroundTestResult | null>(null);
  const [burstCount, setBurstCount] = useState<number>(0);

  const handleSelectKey = (keyId: string) => {
    setSelectedKeyId(keyId);
    if (!keyId) {
      setApiKeyInput('');
      return;
    }
    const found = keys.find((k) => k._id === keyId);
    if (found) {
      if (!apiKeyInput || apiKeyInput.startsWith('AQ.')) {
        setApiKeyInput(found.displayPrefix);
      }
    }
  };

  const handleSendSingleRequest = async () => {
    const keyToUse = apiKeyInput.trim();
    if (!keyToUse) {
      alert('Please select or enter an API key to test.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.testAiEndpoint(keyToUse, prompt);
      setLastResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBurstRequests = async (count: number = 5) => {
    const keyToUse = apiKeyInput.trim();
    if (!keyToUse) {
      alert('Please select or enter an API key to test.');
      return;
    }

    setLoading(true);
    setBurstCount(count);

    for (let i = 0; i < count; i++) {
      try {
        const res = await apiService.testAiEndpoint(keyToUse, `${prompt} (Burst #${i + 1})`);
        setLastResult(res);
      } catch (err) {
        console.error(err);
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    setLoading(false);
    setBurstCount(0);
  };

  const currentQuota = lastResult?.quota;
  const limit = currentQuota?.limit || 10;
  const remaining = currentQuota !== undefined ? currentQuota.remaining : limit;
  const percentRemaining = Math.max(0, Math.min(100, (remaining / limit) * 100));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Config Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--primary-bg)', padding: '8px', borderRadius: '8px' }}>
            <Activity size={20} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>Rate Limit Playground</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Test Gemini API key validation and live quota enforcement
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Key Selector Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px' }}>
              Select Key:
            </label>
            <select
              className="input-field"
              value={selectedKeyId}
              onChange={(e) => handleSelectKey(e.target.value)}
            >
              <option value="">-- Choose Key --</option>
              {keys.map((k) => (
                <option key={k._id} value={k._id}>
                  {k.name} ({k.displayPrefix}) - {k.rateLimit} RPM - [{k.status.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {/* Key Header Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px' }}>
              API Key Header Value (`x-api-key`):
            </label>
            <input
              type="text"
              className="input-field mono"
              placeholder="Paste raw secret key (e.g. AQ.AIzaSy...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{ fontSize: '13px', color: 'var(--primary)' }}
            />
          </div>

          {/* Prompt */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px' }}>
              Prompt:
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px 14px' }}
              onClick={handleSendSingleRequest}
              disabled={loading || !apiKeyInput}
              title="Send a single API request to test key authentication"
            >
              {loading && !burstCount ? (
                <RefreshCw size={15} className="spin" />
              ) : (
                <Play size={15} />
              )}
              Send Single Request
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '10px 14px' }}
              onClick={() => handleSendBurstRequests(5)}
              disabled={loading || !apiKeyInput}
              title="Fire 5 rapid requests in sequence to test quota depletion"
            >
              {burstCount > 0 ? (
                <RefreshCw size={15} className="spin" />
              ) : (
                <Zap size={15} />
              )}
              Test Rate Limit (5 Req)
            </button>

            <button
              className="btn btn-danger"
              style={{ padding: '10px 14px' }}
              onClick={() => handleSendBurstRequests(12)}
              disabled={loading || !apiKeyInput}
              title="Fire 12 rapid requests to trigger 429 Rate Limit overload"
            >
              <Zap size={15} />
              Trigger 429 Overload (12 Req)
            </button>
          </div>

          {/* Quota Progress */}
          {lastResult && (
            <div
              style={{
                marginTop: '12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="var(--primary)" />
                  Quota Status (60s Window)
                </span>
                <span style={{ fontWeight: 600, color: percentRemaining > 20 ? 'var(--status-active-text)' : 'var(--status-revoked-text)' }}>
                  {remaining} / {limit} Remaining
                </span>
              </div>

              <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${percentRemaining}%`,
                    background: percentRemaining > 20 ? 'var(--primary)' : 'var(--status-revoked-text)',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>

              {lastResult.status === 429 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '12px', color: 'var(--status-revoked-text)', background: 'var(--status-revoked-bg)', padding: '8px 12px', borderRadius: '6px' }}>
                  <AlertTriangle size={15} />
                  <span>
                    HTTP 429 Rate Limit Exceeded. Reset in <strong>{lastResult.quota?.resetInSeconds || 60}s</strong>.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Response Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>Response Inspector</h3>
          </div>

          {lastResult && (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                background:
                  lastResult.status === 200
                    ? 'var(--status-active-bg)'
                    : lastResult.status === 429
                    ? 'var(--status-revoked-bg)'
                    : 'var(--status-expired-bg)',
                color:
                  lastResult.status === 200
                    ? 'var(--status-active-text)'
                    : lastResult.status === 429
                    ? 'var(--status-revoked-text)'
                    : 'var(--status-expired-text)',
                border: '1px solid var(--border-color)',
              }}
            >
              {lastResult.status} {lastResult.status === 200 ? 'OK' : lastResult.status === 429 ? 'Too Many Requests' : 'Unauthorized'}
            </span>
          )}
        </div>

        {lastResult ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Limit: <strong style={{ color: 'var(--text-main)' }}>{lastResult.quota?.limit}</strong></span>
              <span>Remaining: <strong style={{ color: 'var(--primary)' }}>{lastResult.quota?.remaining}</strong></span>
              <span>Reset: <strong style={{ color: 'var(--text-muted)' }}>{lastResult.quota?.resetInSeconds}s</strong></span>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: '260px',
                background: 'var(--bg-input)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                padding: '14px',
                overflow: 'auto',
              }}
            >
              <pre className="mono" style={{ fontSize: '12px', color: lastResult.status === 200 ? 'var(--primary)' : 'var(--status-revoked-text)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <Terminal size={32} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
            <p style={{ fontSize: '13px', fontWeight: 500 }}>No Requests Executed</p>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '4px' }}>
              Select an API key and click "Send Request" to view response headers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
