import React from 'react';
import DocumentWrapper from './DocumentWrapper';

export default function TerminationLetterView({ data, customLogo, customSignature, companyName, companyLocation, logoSize, logoX, logoY, template, onChangeLogoPosition }) {
  const parsePlaceholders = (text) => {
    if (!text) return '';
    return text
      .replace(/\{\{employeeName\}\}/gi, data.employeeName || '[Employee Name]')
      .replace(/\{\{employeeAddress\}\}/gi, data.employeeAddress || '[Employee Address]')
      .replace(/\{\{position\}\}/gi, data.position || '[Position]')
      .replace(/\{\{terminationDate\}\}/gi, data.terminationDate || '[Effective Date]')
      .replace(/\{\{reason\}\}/gi, data.reason || '[Reason for separation]')
      .replace(/\{\{noticePeriod\}\}/gi, data.noticePeriod || '[Notice Period]')
      .replace(/\{\{lastWorkingDate\}\}/gi, data.lastWorkingDate || '[Last Working Day]')
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
                    Letter of Termination
                  </div>
                )}
                
                {isFirstPage && (
                  <div className="a4-meta-info" style={{ marginBottom: '20px' }}>
                    <div>
                      <strong>Date:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-date')} title="Edit Letter Date">{data.date || '[Date]'}</span>
                    </div>
                    <div className="text-right">
                      <strong>Company Name:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName || '[Company Name]'}</span><br />
                      <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-location')} title="Edit Company Address">{companyLocation || '[Company Address]'}</span>
                    </div>
                  </div>
                )}

                {isFirstPage && (
                  <div className="a4-salutation" style={{ marginBottom: '15px' }}>
                    Dear <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-employeeName')} title="Edit Employee Name">{data.employeeName || '[Employee Name]'}</span>,
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
                  <div className="a4-signature-block" style={{ marginTop: '36px' }}>
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
                    <p className="a4-signature-name"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-signeeName')} title="Edit Signee Name">{data.signeeName || '[Signee Name]'}</span></p>
                    <p className="a4-signature-title"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-signeeTitle')} title="Edit Signee Title">{data.signeeTitle || '[Signee Title]'}</span></p>
                    <p className="a4-signature-company"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</span></p>
                  </div>
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
      <DocumentWrapper pageNumber={1} totalPages={1} showLogo={true} customLogo={customLogo} companyName={companyName} companyLocation={companyLocation} logoSize={logoSize} logoX={logoX} logoY={logoY} template={template} onChangeLogoPosition={onChangeLogoPosition}>
        <div className="a4-document-title">
          Letter of Separation
        </div>

        <div className="a4-meta-info">
          <div>
            <strong>Date:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-date')} title="Edit Letter Date">{data.date || '[Date]'}</span>
          </div>
          <div className="text-right">
            <strong>Company Name:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName || '[Company Name]'}</span><br />
            <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-location')} title="Edit Company Address">{companyLocation || '[Company Address]'}</span>
          </div>
        </div>

        <div className="a4-salutation" style={{ marginBottom: '20px' }}>
          <strong style={{ display: 'block', fontSize: '14px' }} className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-employeeName')} title="Edit Employee Name">{data.employeeName || '[Employee Name]'}</strong>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px', whiteSpace: 'pre-line', fontStyle: 'normal', fontWeight: '400' }} className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-employeeAddress')} title="Edit Employee Address">
            {data.employeeAddress || '[Employee Address]'}
          </span>
        </div>

        <div className="a4-subject" style={{ color: '#ef4444', borderLeftColor: '#ef4444', marginBottom: '16px' }}>
          Subject: Notice of Separation & Termination of Employment
        </div>

        <div className="a4-letter-body" style={{ fontSize: '12.5px', lineHeight: '1.6' }}>
          <p className="a4-paragraph" style={{ marginBottom: '12px' }}>
            Dear <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-employeeName')} title="Edit Employee Name">{data.employeeName || '[Employee Name]'}</span>,
          </p>

          <p className="a4-paragraph" style={{ marginBottom: '12px' }}>
            We regret to inform you that your employment with <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</strong> as <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-position')} title="Edit Designation">{data.position || '[Designation]'}</strong> is being terminated, effective <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-terminationDate')} title="Edit Effective Date">{data.terminationDate || '[Effective Date]'}</strong>.
          </p>

          <p className="a4-paragraph" style={{ marginBottom: '12px' }}>
            This action follows careful management reviews and is due to <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-reason')} title="Edit Reason">{data.reason || '[Reason for separation]'}</strong>. This separation is executed in full accordance with the notice provisions set forth in your employment agreement.
          </p>

          <p className="a4-paragraph" style={{ marginBottom: '12px' }}>
            As per your contract, you are required to serve a notice period of <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-noticePeriod')} title="Edit Notice Period">{data.noticePeriod || '[Notice Period]'}</strong>. Accordingly, your last working day with the Company will be <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-lastWorkingDate')} title="Edit Last Working Day">{data.lastWorkingDate || '[Last Working Day]'}</strong>.
          </p>

          <p className="a4-paragraph" style={{ marginBottom: '12px' }}>
            During the notice period, you are required to ensure a complete and orderly handover of all ongoing projects, keys, data credentials, and operational responsibilities to your team lead. Furthermore, please return all company-owned assets (including laptops, charger, ID cards, access keys, and files) in your possession on or before your last working day.
          </p>

          <p className="a4-paragraph" style={{ marginBottom: '12px' }}>
            Your Full and Final (F&F) settlement account, including any accrued salary, unpaid allowances, and compensation for unused leaves, will be calculated and processed within thirty (30) days from your last working date, subject to complete clearance and "No Dues" confirmation from all internal departments.
          </p>

          <p className="a4-paragraph" style={{ marginBottom: '16px' }}>
            Please be reminded that your post-employment confidentiality obligations and non-solicitation covenants as outlined in your employment agreement remain fully in force. We thank you for your service and wish you the best in your future career endeavors.
          </p>
        </div>

        <div className="a4-signature-block" style={{ marginTop: '24px' }}>
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
          <p className="a4-signature-name"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-signeeName')} title="Edit Signee Name">{data.signeeName || '[Signee Name]'}</span></p>
          <p className="a4-signature-title"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-termination-signeeTitle')} title="Edit Signee Title">{data.signeeTitle || '[Signee Title]'}</span></p>
          <p className="a4-signature-company"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</span></p>
        </div>
      </DocumentWrapper>
    </div>
  );
}
