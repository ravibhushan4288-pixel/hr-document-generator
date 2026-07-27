import React from 'react';

export default function DocumentWrapper({
  children,
  pageNumber,
  totalPages,
  showLogo = false,
  customLogo = null,
  companyName = "Lumina Workforce Private Limited",
  companyLocation = "4th Floor, Unit No 405-411, Bizeness Square, Madhapur, Shaikpet, Hyderabad - 500081",
  logoSize = 60,
  logoX = 0,
  logoY = 10,
  template = 'corporate',
  onChangeLogoPosition,
  className = '',
}) {
  const templateClass = template === 'minimal' ? 'template-minimal' : template === 'executive' ? 'template-executive' : '';
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseDown = (e) => {
    if (!onChangeLogoPosition) return;
    if (e.button !== 0) return; // Only drag with left click
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = logoX;
    const initialY = logoY;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const nextX = Math.max(0, Math.min(480, initialX + deltaX));
      const nextY = Math.max(-20, Math.min(250, initialY + deltaY));

      onChangeMouseMove(nextX, nextY);
    };

    const onChangeMouseMove = (nextX, nextY) => {
      onChangeLogoPosition(nextX, nextY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    if (!onChangeLogoPosition) return;
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const initialX = logoX;
    const initialY = logoY;

    const handleTouchMove = (moveEvent) => {
      if (moveEvent.touches.length === 0) return;
      const currentTouch = moveEvent.touches[0];
      const deltaX = currentTouch.clientX - startX;
      const deltaY = currentTouch.clientY - startY;

      const nextX = Math.max(0, Math.min(480, initialX + deltaX));
      const nextY = Math.max(-20, Math.min(250, initialY + deltaY));

      onChangeLogoPosition(nextX, nextY);
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <div className={`a4-page ${templateClass} ${className}`} id={`page-${pageNumber}`}>
      {/* Thick vertical bars on left and right margins */}
      <div className="a4-border-left" />
      <div className="a4-border-right" />

      <div className="a4-content">
        {/* Header containing Logo (usually on the first page) */}
        {showLogo ? (
          <div 
            className="a4-header-logo-container" 
            style={{ 
              position: 'relative',
              height: `${Math.max(60, logoSize)}px`,
              marginBottom: '1.5rem',
              width: '100%'
            }}
          >
            <div 
              className={onChangeLogoPosition ? "a4-draggable-logo" : ""}
              onMouseEnter={() => onChangeLogoPosition && setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{
                position: 'absolute',
                left: `${logoX}px`,
                top: `${logoY}px`,
              }}
            >
              {isHovered && onChangeLogoPosition && (
                <div className="logo-drag-tooltip no-print">
                  Drag to reposition
                </div>
              )}

              {customLogo ? (
                <img 
                  src={customLogo} 
                  alt="Logo" 
                  className="a4-uploaded-logo" 
                  style={{ 
                    height: `${logoSize}px`, 
                    maxHeight: `${logoSize}px` 
                  }} 
                />
              ) : (
                <div className="a4-logo-flex">
                  {/* High-fidelity recreation of the Lumina Workforce logo */}
                  <svg className="a4-logo-svg" viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* L character - Tilted Blue stroke */}
                    <path 
                      d="M15 10L30 38C31 40 33 42 36 42H48" 
                      stroke="#1e40af" 
                      strokeWidth="7" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    {/* W character - Gray stroke, interlocking */}
                    <path 
                      d="M40 18L48 42L56 26L64 42L72 18" 
                      stroke="#475569" 
                      strokeWidth="5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    {/* Visual accent - small dot */}
                    <circle cx="56" cy="18" r="3.5" fill="#1e40af" />
                  </svg>
                  
                  <div className="a4-logo-text-border">
                    <span className="a4-logo-title">
                      Lumina
                    </span>
                    <span className="a4-logo-subtitle">
                      Workforce
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Spacing helper for secondary pages to match margins */
          <div className="a4-header-spacing" />
        )}

        {/* Content Body */}
        <div className="a4-body">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="a4-footer">
        <div className="a4-footer-line" />
        <div className="a4-footer-flex">
          <div className="a4-footer-address">
            <span className="a4-company-name">{companyName}</span>
            <span>{companyLocation}</span>
          </div>
          <div className="a4-footer-page">
            Page {pageNumber} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  );
}
