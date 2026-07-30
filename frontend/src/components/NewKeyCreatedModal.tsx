import React, { useState } from 'react';
import { IApiKey } from '../types/apiKey';
import { ShieldAlert, Copy, Check, Play, X, Key } from 'lucide-react';

interface NewKeyCreatedModalProps {
  rawKey: string | null;
  keyData: IApiKey | null;
  onClose: () => void;
  onTestInPlayground: (rawKey: string, keyData: IApiKey) => void;
}

export const NewKeyCreatedModal: React.FC<NewKeyCreatedModalProps> = ({
  rawKey,
  keyData,
  onClose,
  onTestInPlayground,
}) => {
  const [copied, setCopied] = useState(false);

  if (!rawKey || !keyData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--status-active-bg)', padding: '6px', borderRadius: '8px' }}>
              <Key size={18} color="var(--status-active-text)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>API Key Created</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Store key securely. It won't be shown again.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Security Notice */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--status-expired-bg)',
              border: '1px solid var(--status-expired-border)',
              color: 'var(--status-expired-text)',
              fontSize: '13px',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Important:</strong> Save your API key now. For security reasons, you cannot retrieve this key later.
            </div>
          </div>

          {/* Raw Key Box */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Your Gemini API Key
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-input)',
                border: '1px solid var(--primary)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <code
                className="mono"
                style={{
                  fontSize: '13px',
                  color: 'var(--primary)',
                  wordBreak: 'break-all',
                  fontWeight: 500,
                  marginRight: '10px',
                }}
              >
                {rawKey}
              </code>
              <button
                className="btn btn-primary"
                onClick={handleCopy}
                style={{ flexShrink: 0, padding: '6px 12px', fontSize: '12px' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Key Summary */}
          <div
            style={{
              background: 'var(--bg-input)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Name: </span>
              <strong style={{ color: 'var(--text-main)' }}>{keyData.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Quota: </span>
              <strong style={{ color: 'var(--primary)' }}>{keyData.rateLimit} RPM</strong>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onTestInPlayground(rawKey, keyData)}
          >
            <Play size={14} color="var(--primary)" />
            Test in Playground
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
