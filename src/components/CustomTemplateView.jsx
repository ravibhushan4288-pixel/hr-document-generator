import React from 'react';
import DocumentWrapper from './DocumentWrapper';

export default function CustomTemplateView({
  name,
  body,
  fieldValues,
  customLogo,
  customSignature,
  companyName,
  companyLocation,
  logoSize,
  logoX,
  logoY,
  template,
  onChangeLogoPosition,
}) {
  // Replace placeholders with field values in the body text
  let renderedText = body || '';
  
  // Find placeholders
  const regex = /\{\{\s*(.*?)\s*\}\}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(body || '')) !== null) {
    const placeholder = match[1].trim();
    if (!matches.includes(placeholder)) {
      matches.push(placeholder);
    }
  }

  // Helper to split paragraph by {{placeholders}} and render text + clickable pills
  const renderFormattedBody = () => {
    if (!body) return null;
    
    const paragraphs = body.split('\n');
    
    return paragraphs.map((para, paraIdx) => {
      if (para.trim() === '') {
        return <div key={paraIdx} style={{ height: '0.8rem' }} />;
      }
      
      // Split by placeholders, keeping the matching group in the result
      const parts = para.split(/(\{\{\s*.*?\s*\}\})/g);
      
      return (
        <p key={paraIdx} className="a4-paragraph" style={{ margin: '0 0 0.8rem 0', textAlign: 'justify' }}>
          {parts.map((part, partIdx) => {
            const match = part.match(/\{\{\s*(.*?)\s*\}\}/);
            if (match) {
              const placeholder = match[1].trim();
              const val = fieldValues[placeholder] !== undefined && fieldValues[placeholder] !== '' 
                ? fieldValues[placeholder] 
                : `[${placeholder}]`;
              const inputId = `input-custom-${placeholder.replace(/\s+/g, '-')}`;
              
              return (
                <span 
                  key={partIdx} 
                  className="a4-interactive-pill" 
                  onClick={() => window.focusInput && window.focusInput(inputId)}
                  title={`Click to edit ${placeholder}`}
                >
                  {val}
                </span>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

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
        <div className="a4-document-title">
          {name || 'Custom Document'}
        </div>

        <div style={{ marginTop: '24px', lineHeight: '1.6', fontSize: '11px', color: '#1e293b' }}>
          {renderFormattedBody()}
        </div>
      </DocumentWrapper>
    </div>
  );
}

