import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  BriefcaseBusiness,
  Package,
} from "lucide-react";

export default function TopHeader({
  admin,
  darkMode = true,
  onToggleTheme,
  onMenuOpen,
  notificationCount = 0,
  onAddProject,
  onAddPackage,
  onSearch,
  onNotificationClick,
  canUseAddNew = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    function close(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function choose(action) {
    setOpen(false);

    if (action === "project" && typeof onAddProject === "function") {
      onAddProject();
      return;
    }

    if (action === "package" && typeof onAddPackage === "function") {
      onAddPackage();
    }
  }

  function handleSearch(event) {
    const value = event.target.value;
    setQuery(value);
    if (typeof onSearch === "function") onSearch(value);
  }

  const initials =
    (admin?.name || "A").trim().charAt(0).toUpperCase() || "A";

  return (
    <header className="dashboard-top-header">
      <button
        type="button"
        className="mobile-menu-button"
        onClick={onMenuOpen}
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>

      <div className="top-header-title">
        <span>CONTROL CENTER</span>
        <h2>
          Welcome back,{" "}
          <strong>{admin?.name || "Admin"}</strong>
        </h2>
      </div>

      <div className="top-header-actions">
        <button
          type="button"
          className="header-date-button"
          title="Today"
        >
          <CalendarDays size={16} />
          <span>
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </button>

        <div className="header-search">
          <Search size={17} />
          <input
            value={query}
            onChange={handleSearch}
            placeholder="Search..."
            aria-label="Search"
          />
        </div>

        <button
          type="button"
          className="header-icon-button"
          onClick={() => {
            if (typeof onNotificationClick === "function") {
              onNotificationClick();
              return;
            }
            if (typeof onSearch === "function") {
              onSearch("__NEW_ENQUIRIES__");
            }
          }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="header-notification-badge">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="header-icon-button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {canUseAddNew && <div
          ref={menuRef}
          className="header-add-menu"
          style={{ position: "relative" }}
        >
          <button
            type="button"
            className="header-add-button"
            onClick={() => setOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <Plus size={17} />
            ADD NEW
            <ChevronDown
              size={15}
              style={{
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform .18s ease",
              }}
            />
          </button>

          {open && (
            <div
              role="menu"
              aria-label="Create new"
              className="header-add-dropdown"
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: 305,
                padding: "18px 12px 12px",
                borderRadius: 16,
                zIndex: 9999,
                background: darkMode ? "#171a1f" : "#ffffff",
                border: darkMode
                  ? "1px solid #30353d"
                  : "1px solid #e1e5ea",
                boxShadow: "0 18px 50px rgba(0,0,0,.28)",
              }}
            >
              <div
                style={{
                  padding: "0 10px 12px",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                  color: darkMode ? "#aeb5bf" : "#667085",
                }}
              >
                CREATE NEW
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => choose("project")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "10px",
                  border: 0,
                  borderRadius: 11,
                  background: "transparent",
                  color: darkMode ? "#fff" : "#101828",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    borderRadius: 11,
                    display: "grid",
                    placeItems: "center",
                    background: darkMode ? "#39251b" : "#fff0e8",
                    color: "#ff5a00",
                  }}
                >
                  <BriefcaseBusiness size={20} />
                </span>

                <span style={{ display: "grid", gap: 2 }}>
                  <strong style={{ fontSize: 14 }}>Project</strong>
                  <small
                    style={{
                      fontSize: 11,
                      color: darkMode ? "#aeb5bf" : "#667085",
                    }}
                  >
                    Add a portfolio project
                  </small>
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => choose("package")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "10px",
                  border: 0,
                  borderRadius: 11,
                  background: "transparent",
                  color: darkMode ? "#fff" : "#101828",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    borderRadius: 11,
                    display: "grid",
                    placeItems: "center",
                    background: darkMode ? "#39251b" : "#fff0e8",
                    color: "#ff5a00",
                  }}
                >
                  <Package size={20} />
                </span>

                <span style={{ display: "grid", gap: 2 }}>
                  <strong style={{ fontSize: 14 }}>Package</strong>
                  <small
                    style={{
                      fontSize: 11,
                      color: darkMode ? "#aeb5bf" : "#667085",
                    }}
                  >
                    Create a pricing package
                  </small>
                </span>
              </button>
            </div>
          )}
        </div>}

        <div className="header-profile">
          <div className="header-avatar">
            {admin?.avatarUrl ? (
              <img
                src={admin.avatarUrl}
                alt="Admin profile"
                draggable="false"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  borderRadius: "50%",
                  display: "block",
                }}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  const parent = event.currentTarget.parentElement;
                  if (parent) parent.textContent = initials;
                }}
              />
            ) : (
              initials
            )}
          </div>

          <div className="header-profile-text">
            <strong>{admin?.name || "Administrator"}</strong>
            <span>{admin?.role || "Administrator"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
