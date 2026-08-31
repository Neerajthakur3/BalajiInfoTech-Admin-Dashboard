import React, {
  useEffect,
  useState,
} from "react";

import Sidebar from "./Sidebar.jsx";
import TopHeader from "./TopHeader.jsx";

export default function DashboardShell({
  children,
  activeTab,
  onNavigate,
  admin,
  onLogout,
  notificationCount = 0,
  onAddProject,
  onAddPackage,
  onSearch,
  onNotificationClick,
  isTeamMember = false,
}) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme =
      localStorage.getItem(
        "balaji_dashboard_theme"
      );

    if (savedTheme === "light") {
      return false;
    }

    if (savedTheme === "dark") {
      return true;
    }

    return true;
  });

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );

    localStorage.setItem(
      "balaji_dashboard_theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [mobileOpen]);

  function handleNavigate(tabName) {
    onNavigate(tabName);
    setMobileOpen(false);
  }

  function toggleTheme() {
    setDarkMode(
      (current) => !current
    );
  }

  return (
    <div
      className={`dashboard-shell ${
        darkMode
          ? "dashboard-theme-dark"
          : "dashboard-theme-light"
      }`}
    >
      <Sidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        admin={admin}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
        isTeamMember={isTeamMember}
      />

      <div className="dashboard-main">
        <TopHeader
          admin={admin}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          onMenuOpen={() =>
            setMobileOpen(true)
          }
          notificationCount={
            notificationCount
          }
          onAddProject={onAddProject}
          onAddPackage={onAddPackage}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          canUseAddNew={!isTeamMember}
        />

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}