import React, { useId } from "react";
import { BRAND } from "./brand";

/**
 * The Made2Balance logo: "Made2" over "Balance" with the tagline underneath, navy lettering and the glowing
 * teal "2". A sharp vector copy of the supplied artwork (public/brand/made2balance-logo.webp), drawn to the
 * same proportions, so it stays readable at any size and on any background. Size it with `width`.
 */
export const BrandLogo: React.FC<{
  width?: number;
  className?: string;
  showTagline?: boolean;
  /** "reversed" is the standard dark-background version: white lettering, same teal "2" */
  variant?: "standard" | "reversed";
}> = ({ width = 240, className = "", showTagline = true, variant = "standard" }) => {
  const id = useId().replace(/:/g, "");
  const viewHeight = showTagline ? 662 : 595;
  return (
    <svg
      viewBox={`125 170 1290 ${viewHeight}`}
      width={width}
      height={(width * viewHeight) / 1290}
      role="img"
      aria-label={`${BRAND.name}: ${BRAND.tagline}`}
      className={`block select-none ${className}`}
      style={{ fontFamily: "var(--font-app)" }}
    >
      <defs>
        <linearGradient id={`navy-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={variant === "reversed" ? "#FFFFFF" : BRAND.navy} />
          <stop offset="1" stopColor={variant === "reversed" ? "#E2E8F0" : BRAND.navyDark} />
        </linearGradient>
        <filter id={`glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="18" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text x="135" y="470" fontSize="320" fontWeight="800" fill={`url(#navy-${id})`}
            textLength="940" lengthAdjust="spacingAndGlyphs">Made</text>
      <text x="1080" y="498" fontSize="390" fontWeight="800" fill={BRAND.teal} filter={`url(#glow-${id})`}
            textLength="230" lengthAdjust="spacingAndGlyphs">2</text>
      <text x="135" y="745" fontSize="320" fontWeight="800" fill={`url(#navy-${id})`}
            textLength="1260" lengthAdjust="spacingAndGlyphs">Balance</text>
      {showTagline && (
        <text x="137" y="815" fontSize="46" fontWeight="500" fill={variant === "reversed" ? "#94A3B8" : BRAND.taglineGrey}
              textLength="1262" lengthAdjust="spacingAndGlyphs">{BRAND.tagline}</text>
      )}
    </svg>
  );
};
