import { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import MonitoringPage from "./pages/MonitoringPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import EventsPage from "./pages/EventsPage";
import SettingsPage from "./pages/SettingsPage";
import LicensePage from "./pages/LicensePage";
import FireDetectionPage from "./pages/FireDetectionPage";
import AddCameraModal from "./components/Monitoring/AddCameraModal";

export default function App() {
  const [activePage, setActivePage] = useState(
    () => localStorage.getItem("activePage") || "dashboard",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAddCamera, setShowAddCamera] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavigate = (page) => {
    localStorage.setItem("activePage", page);
    setActivePage(page);
    setMobileOpen(false);
  };

  // handleToggle to toggle the sidebar when clicked on the hamburger icon
  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed((c) => !c);
    }
  };

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden"
      style={{ background: "#F8F8F8" }}
    >
      <Navbar
        isCollapsed={sidebarCollapsed}
        onHamburgerClick={() => setMobileOpen((o) => !o)}
      />

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          active={activePage}
          onNavigate={handleNavigate}
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggle}
          mobileOpen={mobileOpen}
        />

        <main className="flex-1 overflow-hidden">
          {activePage === "dashboard" && (
            <DashboardPage isCollapsed={sidebarCollapsed} />
          )}
          {activePage === "monitoring" && (
            <MonitoringPage
              isCollapsed={sidebarCollapsed}
              onAddCamera={() => setShowAddCamera(true)}
            />
          )}
          {activePage === "analytics" && (
            <AnalyticsPage isCollapsed={sidebarCollapsed} />
          )}
          {activePage === "events" && (
            <EventsPage isCollapsed={sidebarCollapsed} />
          )}
          {activePage === "setting" && (
            <SettingsPage isCollapsed={sidebarCollapsed} />
          )}
          {activePage === "license" && (
            <LicensePage isCollapsed={sidebarCollapsed} />
          )}
          {activePage === "fire" && (
            <FireDetectionPage isCollapsed={sidebarCollapsed} />
          )}
        </main>
      </div>

      {showAddCamera && (
        <AddCameraModal onClose={() => setShowAddCamera(false)} />
      )}
    </div>
  );
}
