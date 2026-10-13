import React from 'react';

interface CollegeLogoProps {
  className?: string;
  size?: number | string;
  showBorder?: boolean;
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
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${
        showBorder ? 'rounded-full ring-2 ring-amber-400/50 shadow-xs' : ''
      } ${className}`}
    >
      <img
        src="/college-logo.svg"
        alt="Panchayat College, Baragada Official Emblem"
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
