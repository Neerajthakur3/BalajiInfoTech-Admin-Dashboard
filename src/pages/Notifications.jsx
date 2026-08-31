import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  FileText,
  BriefcaseBusiness,
  X,
} from "lucide-react";

function makeNotifications({ enquiries, invoices, projects }) {
  const result = [];

  enquiries.forEach((item) => {
    const status = String(item.status || "new").toLowerCase();
    const name = item.name || "Client";

    if (status === "new") {
      result.push({
        id: `enquiry-new-${item._id}`,
        type: "enquiry",
        tone: "warning",
        title: "New enquiry received",
        message: `${name} submitted a new enquiry.`,
        date: item.createdAt,
        icon: MessageSquare,
      });
    } else {
      result.push({
        id: `enquiry-${item._id}`,
        type: "enquiry",
        tone: "info",
        title: "Enquiry updated",
        message: `${name}'s enquiry is ${status.replace(/-/g, " ")}.`,
        date: item.updatedAt || item.createdAt,
        icon: MessageSquare,
      });
    }
  });

  invoices.forEach((invoice) => {
    const status = String(invoice.status || "").toLowerCase();
    if (status === "overdue") {
      result.push({
        id: `invoice-overdue-${invoice._id}`,
        type: "invoice",
        tone: "danger",
        title: "Invoice overdue",
        message: `${invoice.invoiceNumber || "Invoice"} requires attention.`,
        date: invoice.dueDate,
        icon: AlertTriangle,
      });
    } else if (status === "paid") {
      result.push({
        id: `invoice-paid-${invoice._id}`,
        type: "invoice",
        tone: "success",
        title: "Invoice paid",
        message: `${invoice.invoiceNumber || "Invoice"} has been marked paid.`,
        date: invoice.updatedAt || invoice.issueDate,
        icon: CheckCircle2,
      });
    } else if (status === "pending") {
      result.push({
        id: `invoice-pending-${invoice._id}`,
        type: "invoice",
        tone: "warning",
        title: "Invoice pending",
        message: `${invoice.invoiceNumber || "Invoice"} is still pending.`,
        date: invoice.dueDate || invoice.issueDate,
        icon: FileText,
      });
    }
  });

  projects.forEach((project) => {
    if (project.published === false) return;

    result.push({
      id: `project-${project._id}`,
      type: "project",
      tone: "info",
      title: "Project available",
      message: `${project.title || project.name || "Project"} is available in your portfolio.`,
      date: project.updatedAt || project.createdAt,
      icon: BriefcaseBusiness,
    });
  });

  return result
    .sort((a, b) => {
      const ad = new Date(a.date || 0).getTime();
      const bd = new Date(b.date || 0).getTime();
      return bd - ad;
    });
}

export default function Notifications({
  enquiries = [],
  invoices = [],
  projects = [],
}) {
  const [filter, setFilter] = useState("all");
  const [read, setRead] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("balaji_notification_read") || "[]"
      );
    } catch {
      return [];
    }
  });
  const [selected, setSelected] = useState(null);
  const [eventNotifications, setEventNotifications] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("balaji_dashboard_notifications") || "[]"
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const syncNotifications = () => {
      try {
        setEventNotifications(
          JSON.parse(
            localStorage.getItem("balaji_dashboard_notifications") || "[]"
          )
        );
      } catch {
        setEventNotifications([]);
      }
    };

    const handleNotification = () => syncNotifications();
    window.addEventListener("storage", syncNotifications);
    window.addEventListener("balaji:notification", handleNotification);

    return () => {
      window.removeEventListener("storage", syncNotifications);
      window.removeEventListener("balaji:notification", handleNotification);
    };
  }, []);

  const notifications = useMemo(() => {
    const generated = makeNotifications({ enquiries, invoices, projects });

    const stored = eventNotifications.map((item) => ({
      ...item,
      icon:
        item.type === "task"
          ? CheckCircle2
          : item.type === "project"
            ? BriefcaseBusiness
            : item.type === "package"
              ? FileText
              : item.type === "service"
                ? FileText
                : FileText,
    }));

    return [...stored, ...generated];
  }, [enquiries, invoices, projects, eventNotifications]);

  const filtered = useMemo(
    () =>
      notifications.filter(
        (item) => filter === "all" || item.type === filter
      ),
    [notifications, filter]
  );

  const unreadCount = notifications.filter(
    (item) => !read.includes(item.id)
  ).length;

  function markRead(id) {
    setRead((current) => {
      const next = current.includes(id) ? current : [...current, id];
      localStorage.setItem(
        "balaji_notification_read",
        JSON.stringify(next.slice(-300))
      );
      return next;
    });
  }

  function markAllRead() {
    const next = notifications.map((item) => item.id);
    setRead(next);
    localStorage.setItem(
      "balaji_notification_read",
      JSON.stringify(next.slice(-300))
    );
  }

  function openNotification(item) {
    markRead(item.id);
    setSelected(item);
  }

  return (
    <section className="content notifications-module">
      <style>{`
        .notifications-module .notification-header {
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:18px;
          margin-bottom:18px;
        }
        .notifications-module .notification-header small {
          color:#ff5a00;
          font-weight:900;
          letter-spacing:.18em;
        }
        .notifications-module .notification-header h2 {
          margin:5px 0 0;
          color:var(--text,#111827);
        }
        .notifications-module .notification-tools {
          display:flex;
          align-items:center;
          gap:8px;
          flex-wrap:wrap;
        }
        .notifications-module .notification-tools button,
        .notifications-module .notification-filter {
          min-height:40px;
          border:1px solid var(--border,#dfe4ea);
          border-radius:10px;
          background:var(--surface,#fff);
          color:var(--text,#334155);
          padding:0 11px;
          font-weight:800;
        }
        .notifications-module .notification-tools button {
          cursor:pointer;
        }
        .notifications-module .notification-count {
          color:#ff5a00;
          font-weight:900;
        }
        .notifications-module .notification-list {
          display:grid;
          gap:10px;
        }
        .notifications-module .notification-item {
          display:grid;
          grid-template-columns:auto minmax(0,1fr) auto;
          align-items:center;
          gap:13px;
          width:100%;
          border:1px solid var(--border,#dfe4ea);
          border-radius:14px;
          background:var(--surface,#fff);
          padding:14px;
          text-align:left;
          cursor:pointer;
        }
        .notifications-module .notification-item:hover {
          border-color:rgba(255,90,0,.35);
        }
        .notifications-module .notification-item.unread {
          background:rgba(255,90,0,.035);
          box-shadow:inset 3px 0 0 #ff5a00;
        }
        .notifications-module .notification-icon {
          width:40px;
          height:40px;
          display:grid;
          place-items:center;
          border-radius:11px;
          flex:0 0 auto;
        }
        .notifications-module .tone-warning {
          color:#b45309;
          background:rgba(245,158,11,.12);
        }
        .notifications-module .tone-danger {
          color:#dc2626;
          background:rgba(239,68,68,.10);
        }
        .notifications-module .tone-success {
          color:#15803d;
          background:rgba(34,197,94,.10);
        }
        .notifications-module .tone-info {
          color:#2563eb;
          background:rgba(37,99,235,.09);
        }
        .notifications-module .notification-copy strong {
          display:block;
          color:var(--text,#111827);
          font-size:13px;
        }
        .notifications-module .notification-copy p {
          margin:4px 0;
          color:var(--text-secondary,#64748b);
          font-size:12px;
        }
        .notifications-module .notification-copy small {
          color:#94a3b8;
          font-size:10px;
        }
        .notifications-module .unread-dot {
          width:8px;
          height:8px;
          border-radius:50%;
          background:#ff5a00;
        }
        .notifications-module .notification-empty {
          padding:45px 20px;
          text-align:center;
          color:#64748b;
        }
        .notifications-module .notification-detail {
          position:fixed;
          inset:0;
          z-index:1000;
          display:grid;
          place-items:center;
          padding:20px;
          background:rgba(15,23,42,.52);
        }
        .notifications-module .notification-detail-card {
          width:min(560px,100%);
          border:1px solid var(--border,#dfe4ea);
          border-radius:17px;
          background:var(--surface,#fff);
          box-shadow:0 24px 70px rgba(15,23,42,.22);
          overflow:hidden;
        }
        .notifications-module .notification-detail-head {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          padding:18px;
          border-bottom:1px solid var(--border,#e5e7eb);
        }
        .notifications-module .notification-detail-head button {
          width:36px;
          height:36px;
          display:grid;
          place-items:center;
          border:1px solid var(--border,#dfe4ea);
          border-radius:9px;
          background:var(--surface,#fff);
          color:var(--text,#334155);
          cursor:pointer;
        }
        .notifications-module .notification-detail-body {
          padding:20px;
          color:var(--text-secondary,#475569);
          line-height:1.7;
        }
        html[data-theme="dark"] .notifications-module .notification-tools button,
        html[data-theme="dark"] .notifications-module .notification-filter,
        html[data-theme="dark"] .notifications-module .notification-item,
        html[data-theme="dark"] .notifications-module .notification-detail-card,
        html[data-theme="dark"] .notifications-module .notification-detail-head button {
          background:#15181d;
          border-color:#2b3139;
          color:#e5e7eb;
        }
        html[data-theme="dark"] .notifications-module .notification-header h2,
        html[data-theme="dark"] .notifications-module .notification-copy strong {
          color:#f3f4f6;
        }
        @media(max-width:640px) {
          .notifications-module .notification-header {
            align-items:stretch;
            flex-direction:column;
          }
          .notifications-module .notification-item {
            grid-template-columns:auto minmax(0,1fr);
          }
          .notifications-module .unread-dot {
            display:none;
          }
        }
      `}</style>

      <div className="notification-header">
        <div>
          <small>SYSTEM ACTIVITY</small>
          <h2>Notifications</h2>
        </div>

        <div className="notification-tools">
          <span className="notification-count">
            {unreadCount} unread
          </span>
          <select
            className="notification-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="enquiry">Enquiries</option>
            <option value="invoice">Invoices</option>
            <option value="project">Projects</option>
            <option value="package">Packages</option>
            <option value="service">Services</option>
            <option value="task">Tasks</option>
          </select>
          <button type="button" onClick={markAllRead}>
            MARK ALL READ
          </button>
        </div>
      </div>

      <section className="dashboard-card">
        <div className="notification-list">
          {filtered.map((item) => {
            const Icon = item.icon || Bell;
            const isUnread = !read.includes(item.id);

            return (
              <button
                type="button"
                key={item.id}
                className={`notification-item ${
                  isUnread ? "unread" : ""
                }`}
                onClick={() => openNotification(item)}
              >
                <div className={`notification-icon tone-${item.tone}`}>
                  <Icon size={18} />
                </div>

                <div className="notification-copy">
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <small>
                    {item.date
                      ? new Date(item.date).toLocaleString("en-IN")
                      : "Date unavailable"}
                  </small>
                </div>

                {isUnread && <span className="unread-dot" />}
              </button>
            );
          })}

          {!filtered.length && (
            <div className="notification-empty">
              <Bell size={24} />
              <p>No notifications available.</p>
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div
          className="notification-detail"
          onMouseDown={() => setSelected(null)}
        >
          <div
            className="notification-detail-card"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="notification-detail-head">
              <strong>{selected.title}</strong>
              <button
                type="button"
                aria-label="Close notification"
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="notification-detail-body">
              {selected.message}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
