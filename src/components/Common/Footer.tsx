import cognexaLogo from "../../assets/figma-cognexa-logo.png";
import { ACCENT_LINE_GRADIENT } from "../../theme";

// NOTE: this footer's background gradient end color (#021DBA) is one hex
// digit off from the #031EBA used everywhere else (sidebar, buttons, pills).
// Left as its own literal rather than silently merged into BRAND_GRADIENT,
// since that would visibly change this color — worth confirming with design
// which one is actually correct, then consolidating.
export default function Footer() {
  return (
    <footer
      className="w-full h-[36px] flex-shrink-0 rounded-t-[20px] flex items-center justify-center gap-3"
      style={{
        background: "linear-gradient(135deg, #3D0C92 0%, #021DBA 100%)",
      }}
    >
      <img src={cognexaLogo} alt="Cognexa" className="h-4 w-auto object-contain" />
      <span
        className="w-px h-[16px]"
        style={{ background: ACCENT_LINE_GRADIENT, opacity: 0.84 }}
      />
      <p className="font-poppins text-xs font-normal text-white">
        Powered by DAccess Security Systems Pvt. Ltd
      </p>
    </footer>
  );
}
