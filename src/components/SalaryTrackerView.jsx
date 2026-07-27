import React, { useState } from 'react';
import { Search, Trash2, Printer, Filter, ShieldAlert, FileText, ArrowRight, Menu, FileSpreadsheet } from 'lucide-react';

export default function SalaryTrackerView({ salaryHistory, onDeleteRecord, onClearAll, onLoadRecord, onNavigate, sidebarCollapsed, toggleSidebarCollapse }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filter records
  const filteredHistory = salaryHistory.filter(record => {
    const matchesSearch = 
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMonth = filterMonth === '' || record.monthYear.toLowerCase().includes(filterMonth.toLowerCase());
    
    return matchesSearch && matchesMonth;
  });

  // Get unique months list for filtering
  const uniqueMonths = Array.from(new Set(salaryHistory.map(r => r.monthYear))).filter(Boolean);

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      alert("No matching records to export.");
      return;
    }
    
    // Create CSV Headers
    const headers = [
      "Employee ID", "Employee Name", "Designation", "Pay Period", "Paid Days", "LOP Days",
      "Basic Salary", "HRA", "Conveyance Allowance", "Special Allowance",
      "Provident Fund (PF)", "Professional Tax (PT)", "Income Tax (TDS)", "ESI",
      "Total Deductions", "Gross Salary", "Net Take-Home", "Bank Name", "Account Number", "Logged On"
    ];
    
    const csvRows = [headers.join(",")];
    
    filteredHistory.forEach(record => {
      const totalDeductions = (record.providentFund || 0) + (record.professionalTax || 0) + (record.incomeTax || 0) + (record.esi || 0);
      const grossVal = (record.basicSalary || 0) + (record.hra || 0) + (record.conveyanceAllowance || 0) + (record.specialAllowance || 0);
      const netVal = grossVal - totalDeductions;
      
      const row = [
        `"${record.employeeId}"`,
        `"${record.employeeName}"`,
        `"${record.designation}"`,
        `"${record.monthYear}"`,
        record.paidDays || 30,
        record.lopDays || 0,
        record.basicSalary || 0,
        record.hra || 0,
        record.conveyanceAllowance || 0,
        record.specialAllowance || 0,
        record.providentFund || 0,
        record.professionalTax || 0,
        record.incomeTax || 0,
        record.esi || 0,
        totalDeductions,
        grossVal,
        netVal,
        `"${record.bankName || ''}"`,
        `"${record.accountNumber || ''}"`,
        `"${record.timestamp || ''}"`
      ];
      csvRows.push(row.join(","));
    });
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Payroll_Ledger_${filterMonth || 'Export'}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header and Summary */}
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
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Salary Slip Ledger</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Audit log of all generated and logged payroll payroll records.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {salaryHistory.length > 0 && (
            <>
              <button 
                type="button" 
                onClick={handleExportCSV} 
                className="btn-action-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileSpreadsheet size={13} /> Export Ledger (CSV)
              </button>
              <button 
                type="button" 
                onClick={onClearAll} 
                className="btn-action-outline btn-action-danger"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem' }}
              >
                <Trash2 size={13} /> Clear Entire Ledger
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search employee name or ID..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="doc-form-input"
            style={{ paddingLeft: '32px', width: '100%', fontSize: '0.8rem' }}
          />
        </div>

        {/* Filter Month */}
        <div style={{ position: 'relative', minWidth: '150px' }}>
          <Filter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select 
            value={filterMonth} 
            onChange={e => setFilterMonth(e.target.value)}
            className="doc-form-input"
            style={{ paddingLeft: '32px', fontSize: '0.8rem', width: '100%' }}
          >
            <option value="">All Payroll Months</option>
            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Ledger Table Container */}
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
                <th style={{ padding: '0.85rem 1rem' }}>Employee Details</th>
                <th style={{ padding: '0.85rem 1rem' }}>Pay Period</th>
                <th style={{ padding: '0.85rem 1rem' }}>Gross Pay</th>
                <th style={{ padding: '0.85rem 1rem' }}>Deductions</th>
                <th style={{ padding: '0.85rem 1rem' }}>Net Take-Home</th>
                <th style={{ padding: '0.85rem 1rem' }}>Logged On</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(record => {
                const totalDeductions = (record.providentFund || 0) + (record.professionalTax || 0) + (record.incomeTax || 0) + (record.esi || 0);
                const grossVal = record.basicSalary + record.hra + record.conveyanceAllowance + record.specialAllowance;
                const netVal = grossVal - totalDeductions;
                
                return (
                  <tr key={record.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{record.employeeName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{record.employeeId} • {record.designation}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {record.monthYear}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)' }}>
                      {formatCurrency(grossVal)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--danger)', fontSize: '0.75rem' }}>
                      {formatCurrency(totalDeductions)}
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        (PF: {record.providentFund} • TDS: {record.incomeTax})
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: 'var(--success)' }}>
                      {formatCurrency(netVal)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {record.timestamp || 'N/A'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => onLoadRecord(record)}
                          className="btn-action-outline"
                          style={{ padding: '0.4rem', borderRadius: '4px' }}
                          title="Load/Re-Print Slip"
                        >
                          <Printer size={12} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => onDeleteRecord(record.id)}
                          className="btn-action-outline btn-action-danger"
                          style={{ padding: '0.4rem', borderRadius: '4px' }}
                          title="Delete Record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldAlert size={24} style={{ opacity: 0.5 }} />
                      <span>No payroll slip records match your filter criteria.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
