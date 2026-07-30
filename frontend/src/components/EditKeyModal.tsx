import React, { useState, useEffect } from 'react';
import { IApiKey } from '../types/apiKey';
import { X, Edit2, Zap } from 'lucide-react';

interface EditKeyModalProps {
  keyData: IApiKey | null;
  onClose: () => void;
  onSubmit: (id: string, name: string, rateLimit: number) => Promise<void>;
}

export const EditKeyModal: React.FC<EditKeyModalProps> = ({ keyData, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [rateLimit, setRateLimit] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (keyData) {
      setName(keyData.name);
      setRateLimit(keyData.rateLimit);
    }
  }, [keyData]);

  if (!keyData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(keyData._id, name.trim(), Number(rateLimit));
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
              <Edit2 size={18} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Edit API Key</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{keyData.displayPrefix}</p>
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
                Key Name
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Rate Limit RPM */}
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
              <input
                type="number"
                min="1"
                max="1000"
                className="input-field"
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
