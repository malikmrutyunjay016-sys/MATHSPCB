import React from 'react';

interface CollegeLogoProps {
  className?: string;
  size?: number | string;
  showBorder?: boolean;
  onClick?: () => void;
  title?: string;
}

/**
 * Official Emblem Logo of Panchayat College, Baragada (ESTD 1960)
 * Features the authentic circular crest:
 * - Kalasha finial at top apex
 * - Burning Diya lamp in central dome
 * - Dark mountain peak with Boita (sailing boat) & river waves
 * - Open book with quill & inkpot
 * - Lekhani (writing stylus) & ink vessel
 * - "ESTD 1960" ribbons
 * - Sanskrit Motto: "नास्ति प्रज्ञा समं आभा"
 * - Odia Inscription: "ପଞ୍ଚାୟତ ମହାବିଦ୍ୟାଳୟ, ବରଗଡ଼"
 */
export const CollegeLogo: React.FC<CollegeLogoProps> = ({
  className = 'w-10 h-10',
  showBorder = false,
  onClick,
  title,
}) => {
  let customLogoUrl = '';
  try {
    const saved = localStorage.getItem('dept_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.logoUrl) {
        customLogoUrl = parsed.logoUrl;
      }
    }
  } catch {}

  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative inline-flex items-center justify-center shrink-0 ${
        showBorder ? 'ring-1 ring-amber-400/50 shadow-xs' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={customLogoUrl || "/college-logo.svg"}
        alt="College Logo"
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
