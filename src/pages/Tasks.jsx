import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_TOKEN_KEY = "balaji_admin_token";
const TEAM_TOKEN_KEY = "balaji_team_token";
const SESSION_KEY = "balaji_session_type";

function getDashboardToken() {
  const team = localStorage.getItem(SESSION_KEY) === "team";
  return localStorage.getItem(team ? TEAM_TOKEN_KEY : ADMIN_TOKEN_KEY);
}

const EMPTY_TASK = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  client: "",
  project: "",
  assignedTo: "",
};

async function api(path, options = {}) {
  const token = getDashboardToken();
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

function normaliseTask(task) {
  return {
    ...task,
    status:
      task.status === "in-progress" || task.status === "in_progress"
        ? "in-progress"
        : task.status === "completed"
          ? "completed"
          : task.status === "cancelled"
            ? "cancelled"
            : "todo",
    priority: ["low", "medium", "high", "urgent"].includes(task.priority)
      ? task.priority
      : "medium",
  };
}

function formatDueDate(value) {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "completed") return false;
  const end = new Date(task.dueDate);
  end.setHours(23, 59, 59, 999);
  return end < new Date();
}

export default function Tasks({ clients = [], projects = [], initialTasks = [] }) {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [modal, setModal] = useState(null);

  async function loadTasks() {
    try {
      setLoading(true);
      const result = await api("/tasks");
      const data = Array.isArray(result) ? result : result.data || [];
      setTasks(data.map(normaliseTask));
    } catch (error) {
      console.error("Tasks load error:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const stats = useMemo(() => {
    const overdue = tasks.filter(isOverdue).length;
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      progress: tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      overdue,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const clientName =
        task.client?.name ||
        clients.find((client) => client._id === task.client)?.name ||
        "";
      const projectName =
        task.project?.title ||
        projects.find((project) => project._id === task.project)?.title ||
        "";

      const matchesSearch =
        !q ||
        [task.title, task.description, clientName, projectName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, clients, projects, search, statusFilter, priorityFilter]);

  function openCreate() {
    setModal({ mode: "create", data: { ...EMPTY_TASK } });
  }

  function openEdit(task) {
    setModal({
      mode: "edit",
      data: {
        ...EMPTY_TASK,
        ...task,
        client: task.client?._id || task.client || "",
        project: task.project?._id || task.project || "",
        assignedTo: task.assignedTo?._id || task.assignedTo || "",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().slice(0, 10)
          : "",
      },
    });
  }

  async function saveTask(event) {
    event.preventDefault();
    const data = modal.data;

    if (!data.title.trim()) return;

    try {
      setSaving(true);

      const isEdit = modal.mode === "edit";
      const result = await api(isEdit ? `/tasks/${data._id}` : "/tasks", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description?.trim() || "",
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate || null,
          client: data.client || null,
          project: data.project || null,
          assignedTo: data.assignedTo || null,
        }),
      });

      const saved = normaliseTask(result.data || result.task || result);
      setTasks((current) =>
        isEdit
          ? current.map((item) => (item._id === saved._id ? saved : item))
          : [saved, ...current]
      );
      setModal(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    try {
      await api(`/tasks/${task._id}`, { method: "DELETE" });
      setTasks((current) => current.filter((item) => item._id !== task._id));
    } catch (error) {
      alert(error.message);
    }
  }

  async function changeStatus(task, status) {
    try {
      const result = await api(`/tasks/${task._id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      const updated = normaliseTask(result.data || result.task || { ...task, status });
      setTasks((current) =>
        current.map((item) => (item._id === task._id ? updated : item))
      );
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <section className="tasks-page">
      <style>{`
        .tasks-page {
          --task-bg: #0b0d0f;
          --task-panel: rgba(24, 27, 31, .82);
          --task-panel-2: rgba(18, 21, 24, .92);
          --task-border: rgba(255,255,255,.10);
          --task-text: #f4f5f7;
          --task-muted: #8d949d;
          --task-orange: #ff641f;
          --task-orange-soft: rgba(255,100,31,.12);
          --task-green: #42d392;
          width: min(100%, 1280px);
          margin: 0 auto;
          padding: 34px 0 70px;
          color: var(--task-text);
        }

        .tasks-page, .tasks-page * { box-sizing: border-box; }
        .tasks-page button, .tasks-page input, .tasks-page select, .tasks-page textarea {
          font: inherit;
        }
        .tasks-page button { border: 0; }
        .tasks-header {
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:24px;
          margin-bottom:28px;
        }
        .tasks-eyebrow, .tasks-card-label {
          display:block;
          color:var(--task-orange);
          font-size:10px;
          font-weight:900;
          letter-spacing:.18em;
          text-transform:uppercase;
          margin-bottom:7px;
        }
        .tasks-header h1 {
          margin:0;
          font-size:38px;
          line-height:1;
          letter-spacing:-.04em;
          font-weight:900;
        }
        .tasks-header p {
          margin:9px 0 0;
          color:var(--task-muted);
          font-size:14px;
        }
        .tasks-add {
          display:inline-flex;
          align-items:center;
          gap:8px;
          min-height:42px;
          padding:0 17px;
          border-radius:10px;
          color:#fff;
          background:linear-gradient(135deg,#ff762f,#f05213);
          font-size:12px;
          font-weight:900;
          letter-spacing:.06em;
          cursor:pointer;
          box-shadow:0 10px 28px rgba(255,91,22,.20);
        }
        .tasks-add:hover { transform:translateY(-1px); }

        .tasks-stats {
          display:grid;
          grid-template-columns:repeat(5,1fr);
          gap:12px;
          margin-bottom:18px;
        }
        .task-stat {
          position:relative;
          min-height:102px;
          padding:16px;
          border:1px solid var(--task-border);
          border-radius:14px;
          background:linear-gradient(145deg,rgba(31,35,40,.86),rgba(17,20,23,.78));
          overflow:hidden;
          box-shadow:0 18px 50px rgba(0,0,0,.20);
        }
        .task-stat:after {
          content:"";
          position:absolute;
          width:90px;height:90px;
          right:-35px;bottom:-45px;
          border-radius:50%;
          background:var(--task-orange-soft);
          filter:blur(8px);
        }
        .task-stat-icon {
          width:32px;height:32px;
          display:grid;place-items:center;
          border-radius:9px;
          color:var(--task-orange);
          background:var(--task-orange-soft);
          margin-bottom:12px;
        }
        .task-stat strong { display:block;font-size:25px;line-height:1; }
        .task-stat span:last-child {
          display:block;margin-top:5px;color:var(--task-muted);
          font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;
        }

        .tasks-toolbar {
          display:grid;
          grid-template-columns:minmax(0,1fr) 190px 190px;
          gap:10px;
          padding:12px;
          border:1px solid var(--task-border);
          border-radius:14px;
          background:rgba(21,24,28,.74);
          margin-bottom:18px;
          backdrop-filter:blur(18px);
        }
        .task-search, .task-select {
          min-height:44px;
          display:flex;
          align-items:center;
          gap:9px;
          padding:0 13px;
          border:1px solid rgba(255,255,255,.09);
          border-radius:10px;
          background:#0b0d0f;
          color:#747b83;
        }
        .task-search input, .task-select select {
          width:100%;
          min-width:0;
          color:#e8eaed;
          background:transparent;
          border:0;
          outline:0;
        }
        .task-select select { appearance:auto; }
        .task-search input::placeholder { color:#6f757c; }

        .tasks-list-card {
          border:1px solid var(--task-border);
          border-radius:16px;
          background:linear-gradient(145deg,rgba(25,29,33,.88),rgba(16,19,22,.90));
          overflow:hidden;
        }
        .tasks-list-head {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          padding:18px 20px;
          border-bottom:1px solid var(--task-border);
        }
        .tasks-list-head h2 { margin:0;font-size:18px;letter-spacing:-.02em; }
        .tasks-count { color:var(--task-muted);font-size:12px; }
        .task-row {
          display:grid;
          grid-template-columns:minmax(0,1fr) 130px 130px 145px 112px;
          align-items:center;
          gap:16px;
          padding:17px 20px;
          border-bottom:1px solid rgba(255,255,255,.055);
        }
        .task-row:last-child { border-bottom:0; }
        .task-main { min-width:0;display:flex;align-items:flex-start;gap:12px; }
        .task-check {
          flex:0 0 auto;
          width:34px;height:34px;
          display:grid;place-items:center;
          border:1px solid rgba(255,255,255,.11);
          border-radius:9px;
          background:#101316;
          color:var(--task-muted);
          cursor:pointer;
        }
        .task-check.done { color:var(--task-green);border-color:rgba(66,211,146,.25); }
        .task-title { margin:0;color:#f1f2f4;font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .task-description { margin:5px 0 0;color:var(--task-muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .task-meta { min-width:0;color:#b4bac1;font-size:11px; }
        .task-pill {
          display:inline-flex;align-items:center;gap:6px;
          width:max-content;
          padding:6px 9px;
          border-radius:999px;
          font-size:9px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;
          background:#101316;border:1px solid rgba(255,255,255,.08);
        }
        .task-pill.todo { color:#b6bdc6; }
        .task-pill.in-progress { color:#ffb36e;background:rgba(255,126,44,.10); }
        .task-pill.completed { color:var(--task-green);background:rgba(66,211,146,.09); }
        .task-pill.cancelled { color:#ff7b86;background:rgba(255,76,91,.08); }
        .task-priority.low { color:#7fc7ff; }
        .task-priority.medium { color:#c9ced5; }
        .task-priority.high { color:#ffb15c; }
        .task-priority.urgent { color:#ff6570; }
        .task-due { display:flex;align-items:center;gap:7px;color:#adb3bb;font-size:11px; }
        .task-due.overdue { color:#ff6570; }
        .task-actions { display:flex;justify-content:flex-end;gap:7px; }
        .task-action {
          width:34px;height:34px;
          display:grid;place-items:center;
          border:1px solid rgba(255,255,255,.08);
          border-radius:9px;
          background:#101316;color:#aeb4bc;cursor:pointer;
        }
        .task-action:hover { color:#fff;border-color:rgba(255,255,255,.18); }
        .task-action.danger:hover { color:#ff6570;border-color:rgba(255,101,112,.28); }

        .tasks-empty {
          padding:70px 20px;
          text-align:center;
        }
        .tasks-empty-icon {
          width:52px;height:52px;display:grid;place-items:center;
          margin:0 auto 14px;border-radius:14px;
          color:var(--task-orange);background:var(--task-orange-soft);
        }
        .tasks-empty h3 { margin:0;font-size:17px; }
        .tasks-empty p { margin:7px 0 17px;color:var(--task-muted);font-size:12px; }

        .task-backdrop {
          position:fixed;inset:0;z-index:1000;
          display:grid;place-items:center;
          padding:20px;
          background:rgba(0,0,0,.72);
          backdrop-filter:blur(12px);
        }
        .task-modal {
          width:min(680px,100%);
          max-height:90vh;
          overflow:auto;
          border:1px solid rgba(255,255,255,.12);
          border-radius:17px;
          background:#15181b;
          box-shadow:0 30px 100px rgba(0,0,0,.60);
        }
        .task-modal-head {
          display:flex;align-items:center;justify-content:space-between;
          padding:18px 20px;border-bottom:1px solid var(--task-border);
        }
        .task-modal-head h2 { margin:0;font-size:18px; }
        .task-close { width:34px;height:34px;display:grid;place-items:center;border-radius:9px;background:#0d1012;color:#aeb4bb;cursor:pointer; }
        .task-form { display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:20px; }
        .task-form label { display:grid;gap:7px;color:#aeb4bb;font-size:9px;font-weight:900;letter-spacing:.10em;text-transform:uppercase; }
        .task-form .full { grid-column:1 / -1; }
        .task-form input,.task-form select,.task-form textarea {
          width:100%;border:1px solid rgba(255,255,255,.09);outline:0;
          border-radius:9px;background:#0d1012;color:#f0f2f4;
          min-height:42px;padding:0 11px;font-size:12px;
        }
        .task-form textarea { padding:11px;min-height:92px;resize:vertical; }
        .task-form input:focus,.task-form select:focus,.task-form textarea:focus { border-color:rgba(255,100,31,.45); }
        .task-modal-actions {
          display:flex;justify-content:flex-end;gap:9px;
          padding:0 20px 20px;
        }
        .task-secondary,.task-primary {
          min-height:40px;padding:0 15px;border-radius:9px;cursor:pointer;font-size:11px;font-weight:900;
        }
        .task-secondary { color:#c7ccd2;background:#0d1012;border:1px solid rgba(255,255,255,.08); }
        .task-primary { color:#fff;background:linear-gradient(135deg,#ff762f,#f05213); }

        @media (max-width: 1000px) {
          .tasks-stats { grid-template-columns:repeat(3,1fr); }
          .task-row { grid-template-columns:minmax(0,1fr) 120px 110px 130px; }
          .task-row > .task-meta:nth-child(3) { display:none; }
        }
        @media (max-width: 760px) {
          .tasks-page { padding:24px 0 50px; }
          .tasks-header { align-items:flex-start;flex-direction:column; }
          .tasks-header h1 { font-size:31px; }
          .tasks-add { width:100%;justify-content:center; }
          .tasks-stats { grid-template-columns:1fr 1fr; }
          .tasks-toolbar { grid-template-columns:1fr; }
          .task-row { grid-template-columns:1fr auto;gap:12px; }
          .task-row > .task-meta { display:none; }
          .task-actions { grid-column:2;grid-row:1; }
          .task-form { grid-template-columns:1fr; }
          .task-form .full { grid-column:auto; }
        }
        @media (max-width: 480px) {
          .tasks-stats { grid-template-columns:1fr; }
          .tasks-list-head { padding:15px; }
          .task-row { padding:15px; }
        }
      `}</style>

      <div className="tasks-header">
        <div>
          <span className="tasks-eyebrow">WORKFLOW</span>
          <h1>TASKS</h1>
          <p>Manage work, deadlines and team workflow.</p>
        </div>
        <button type="button" className="tasks-add" onClick={openCreate}>
          <Plus size={16} /> ADD TASK
        </button>
      </div>

      <div className="tasks-stats">
        <div className="task-stat">
          <div className="task-stat-icon"><ListChecks size={17} /></div>
          <strong>{stats.total}</strong>
          <span>Total Tasks</span>
        </div>
        <div className="task-stat">
          <div className="task-stat-icon"><Clock3 size={17} /></div>
          <strong>{stats.todo}</strong>
          <span>To Do</span>
        </div>
        <div className="task-stat">
          <div className="task-stat-icon"><AlertTriangle size={17} /></div>
          <strong>{stats.progress}</strong>
          <span>In Progress</span>
        </div>
        <div className="task-stat">
          <div className="task-stat-icon"><CheckCircle2 size={17} /></div>
          <strong>{stats.completed}</strong>
          <span>Completed</span>
        </div>
        <div className="task-stat">
          <div className="task-stat-icon"><CalendarDays size={17} /></div>
          <strong>{stats.overdue}</strong>
          <span>Overdue</span>
        </div>
      </div>

      <div className="tasks-toolbar">
        <label className="task-search">
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks..."
          />
        </label>

        <label className="task-select">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">ALL STATUS</option>
            <option value="todo">TO DO</option>
            <option value="in-progress">IN PROGRESS</option>
            <option value="completed">COMPLETED</option>
            <option value="cancelled">CANCELLED</option>
          </select>
        </label>

        <label className="task-select">
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">ALL PRIORITY</option>
            <option value="low">LOW</option>
            <option value="medium">MEDIUM</option>
            <option value="high">HIGH</option>
            <option value="urgent">URGENT</option>
          </select>
        </label>
      </div>

      <section className="tasks-list-card">
        <div className="tasks-list-head">
          <div>
            <span className="tasks-card-label">TASK MANAGEMENT</span>
            <h2>{filteredTasks.length} TASK{filteredTasks.length === 1 ? "" : "S"}</h2>
          </div>
          <span className="tasks-count">
            {filteredTasks.length === tasks.length
              ? `${tasks.length} total`
              : `Showing ${filteredTasks.length} of ${tasks.length}`}
          </span>
        </div>

        {!loading && !filteredTasks.length ? (
          <div className="tasks-empty">
            <div className="tasks-empty-icon"><ListChecks size={25} /></div>
            <h3>No tasks found</h3>
            <p>Create your first task to start managing work.</p>
            <button type="button" className="tasks-add" onClick={openCreate}>
              <Plus size={16} /> CREATE TASK
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const clientName =
              task.client?.name ||
              clients.find((client) => client._id === task.client)?.name ||
              "Unassigned client";
            const projectName =
              task.project?.title ||
              projects.find((project) => project._id === task.project)?.title ||
              "No project";
            const overdue = isOverdue(task);

            return (
              <article className="task-row" key={task._id}>
                <div className="task-main">
                  <button
                    type="button"
                    className={`task-check ${task.status === "completed" ? "done" : ""}`}
                    title="Mark completed"
                    onClick={() =>
                      changeStatus(
                        task,
                        task.status === "completed" ? "todo" : "completed"
                      )
                    }
                  >
                    <CheckCircle2 size={17} />
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="task-title">{task.title}</h3>
                    <p className="task-description">
                      {task.description || `${clientName} · ${projectName}`}
                    </p>
                  </div>
                </div>

                <div className="task-meta">
                  <span className={`task-pill ${task.status}`}>
                    {task.status === "in-progress" ? "In Progress" : task.status}
                  </span>
                </div>

                <div className="task-meta">
                  <span className={`task-priority ${task.priority}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>

                <div className={`task-due ${overdue ? "overdue" : ""}`}>
                  <CalendarDays size={14} />
                  {overdue ? "OVERDUE · " : ""}
                  {formatDueDate(task.dueDate)}
                </div>

                <div className="task-actions">
                  <button
                    type="button"
                    className="task-action"
                    onClick={() => openEdit(task)}
                    title="Edit task"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="task-action danger"
                    onClick={() => removeTask(task)}
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {modal && (
        <div className="task-backdrop" onMouseDown={() => setModal(null)}>
          <div className="task-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="task-modal-head">
              <h2>{modal.mode === "edit" ? "EDIT TASK" : "CREATE TASK"}</h2>
              <button
                type="button"
                className="task-close"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form className="task-form" onSubmit={saveTask}>
              <label className="full">
                Task title
                <input
                  value={modal.data.title}
                  onChange={(event) =>
                    setModal((current) => ({
                      ...current,
                      data: { ...current.data, title: event.target.value },
                    }))
                  }
                  placeholder="e.g. Finish BalajiInfoTech homepage"
                  autoFocus
                  required
                />
              </label>

              <label className="full">
                Description
                <textarea
                  value={modal.data.description}
                  onChange={(event) =>
                    setModal((current) => ({
                      ...current,
                      data: { ...current.data, description: event.target.value },
                    }))
                  }
                  placeholder="Add task details..."
                />
              </label>

              <label>
                Status
                <select
                  value={modal.data.status}
                  onChange={(event) =>
                    setModal((current) => ({
                      ...current,
                      data: { ...current.data, status: event.target.value },
                    }))
                  }
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label>
                Priority
                <select
                  value={modal.data.priority}
                  onChange={(event) =>
                    setModal((current) => ({
                      ...current,
                      data: { ...current.data, priority: event.target.value },
                    }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              <label>
                Due date
                <input
                  type="date"
                  value={modal.data.dueDate}
                  onChange={(event) =>
                    setModal((current) => ({
                      ...current,
                      data: { ...current.data, dueDate: event.target.value },
                    }))
                  }
                />
              </label>

              <label>
                Client
                <select
                  value={modal.data.client}
                  onChange={(event) =>
                    setModal((current) => ({
                      ...current,
                      data: { ...current.data, client: event.target.value },
                    }))
                  }
                >
                  <option value="">No client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Project
                <select
                  value={modal.data.project}
                  onChange={(event) =>
                    setModal((current) => ({
                      ...current,
                      data: { ...current.data, project: event.target.value },
                    }))
                  }
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Assigned to
                <div style={{ position: "relative" }}>
                  <UserRound
                    size={15}
                    style={{
                      position: "absolute",
                      left: 11,
                      top: 13,
                      color: "#727980",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    value={modal.data.assignedTo}
                    onChange={(event) =>
                      setModal((current) => ({
                        ...current,
                        data: {
                          ...current.data,
                          assignedTo: event.target.value,
                        },
                      }))
                    }
                    placeholder="Team member ID"
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </label>

              <div className="task-modal-actions full">
                <button
                  type="button"
                  className="task-secondary"
                  onClick={() => setModal(null)}
                  disabled={saving}
                >
                  CANCEL
                </button>
                <button type="submit" className="task-primary" disabled={saving}>
                  {saving ? "SAVING..." : modal.mode === "edit" ? "SAVE CHANGES" : "CREATE TASK"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
