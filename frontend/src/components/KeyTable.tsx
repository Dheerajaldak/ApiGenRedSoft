import React, { useState } from 'react';
import { IApiKey } from '../types/apiKey';
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  Slash,
  Trash2,
  Edit2,
  Search,
  Plus,
  Play,
  Clock,
  Zap,
} from 'lucide-react';

interface KeyTableProps {
  keys: IApiKey[];
  loading: boolean;
  onOpenCreateModal: () => void;
  onOpenEditModal: (key: IApiKey) => void;
  onRevokeKey: (id: string) => void;
  onRollKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
  onSelectForPlayground: (key: IApiKey) => void;
}

export const KeyTable: React.FC<KeyTableProps> = ({
  keys,
  loading,
  onOpenCreateModal,
  onOpenEditModal,
  onRevokeKey,
  onRollKey,
  onDeleteKey,
  onSelectForPlayground,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPrefix = (id: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredKeys = keys.filter(
    (k) =>
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.displayPrefix.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Table Header Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} color="var(--primary)" />
            API Keys
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            API keys grant access to Google Gemini models and services. Keep your keys secure.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search API keys..."
              className="input-field"
              style={{ paddingLeft: '34px', fontSize: '13px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Create Button */}
          <button className="btn btn-primary" onClick={onOpenCreateModal}>
            <Plus size={16} />
            Create API Key
          </button>
        </div>
      </div>

      {/* Keys Data Table */}
      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: '8px', color: 'var(--primary)' }} />
          <p style={{ fontSize: '13px' }}>Loading API keys...</p>
        </div>
      ) : filteredKeys.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--bg-input)', borderRadius: '8px', border: '1px border var(--border-color)' }}>
          <Key size={32} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)' }}>No API Keys</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>
            {searchTerm ? 'No keys matched your search.' : 'Get started by creating your first API key.'}
          </p>
          {!searchTerm && (
            <button className="btn btn-primary" onClick={onOpenCreateModal}>
              <Plus size={16} />
              Create API Key
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th style={{ padding: '12px 16px' }}>Key Prefix</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Rate Limit</th>
                <th style={{ padding: '12px 16px' }}>Usage</th>
                <th style={{ padding: '12px 16px' }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.map((key) => {
                const isActive = key.status === 'active';
                const isRevoked = key.status === 'revoked';
                const isExpired = key.status === 'expired';

                return (
                  <tr
                    key={key._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      opacity: isRevoked ? 0.6 : 1,
                    }}
                  >
                    {/* Name & Scopes */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{key.name}</div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {key.scopes?.map((sc) => (
                          <span key={sc} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            {sc}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Display Prefix & Copy */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code className="mono" style={{ background: 'var(--bg-input)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--primary)', fontSize: '12px' }}>
                          {key.displayPrefix}
                        </code>
                        <button
                          onClick={() => handleCopyPrefix(key._id, key.displayPrefix)}
                          title="Copy Display Prefix"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === key._id ? 'var(--status-active-text)' : 'var(--text-dim)' }}
                        >
                          {copiedId === key._id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      {isActive && <span className="badge badge-active"><Check size={12} /> Active</span>}
                      {isRevoked && <span className="badge badge-revoked"><Slash size={12} /> Revoked</span>}
                      {isExpired && <span className="badge badge-expired"><Clock size={12} /> Expired</span>}
                    </td>

                    {/* Rate Limit */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <Zap size={13} color="var(--primary)" />
                        <span>{key.rateLimit} RPM</span>
                      </div>
                    </td>

                    {/* Usage Stats */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        {key.usageCount || 0} requests
                      </div>
                      {key.lastUsedAt && (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {new Date(key.lastUsedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Test Playground */}
                        {isActive && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            title="Test Key in API Playground"
                            onClick={() => onSelectForPlayground(key)}
                          >
                            <Play size={12} color="var(--primary)" />
                            Test API
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          title="Edit Key Name and Rate Limit"
                          onClick={() => onOpenEditModal(key)}
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>

                        {/* Roll Key */}
                        {isActive && (
                          <button
                            className="btn btn-outline-warning"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            title="Roll Key: Revokes current key and generates a new secret key"
                            onClick={() => onRollKey(key._id)}
                          >
                            <RefreshCw size={12} />
                            Roll Key
                          </button>
                        )}

                        {/* Revoke Key */}
                        {isActive && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            title="Revoke Key: Immediately blocks access for this API key"
                            onClick={() => onRevokeKey(key._id)}
                          >
                            <Slash size={12} />
                            Revoke
                          </button>
                        )}

                        {/* Delete Key */}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--status-revoked-text)', borderColor: 'rgba(255,180,171,0.2)' }}
                          title="Delete Key Permanently"
                          onClick={() => onDeleteKey(key._id)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
