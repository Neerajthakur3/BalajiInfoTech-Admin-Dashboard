import { useMemo, useState } from "react";
import {
  Search,
  MessageSquare,
  Eye,
  Trash2,
  Mail,
  Phone,
  Clock3,
  CheckCircle2,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Messages" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in-progress", label: "In Progress" },
  { value: "closed", label: "Closed" },
];

function statusLabel(status) {
  const value = String(status || "new").toLowerCase();
  return (
    STATUS_OPTIONS.find((item) => item.value === value)?.label ||
    value.replace(/-/g, " ")
  );
}

function statusClass(status) {
  return `message-status message-status-${String(status || "new").toLowerCase()}`;
}

export default function Messages({
  items = [],
  update,
  del,
  onView,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const currentStatus = String(item.status || "new").toLowerCase();

      const matchesStatus =
        status === "all" || currentStatus === status;

      const haystack = [
        item.name,
        item.email,
        item.phone,
        item.service,
        item.packageName,
        item.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [items, search, status]);

  const stats = useMemo(() => {
    const total = items.length;
    const newCount = items.filter(
      (item) => String(item.status || "new").toLowerCase() === "new"
    ).length;
    const contacted = items.filter(
      (item) => String(item.status || "").toLowerCase() === "contacted"
    ).length;
    const closed = items.filter(
      (item) => String(item.status || "").toLowerCase() === "closed"
    ).length;

    return { total, newCount, contacted, closed };
  }, [items]);

  function handleView(item) {
    setSelected(item);
    if (onView) onView(item);
  }

  async function handleStatusChange(item, nextStatus) {
    if (!update || nextStatus === item.status) return;

    try {
      await update(item._id, nextStatus);
    } catch (error) {
      console.error("Message status update error:", error);
    }
  }

  return (
    <section className="content messages-module">
      <style>{`
        .messages-module .messages-toolbar {
          display: grid;
          grid-template-columns: minmax(240px, 1fr) 210px;
          gap: 12px;
          margin-bottom: 18px;
        }

        .messages-module .messages-search,
        .messages-module .messages-filter {
          min-height: 46px;
          border: 1px solid var(--border, #dfe4ea);
          border-radius: 12px;
          background: var(--surface, #fff);
          color: var(--text, #111827);
          padding: 0 14px;
          outline: none;
        }

        .messages-module .messages-search {
          padding-left: 42px;
        }

        .messages-module .messages-search-wrap {
          position: relative;
        }

        .messages-module .messages-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        .messages-module .message-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .messages-module .message-kpi {
          border: 1px solid var(--border, #dfe4ea);
          border-radius: 14px;
          background: var(--surface, #fff);
          padding: 16px;
        }

        .messages-module .message-kpi span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .messages-module .message-kpi strong {
          display: block;
          margin-top: 7px;
          color: var(--text, #111827);
          font-size: 26px;
        }

        .messages-module .message-list {
          display: grid;
          gap: 10px;
        }

        .messages-module .message-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          border: 1px solid var(--border, #dfe4ea);
          border-radius: 14px;
          background: var(--surface, #fff);
          padding: 16px;
        }

        .messages-module .message-row-main {
          min-width: 0;
        }

        .messages-module .message-client {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .messages-module .message-avatar {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: rgba(255, 90, 0, .09);
          color: #ff5a00;
          flex: 0 0 auto;
        }

        .messages-module .message-client strong {
          display: block;
          color: var(--text, #111827);
          font-size: 14px;
        }

        .messages-module .message-client small,
        .messages-module .message-meta {
          color: #64748b;
        }

        .messages-module .message-preview {
          margin: 10px 0 7px;
          color: var(--text-secondary, #475569);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .messages-module .message-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 11px;
        }

        .messages-module .message-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 8px;
        }

        .messages-module .message-actions button,
        .messages-module .message-actions select {
          min-height: 38px;
          border-radius: 10px;
          border: 1px solid var(--border, #dfe4ea);
          background: var(--surface, #fff);
          color: var(--text, #334155);
          padding: 0 11px;
          font-weight: 800;
        }

        .messages-module .message-actions button {
          cursor: pointer;
        }

        .messages-module .message-actions .danger {
          color: #dc2626;
          border-color: rgba(239, 68, 68, .25);
          background: rgba(239, 68, 68, .06);
        }

        .messages-module .message-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .04em;
        }

        .messages-module .message-status-new {
          color: #b45309;
          background: rgba(245, 158, 11, .11);
        }

        .messages-module .message-status-contacted {
          color: #2563eb;
          background: rgba(37, 99, 235, .09);
        }

        .messages-module .message-status-in-progress {
          color: #7c3aed;
          background: rgba(124, 58, 237, .09);
        }

        .messages-module .message-status-closed {
          color: #15803d;
          background: rgba(34, 197, 94, .10);
        }

        .messages-module .message-empty {
          padding: 42px 20px;
          text-align: center;
          color: #64748b;
        }

        .messages-module .message-detail {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15, 23, 42, .52);
        }

        .messages-module .message-detail-card {
          width: min(720px, 100%);
          max-height: 85vh;
          overflow: auto;
          border: 1px solid var(--border, #dfe4ea);
          border-radius: 18px;
          background: var(--surface, #fff);
          color: var(--text, #111827);
          box-shadow: 0 24px 70px rgba(15, 23, 42, .22);
        }

        .messages-module .message-detail-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .messages-module .message-detail-head button {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border, #dfe4ea);
          border-radius: 10px;
          background: var(--surface, #fff);
          color: var(--text, #334155);
          cursor: pointer;
        }

        .messages-module .message-detail-body {
          padding: 20px;
        }

        .messages-module .message-detail-body p {
          white-space: pre-wrap;
          line-height: 1.7;
          color: var(--text-secondary, #475569);
        }

        html[data-theme="dark"] .messages-module .messages-search,
        html[data-theme="dark"] .messages-module .messages-filter,
        html[data-theme="dark"] .messages-module .message-kpi,
        html[data-theme="dark"] .messages-module .message-row,
        html[data-theme="dark"] .messages-module .message-actions button,
        html[data-theme="dark"] .messages-module .message-actions select,
        html[data-theme="dark"] .messages-module .message-detail-card,
        html[data-theme="dark"] .messages-module .message-detail-head button {
          background: #15181d;
          border-color: #2b3139;
          color: #e5e7eb;
        }

        html[data-theme="dark"] .messages-module .message-client strong,
        html[data-theme="dark"] .messages-module .message-kpi strong {
          color: #f3f4f6;
        }

        @media (max-width: 900px) {
          .messages-module .message-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .messages-module .messages-toolbar {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .messages-module .message-grid {
            grid-template-columns: 1fr 1fr;
          }
          .messages-module .message-row {
            grid-template-columns: 1fr;
          }
          .messages-module .message-actions {
            justify-content: flex-start;
          }
          .messages-module .message-preview {
            white-space: normal;
          }
        }
      `}</style>

      <div className="heading">
        <div>
          <small>CLIENT COMMUNICATION</small>
          <h2>Messages</h2>
        </div>
      </div>

      <div className="message-grid">
        <div className="message-kpi">
          <span>TOTAL</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="message-kpi">
          <span>NEW</span>
          <strong>{stats.newCount}</strong>
        </div>
        <div className="message-kpi">
          <span>CONTACTED</span>
          <strong>{stats.contacted}</strong>
        </div>
        <div className="message-kpi">
          <span>CLOSED</span>
          <strong>{stats.closed}</strong>
        </div>
      </div>

      <section className="dashboard-card">
        <div className="messages-toolbar">
          <div className="messages-search-wrap">
            <Search className="messages-search-icon" size={17} />
            <input
              className="messages-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search client, email, service or message..."
            />
          </div>

          <select
            className="messages-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="message-list">
          {filtered.map((item) => {
            const currentStatus = String(item.status || "new").toLowerCase();

            return (
              <article className="message-row" key={item._id}>
                <div className="message-row-main">
                  <div className="message-client">
                    <div className="message-avatar">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <strong>{item.name || "Unknown client"}</strong>
                      <small>{item.email || "No email"}</small>
                    </div>
                  </div>

                  <div className="message-preview">
                    {item.message || "No message content"}
                  </div>

                  <div className="message-meta">
                    <span>{item.service || "General enquiry"}</span>
                    {item.packageName && <span>{item.packageName}</span>}
                    {item.createdAt && (
                      <span>
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="message-actions">
                  <span className={statusClass(currentStatus)}>
                    {statusLabel(currentStatus)}
                  </span>

                  <select
                    value={currentStatus}
                    onChange={(event) =>
                      handleStatusChange(item, event.target.value)
                    }
                    aria-label={`Status for ${item.name || "message"}`}
                  >
                    {STATUS_OPTIONS.filter(
                      (option) => option.value !== "all"
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleView(item)}
                  >
                    <Eye size={14} />
                    VIEW
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      if (window.confirm("Delete this message?")) {
                        del?.(item._id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}

          {!filtered.length && (
            <div className="message-empty">
              <MessageSquare size={22} />
              <p>
                {items.length
                  ? "No messages match the current search or filter."
                  : "No client messages yet."}
              </p>
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div className="message-detail" onMouseDown={() => setSelected(null)}>
          <div
            className="message-detail-card"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="message-detail-head">
              <div>
                <strong>{selected.name || "Unknown client"}</strong>
                <div className="message-meta">
                  <span>{selected.email || "No email"}</span>
                  {selected.phone && (
                    <span>
                      <Phone size={12} /> {selected.phone}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                aria-label="Close message"
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="message-detail-body">
              <div className="message-meta">
                <span>
                  {selected.service || "General enquiry"}
                </span>
                {selected.packageName && (
                  <span>{selected.packageName}</span>
                )}
                <span className={statusClass(selected.status)}>
                  {statusLabel(selected.status)}
                </span>
              </div>

              <p>{selected.message || "No message content."}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
