import { Camera, ScrollText } from "lucide-react";
import { BRAND_GRADIENT } from "../../theme";
import dashboardIcon from "../../assets/figma-icon-dashboard.svg";
import monitorIcon from "../../assets/figma-icon-monitor.svg";
import eventIcon from "../../assets/figma-icon-event.svg";
import settingsIcon from "../../assets/figma-icon-settings.svg";
import licenseIcon from "../../assets/figma-icon-license.svg";

// Most nav icons are Figma-exported SVGs (`icon`); Camera Master and Logs
// have no exported asset yet (the Logs Figma mock even reuses the Settings
// gear glyph for its own nav item — a placeholder mistake, not intentional),
// so both use a lucide component (`Icon`) instead — rendered the same
// size/color, just without the invert-on-active filter trick since lucide
// icons take a `color` prop directly.
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: dashboardIcon },
  { id: "monitoring", label: "Monitoring", icon: monitorIcon },
  { id: "cameraMaster", label: "Camera Master", Icon: Camera },
  { id: "events", label: "Events", icon: eventIcon },
  { id: "logs", label: "Logs", Icon: ScrollText },
  { id: "license", label: "License", icon: licenseIcon },
  { id: "setting", label: "Settings", icon: settingsIcon },
];

export default function Sidebar({ active = "dashboard", onNavigate, collapsed = true }) {
  return (
    <aside
      className={`relative flex flex-col gap-[10px] p-[15px] shadow-[0_20px_45px_-10px_rgba(61,12,146,0.18)] transition-[width,border-radius,background-color,box-shadow] duration-300 ease-out ${
        collapsed
          ? "w-[80px] rounded-full items-center bg-white border border-[rgba(97,32,214,0.1)]"
          : "w-[256px] rounded-[30px] bg-white/90"
      }`}
    >
      {NAV_ITEMS.map(({ id, label, icon, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate?.(id)}
            title={collapsed ? label : undefined}
            aria-label={label}
            className={`flex items-center flex-shrink-0 h-[50px] w-full rounded-full pl-[13px] gap-4 transition-[background-color,box-shadow] duration-200 outline-none focus:outline-none ${
              !isActive ? "hover:bg-[#F4EEFF]" : ""
            }`}
            style={
              isActive
                ? {
                    background: BRAND_GRADIENT,
                    boxShadow: "0 8px 20px -4px rgba(61,12,146,0.45)",
                  }
                : {}
            }
          >
            {Icon ? (
              <Icon size={24} className="flex-shrink-0" color={isActive ? "#FFFFFF" : "#220E97"} />
            ) : (
              <img
                src={icon}
                alt=""
                className="w-6 h-6 flex-shrink-0"
                style={isActive ? { filter: "brightness(0) invert(1)" } : {}}
              />
            )}
            <span
              className="font-poppins text-[16px] leading-[1.4] whitespace-nowrap overflow-x-hidden overflow-y-visible transition-[max-width,opacity] duration-300 ease-out inline-block"
              style={{
                color: isActive ? "#FFFFFF" : "#220E97",
                maxWidth: collapsed ? 0 : 160,
                opacity: collapsed ? 0 : 1,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
