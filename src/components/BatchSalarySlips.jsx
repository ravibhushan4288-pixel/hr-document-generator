import React from 'react';
import SalarySlipView from './SalarySlipView';

export default function BatchSalarySlips({ batchData, customLogo, customSignature, companyName, companyLocation, logoSize, logoX, logoY, template, divRef, onChangeLogoPosition }) {
  if (!batchData || batchData.length === 0) {
    return (
      <div className="doc-preview-viewport">
        <div className="a4-page template-corporate" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Select employees from the left to preview batch salary slips.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-preview-viewport" ref={divRef}>
      {batchData.map((data, index) => (
        <React.Fragment key={data.employeeId || index}>
          <SalarySlipView 
            data={data} 
            customLogo={customLogo} 
            customSignature={customSignature} 
            companyName={companyName} 
            companyLocation={companyLocation} 
            logoSize={logoSize} 
            logoX={logoX} 
            logoY={logoY} 
            template={template} 
            onChangeLogoPosition={onChangeLogoPosition}
          />
          {index < batchData.length - 1 && <div className="print-page-break"></div>}
        </React.Fragment>
      ))}
    </div>
  );
}
