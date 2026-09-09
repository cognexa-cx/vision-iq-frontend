// src/theme.ts
// Shared brand style tokens — single source of truth so the color scheme
// only needs updating in one place. Pulled out after the same gradient
// string was found hardcoded in 6+ components.

/** Primary brand gradient — active nav items, footer, primary buttons. */
export const BRAND_GRADIENT = "linear-gradient(135deg, #3D0C92 0%, #031EBA 100%)";

/** Purple-dominant gradient for large filled surfaces (hero banners) — the
 *  full-strength blue endpoint in BRAND_GRADIENT reads as "too blue" once
 *  it covers a big area, so large surfaces stay in the purple family. */
export const HERO_GRADIENT = "linear-gradient(135deg, #2E0A66 0%, #6020D6 55%, #3D0C92 100%)";

/** Soft accent line used next to page/section titles. */
export const ACCENT_LINE_GRADIENT = "linear-gradient(180deg, #C7F1FF 0%, #6020D6 100%)";

/** Dark navy gradient used for gradient-clipped heading text. */
export const HEADING_TEXT_GRADIENT = "linear-gradient(135deg, #024180 0%, #01244F 100%)";

/** Standard elevated-surface shadow (sidebar, navbar, panels, dropdowns). */
export const PANEL_SHADOW = "0 20px 45px -10px rgba(61,12,146,0.18)";

/** Light purple tint used for icon-button backgrounds (bell, close, view). */
export const ICON_BUTTON_BG = "#F4EEFF";
export const ICON_BUTTON_COLOR = "#3D0C92";
