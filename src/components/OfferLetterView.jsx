import React from 'react';
import { formatSalaryInWords } from '../lib/numberToWords';
import DocumentWrapper from './DocumentWrapper';

export default function OfferLetterView({ data, customLogo, customSignature, companyName, companyLocation, logoSize, logoX, logoY, template, onChangeLogoPosition }) {
  const monthlySalary = Number(data.monthlySalary) || 0;
  const annualSalary = Number(data.annualSalary) || (monthlySalary * 12);
  const basicMonthly = Math.round(monthlySalary * 0.50);
  const hraMonthly = Math.round(basicMonthly * 0.40);
  const conveyanceMonthly = monthlySalary > 15000 ? 1600 : 0;
  const specialMonthly = Math.max(0, monthlySalary - (basicMonthly + hraMonthly + conveyanceMonthly));
  const pfMonthly = monthlySalary > 15000 ? Math.min(1800, Math.round(basicMonthly * 0.12)) : 0;
  const ptMonthly = monthlySalary > 15000 ? 200 : 0;
  const netMonthly = monthlySalary - (pfMonthly + ptMonthly);

  const basicAnnual = basicMonthly * 12;
  const hraAnnual = hraMonthly * 12;
  const conveyanceAnnual = conveyanceMonthly * 12;
  const specialAnnual = specialMonthly * 12;
  const pfAnnual = pfMonthly * 12;
  const ptAnnual = ptMonthly * 12;
  const netAnnual = netMonthly * 12;

  const formattedMonthly = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(monthlySalary);

  const formattedAnnual = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(annualSalary);

  const monthlyWords = formatSalaryInWords(monthlySalary);
  const annualWords = formatSalaryInWords(annualSalary);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };


  const parsePlaceholders = (text) => {
    if (!text) return '';
    return text
      .replace(/\{\{candidateName\}\}/gi, data.candidateName || '[Candidate Name]')
      .replace(/\{\{candidateAddress\}\}/gi, data.candidateAddress || '[Candidate Address]')
      .replace(/\{\{position\}\}/gi, data.position || '[Position]')
      .replace(/\{\{monthlySalary\}\}/gi, formattedMonthly)
      .replace(/\{\{annualSalary\}\}/gi, formattedAnnual)
      .replace(/\{\{monthlyWords\}\}/gi, monthlyWords)
      .replace(/\{\{annualWords\}\}/gi, annualWords)
      .replace(/\{\{incentives\}\}/gi, data.incentives || '[Incentives Details]')
      .replace(/\{\{probationPeriod\}\}/gi, data.probationPeriod || '[Probation Period]')
      .replace(/\{\{joiningDate\}\}/gi, data.joiningDate || '[Joining Date]')
      .replace(/\{\{workingHours\}\}/gi, data.workingHours || '[Working Hours]')
      .replace(/\{\{reportingManager\}\}/gi, data.reportingManager || '[Reporting Manager]')
      .replace(/\{\{date\}\}/gi, data.date || '[Date]')
      .replace(/\{\{companyName\}\}/gi, companyName)
      .replace(/\{\{companyLocation\}\}/gi, companyLocation)
      .replace(/\{\{signeeName\}\}/gi, data.signeeName || '[Signee Name]')
      .replace(/\{\{signeeTitle\}\}/gi, data.signeeTitle || '[Signee Title]');
  };

  if (data.customBodyText) {
    const pages = data.customBodyText.split('<!-- pagebreak -->');
    return (
      <div className="preview-document-container">
        {pages.map((pageText, index) => {
          const paragraphs = pageText.split('\n').map(p => p.trim()).filter(p => p !== '');
          const isFirstPage = index === 0;
          const isLastPage = index === pages.length - 1;
          
          return (
            <React.Fragment key={index}>
              <DocumentWrapper 
                pageNumber={index + 1} 
                totalPages={pages.length} 
                showLogo={isFirstPage} 
                customLogo={customLogo} 
                companyName={companyName} 
                companyLocation={companyLocation} 
                logoSize={logoSize} 
                logoX={logoX} 
                logoY={logoY} 
                template={template} 
                onChangeLogoPosition={onChangeLogoPosition}
              >
                {isFirstPage && (
                  <div className="a4-document-title">
                    Employment Letter
                  </div>
                )}
                
                {isFirstPage && (
                  <div className="a4-meta-info" style={{ marginBottom: '20px' }}>
                    <div>
                      <strong>Date:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-date')} title="Edit Letter Date">{data.date || '[Date]'}</span>
                    </div>
                    <div className="text-right">
                      <strong>Company Name:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName || '[Company Name]'}</span><br />
                      <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-location')} title="Edit Company Address">{companyLocation || '[Company Address]'}</span>
                    </div>
                  </div>
                )}

                {isFirstPage && (
                  <div className="a4-salutation" style={{ marginBottom: '15px' }}>
                    Dear <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-candidateName')} title="Edit Candidate Name">{data.candidateName || '[Candidate Name]'}</strong>,
                  </div>
                )}

                {paragraphs.map((p, pIdx) => {
                  const parsed = parsePlaceholders(p);
                  if (parsed.startsWith('-') || parsed.startsWith('*')) {
                    return (
                      <ul key={pIdx} className="a4-bullet-list" style={{ margin: '4px 0 4px 15px' }}>
                        <li>{parsed.substring(1).trim()}</li>
                      </ul>
                    );
                  }
                  return (
                    <p key={pIdx} className="a4-paragraph" style={{ marginBottom: '12px' }}>
                      {parsed}
                    </p>
                  );
                })}

                {isLastPage && (
                  <>
                    <div className="a4-signature-block" style={{ marginTop: '24px' }}>
                      <p style={{ marginBottom: '8px' }}>Yours sincerely,</p>
                      <div className="a4-signature-ink">
                        {customSignature ? (
                          <img src={customSignature} className="a4-uploaded-signature" alt="Signature" />
                        ) : (
                          <svg className="a4-signature-svg" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 25C15 22 25 10 27 12C29 14 25 32 30 30C35 28 38 18 42 20C46 22 43 32 47 30C51 28 55 18 58 18C61 18 62 25 65 24C68 23 72 15 75 18C78 21 72 32 82 25" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                      <p className="a4-signature-name"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-signeeName')} title="Edit Signee Name">{data.signeeName || '[Signee Name]'}</span></p>
                      <p className="a4-signature-title"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-signeeTitle')} title="Edit Signee Title">{data.signeeTitle || '[Signee Title]'}</span></p>
                      <p className="a4-signature-company"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</span></p>
                    </div>

                    <div className="a4-acceptance-panel" style={{ marginTop: '20px' }}>
                      <h4 className="a4-acceptance-heading">
                        Employee Acceptance
                      </h4>
                      <p className="a4-acceptance-statement">
                        I, <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-candidateName')} title="Edit Candidate Name">{data.candidateName || '[Candidate Name]'}</strong>, accept the terms and conditions outlined in this offer letter.
                      </p>

                      <div className="a4-acceptance-grid">
                        <div className="a4-acceptance-field">
                          <span className="a4-field-label">Employee Signature:</span>
                        </div>
                        <div className="a4-acceptance-field">
                          <span className="a4-field-label">Date:</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </DocumentWrapper>
              {index < pages.length - 1 && <div className="print-page-break" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="preview-document-container">
      {/* ─── PAGE 1 ─── */}
      <DocumentWrapper pageNumber={1} totalPages={3} showLogo={true} customLogo={customLogo} companyName={companyName} companyLocation={companyLocation} logoSize={logoSize} logoX={logoX} logoY={logoY} template={template} onChangeLogoPosition={onChangeLogoPosition}>
        <div className="a4-document-title">
          Employment Offer Letter
        </div>

        <div className="a4-meta-info">
          <div>
            <strong>Date:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-date')} title="Edit Letter Date">{data.date || '[Date]'}</span>
          </div>
          <div className="text-right">
            <strong>Company Name:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName || '[Company Name]'}</span><br />
            <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-location')} title="Edit Company Address">{companyLocation || '[Company Address]'}</span>
          </div>
        </div>

        <div className="a4-salutation">
          Dear <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-candidateName')} title="Edit Candidate Name">{data.candidateName || '[Candidate Name]'}</strong>,
        </div>

        <div className="a4-subject">
          Subject: Offer of Employment for the Position of <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-position')} title="Edit Position">{data.position || '[Position]'}</span>
        </div>

        <p className="a4-paragraph">
          We are pleased to offer you employment with <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName || '[Company Name]'}</strong>. We have been impressed by your skills, experience, and professional background, and we believe you will be a valuable addition to our team.
        </p>

        <h3 className="a4-section-heading">
          1. Position and Scope of Work
        </h3>
        <p className="a4-paragraph">
          You will be appointed to the position of <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-position')} title="Edit Position">{data.position || '[Position]'}</strong>. Your initial reporting structure will place you under the direction of <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-reportingManager')} title="Edit Manager">{data.reportingManager || '[Reporting Manager]'}</span>. Your duties and responsibilities will correspond to this role and will include any other related tasks assigned by the Management.
        </p>

        <h3 className="a4-section-heading">
          2. Commencement of Employment
        </h3>
        <p className="a4-paragraph">
          Your employment will officially commence on <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-joiningDate')} title="Edit Joining Date">{data.joiningDate || '[Joining Date]'}</strong>. Please ensure that all onboarding paperwork and the documentation requested in Section 10 are submitted on or before this date.
        </p>

        <h3 className="a4-section-heading">
          3. Probation and Confirmation
        </h3>
        <p className="a4-paragraph">
          You will be on probation for a period of <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-probationPeriod')} title="Edit Probation Period">{data.probationPeriod || '[Probation Period]'}</span> from your date of joining. Upon successful completion of your probation, and subject to a satisfactory performance review, your employment will be confirmed in writing. The Company reserves the right to extend the probation period if deemed necessary.
        </p>

        <h3 className="a4-section-heading">
          4. Working Hours and Schedule
        </h3>
        <p className="a4-paragraph">
          Your standard working hours will be <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-workingHours')} title="Edit Working Hours">{data.workingHours || '[Working Hours]'}</span>. Due to client commitments or business needs, the Company may adjust your shift timings or work schedule as necessary.
        </p>
      </DocumentWrapper>

      {/* PAGE BREAK FOR PRINT */}
      <div className="print-page-break" />

      {/* ─── PAGE 2 ─── */}
      <DocumentWrapper pageNumber={2} totalPages={3} showLogo={false} customLogo={customLogo} companyName={companyName} companyLocation={companyLocation} logoSize={logoSize} logoX={logoX} logoY={logoY} template={template}>
        <h3 className="a4-section-heading" style={{ marginTop: 0 }}>
          5. Compensation Structure (Schedule A)
        </h3>
        <p className="a4-paragraph" style={{ marginBottom: '8px' }}>
          Your gross salary details are set out in the table below. Salary payments are processed monthly and credited directly to your bank account during the first week of the following calendar month.
        </p>

        {/* Schedule A Table */}
        <table className="salary-breakdown-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Salary Components</th>
              <th style={{ textAlign: 'right', width: '25%' }}>Monthly Amount (INR)</th>
              <th style={{ textAlign: 'right', width: '25%' }}>Annual Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary (50% of CTC)</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(basicMonthly)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(basicAnnual)}</td>
            </tr>
            <tr>
              <td>House Rent Allowance (HRA) (40% of Basic)</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(hraMonthly)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(hraAnnual)}</td>
            </tr>
            <tr>
              <td>Conveyance Allowance</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(conveyanceMonthly)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(conveyanceAnnual)}</td>
            </tr>
            <tr>
              <td>Special Allowance</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(specialMonthly)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(specialAnnual)}</td>
            </tr>
            <tr style={{ fontWeight: '700', backgroundColor: '#f8fafc' }}>
              <td>Gross CTC (CTC)</td>
              <td style={{ textAlign: 'right', color: '#1e40af' }}>{formattedMonthly}</td>
              <td style={{ textAlign: 'right', color: '#1e40af' }}>{formattedAnnual}</td>
            </tr>
            <tr>
              <td>Less: Employee Provident Fund (PF)</td>
              <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(pfMonthly)}</td>
              <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(pfAnnual)}</td>
            </tr>
            <tr>
              <td>Less: Professional Tax (PT)</td>
              <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(ptMonthly)}</td>
              <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(ptAnnual)}</td>
            </tr>
            <tr className="salary-table-totals" style={{ fontWeight: '700', fontSize: '11px', borderTop: '2px solid #cbd5e1' }}>
              <td>Estimated Net Take-Home (pre-tax)</td>
              <td style={{ textAlign: 'right', color: '#10b981' }}>{formatCurrency(netMonthly)}</td>
              <td style={{ textAlign: 'right', color: '#10b981' }}>{formatCurrency(netAnnual)}</td>
            </tr>
          </tbody>
        </table>

        <p className="a4-paragraph" style={{ fontSize: '11px', color: '#64748b', marginTop: '-8px', marginBottom: '12px' }}>
          * Deductions for Income Tax (TDS) will be calculated based on your personal investment choices and declarations under prevailing tax laws.
        </p>

        <h3 className="a4-section-heading">
          6. Confidentiality and NDA
        </h3>
        <p className="a4-paragraph">
          You shall maintain strict confidentiality regarding all Company proprietary information, clients, source codes, business structures, trade secrets, and financial details. You agree to sign the Company's standard Non-Disclosure Agreement (NDA) on or before your date of joining.
        </p>

        <h3 className="a4-section-heading">
          7. Intellectual Property Rights (IPR)
        </h3>
        <p className="a4-paragraph">
          All materials, processes, inventions, code repositories, design guidelines, and products created or optimized by you during the tenure of your employment shall remain the sole and exclusive property of the Company.
        </p>

        <h3 className="a4-section-heading">
          8. Non-Solicitation Agreement
        </h3>
        <p className="a4-paragraph">
          During your employment and for a period of six (6) months following the termination of your employment, you shall not recruit, solicit, or attempt to hire any employee, developer, or contractor of the Company for a competing business.
        </p>
      </DocumentWrapper>

      {/* PAGE BREAK FOR PRINT */}
      <div className="print-page-break" />

      {/* ─── PAGE 3 ─── */}
      <DocumentWrapper pageNumber={3} totalPages={3} showLogo={false} customLogo={customLogo} companyName={companyName} companyLocation={companyLocation} logoSize={logoSize} logoX={logoX} logoY={logoY} template={template}>
        <h3 className="a4-section-heading" style={{ marginTop: 0 }}>
          9. Notice Period & Termination
        </h3>
        <p className="a4-paragraph">
          Either party may terminate this employment agreement by giving written notice as follows:
        </p>
        <ul className="a4-bullet-list">
          <li><strong>During Probation:</strong> A written notice of seven (7) days or payment of equivalent salary in lieu thereof.</li>
          <li><strong>After Confirmation:</strong> A written notice of thirty (30) days or payment of equivalent salary in lieu thereof.</li>
          <li>The Company reserves the right to terminate your employment immediately, without notice or pay, in cases involving material breach of policy, misconduct, fraud, or violation of NDA.</li>
        </ul>

        <h3 className="a4-section-heading">
          10. Documentation Required on Onboarding
        </h3>
        <p className="a4-paragraph" style={{ marginBottom: '8px' }}>Please submit self-attested copies of the following documents to the HR department:</p>
        <ul className="a4-bullet-list">
          <li>Educational Certificates and Mark sheets (10th, 12th, and Degree).</li>
          <li>Relieving letter and experience certificates from your previous employer.</li>
          <li>Payslips for the last three (3) months of your previous employment.</li>
          <li>Copy of PAN Card, Aadhaar Card, and Passport-size photographs (4 copies).</li>
          <li>Cancelled Cheque or bank statement for payroll registration.</li>
        </ul>

        <p className="a4-paragraph" style={{ marginTop: '16px' }}>
          We welcome you to <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</strong> and look forward to building a highly successful, mutually beneficial relationship together.
        </p>

        <div className="a4-signature-block" style={{ marginTop: '20px' }}>
          <p style={{ marginBottom: '4px' }}>Yours sincerely,</p>
          <div className="a4-signature-ink">
            {customSignature ? (
              <img src={customSignature} className="a4-uploaded-signature" alt="Signature" />
            ) : (
              <svg className="a4-signature-svg" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 25C15 22 25 10 27 12C29 14 25 32 30 30C35 28 38 18 42 20C46 22 43 32 47 30C51 28 55 18 58 18C61 18 62 25 65 24C68 23 72 15 75 18C78 21 72 32 82 25" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <p className="a4-signature-name"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-signeeName')} title="Edit Signee Name">{data.signeeName || '[Signee Name]'}</span></p>
          <p className="a4-signature-title"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-signeeTitle')} title="Edit Signee Title">{data.signeeTitle || '[Signee Title]'}</span></p>
          <p className="a4-signature-company"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</span></p>
        </div>

        <div className="a4-acceptance-panel" style={{ marginTop: '16px' }}>
          <h4 className="a4-acceptance-heading" style={{ margin: 0, paddingBottom: '4px' }}>
            Employee Acceptance and Declaration
          </h4>
          <p className="a4-acceptance-statement" style={{ margin: 0, paddingBottom: '10px' }}>
            I, <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-candidateName')} title="Edit Candidate Name">{data.candidateName || '[Candidate Name]'}</strong>, hereby accept the terms and conditions outlined in this offer letter, and confirm that I will report for duty on <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-joiningDate')} title="Edit Joining Date">{data.joiningDate || '[Joining Date]'}</strong>.
          </p>

          <div className="a4-acceptance-grid">
            <div className="a4-acceptance-field">
              <span className="a4-field-label">Full Legal Name (Print):</span>
              <span className="a4-field-value"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-offer-candidateName')} title="Edit Candidate Name">{data.candidateName || '[Candidate Name]'}</span></span>
            </div>
            <div className="a4-acceptance-field">
              <span className="a4-field-label">Signature:</span>
            </div>
            <div className="a4-acceptance-field">
              <span className="a4-field-label">Date:</span>
            </div>
          </div>
        </div>
      </DocumentWrapper>
    </div>
  );
}

