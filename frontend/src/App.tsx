import React, { useState, useEffect, useCallback } from 'react';
import { IApiKey, CreateKeyPayload } from './types/apiKey';
import { apiService } from './services/api';
import { Header } from './components/Header';
import { KeyTable } from './components/KeyTable';
import { CreateKeyModal } from './components/CreateKeyModal';
import { NewKeyCreatedModal } from './components/NewKeyCreatedModal';
import { EditKeyModal } from './components/EditKeyModal';
import { ApiPlayground } from './components/ApiPlayground';
import { Key, Shield, Zap, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'keys' | 'playground'>('keys');
  const [keys, setKeys] = useState<IApiKey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<IApiKey | null>(null);
  
  const [editingKey, setEditingKey] = useState<IApiKey | null>(null);

  // Playground pre-selected key
  const [playgroundRawKey, setPlaygroundRawKey] = useState<string | null>(null);
  const [playgroundKeyData, setPlaygroundKeyData] = useState<IApiKey | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      setError(null);
      const data = await apiService.getKeys();
      setKeys(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreateKey = async (payload: CreateKeyPayload) => {
    try {
      const res = await apiService.createKey(payload);
      setCreatedRawKey(res.rawKey);
      setNewlyCreatedKey(res.key);
      await loadKeys();
    } catch (err: any) {
      alert(`Error creating key: ${err.message}`);
    }
  };

  const handleUpdateKey = async (id: string, name: string, rateLimit: number) => {
    try {
      await apiService.updateKey(id, { name, rateLimit });
      await loadKeys();
    } catch (err: any) {
      alert(`Error updating key: ${err.message}`);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this API key? Applications using it will immediately be blocked.')) {
      return;
    }
    try {
      await apiService.revokeKey(id);
      await loadKeys();
    } catch (err: any) {
      alert(`Error revoking key: ${err.message}`);
    }
  };

  const handleRollKey = async (id: string) => {
    if (!window.confirm('Rolling this key will immediately REVOKE the current key and generate a fresh secret key. Continue?')) {
      return;
    }
    try {
      const res = await apiService.rollKey(id);
      setCreatedRawKey(res.rawKey);
      setNewlyCreatedKey(res.newKey);
      await loadKeys();
    } catch (err: any) {
      alert(`Error rolling key: ${err.message}`);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Permanently delete this API key record? This action cannot be undone.')) {
      return;
    }
    try {
      await apiService.deleteKey(id);
      await loadKeys();
    } catch (err: any) {
      alert(`Error deleting key: ${err.message}`);
    }
  };

  const handleSelectForPlayground = (key: IApiKey, rawKey?: string) => {
    setPlaygroundKeyData(key);
    if (rawKey) {
      setPlaygroundRawKey(rawKey);
    }
    setActiveTab('playground');
  };

  // Metrics
  const totalKeys = keys.length;
  const activeKeysCount = keys.filter((k) => k.status === 'active').length;
  const totalCalls = keys.reduce((acc, curr) => acc + (curr.usageCount || 0), 0);
  const avgRateLimit = totalKeys > 0 ? Math.round(keys.reduce((acc, curr) => acc + curr.rateLimit, 0) / totalKeys) : 10;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Top Navbar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} totalKeys={totalKeys} />

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '24px', flex: 1 }}>
        {/* Error Banner */}
        {error && (
          <div style={{ background: 'var(--status-revoked-bg)', border: '1px solid var(--status-revoked-border)', color: 'var(--status-revoked-text)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>Backend Warning: {error}</span>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={loadKeys}>
              Retry
            </button>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {/* Card 1 */}
          <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-bg)', padding: '10px', borderRadius: '8px' }}>
              <Key size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Keys</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{totalKeys}</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--status-active-bg)', padding: '10px', borderRadius: '8px' }}>
              <Shield size={18} color="var(--status-active-text)" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Status</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--status-active-text)', marginTop: '2px' }}>
                {activeKeysCount} Active
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-bg)', padding: '10px', borderRadius: '8px' }}>
              <Activity size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>API Requests</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{totalCalls}</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-bg)', padding: '10px', borderRadius: '8px' }}>
              <Zap size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Rate Limit</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {avgRateLimit} RPM
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switch */}
        {activeTab === 'keys' ? (
          <KeyTable
            keys={keys}
            loading={loading}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenEditModal={(k) => setEditingKey(k)}
            onRevokeKey={handleRevokeKey}
            onRollKey={handleRollKey}
            onDeleteKey={handleDeleteKey}
            onSelectForPlayground={(k) => handleSelectForPlayground(k)}
          />
        ) : (
          <ApiPlayground
            keys={keys}
            selectedRawKey={playgroundRawKey}
            selectedKeyData={playgroundKeyData}
          />
        )}
      </main>

      {/* Modals */}
      <CreateKeyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateKey}
      />

      <NewKeyCreatedModal
        rawKey={createdRawKey}
        keyData={newlyCreatedKey}
        onClose={() => {
          setCreatedRawKey(null);
          setNewlyCreatedKey(null);
        }}
        onTestInPlayground={(raw, keyObj) => {
          setCreatedRawKey(null);
          setNewlyCreatedKey(null);
          handleSelectForPlayground(keyObj, raw);
        }}
      />

      <EditKeyModal
        keyData={editingKey}
        onClose={() => setEditingKey(null)}
        onSubmit={handleUpdateKey}
      />
    </div>
  );
};
