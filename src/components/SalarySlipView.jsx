import React from 'react';
import { formatSalaryInWords } from '../lib/numberToWords';
import DocumentWrapper from './DocumentWrapper';

export default function SalarySlipView({ 
  data, 
  customLogo, 
  customSignature, 
  companyName, 
  companyLocation, 
  logoSize, 
  logoX, 
  logoY, 
  template, 
  onChangeLogoPosition 
}) {
  const currencySymbol = data.currencySymbol || '₹';
  const currencyCode = data.currencyCode || 'INR';

  // Format currency dynamically
  const formatCurrency = (val) => {
    return new Intl.NumberFormat(currencyCode === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Base standard rates (fallback to earned values if standard fields are undefined)
  const stdBasic = data.stdBasicSalary !== undefined ? data.stdBasicSalary : data.basicSalary;
  const stdHra = data.stdHra !== undefined ? data.stdHra : data.hra;
  const stdConveyance = data.stdConveyanceAllowance !== undefined ? data.stdConveyanceAllowance : data.conveyanceAllowance;
  const stdSpecial = data.stdSpecialAllowance !== undefined ? data.stdSpecialAllowance : data.specialAllowance;

  // Custom earnings & deductions
  const customEarnings = data.customEarnings || [];
  const customDeductions = data.customDeductions || [];

  // Totals calculations
  const totalStandardEarnings = stdBasic + stdHra + stdConveyance + stdSpecial + 
    customEarnings.reduce((sum, item) => sum + (Number(item.standard) || 0), 0);

  const totalEarnedEarnings = data.basicSalary + data.hra + data.conveyanceAllowance + data.specialAllowance + 
    customEarnings.reduce((sum, item) => sum + (Number(item.earned) || 0), 0);

  const totalDeductions = data.providentFund + data.professionalTax + data.incomeTax + (data.esi || 0) + 
    customDeductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const netSalary = totalEarnedEarnings - totalDeductions;
  const netSalaryWords = formatSalaryInWords(netSalary, currencyCode);

  // Match rows for Earnings and Deductions columns
  const earningsRows = [
    { label: 'Basic Salary', standard: stdBasic, earned: data.basicSalary },
    { label: 'House Rent Allowance (HRA)', standard: stdHra, earned: data.hra },
    { label: 'Conveyance Allowance', standard: stdConveyance, earned: data.conveyanceAllowance },
    { label: 'Special Allowance', standard: stdSpecial, earned: data.specialAllowance },
    ...customEarnings.map(item => ({ label: item.name, standard: item.standard, earned: item.earned }))
  ];

  const deductionsRows = [
    { label: 'Provident Fund (PF)', amount: data.providentFund },
    { label: 'Professional Tax (PT)', amount: data.professionalTax },
    { label: 'Income Tax / TDS', amount: data.incomeTax },
    ...(data.esi > 0 ? [{ label: 'Employee State Insurance (ESI)', amount: data.esi }] : []),
    ...customDeductions.map(item => ({ label: item.name, amount: item.amount }))
  ];

  // Align table rows by finding the max length
  const maxRows = Math.max(earningsRows.length, deductionsRows.length);
  const tableRows = [];
  for (let i = 0; i < maxRows; i++) {
    tableRows.push({
      earnings: earningsRows[i] || null,
      deductions: deductionsRows[i] || null
    });
  }

  // Determine if compliance data exists to display
  const hasCompliance = data.pan || data.uan || data.esic;

  // Custom accent color passed in data.accentColor (passed down from App config)
  const themeColor = data.accentColor || '#6366f1';

  return (
    <div className="preview-document-container">
      <DocumentWrapper 
        pageNumber={1} 
        totalPages={1} 
        showLogo={true} 
        customLogo={customLogo} 
        companyName={companyName} 
        companyLocation={companyLocation} 
        logoSize={logoSize} 
        logoX={logoX} 
        logoY={logoY} 
        template={template} 
        onChangeLogoPosition={onChangeLogoPosition}
      >
        <div className="a4-document-title" style={{ color: template === 'minimal' ? '#0f172a' : themeColor }}>
          Salary Slip
        </div>

        <div className="a4-document-subtitle" style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
          Pay Slip for the Month of <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-salary-monthYear')} title="Edit Month & Year">{data.monthYear || '[Select Month]'}</span>
        </div>

        {/* Employee Details Grid */}
        <table className="salary-info-table">
          <tbody>
            <tr>
              <td className="salary-info-label">Employee Name</td>
              <td className="salary-info-value">
                <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-salary-employeeName')} title="Edit Employee Name">{data.employeeName || '[Employee Name]'}</span>
              </td>
              <td className="salary-info-label">Employee ID</td>
              <td className="salary-info-value">
                <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-salary-employeeId')} title="Edit Employee ID">{data.employeeId || '[Employee ID]'}</span>
              </td>
            </tr>
            <tr>
              <td className="salary-info-label">Designation</td>
              <td className="salary-info-value">
                <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-salary-designation')} title="Edit Designation">{data.designation || '[Designation]'}</span>
              </td>
              <td className="salary-info-label">Bank Name</td>
              <td className="salary-info-value">
                <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-salary-bankName')} title="Edit Bank Name">{data.bankName || '[Bank Name]'}</span>
              </td>
            </tr>
             <tr>
               <td className="salary-info-label">Account Number</td>
               <td className="salary-info-value">
                 <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-salary-accountNumber')} title="Edit Account Number">{data.accountNumber || '[Account Number]'}</span>
               </td>
               <td className="salary-info-label">Paid Days / LOP</td>
               <td className="salary-info-value">
                 <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-salary-paidDays')} title="Edit Paid Days">{data.paidDays}</span> Days / <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-salary-lopDays')} title="Edit LOP Days">{data.lopDays}</span> LOP
               </td>
             </tr>
             <tr>
               <td className="salary-info-label">Department</td>
               <td className="salary-info-value">{data.department || 'Engineering'}</td>
               <td className="salary-info-label">Date of Joining</td>
               <td className="salary-info-value">{data.joiningDate || '01-JUNE-2023'}</td>
             </tr>
            {hasCompliance && (
              <tr>
                <td className="salary-info-label">PAN Card No</td>
                <td className="salary-info-value" style={{ textTransform: 'uppercase' }}>{data.pan || 'N/A'}</td>
                <td className="salary-info-label">UAN / ESIC No</td>
                <td className="salary-info-value">
                  {data.uan ? `UAN: ${data.uan}` : ''}
                  {data.uan && data.esic ? ' | ' : ''}
                  {data.esic ? `ESIC: ${data.esic}` : ''}
                  {!data.uan && !data.esic ? 'N/A' : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Earnings & Deductions Table */}
        <table className="salary-breakdown-table">
          <thead>
            <tr>
              <th style={{ width: '38%' }}>Earnings</th>
              <th style={{ textAlign: 'right', width: '15%' }}>Standard ({currencySymbol})</th>
              <th style={{ textAlign: 'right', width: '15%' }}>Earned ({currencySymbol})</th>
              <th style={{ width: '20%' }}>Deductions</th>
              <th style={{ textAlign: 'right', width: '12%' }}>Amount ({currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, index) => (
              <tr key={index}>
                {/* Earnings Side */}
                {row.earnings ? (
                  <>
                    <td>{row.earnings.label}</td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>{formatCurrency(row.earnings.standard)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(row.earnings.earned)}</td>
                  </>
                ) : (
                  <>
                    <td></td>
                    <td></td>
                    <td></td>
                  </>
                )}

                {/* Deductions Side */}
                {row.deductions ? (
                  <>
                    <td>{row.deductions.label}</td>
                    <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(row.deductions.amount)}</td>
                  </>
                ) : (
                  <>
                    <td></td>
                    <td></td>
                  </>
                )}
              </tr>
            ))}
            
            {/* Totals */}
            <tr className="salary-table-totals">
              <td>Total Earnings</td>
              <td style={{ textAlign: 'right', color: '#64748b' }}>{formatCurrency(totalStandardEarnings)}</td>
              <td style={{ textAlign: 'right', color: '#10b981' }}>{formatCurrency(totalEarnedEarnings)}</td>
              <td>Total Deductions</td>
              <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(totalDeductions)}</td>
            </tr>
          </tbody>
        </table>

        {/* Net Salary Summary Panel */}
        <div className="salary-net-panel" style={{ borderLeft: `4px solid ${themeColor}` }}>
          <div className="salary-net-flex">
            <span className="salary-net-label">Net Take-Home Salary</span>
            <span className="salary-net-value" style={{ color: template === 'minimal' ? '#0f172a' : themeColor }}>{formatCurrency(netSalary)}</span>
          </div>
          <div className="salary-net-words">
            <strong>Amount in Words:</strong> {netSalaryWords}
          </div>
        </div>

        {/* Signature Panel */}
        <div className="salary-signatures-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2.5rem' }}>
          <div>
            <span className="salary-sig-label">Employee Signature:</span>
            <div className="salary-sig-line" style={{ width: '120px', borderBottom: '1px solid #cbd5e1', height: '35px', marginBottom: '8px' }} />
          </div>

          {/* Secure verification badge in the middle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1.5px dashed rgba(16, 185, 129, 0.4)', padding: '8px 12px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.02)', margin: '0 auto' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 11l3 3L18 8" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>System Verified</span>
              <span style={{ fontSize: '7.5px', color: '#64748b', lineHeight: 1 }}>Authenticated Payroll</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="salary-sig-label" style={{ display: 'block', textAlign: 'right' }}>Authorized Signatory:</span>
            <div className="salary-sig-ink">
              {customSignature ? (
                <img src={customSignature} className="salary-uploaded-signature" alt="Signature" />
              ) : (
                <svg className="a4-signature-svg" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: themeColor }}>
                  <path d="M10 25C15 22 25 10 27 12C29 14 25 32 30 30C35 28 38 18 42 20C46 22 43 32 47 30C51 28 55 18 58 18C61 18 62 25 65 24C68 23 72 15 75 18C78 21 72 32 82 25" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <p className="salary-sig-name">
              <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-salary-signeeName')} title="Edit Signee Name">{data.signeeName || '[Signee Name]'}</span>
            </p>
            <p className="salary-sig-title">
              <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</span>
            </p>
          </div>
        </div>
      </DocumentWrapper>
    </div>
  );
}
