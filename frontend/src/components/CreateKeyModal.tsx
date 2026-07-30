import React, { useState } from 'react';
import { CreateKeyPayload } from '../types/apiKey';
import { X, Key, Zap } from 'lucide-react';

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateKeyPayload) => Promise<void>;
}

export const CreateKeyModal: React.FC<CreateKeyModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [rateLimit, setRateLimit] = useState<number>(10);
  const [customPrefix, setCustomPrefix] = useState('AQ.AIzaSy');
  const [scopes, setScopes] = useState<string[]>(['read', 'ai:generate']);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleScopeToggle = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        rateLimit: Number(rateLimit) || 10,
        scopes,
        customPrefix,
      });
      setName('');
      setRateLimit(10);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary-bg)', padding: '6px', borderRadius: '8px' }}>
              <Key size={18} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Create API Key</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure Gemini key settings and rate limits</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Key Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px' }}>
                Key Name <span style={{ color: 'var(--status-revoked-text)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Gemini Production Chatbot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Custom Gemini Key Prefix */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px' }}>
                Key Prefix Format
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['AQ.AIzaSy', 'AQ.production', 'AQ.test'].map((prefix) => (
                  <button
                    key={prefix}
                    type="button"
                    onClick={() => setCustomPrefix(prefix)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid',
                      borderColor: customPrefix === prefix ? 'var(--primary)' : 'var(--border-color)',
                      background: customPrefix === prefix ? 'rgba(168, 199, 250, 0.1)' : 'var(--bg-input)',
                      color: customPrefix === prefix ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {prefix}...
                  </button>
                ))}
              </div>
            </div>

            {/* Rate Limit RPM Selection */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="var(--primary)" />
                  Rate Limit Quota (RPM)
                </label>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                  {rateLimit} RPM
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {[5, 10, 30, 60, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRateLimit(preset)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: '1px solid',
                      borderColor: rateLimit === preset ? 'var(--primary)' : 'var(--border-color)',
                      background: rateLimit === preset ? 'rgba(168, 199, 250, 0.1)' : 'var(--bg-input)',
                      color: rateLimit === preset ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {preset} RPM
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                max="1000"
                className="input-field"
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                placeholder="Custom limit..."
              />
            </div>

            {/* Scopes Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px' }}>
                API Scopes & Permissions
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'ai:generate', label: 'ai:generate', desc: 'Gemini AI Completions' },
                  { id: 'read', label: 'read', desc: 'Read resource metadata' },
                  { id: 'write', label: 'write', desc: 'Modify resources' },
                  { id: 'admin', label: 'admin', desc: 'Full administration' },
                ].map((item) => {
                  const checked = scopes.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleScopeToggle(item.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: checked ? 'var(--primary)' : 'var(--border-color)',
                        background: checked ? 'rgba(168, 199, 250, 0.08)' : 'var(--bg-input)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 500, color: checked ? 'var(--primary)' : 'var(--text-main)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
              {submitting ? 'Creating...' : 'Create API Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
