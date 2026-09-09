import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Footer from "./components/Common/Footer";
import DashboardPage from "./pages/DashboardPage";
import MonitoringPage from "./pages/MonitoringPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import EventsPage from "./pages/EventsPage";
import CameraMasterPage from "./pages/CameraMasterPage";
import SettingsPage from "./pages/SettingsPage";
import LicensePage from "./pages/LicensePage";
import LogsPage from "./pages/LogsPage";
import FireDetectionPage from "./pages/FireDetectionPage";
import visionIqImg from "./assets/figma-logo-exact.png";
import visionIqIcon from "./assets/figma-logo-icon-only.png";

export default function App() {
  const [activePage, setActivePage] = useState(
    () => localStorage.getItem("activePage") || "dashboard",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const handleNavigate = (page) => {
    localStorage.setItem("activePage", page);
    setActivePage(page);
  };

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden"
      style={{ background: "#F8F8F8" }}
    >
      <div className="flex flex-1 min-h-0">
        {/* Left column — logo + floating sidebar pill (top-anchored, exact spec offsets) */}
        <div
          className={`flex flex-col items-center flex-shrink-0 transition-all duration-300 ${
            sidebarCollapsed ? "w-[128px]" : "w-[304px]"
          }`}
          style={{ paddingTop: 28 }}
        >
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex-shrink-0 outline-none focus:outline-none hover:opacity-80 transition-opacity flex justify-center ${
              sidebarCollapsed ? "items-center" : "items-start"
            }`}
            style={{ height: 60 }}
          >
            {sidebarCollapsed ? (
              <img src={visionIqIcon} alt="Vision IQ" style={{ height: 48, width: "auto" }} />
            ) : (
              <img src={visionIqImg} alt="Vision IQ" style={{ height: 72, width: "auto" }} />
            )}
          </button>
          <div style={{ marginTop: 28 }}>
            <Sidebar
              active={activePage}
              onNavigate={handleNavigate}
              collapsed={sidebarCollapsed}
            />
          </div>
        </div>

        {/* Right column — navbar + page content (exact spec offsets) */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ paddingTop: 28, paddingRight: 28, paddingBottom: 29 }}
        >
          <Navbar />

          <main className="flex-1 min-h-0">
            {activePage === "dashboard" && <DashboardPage />}
            {activePage === "monitoring" && <MonitoringPage />}
            {activePage === "analytics" && <AnalyticsPage />}
            {activePage === "events" && <EventsPage />}
            {activePage === "cameraMaster" && <CameraMasterPage />}
            {activePage === "setting" && <SettingsPage />}
            {activePage === "license" && <LicensePage />}
            {activePage === "logs" && <LogsPage />}
            {activePage === "fire" && <FireDetectionPage />}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
