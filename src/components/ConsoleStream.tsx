import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export const ConsoleStream: React.FC = () => {
  const { logs, clearLogs, currentUser } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  // Non-admins or non-managers don't need clutter
  if (currentUser?.role === 'engenheiro') return null;

  return (
    <div className="card" style={{ marginTop: 14, padding: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Terminal size={18} color="#6366f1" />
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
            Terminal de Automação & Logs SIENGE ({logs.length})
          </h3>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Monitoramento de rotinas em tempo real
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              clearLogs();
            }}
            title="Limpar logs"
          >
            <Trash2 size={13} />
            Limpar
          </button>
          <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div
          id="console-stream"
          style={{
            marginTop: 12,
            background: 'rgba(0, 0, 0, 0.45)',
            borderRadius: 8,
            padding: 12,
            fontFamily: 'monospace',
            fontSize: 12,
            maxHeight: 220,
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum log registrado na sessão atual.</div>
          ) : (
            logs.map(log => {
              let color = '#94a3b8';
              let badgeBg = 'rgba(148, 163, 184, 0.1)';
              if (log.type === 'success') {
                color = '#34d399';
                badgeBg = 'rgba(16, 185, 129, 0.15)';
              } else if (log.type === 'sienge') {
                color = '#60a5fa';
                badgeBg = 'rgba(59, 130, 246, 0.15)';
              } else if (log.type === 'warn') {
                color = '#fbbf24';
                badgeBg = 'rgba(245, 158, 11, 0.15)';
              } else if (log.type === 'error') {
                color = '#f87171';
                badgeBg = 'rgba(239, 68, 68, 0.15)';
              }

              return (
                <div key={log.id} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 65 }}>[{log.time}]</span>
                  <span style={{ background: badgeBg, color, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, height: 'fit-content' }}>
                    {(log.type || 'INFO').toUpperCase()}
                  </span>
                  <span style={{ color, flex: 1, wordBreak: 'break-word' }}>{log.msg}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
