import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import bellIcon from "../../assets/figma-icon-bell.svg";
import avatarImg from "../../assets/figma-avatar.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    localStorage.removeItem("activePage");
    window.location.reload();
  };

  return (
    <header
      className="relative flex items-center justify-end h-[60px] bg-white rounded-[20px] flex-shrink-0 shadow-[0_20px_45px_-10px_rgba(61,12,146,0.18)]"
      style={{ gap: 10, paddingRight: 16 }}
    >
      <button
        className="relative w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 hover:opacity-90 transition-opacity"
        style={{ background: "#F7F4FD" }}
        aria-label="Notifications"
      >
        <img src={bellIcon} alt="" className="w-6 h-6" />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 hover:opacity-90 transition-opacity"
          aria-label="Account"
        >
          <img src={avatarImg} alt="Account" className="w-full h-full object-cover" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-[calc(100%+10px)] w-[240px] bg-white rounded-2xl shadow-[0_20px_45px_-10px_rgba(61,12,146,0.25)] border border-[rgba(97,32,214,0.08)] py-2 z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <img
                src={avatarImg}
                alt="Account"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-poppins text-sm font-semibold truncate" style={{ color: "#00183E" }}>
                  Admin
                </p>
                <p className="font-poppins text-xs text-gray-500 truncate">
                  admin@daccess.co
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100 mx-2 my-1" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-left hover:bg-[#FEF2F2] transition-colors"
              style={{ color: "#DC2626" }}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
