import React from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Mail,
  BriefcaseBusiness,
  Package,
  FileText,
  CreditCard,
  DollarSign,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Bell,
  UsersRound,
  CalendarDays,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const navigation = [
  {
    key: "overview",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    key: "projects",
    label: "Projects",
    icon: FolderKanban,
    permission: "projects.view",
  },
  {
    key: "clients",
    label: "Clients",
    icon: Users,
    permission: "clients.view",
  },
  {
    key: "enquiries",
    label: "Enquiries",
    icon: Mail,
    permission: "enquiries.view",
  },
  {
    key: "services",
    label: "Services",
    icon: BriefcaseBusiness,
    permission: "services.view",
  },
  {
    key: "packages",
    label: "Packages",
    icon: Package,
    permission: "packages.view",
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: FileText,
    permission: "invoices.view",
  },
  {
    key: "payments",
    label: "Payments",
    icon: CreditCard,
    permission: "payments.view",
  },
  {
    key: "revenue",
    label: "Revenue Analytics",
    icon: DollarSign,
    permission: "revenue.view",
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    permission: "tasks.view",
  },
  {
    key: "messages",
    label: "Messages",
    icon: MessageSquare,
    permission: "messages.view",
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    permission: "reports.view",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    permission: "notifications.view",
  },
  {
    key: "team",
    label: "Team",
    icon: UsersRound,
    permission: "team.view",
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    permission: "calendar.view",
  },
];

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function normalizePermissions(value) {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((item) => {
      if (typeof item === "string") return [item];

      if (item && typeof item === "object") {
        return [
          item.value,
          item.permission,
          item.key,
          item.name,
        ].filter(Boolean);
      }

      return [];
    })
    .map((item) =>
      String(item)
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);
}

function isAdminUser(user) {
  const role = normalizeRole(user?.role);

  return (
    role === "admin" ||
    role === "administrator" ||
    user?.isAdmin === true ||
    user?.isAdmin === "true"
  );
}

function hasPermission(user, permission) {
  // Admin always gets every sidebar module.
  if (isAdminUser(user)) {
    return true;
  }

  // Dashboard has no permission requirement.
  if (!permission) {
    return true;
  }

  const permissions = normalizePermissions(
    user?.permissions
  );

  const required = String(permission)
    .trim()
    .toLowerCase();

  // Exact view permission.
  if (permissions.includes(required)) {
    return true;
  }

  // A manage permission also grants visibility.
  const [module] = required.split(".");

  return (
    permissions.includes(`${module}.manage`) ||
    permissions.includes(`${module}.admin`)
  );
}

function canManage(user, permission) {
  if (isAdminUser(user)) return true;

  if (!permission) return false;

  const permissions = normalizePermissions(
    user?.permissions
  );

  const [module] = String(permission)
    .trim()
    .toLowerCase()
    .split(".");

  return (
    permissions.includes(`${module}.manage`) ||
    permissions.includes(`${module}.admin`)
  );
}

export default function Sidebar({
  activeTab,
  onNavigate,
  admin,
  onLogout,
  mobileOpen = false,
  onClose,
  isTeamMember = false,
}) {
  const sessionIsAdmin = !isTeamMember;
  const visibleNavigation = navigation.filter((item) => {
    // Primary Admin sees every module. Team members see only their
    // explicitly granted permissions. Team is Admin-only.
    if (item.key === "team") return sessionIsAdmin;
    if (sessionIsAdmin) return true;
    return hasPermission(admin, item.permission);
  });

  // Settings is a personal account page. Admin gets admin settings;
  // team members get only their own profile/security/payment settings.
  const canOpenSettings = true;

  function handleNavigation(key) {
    // Settings is a personal account area. It never changes
    // administrator/business settings when opened by a team member.
    if (key === "settings") {
      if (!canOpenSettings) return;
      onNavigate?.("settings");
      onClose?.();
      return;
    }

    const item = navigation.find(
      (navigationItem) => navigationItem.key === key
    );

    if (
      key !== "overview" &&
      (!item || (!sessionIsAdmin && !hasPermission(admin, item.permission)))
    ) {
      return;
    }

    onNavigate?.(key);
    onClose?.();
  }

  const activeIsAllowed =
    activeTab === "settings"
      ? canOpenSettings
      : visibleNavigation.some(
          (item) => item.key === activeTab
        );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside
        className={`dashboard-sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">B</div>

          <div className="brand-text">
            <strong>
              BALAJI<span>INFOTECH</span>
            </strong>

            <small>
              {sessionIsAdmin
                ? "ADMIN CONTROL CENTER"
                : "TEAM WORKSPACE"}
            </small>
          </div>

          <button
            type="button"
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">
          MAIN MENU
        </div>

        <nav className="sidebar-navigation">
          {visibleNavigation.map(
            ({ key, label, icon: Icon }) => (
              <button
                type="button"
                key={key}
                className={`sidebar-link ${
                  activeTab === key ? "active" : ""
                }`}
                onClick={() =>
                  handleNavigation(key)
                }
              >
                <span className="sidebar-link-icon">
                  <Icon
                    size={18}
                    strokeWidth={2}
                  />
                </span>

                <span className="sidebar-link-label">
                  {label}
                </span>

                {activeTab === key && (
                  <span className="sidebar-active-indicator" />
                )}
              </button>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          {canOpenSettings && (
            <button
              type="button"
              className={`sidebar-link ${
                activeTab === "settings"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigation("settings")
              }
            >
              <span className="sidebar-link-icon">
                <Settings
                  size={18}
                  strokeWidth={2}
                />
              </span>

              <span className="sidebar-link-label">
                Settings
              </span>
            </button>
          )}

          <div className="sidebar-account">
            <div className="sidebar-avatar">
              {admin?.avatarUrl ||
              admin?.avatar ||
              admin?.profileImage ? (
                <img
                  src={
                    admin.avatarUrl ||
                    admin.avatar ||
                    admin.profileImage
                  }
                  alt={admin?.name || "Profile"}
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                    event.currentTarget.parentElement
                      ?.classList.add(
                        "sidebar-avatar-fallback"
                      );
                  }}
                />
              ) : (
                (admin?.name || "A")
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            <div className="sidebar-account-info">
              <strong>
                {admin?.name ||
                  "Administrator"}
              </strong>

              <small>
                {admin?.email ||
                  "Account"}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={onLogout}
          >
            <LogOut size={17} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
