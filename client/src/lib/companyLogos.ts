/**
 * Company Branding & Logo Assets
 * - Healthy Fields Business Hub (Primary Company Logo)
 * - ProAgriSA Education (Educational Program Logo)
 */

export const HEALTHY_FIELDS_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="hf-grad-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22C55E" />
      <stop offset="100%" stop-color="#15803D" />
    </linearGradient>
    <linearGradient id="hf-grad-tech" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="hf-grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="100%" stop-color="#CA8A04" />
    </linearGradient>
    <filter id="hf-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#15803D" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Outer Ring Background -->
  <circle cx="200" cy="200" r="190" fill="#FFFFFF" stroke="#15803D" stroke-width="4" />
  <circle cx="200" cy="200" r="182" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />

  <!-- Top Hemisphere: Agriculture & Globe Grid -->
  <g opacity="0.85">
    <!-- Globe lines -->
    <ellipse cx="200" cy="85" rx="55" ry="32" fill="none" stroke="#22C55E" stroke-width="2" stroke-dasharray="3,3" />
    <path d="M 145 85 Q 200 45 255 85" fill="none" stroke="#16A34A" stroke-width="2" />
    <path d="M 200 50 L 200 120" stroke="#16A34A" stroke-width="2" stroke-linecap="round" />
  </g>

  <!-- Left Tech Circuits -->
  <g stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9">
    <path d="M 70 140 L 95 140 L 115 160 L 130 160" />
    <circle cx="68" cy="140" r="4" fill="#0284C7" />
    <circle cx="132" cy="160" r="3" fill="#38BDF8" />
    
    <path d="M 60 180 L 90 180 L 105 195 L 125 195" />
    <circle cx="58" cy="180" r="4" fill="#0284C7" />
    
    <path d="M 75 220 L 100 220 L 115 205 L 130 205" />
    <circle cx="73" cy="220" r="4" fill="#0284C7" />
  </g>

  <!-- Right Gear / Industry Cog -->
  <g transform="translate(285, 175)" fill="#166534" opacity="0.85">
    <path d="M -5 -25 L 5 -25 L 7 -18 L 15 -15 L 21 -20 L 28 -13 L 24 -6 L 26 3 L 33 6 L 33 16 L 25 19 L 23 27 L 28 34 L 20 40 L 13 36 L 5 38 L 2 45 L -8 45 L -10 38 L -18 35 L -24 40 L -31 33 L -27 26 L -29 17 L -36 14 L -36 4 L -29 1 L -27 -7 L -32 -14 L -24 -20 L -17 -16 L -9 -19 Z" />
    <circle cx="-2" cy="10" r="12" fill="#FFFFFF" />
    <circle cx="-2" cy="10" r="6" fill="#166534" />
  </g>

  <!-- Central Sprout Leaves Above Monogram -->
  <g transform="translate(200, 105)" filter="url(#hf-glow)">
    <!-- Center Leaf -->
    <path d="M 0 15 C -20 -15 -10 -40 0 -50 C 10 -40 20 -15 0 15 Z" fill="url(#hf-grad-leaf)" />
    <!-- Left Leaf -->
    <path d="M -5 12 C -25 5 -35 -15 -25 -30 C -15 -25 -5 -5 -5 12 Z" fill="#15803D" />
    <!-- Right Leaf -->
    <path d="M 5 12 C 25 5 35 -15 25 -30 C 15 -25 5 -5 5 12 Z" fill="#22C55E" />
    <!-- Central stem vein -->
    <path d="M 0 15 L 0 -40" stroke="#DCFCE7" stroke-width="2" stroke-linecap="round" />
  </g>

  <!-- Monogram HF (Healthy Fields) -->
  <g transform="translate(200, 195)">
    <!-- H -->
    <path d="M -55 -38 L -35 -38 L -35 -12 L -15 -12 L -15 -38 L 5 -38 L 5 38 L -15 38 L -15 8 L -35 8 L -35 38 L -55 38 Z" fill="#15803D" />
    <!-- F with leaf notch -->
    <path d="M 15 -38 L 65 -38 L 65 -18 L 35 -18 L 35 -6 L 58 -6 L 58 12 L 35 12 L 35 38 L 15 38 Z" fill="#166534" />
    <!-- Small Leaf Accent inside F -->
    <path d="M 45 -28 C 40 -35 48 -35 52 -32 C 55 -28 50 -24 45 -28 Z" fill="#86EFAC" />
  </g>

  <!-- Main Text: HEALTHY FIELDS -->
  <text x="200" y="260" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="23" fill="#14532D" letter-spacing="1.5">
    HEALTHY FIELDS
  </text>

  <!-- Sub-Header: BUSINESS HUB -->
  <g transform="translate(200, 280)">
    <line x1="-120" y1="-5" x2="-65" y2="-5" stroke="#0F172A" stroke-width="1.5" />
    <text x="0" y="0" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="14" fill="#0F172A" letter-spacing="3">
      BUSINESS HUB
    </text>
    <line x1="65" y1="-5" x2="120" y2="-5" stroke="#0F172A" stroke-width="1.5" />
  </g>

  <!-- Six Core Pillars Badges (Dots / Sub-tags) -->
  <text x="200" y="306" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="7.5" fill="#166534" letter-spacing="0.8">
    AGRICULTURE • TECHNOLOGY • HEALTH • EDUCATION • E-COMMERCE • SUSTAINABILITY
  </text>

  <!-- Tagline Banner at Bottom -->
  <path d="M 75 330 Q 200 355 325 330 L 320 348 Q 200 375 80 348 Z" fill="#15803D" />
  <text x="200" y="344" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="10" fill="#FFFFFF" letter-spacing="3">
    INNOVATE • INTEGRATE • GROW
  </text>
</svg>`;

export const PROAGRISA_EDU_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="edu-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F3A3A" />
      <stop offset="50%" stop-color="#0A2C2C" />
      <stop offset="100%" stop-color="#041E1E" />
    </linearGradient>
    <linearGradient id="edu-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ADE80" />
      <stop offset="100%" stop-color="#16A34A" />
    </linearGradient>
    <linearGradient id="edu-book" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#CFFAFE" />
    </linearGradient>
  </defs>

  <!-- Circle Container -->
  <circle cx="200" cy="200" r="190" fill="url(#edu-bg)" stroke="#14B8A6" stroke-width="3.5" />
  <circle cx="200" cy="200" r="182" fill="none" stroke="#2DD4BF" stroke-width="1" stroke-dasharray="4,4" opacity="0.5" />

  <!-- Floating Digital Tech Cubes (Top Left) -->
  <g fill="#5EEAD4" opacity="0.85">
    <rect x="85" y="90" width="14" height="14" rx="2" />
    <rect x="105" y="75" width="10" height="10" rx="1.5" />
    <rect x="75" y="115" width="10" height="10" rx="1.5" />
    <rect x="102" y="110" width="16" height="16" rx="2.5" fill="#2DD4BF" />
  </g>

  <!-- Central Growing Plant Sprout -->
  <g transform="translate(200, 160)">
    <!-- Central Stem -->
    <path d="M 0 35 Q 0 -15 0 -45" stroke="#4ADE80" stroke-width="5" stroke-linecap="round" />
    
    <!-- Left Leaf -->
    <path d="M 0 0 C -35 -10 -40 -40 -10 -45 C 5 -40 0 -10 0 0 Z" fill="url(#edu-leaf)" />
    <path d="M 0 0 C -15 -15 -25 -28 -10 -45" stroke="#DCFCE7" stroke-width="1.5" fill="none" />
    
    <!-- Right Leaf -->
    <path d="M 0 10 C 35 0 42 -30 15 -38 C 0 -30 0 0 0 10 Z" fill="#22C55E" />
    <path d="M 0 10 C 15 -5 25 -20 15 -38" stroke="#DCFCE7" stroke-width="1.5" fill="none" />
  </g>

  <!-- Open Knowledge Book Platform -->
  <g transform="translate(200, 205)">
    <!-- Book Left Page -->
    <path d="M -5 5 C -35 -15 -80 -10 -105 5 L -105 25 C -80 10 -35 5 -5 25 Z" fill="url(#edu-book)" opacity="0.95" />
    <!-- Book Right Page -->
    <path d="M 5 5 C 35 -15 80 -10 105 5 L 105 25 C 80 10 35 5 5 25 Z" fill="url(#edu-book)" opacity="0.95" />
    
    <!-- Book Spine Glow -->
    <ellipse cx="0" cy="15" rx="7" ry="12" fill="#0D9488" />
    <path d="M 0 -5 L 0 30" stroke="#0D9488" stroke-width="3" stroke-linecap="round" />
    
    <!-- Subtle Page Lines -->
    <line x1="-90" y1="12" x2="-20" y2="10" stroke="#94A3B8" stroke-width="1.5" opacity="0.4" />
    <line x1="-85" y1="18" x2="-25" y2="16" stroke="#94A3B8" stroke-width="1.5" opacity="0.4" />
    <line x1="20" y1="10" x2="90" y2="12" stroke="#94A3B8" stroke-width="1.5" opacity="0.4" />
    <line x1="25" y1="16" x2="85" y2="18" stroke="#94A3B8" stroke-width="1.5" opacity="0.4" />
  </g>

  <!-- Brand Typography: ProAgriSA -->
  <g transform="translate(200, 290)">
    <text x="0" y="0" text-anchor="middle" font-family="'Georgia', serif" font-weight="bold" font-size="34" fill="#FFFFFF" letter-spacing="1">
      ProAgriSA
    </text>
    <!-- Dot over the 'i' in turquoise glow -->
    <circle cx="43" cy="-24" r="3.5" fill="#2DD4BF" />
  </g>

  <!-- Sub-Title: Education -->
  <g transform="translate(200, 325)">
    <text x="0" y="0" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="300" font-size="20" fill="#2DD4BF" letter-spacing="6">
      Education
    </text>
    <!-- Modern underline accent -->
    <line x1="-60" y1="12" x2="60" y2="12" stroke="#14B8A6" stroke-width="2" stroke-linecap="round" />
  </g>
</svg>`;

export const svgToDataUrl = (svgString: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
};

export const DEFAULT_PRIMARY_LOGO_DATA_URL = svgToDataUrl(HEALTHY_FIELDS_LOGO_SVG);
export const DEFAULT_EDU_LOGO_DATA_URL = svgToDataUrl(PROAGRISA_EDU_LOGO_SVG);
