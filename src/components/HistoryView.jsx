import React from 'react';
import { Trash2, RotateCcw, Clock, AlertTriangle, FileText, Menu } from 'lucide-react';

export default function HistoryView({ historyList, onLoadRecord, onDeleteRecord, onClearAll, onNavigate, sidebarCollapsed, toggleSidebarCollapse }) {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {sidebarCollapsed && toggleSidebarCollapse && (
            <button 
              type="button" 
              onClick={toggleSidebarCollapse}
              className="btn-action-outline no-print"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.7rem', fontWeight: '700', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Menu size={12} /> Sidebar
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Printed Document Archives</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              All-time audit history of letters generated, printed, and exported to PDF.
            </p>
          </div>
        </div>
        {historyList.length > 0 && (
          <button 
            type="button" 
            onClick={onClearAll} 
            className="btn-action-outline btn-action-danger"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem' }}
          >
            <Trash2 size={13} /> Delete All Archives
          </button>
        )}
      </div>

      {/* Roster Cards or Table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {historyList.map(item => {
          let badgeColor = 'rgba(99, 102, 241, 0.1)';
          let badgeText = 'var(--accent-primary)';
          let docLabel = 'Offer Letter';

          if (item.type === 'termination') {
            badgeColor = 'rgba(248, 113, 113, 0.1)';
            badgeText = 'var(--danger)';
            docLabel = 'Termination';
          } else if (item.type === 'experience') {
            badgeColor = 'rgba(251, 191, 36, 0.1)';
            badgeText = 'var(--warning)';
            docLabel = 'Experience Cert.';
          } else if (item.type === 'salary') {
            badgeColor = 'rgba(52, 211, 153, 0.1)';
            badgeText = 'var(--success)';
            docLabel = 'Salary Slip';
          }

          return (
            <div 
              key={item.id} 
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'var(--transition)'
              }}
              className="history-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700',
                  backgroundColor: badgeColor, color: badgeText
                }}>
                  {docLabel}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> {item.timestamp}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Recipient Name</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', marginTop: '2px' }}>
                  {item.name}
                </strong>
                {item.companyName && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    {item.companyName}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <button 
                  type="button" 
                  onClick={() => onLoadRecord(item)}
                  className="btn-action-primary"
                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', boxShadow: 'none' }}
                >
                  <RotateCcw size={12} /> Reload Template
                </button>
                <button 
                  type="button" 
                  onClick={(e) => onDeleteRecord(item.id, e)}
                  className="btn-action-outline btn-action-danger"
                  style={{ padding: '0.4rem' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {historyList.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            background: 'var(--bg-secondary)',
            border: '1px dotted var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '4rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <FileText size={32} style={{ opacity: 0.3 }} />
            <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '600' }}>No Archived Documents</h4>
            <p style={{ fontSize: '0.75rem', maxWidth: '360px' }}>
              Whenever you print a letter or export a PDF, a copy of the template parameters will automatically appear here as an audit log.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
