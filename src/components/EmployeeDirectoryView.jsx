import React, { useState } from 'react';
import { Search, Plus, UserPlus, Edit2, Trash2, FolderPlus, CreditCard, Menu, Upload, FileSpreadsheet, X, HelpCircle } from 'lucide-react';

export default function EmployeeDirectoryView({ 
  employees, 
  empForm, 
  setEmpForm, 
  editingEmployee, 
  setEditingEmployee, 
  handleSaveEmployee, 
  handleEditEmployee, 
  onNavigate,
  sidebarCollapsed,
  toggleSidebarCollapse,
  onImportEmployees
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [importSummary, setImportSummary] = useState(null);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.empId && emp.empId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCsvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      try {
        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) {
          setCsvError('The CSV file is empty or missing data rows.');
          return;
        }

        // Clean headers and match fields
        const rawHeaders = lines[0].split(',');
        const headers = rawHeaders.map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV line splitter respecting quotes
          const values = [];
          let current = '';
          let inQuotes = false;
          for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          const row = {};
          headers.forEach((header, index) => {
            const cleanVal = values[index] ? values[index].replace(/^["']|["']$/g, '') : '';
            row[header] = cleanVal;
          });
          parsedRows.push(row);
        }

        // Map parsed rows to employee objects
        const importedList = parsedRows.map(row => {
          // Detect headers and map them
          const name = row['name'] || row['full name'] || row['employee name'] || '';
          const empId = row['empid'] || row['employeeid'] || row['id'] || row['emp id'] || '';
          const designation = row['designation'] || row['position'] || row['role'] || '';
          const department = row['department'] || row['dept'] || '';
          const grossSalary = row['grosssalary'] || row['gross'] || row['salary'] || row['monthly gross'] || '0';
          const joiningDate = row['joiningdate'] || row['doj'] || row['joining date'] || '';
          const email = row['email'] || row['email address'] || '';
          const address = row['address'] || row['residential address'] || '';
          const bankName = row['bankname'] || row['bank'] || '';
          const accountNumber = row['accountnumber'] || row['account no'] || row['account'] || '';
          const pan = row['pan'] || row['pan number'] || '';
          const uan = row['uan'] || row['uan number'] || '';
          const esic = row['esic'] || row['esic number'] || '';

          return {
            id: (Date.now() + Math.random()).toString(),
            name,
            empId,
            designation,
            department,
            grossSalary: isNaN(Number(grossSalary)) ? 0 : Number(grossSalary),
            joiningDate,
            email,
            address,
            bankName,
            accountNumber,
            pan,
            uan,
            esic
          };
        }).filter(emp => emp.name !== ''); // Skip empty names

        if (importedList.length === 0) {
          setCsvError('No valid employee records could be parsed. Check column names.');
        } else {
          setImportSummary(importedList);
          setCsvError('');
        }
      } catch (err) {
        setCsvError('Error parsing CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const executeImport = () => {
    if (importSummary && importSummary.length > 0) {
      onImportEmployees(importSummary);
      setShowImportModal(false);
      setImportSummary(null);
      alert(`Successfully imported ${importSummary.length} employees into directory!`);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '100%', width: '100%' }}>
      
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-sm)',
        width: '100%'
      }}>
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
          <h2 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Employee Directory</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            className="btn-action-secondary"
            onClick={() => { setShowImportModal(true); setCsvError(''); setImportSummary(null); }}
            style={{ fontSize: '0.7rem', padding: '0.45rem 0.75rem', gap: '6px', display: 'flex', alignItems: 'center' }}
          >
            <Upload size={12} /> Bulk Import (CSV)
          </button>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered: {employees.length}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start', flex: 1, width: '100%' }}>
      
      {/* Add / Edit Form Panel */}
      <div style={{
        flex: '1 1 320px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={16} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600' }}>
            {editingEmployee ? 'Modify Employee Profile' : 'Register New Employee'}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="doc-form-group">
            <label className="doc-form-label">Full Name *</label>
            <input 
              type="text" 
              value={empForm.name || ''} 
              onChange={e => setEmpForm({...empForm, name: e.target.value})} 
              className="doc-form-input" 
              placeholder="e.g. John Doe"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="doc-form-group">
              <label className="doc-form-label">Employee ID</label>
              <input 
                type="text" 
                value={empForm.empId || ''} 
                onChange={e => setEmpForm({...empForm, empId: e.target.value})} 
                className="doc-form-input" 
                placeholder="e.g. EMP-09"
              />
            </div>
            <div className="doc-form-group">
              <label className="doc-form-label">Department</label>
              <input 
                type="text" 
                value={empForm.department || ''} 
                onChange={e => setEmpForm({...empForm, department: e.target.value})} 
                className="doc-form-input" 
                placeholder="e.g. Engineering"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="doc-form-group">
              <label className="doc-form-label">Designation</label>
              <input 
                type="text" 
                value={empForm.designation || ''} 
                onChange={e => setEmpForm({...empForm, designation: e.target.value})} 
                className="doc-form-input" 
                placeholder="e.g. Senior Dev"
              />
            </div>
            <div className="doc-form-group">
              <label className="doc-form-label">Monthly Gross (₹)</label>
              <input 
                type="number" 
                value={empForm.grossSalary || ''} 
                onChange={e => setEmpForm({...empForm, grossSalary: e.target.value})} 
                className="doc-form-input" 
                placeholder="e.g. 75000"
              />
            </div>
          </div>

          <div className="doc-form-group">
            <label className="doc-form-label">Date of Joining</label>
            <input 
              type="text" 
              value={empForm.joiningDate || ''} 
              onChange={e => setEmpForm({...empForm, joiningDate: e.target.value})} 
              className="doc-form-input" 
              placeholder="e.g. 01-JAN-2026"
            />
          </div>

          <div className="doc-form-group">
            <label className="doc-form-label">Email Address</label>
            <input 
              type="email" 
              value={empForm.email || ''} 
              onChange={e => setEmpForm({...empForm, email: e.target.value})} 
              className="doc-form-input" 
              placeholder="e.g. employee@company.com"
            />
          </div>

          <div className="doc-form-group">
            <label className="doc-form-label">Residential Address</label>
            <input 
              type="text" 
              value={empForm.address || ''} 
              onChange={e => setEmpForm({...empForm, address: e.target.value})} 
              className="doc-form-input" 
              placeholder="Address details"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="doc-form-group">
              <label className="doc-form-label">Bank Name</label>
              <input 
                type="text" 
                value={empForm.bankName || ''} 
                onChange={e => setEmpForm({...empForm, bankName: e.target.value})} 
                className="doc-form-input" 
                placeholder="e.g. HDFC"
              />
            </div>
            <div className="doc-form-group">
              <label className="doc-form-label">Account Number</label>
              <input 
                type="text" 
                value={empForm.accountNumber || ''} 
                onChange={e => setEmpForm({...empForm, accountNumber: e.target.value})} 
                className="doc-form-input" 
                placeholder="Bank account"
              />
            </div>
          </div>

          {/* Collapsible compliance information section (keeps UI uncluttered) */}
          <details style={{ marginTop: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', background: 'var(--bg-tertiary)' }}>
            <summary style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--accent-hover)', cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
              Compliance IDs (Optional)
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.5rem' }}>
              <div className="doc-form-group">
                <label className="doc-form-label">PAN Number</label>
                <input 
                  type="text" 
                  value={empForm.pan || ''} 
                  onChange={e => setEmpForm({...empForm, pan: e.target.value})} 
                  className="doc-form-input" 
                  placeholder="e.g. ABCDE1234F"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="doc-form-group">
                  <label className="doc-form-label">UAN (PF)</label>
                  <input 
                    type="text" 
                    value={empForm.uan || ''} 
                    onChange={e => setEmpForm({...empForm, uan: e.target.value})} 
                    className="doc-form-input" 
                    placeholder="12 digit UAN"
                  />
                </div>
                <div className="doc-form-group">
                  <label className="doc-form-label">ESIC IP No</label>
                  <input 
                    type="text" 
                    value={empForm.esic || ''} 
                    onChange={e => setEmpForm({...empForm, esic: e.target.value})} 
                    className="doc-form-input" 
                    placeholder="17 digit ESIC"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>

        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            onClick={handleSaveEmployee} 
            className="btn-action-primary" 
            style={{ flex: 1, padding: '0.55rem' }}
          >
            {editingEmployee ? 'Save Changes' : 'Register Employee'}
          </button>
          {editingEmployee && (
            <button 
              type="button" 
              onClick={() => {
                setEditingEmployee(null);
                setEmpForm({ id: '', name: '', empId: '', designation: '', department: '', address: '', joiningDate: '', grossSalary: '', bankName: '', accountNumber: '', email: '', pan: '', uan: '', esic: '' });
              }} 
              className="btn-action-outline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Roster list table */}
      <div style={{
        flex: '99 1 500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Search */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Employee Directory ({employees.length} total)
          </span>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search roster..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="doc-form-input"
              style={{ paddingLeft: '32px', width: '100%', fontSize: '0.75rem' }}
            />
          </div>
        </div>

        {/* Directory Table */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Employee Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Employee ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Designation / Email</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Gross Salary</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date Joined</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{emp.empId || 'N/A'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '600',
                        background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)'
                      }}>
                        {emp.department || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{emp.designation || 'N/A'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{emp.email || 'No email saved'}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(emp.grossSalary || 0)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{emp.joiningDate || 'N/A'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => handleEditEmployee(emp)} 
                          className="btn-action-outline"
                          style={{ padding: '0.4rem', borderRadius: '4px' }}
                          title="Edit Profile"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteEmployee(emp.id)} 
                          className="btn-action-outline btn-action-danger"
                          style={{ padding: '0.4rem', borderRadius: '4px' }}
                          title="Delete Employee"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No matching employee records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showImportModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '520px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Bulk Import Employees</h3>
              </div>
              <button type="button" onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Instructions & Format:</span>
              <span>Please upload a CSV file with the following column headers (case-insensitive):</span>
              <code style={{ fontSize: '0.7rem', color: 'var(--accent-hover)', display: 'block', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                name, empId, designation, department, grossSalary, joiningDate, email, address, bankName, accountNumber, pan, uan, esic
              </code>
              <span>* Only <strong>name</strong> is strictly required. Other fields will fallback to empty values if missing.</span>
            </div>

            <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
              <Upload size={24} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-primary)' }}>Select CSV File to Upload</span>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleCsvFile}
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }} 
              />
            </div>

            {csvError && (
              <div style={{ background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.15)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--danger)' }}>
                ⚠️ {csvError}
              </div>
            )}

            {importSummary && (
              <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.15)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--success)' }}>
                ✅ CSV Parsed successfully! Detected <strong>{importSummary.length} employee records</strong> ready to import.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="btn-action-outline" onClick={() => setShowImportModal(false)} style={{ padding: '0.45rem 1rem', fontSize: '0.75rem' }}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-action-primary" 
                onClick={executeImport} 
                disabled={!importSummary || importSummary.length === 0}
                style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', opacity: (!importSummary || importSummary.length === 0) ? 0.5 : 1 }}
              >
                Confirm & Import
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
  );
}
