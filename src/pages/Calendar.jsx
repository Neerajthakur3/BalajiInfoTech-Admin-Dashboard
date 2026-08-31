import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  BriefcaseBusiness,
  FileText,
  CheckSquare,
} from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function Calendar({
  tasks = [],
  projects = [],
  invoices = [],
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));

  const events = useMemo(() => {
    const result = [];

    tasks.forEach((task) => {
      const raw = task.dueDate || task.deadline || task.date;
      if (!raw) return;
      const key = dateKey(raw);
      if (!key) return;

      result.push({
        id: `task-${task._id || Math.random()}`,
        date: key,
        type: "task",
        title: task.title || task.name || "Task",
        detail: task.status || "Task",
        icon: CheckSquare,
      });
    });

    invoices.forEach((invoice) => {
      const raw = invoice.dueDate;
      if (!raw) return;
      const key = dateKey(raw);
      if (!key) return;

      result.push({
        id: `invoice-${invoice._id || Math.random()}`,
        date: key,
        type: "invoice",
        title: invoice.invoiceNumber || "Invoice",
        detail: `₹${Number(invoice.total || 0).toLocaleString("en-IN")}`,
        icon: FileText,
      });
    });

    projects.forEach((project) => {
      const raw = project.deadline || project.dueDate || project.updatedAt;
      if (!raw) return;
      const key = dateKey(raw);
      if (!key) return;

      result.push({
        id: `project-${project._id || Math.random()}`,
        date: key,
        type: "project",
        title: project.title || project.name || "Project",
        detail: project.category || "Project",
        icon: BriefcaseBusiness,
      });
    });

    return result;
  }, [tasks, projects, invoices]);

  const monthDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const leading = first.getDay();
    const total = last.getDate();
    const cells = [];

    for (let i = 0; i < leading; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= total; day += 1) {
      cells.push(new Date(year, month, day));
    }

    return cells;
  }, [cursor]);

  const selectedEvents = events.filter((event) => event.date === selectedDate);

  function changeMonth(offset) {
    setCursor((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + offset);
      return next;
    });
  }

  function goToday() {
    const today = new Date();
    setCursor(today);
    setSelectedDate(dateKey(today));
  }

  return (
    <section className="content calendar-module">
      <style>{`
        .calendar-module .calendar-head {
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:18px;
          margin-bottom:18px;
        }
        .calendar-module .calendar-head small {
          color:#ff5a00;
          font-weight:900;
          letter-spacing:.18em;
        }
        .calendar-module .calendar-head h2 {
          margin:5px 0 0;
          color:var(--text,#111827);
        }
        .calendar-module .calendar-actions {
          display:flex;
          gap:8px;
        }
        .calendar-module .calendar-actions button {
          min-height:40px;
          border:1px solid var(--border,#dfe4ea);
          border-radius:10px;
          background:var(--surface,#fff);
          color:var(--text,#334155);
          padding:0 11px;
          font-weight:800;
          cursor:pointer;
        }
        .calendar-module .calendar-actions .today {
          color:#ff5a00;
        }
        .calendar-module .calendar-layout {
          display:grid;
          grid-template-columns:minmax(0,1fr) 310px;
          gap:18px;
        }
        .calendar-module .calendar-card,
        .calendar-module .agenda-card {
          border:1px solid var(--border,#dfe4ea);
          border-radius:15px;
          background:var(--surface,#fff);
        }
        .calendar-module .calendar-card {
          padding:18px;
        }
        .calendar-module .month-title {
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:16px;
        }
        .calendar-module .month-title strong {
          color:var(--text,#111827);
          font-size:17px;
        }
        .calendar-module .weekdays,
        .calendar-module .days {
          display:grid;
          grid-template-columns:repeat(7,minmax(0,1fr));
        }
        .calendar-module .weekday {
          padding:8px 4px;
          text-align:center;
          color:#64748b;
          font-size:10px;
          font-weight:900;
        }
        .calendar-module .day {
          min-height:82px;
          padding:7px;
          border:1px solid var(--border,#edf0f3);
          background:transparent;
          color:var(--text,#111827);
          text-align:left;
          cursor:pointer;
        }
        .calendar-module .day:hover {
          background:rgba(255,90,0,.05);
        }
        .calendar-module .day.empty {
          cursor:default;
          background:var(--muted-surface,#f8fafc);
        }
        .calendar-module .day.selected {
          box-shadow:inset 0 0 0 2px #ff5a00;
        }
        .calendar-module .day.today {
          background:rgba(255,90,0,.07);
        }
        .calendar-module .day-number {
          display:block;
          font-size:12px;
          font-weight:900;
          margin-bottom:5px;
        }
        .calendar-module .event-dot {
          display:block;
          overflow:hidden;
          margin-top:3px;
          padding:3px 5px;
          border-radius:5px;
          background:rgba(255,90,0,.09);
          color:#c2410c;
          font-size:9px;
          font-weight:800;
          white-space:nowrap;
          text-overflow:ellipsis;
        }
        .calendar-module .agenda-card {
          padding:18px;
        }
        .calendar-module .agenda-card h3 {
          margin:0;
          color:var(--text,#111827);
          font-size:16px;
        }
        .calendar-module .agenda-date {
          display:flex;
          align-items:center;
          gap:7px;
          margin:7px 0 16px;
          color:#64748b;
          font-size:11px;
        }
        .calendar-module .agenda-list {
          display:grid;
          gap:9px;
        }
        .calendar-module .agenda-item {
          display:flex;
          gap:10px;
          padding:11px;
          border:1px solid var(--border,#e5e7eb);
          border-radius:10px;
        }
        .calendar-module .agenda-icon {
          width:32px;
          height:32px;
          display:grid;
          place-items:center;
          border-radius:9px;
          background:rgba(255,90,0,.09);
          color:#ff5a00;
          flex:0 0 auto;
        }
        .calendar-module .agenda-item strong {
          display:block;
          color:var(--text,#111827);
          font-size:12px;
        }
        .calendar-module .agenda-item span {
          color:#64748b;
          font-size:10px;
        }
        .calendar-module .empty-agenda {
          padding:25px 8px;
          text-align:center;
          color:#64748b;
          font-size:12px;
        }
        html[data-theme="dark"] .calendar-module .calendar-actions button,
        html[data-theme="dark"] .calendar-module .calendar-card,
        html[data-theme="dark"] .calendar-module .agenda-card {
          background:#15181d;
          border-color:#2b3139;
          color:#e5e7eb;
        }
        html[data-theme="dark"] .calendar-module .calendar-head h2,
        html[data-theme="dark"] .calendar-module .month-title strong,
        html[data-theme="dark"] .calendar-module .day,
        html[data-theme="dark"] .calendar-module .agenda-card h3,
        html[data-theme="dark"] .calendar-module .agenda-item strong {
          color:#f3f4f6;
        }
        html[data-theme="dark"] .calendar-module .day.empty {
          background:#101215;
        }
        @media (max-width:900px) {
          .calendar-module .calendar-layout {
            grid-template-columns:1fr;
          }
        }
        @media (max-width:560px) {
          .calendar-module .calendar-head {
            align-items:stretch;
            flex-direction:column;
          }
          .calendar-module .day {
            min-height:62px;
            padding:5px;
          }
          .calendar-module .event-dot {
            font-size:8px;
          }
        }
      `}</style>

      <div className="calendar-head">
        <div>
          <small>SCHEDULE & DEADLINES</small>
          <h2>Calendar</h2>
        </div>
        <div className="calendar-actions">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={17} />
          </button>
          <button type="button" className="today" onClick={goToday}>
            TODAY
          </button>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="month-title">
            <strong>
              {cursor.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <span>{events.length} scheduled items</span>
          </div>

          <div className="weekdays">
            {DAY_NAMES.map((day) => (
              <div className="weekday" key={day}>{day}</div>
            ))}
          </div>

          <div className="days">
            {monthDays.map((day, index) => {
              if (!day) {
                return <div className="day empty" key={`empty-${index}`} />;
              }

              const key = dateKey(day);
              const dayEvents = events.filter((event) => event.date === key);
              const isSelected = key === selectedDate;
              const isToday = key === dateKey(new Date());

              return (
                <button
                  type="button"
                  className={`day ${isSelected ? "selected" : ""} ${
                    isToday ? "today" : ""
                  }`}
                  key={key}
                  onClick={() => setSelectedDate(key)}
                >
                  <span className="day-number">{day.getDate()}</span>
                  {dayEvents.slice(0, 3).map((event) => (
                    <span className="event-dot" key={event.id}>
                      {event.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="event-dot">+{dayEvents.length - 3} more</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="agenda-card">
          <h3>Selected Day</h3>
          <div className="agenda-date">
            <CalendarDays size={14} />
            {selectedDate ? formatDate(new Date(`${selectedDate}T12:00:00`)) : "Select a date"}
          </div>

          <div className="agenda-list">
            {selectedEvents.map((event) => {
              const Icon = event.icon || Clock3;
              return (
                <div className="agenda-item" key={event.id}>
                  <div className="agenda-icon">
                    <Icon size={15} />
                  </div>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.detail}</span>
                  </div>
                </div>
              );
            })}

            {!selectedEvents.length && (
              <div className="empty-agenda">
                No tasks, invoices or project dates on this day.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
