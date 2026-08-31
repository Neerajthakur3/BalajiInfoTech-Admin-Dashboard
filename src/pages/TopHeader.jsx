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
  UserPlus,
  FileText,
  Mail,
  X,
  Check,
} from "lucide-react";

export default function TopHeader({
  admin,
  darkMode = true,
  onToggleTheme,
  onMenuOpen,

  notificationCount = 0,
  notifications = [],

  onNotificationClick,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,

  onAddProject,
  onAddPackage,
  onAddClient,
  onAddInvoice,
  onAddEnquiry,

  onSearch,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [query, setQuery] = useState("");

  const addRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        addRef.current &&
        !addRef.current.contains(event.target)
      ) {
        setAddOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  function choose(action) {
    setAddOpen(false);

    if (action === "project") {
      onAddProject?.();
      return;
    }

    if (action === "package") {
      onAddPackage?.();
      return;
    }

    if (action === "client") {
      onAddClient?.();
      return;
    }

    if (action === "invoice") {
      onAddInvoice?.();
      return;
    }

    if (action === "enquiry") {
      onAddEnquiry?.();
    }
  }

  function handleSearch(event) {
    const value = event.target.value;

    setQuery(value);

    if (typeof onSearch === "function") {
      onSearch(value);
    }
  }

  function toggleNotifications() {
    setNotificationOpen(
      (current) => !current
    );

    setAddOpen(false);
  }

  const initials =
    (admin?.name || "A")
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  const visibleNotifications =
    Array.isArray(notifications)
      ? notifications.slice(0, 8)
      : [];

  return (
    <header className="dashboard-top-header">

      {/* MOBILE MENU */}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={onMenuOpen}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* TITLE */}
      <div className="top-header-title">
        <span>CONTROL CENTER</span>

        <h2>
          Welcome back,{" "}
          <strong>
            {admin?.name || "Admin"}
          </strong>
        </h2>
      </div>

      {/* ACTIONS */}
      <div className="top-header-actions">

        {/* DATE */}
        <button
          type="button"
          className="header-date-button"
          title="Today"
        >
          <CalendarDays size={16} />

          <span>
            {new Date().toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )}
          </span>
        </button>

        {/* SEARCH */}
        <div className="header-search">
          <Search size={17} />

          <input
            value={query}
            onChange={handleSearch}
            placeholder="Search..."
            aria-label="Search"
          />

          {query && (
            <button
              type="button"
              className="header-search-clear"
              onClick={() => {
                setQuery("");

                if (
                  typeof onSearch ===
                  "function"
                ) {
                  onSearch("");
                }
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div
          ref={notificationRef}
          className="header-notification-wrapper"
        >
          <button
            type="button"
            className="header-icon-button"
            onClick={toggleNotifications}
            aria-label="Notifications"
            aria-expanded={
              notificationOpen
            }
          >
            <Bell size={18} />

            {notificationCount > 0 && (
              <span className="header-notification-badge">
                {notificationCount > 99
                  ? "99+"
                  : notificationCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="notification-dropdown">

              <div className="notification-header">
                <div>
                  <strong>
                    Notifications
                  </strong>

                  <small>
                    {notificationCount} unread
                  </small>
                </div>

                {notificationCount > 0 && (
                  <button
                    type="button"
                    onClick={
                      onMarkAllNotificationsRead
                    }
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notification-list">

                {visibleNotifications.length >
                0 ? (
                  visibleNotifications.map(
                    (notification) => (
                      <button
                        type="button"
                        key={
                          notification.id
                        }
                        className={`notification-item ${
                          notification.read
                            ? "read"
                            : "unread"
                        }`}
                        onClick={() => {
                          onNotificationClick?.(
                            notification
                          );

                          if (
                            !notification.read
                          ) {
                            onMarkNotificationRead?.(
                              notification.id
                            );
                          }
                        }}
                      >
                        <span className="notification-icon">
                          {notification.icon || (
                            <Bell size={16} />
                          )}
                        </span>

                        <span className="notification-content">
                          <strong>
                            {notification.title ||
                              "Notification"}
                          </strong>

                          <small>
                            {notification.message ||
                              ""}
                          </small>

                          <time>
                            {notification.date
                              ? new Date(
                                  notification.date
                                ).toLocaleString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute:
                                      "2-digit",
                                  }
                                )
                              : "Just now"}
                          </time>
                        </span>

                        {!notification.read && (
                          <span className="notification-dot" />
                        )}
                      </button>
                    )
                  )
                ) : (
                  <div className="notification-empty">
                    <Check size={25} />

                    <strong>
                      You're all caught up
                    </strong>

                    <span>
                      No new notifications.
                    </span>
                  </div>
                )}

              </div>

              <button
                type="button"
                className="notification-footer"
                onClick={() => {
                  setNotificationOpen(false);
                  onNotificationClick?.({
                    type: "all",
                  });
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* THEME */}
        <button
          type="button"
          className="header-icon-button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title={
            darkMode
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {darkMode ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>

        {/* ADD NEW */}
        <div
          ref={addRef}
          className="header-add-menu"
        >
          <button
            type="button"
            className="header-add-button"
            onClick={() => {
              setAddOpen(
                (current) => !current
              );

              setNotificationOpen(false);
            }}
            aria-haspopup="menu"
            aria-expanded={addOpen}
          >
            <Plus size={17} />

            <span>ADD NEW</span>

            <ChevronDown
              size={15}
              className={
                addOpen
                  ? "rotate-open"
                  : ""
              }
            />
          </button>

          {addOpen && (
            <div
              className="header-add-dropdown"
              role="menu"
            >
              <div className="add-menu-title">
                CREATE NEW
              </div>

              {/* PROJECT */}
              <button
                type="button"
                className="add-menu-item"
                onClick={() =>
                  choose("project")
                }
              >
                <span className="add-menu-icon">
                  <BriefcaseBusiness size={19} />
                </span>

                <span>
                  <strong>
                    Project
                  </strong>

                  <small>
                    Add a portfolio project
                  </small>
                </span>
              </button>

              {/* PACKAGE */}
              <button
                type="button"
                className="add-menu-item"
                onClick={() =>
                  choose("package")
                }
              >
                <span className="add-menu-icon">
                  <Package size={19} />
                </span>

                <span>
                  <strong>
                    Package
                  </strong>

                  <small>
                    Create a pricing package
                  </small>
                </span>
              </button>

              {/* CLIENT */}
              <button
                type="button"
                className="add-menu-item"
                onClick={() =>
                  choose("client")
                }
              >
                <span className="add-menu-icon">
                  <UserPlus size={19} />
                </span>

                <span>
                  <strong>
                    Client
                  </strong>

                  <small>
                    Add a new client
                  </small>
                </span>
              </button>

              {/* INVOICE */}
              <button
                type="button"
                className="add-menu-item"
                onClick={() =>
                  choose("invoice")
                }
              >
                <span className="add-menu-icon">
                  <FileText size={19} />
                </span>

                <span>
                  <strong>
                    Invoice
                  </strong>

                  <small>
                    Create a new invoice
                  </small>
                </span>
              </button>

              {/* ENQUIRY */}
              <button
                type="button"
                className="add-menu-item"
                onClick={() =>
                  choose("enquiry")
                }
              >
                <span className="add-menu-icon">
                  <Mail size={19} />
                </span>

                <span>
                  <strong>
                    Enquiry
                  </strong>

                  <small>
                    Add a new enquiry
                  </small>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <button
          type="button"
          className="header-profile"
          onClick={() =>
            onNotificationClick?.({
              type: "profile",
            })
          }
        >
          <div className="header-avatar">
            {admin?.avatarUrl ? (
              <img
                src={admin.avatarUrl}
                alt={
                  admin?.name ||
                  "Admin"
                }
                draggable="false"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              initials
            )}
          </div>

          <div className="header-profile-text">
            <strong>
              {admin?.name ||
                "Administrator"}
            </strong>

            <span>
              {admin?.role ||
                "Administrator"}
            </span>
          </div>

          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}