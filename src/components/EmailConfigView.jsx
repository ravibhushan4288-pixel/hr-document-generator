import React, { useState } from 'react';
import { Mail, Check, ShieldAlert, Key, Send, Menu } from 'lucide-react';

export default function EmailConfigView({ smtpConfig, onSaveConfig, onTestConnection, onNavigate, sidebarCollapsed, toggleSidebarCollapse }) {
  const [config, setConfig] = useState({
    host: smtpConfig.host || '',
    port: smtpConfig.port || '465',
    secure: smtpConfig.secure !== undefined ? smtpConfig.secure : true,
    username: smtpConfig.username || '',
    password: smtpConfig.password || '',
    senderName: smtpConfig.senderName || 'Lumina HR',
    emailSubject: smtpConfig.emailSubject || 'Salary Slip for {{month}}',
    emailBody: smtpConfig.emailBody || 'Dear {{name}},\n\nPlease find attached your salary slip for the month of {{month}}.\n\nBest regards,\nHR Department'
  });

  const [testEmail, setTestEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onSaveConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      alert('SMTP settings saved successfully!');
    }, 500);
  };

  const handleTest = async () => {
    if (!testEmail) return alert('Please enter a recipient email address for the test!');
    setIsTesting(true);
    const result = await onTestConnection(config, testEmail);
    setIsTesting(false);
    
    if (result.success) {
      alert(`Connection successful! Test email sent successfully.\nMessage ID: ${result.messageId}`);
    } else {
      alert(`SMTP Connection Failed:\n\n${result.error}`);
    }
  };

  const isDesktop = window.ipcRenderer !== undefined;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '100%', width: '100%' }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-sm)',
        gap: '10px',
        width: '100%'
      }}>
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
          <h2 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Email SMTP Configurations</h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Configure SMTP credentials to automatically distribute payslips directly to employee inboxes</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start', flex: 1, width: '100%' }}>
      
      {/* SMTP Config Form */}
      <div style={{
        flex: '1 1 450px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>SMTP Configurations</h3>
        </div>

        {!isDesktop && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Desktop Mode Required:</strong> Direct socket connections to SMTP servers are blocked by web browsers. Please launch the Desktop App to utilize email dispatch features.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="doc-form-group">
              <label className="doc-form-label">SMTP Server Host</label>
              <input 
                type="text" 
                value={config.host} 
                onChange={e => setConfig({...config, host: e.target.value})} 
                className="doc-form-input" 
                placeholder="smtp.gmail.com"
                disabled={!isDesktop}
              />
            </div>
            <div className="doc-form-group">
              <label className="doc-form-label">Port</label>
              <input 
                type="text" 
                value={config.port} 
                onChange={e => setConfig({...config, port: e.target.value})} 
                className="doc-form-input" 
                placeholder="465"
                disabled={!isDesktop}
              />
            </div>
            <div className="doc-form-group" style={{ justifyContent: 'center' }}>
              <label className="doc-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', height: '100%', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  checked={config.secure} 
                  onChange={e => setConfig({...config, secure: e.target.checked})}
                  disabled={!isDesktop}
                />
                SSL/TLS
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="doc-form-group">
              <label className="doc-form-label">SMTP Username (Email)</label>
              <input 
                type="text" 
                value={config.username} 
                onChange={e => setConfig({...config, username: e.target.value})} 
                className="doc-form-input" 
                placeholder="e.g. sender@gmail.com"
                disabled={!isDesktop}
              />
            </div>
            <div className="doc-form-group">
              <label className="doc-form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                SMTP Password / App Password
              </label>
              <input 
                type="password" 
                value={config.password} 
                onChange={e => setConfig({...config, password: e.target.value})} 
                className="doc-form-input" 
                placeholder="App passwords recommended"
                disabled={!isDesktop}
              />
            </div>
          </div>

          <div className="doc-form-group">
            <label className="doc-form-label">Sender Name</label>
            <input 
              type="text" 
              value={config.senderName} 
              onChange={e => setConfig({...config, senderName: e.target.value})} 
              className="doc-form-input" 
              placeholder="e.g. Lumina HR"
              disabled={!isDesktop}
            />
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

          <div className="doc-form-group">
            <label className="doc-form-label">Default Email Subject</label>
            <input 
              type="text" 
              value={config.emailSubject} 
              onChange={e => setConfig({...config, emailSubject: e.target.value})} 
              className="doc-form-input" 
              placeholder="e.g. Payslip for {{month}}"
              disabled={!isDesktop}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Use <code>{"{{month}}"}</code> to insert the payroll month.
            </span>
          </div>

          <div className="doc-form-group">
            <label className="doc-form-label">Email Cover Body Text</label>
            <textarea 
              rows="4" 
              value={config.emailBody} 
              onChange={e => setConfig({...config, emailBody: e.target.value})} 
              className="doc-form-textarea" 
              placeholder="Write cover details..."
              style={{ fontSize: '0.75rem' }}
              disabled={!isDesktop}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Use <code>{"{{name}}"}</code> for employee name, <code>{"{{month}}"}</code> for the month.
            </span>
          </div>

        </div>

        <button 
          type="button" 
          onClick={handleSave} 
          className="btn-action-primary" 
          style={{ width: '100%', padding: '0.65rem' }}
          disabled={!isDesktop || isSaving}
        >
          <Check size={14} /> {isSaving ? 'Saving Configurations...' : 'Save Configs'}
        </button>
      </div>

      {/* Test connection panel */}
      <div style={{
        flex: '1 1 300px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>Test Dispatcher</h3>
        </div>

        <div className="doc-form-group">
          <label className="doc-form-label">Test Recipient Email</label>
          <input 
            type="email" 
            placeholder="e.g. administrator@gmail.com" 
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            className="doc-form-input"
            disabled={!isDesktop}
          />
        </div>

        <button 
          type="button" 
          onClick={handleTest} 
          className="btn-action-outline"
          style={{ width: '100%', padding: '0.65rem', display: 'flex', justifyContent: 'center' }}
          disabled={!isDesktop || isTesting || !testEmail}
        >
          <Send size={14} /> {isTesting ? 'Dispatching Test Mail...' : 'Send Test Mail'}
        </button>
      </div>

    </div>
  </div>
  );
}
