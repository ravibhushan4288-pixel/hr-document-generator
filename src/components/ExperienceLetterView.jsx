import React from 'react';
import DocumentWrapper from './DocumentWrapper';

export default function ExperienceLetterView({ data, customLogo, customSignature, companyName, companyLocation, logoSize, logoX, logoY, template, onChangeLogoPosition }) {
  const parsePlaceholders = (text) => {
    if (!text) return '';
    return text
      .replace(/\{\{employeeName\}\}/gi, data.employeeName || '[Employee Name]')
      .replace(/\{\{position\}\}/gi, data.position || '[Position]')
      .replace(/\{\{joiningDate\}\}/gi, data.joiningDate || '[Joining Date]')
      .replace(/\{\{leavingDate\}\}/gi, data.leavingDate || '[Leaving Date]')
      .replace(/\{\{keyResponsibilities\}\}/gi, data.keyResponsibilities || '[Key Responsibilities]')
      .replace(/\{\{performanceDescription\}\}/gi, data.performanceDescription || '[Performance Description]')
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
                className="experience-certificate-page"
              >
                {isFirstPage && (
                  <div className="a4-document-title">
                    TO WHOMSOEVER IT MAY CONCERN
                  </div>
                )}
                
                {isFirstPage && (
                  <div className="a4-meta-info" style={{ marginBottom: '20px' }}>
                    <div>
                      <strong>Date:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-date')} title="Edit Letter Date">{data.date || '[Date]'}</span>
                    </div>
                    <div className="text-right">
                      <strong>Company Name:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName || '[Company Name]'}</span><br />
                      <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-location')} title="Edit Company Address">{companyLocation || '[Company Address]'}</span>
                    </div>
                  </div>
                )}

                {isFirstPage && (
                  <div className="a4-document-subtitle-underlined" style={{ marginBottom: '15px' }}>
                    Service & Experience Certificate
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
                    <p key={pIdx} className="a4-paragraph" style={{ marginBottom: '12px', textAlign: 'justify' }}>
                      {parsed}
                    </p>
                  );
                })}

                {isLastPage && (
                  <div className="a4-signature-block" style={{ marginTop: '48px' }}>
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
                    <p className="a4-signature-name"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-signeeName')} title="Edit Signee Name">{data.signeeName || '[Signee Name]'}</span></p>
                    <p className="a4-signature-title"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-signeeTitle')} title="Edit Signee Title">{data.signeeTitle || '[Signee Title]'}</span></p>
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
        className="experience-certificate-page"
      >
        <div className="a4-document-title" style={{ marginTop: '10px', fontSize: '18px', letterSpacing: '0.08em' }}>
          TO WHOMSOEVER IT MAY CONCERN
        </div>

        <div className="a4-meta-info" style={{ marginBottom: '15px' }}>
          <div>
            <strong>Date:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-date')} title="Edit Letter Date">{data.date || '[Date]'}</span>
          </div>
          <div className="text-right">
            <strong>Company Name:</strong> <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName || '[Company Name]'}</span><br />
            <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-location')} title="Edit Company Address">{companyLocation || '[Company Address]'}</span>
          </div>
        </div>

        <div className="a4-document-subtitle-underlined" style={{ textDecoration: 'none', borderBottom: '2px double #cbd5e1', paddingBottom: '6px', fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>
          Certificate of Experience & Service
        </div>

        <div className="a4-letter-body" style={{ textAlign: 'justify', fontSize: '13px', lineHeight: '1.65' }}>
          <p className="a4-paragraph" style={{ marginBottom: '16px' }}>
            This is to certify that <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-employeeName')} title="Edit Employee Name">{data.employeeName || '[Employee Name]'}</strong> was employed with <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</strong> as a <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-position')} title="Edit Designation">{data.position || '[Designation]'}</strong>. Their official tenure of service was from <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-joiningDate')} title="Edit Joining Date">{data.joiningDate || '[Joining Date]'}</strong> to <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-leavingDate')} title="Edit Leaving Date">{data.leavingDate || '[Leaving Date]'}</strong>.
          </p>

          <p className="a4-paragraph" style={{ marginBottom: '8px' }}>
            During their tenure, they were responsible for handling critical projects and operations, which included:
          </p>
          
          <div className="a4-responsibilities-box" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px 16px', margin: '12px 0 16px 0', fontSize: '12px', fontStyle: 'normal', color: '#334155' }}>
            <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-keyResponsibilities')} title="Edit Responsibilities" style={{ display: 'block', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
              {data.keyResponsibilities || '[Key Responsibilities]'}
            </span>
          </div>

          <p className="a4-paragraph" style={{ marginBottom: '16px' }}>
            <span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-performanceDescription')} title="Edit Performance Description" style={{ display: 'block' }}>
              {data.performanceDescription || '[Performance Description]'}
            </span>
          </p>

          <p className="a4-paragraph" style={{ marginBottom: '16px' }}>
            Throughout their service with us, we found them to be highly dedicated, cooperative, and target-driven. They demonstrated professional excellence and maintained exemplary relationships with colleagues, management, and clients alike.
          </p>

          <p className="a4-paragraph" style={{ marginBottom: '24px' }}>
            We sincerely appreciate their services and valuable contributions to <strong className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</strong>, and we wish them the absolute best in all their future professional endeavors.
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
          <p className="a4-signature-name"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-signeeName')} title="Edit Signee Name">{data.signeeName || '[Signee Name]'}</span></p>
          <p className="a4-signature-title"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-experience-signeeTitle')} title="Edit Signee Title">{data.signeeTitle || '[Signee Title]'}</span></p>
          <p className="a4-signature-company"><span className="a4-interactive-pill" onClick={() => window.focusInput?.('input-company-name')} title="Edit Company Name">{companyName}</span></p>
        </div>
      </DocumentWrapper>
    </div>
  );
}
