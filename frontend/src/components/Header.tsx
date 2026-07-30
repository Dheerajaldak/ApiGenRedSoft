import React from 'react';
import { Key, Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'keys' | 'playground';
  setActiveTab: (tab: 'keys' | 'playground') => void;
  totalKeys: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, totalKeys }) => {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-dark)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#004a77',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color="var(--primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                API Key Console
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  background: 'rgba(168, 199, 250, 0.1)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(168, 199, 250, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 500,
                }}
              >
                API Keys
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--bg-card)',
            padding: '4px',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setActiveTab('keys')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'keys' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'keys' ? 'var(--primary-text)' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            <Key size={15} />
            API Keys ({totalKeys})
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'playground' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'playground' ? 'var(--primary-text)' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            <Activity size={15} />
            Rate Limit Playground
          </button>
        </div>

        {/* Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--status-active-text)',
            background: 'var(--status-active-bg)',
            padding: '4px 10px',
            borderRadius: '12px',
            border: '1px solid var(--status-active-border)',
          }}
        >
          <ShieldCheck size={14} />
          <span>MongoDB Engine Active</span>
        </div>
      </div>
    </header>
  );
};
