import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  UserRound,
  ShieldCheck,
  Power,
  X,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ADMIN_TOKEN_KEY = "balaji_admin_token";
const TEAM_TOKEN_KEY = "balaji_team_token";
const SESSION_KEY = "balaji_session_type";

const ROLES = [
  { value: "manager", label: "Manager" },
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "seo", label: "SEO" },
  { value: "social_media", label: "Social Media" },
  { value: "support", label: "Support" },
  { value: "staff", label: "Staff" },
];

const PERMISSIONS = [
  { value: "dashboard.view", label: "Dashboard" },
  { value: "projects.view", label: "View Projects" },
  { value: "projects.manage", label: "Manage Projects" },
  { value: "clients.view", label: "View Clients" },
  { value: "clients.manage", label: "Manage Clients" },
  { value: "enquiries.view", label: "View Enquiries" },
  { value: "enquiries.manage", label: "Manage Enquiries" },
  { value: "tasks.view", label: "View Tasks" },
  { value: "tasks.manage", label: "Manage Tasks" },
  { value: "invoices.view", label: "View Invoices" },
  { value: "invoices.manage", label: "Manage Invoices" },
  { value: "payments.view", label: "View Payments" },
  { value: "payments.manage", label: "Manage Payments" },
  { value: "seo.view", label: "View SEO" },
  { value: "seo.manage", label: "Manage SEO" },
  { value: "social.view", label: "View Social Media" },
  { value: "social.manage", label: "Manage Social Media" },
  { value: "reports.view", label: "View Reports" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "staff",
  permissions: [],
};

async function api(path, options = {}) {
  const sessionType = localStorage.getItem(SESSION_KEY);
  const tokenKey =
    sessionType === "team"
      ? TEAM_TOKEN_KEY
      : ADMIN_TOKEN_KEY;
  const token = localStorage.getItem(tokenKey);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

function roleLabel(role) {
  return (
    ROLES.find(
      (item) => item.value === role
    )?.label || role || "Staff"
  );
}

function memberId(member) {
  return member?._id || member?.id;
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("all");

  const [modal, setModal] = useState(null);

  async function loadMembers() {
    try {
      setLoading(true);

      const result = await api("/team");

      const data = Array.isArray(result)
        ? result
        : result.data || [];

      setMembers(data);
    } catch (error) {
      console.error(
        "Team members load error:",
        error
      );

      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        [
          member.name,
          member.email,
          member.role,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      const matchesRole =
        roleFilter === "all" ||
        member.role === roleFilter;

      return (
        matchesSearch &&
        matchesRole
      );
    });
  }, [
    members,
    search,
    roleFilter,
  ]);

  const stats = useMemo(
    () => ({
      total: members.length,

      active: members.filter(
        (member) =>
          member.isActive !== false
      ).length,

      inactive: members.filter(
        (member) =>
          member.isActive === false
      ).length,

      managers: members.filter(
        (member) =>
          member.role === "manager"
      ).length,
    }),
    [members]
  );

  function openCreate() {
    setModal({
      mode: "create",
      data: {
        ...EMPTY_FORM,
        permissions: [],
      },
    });
  }

  function openEdit(member) {
    setModal({
      mode: "edit",
      data: {
        name: member.name || "",
        email: member.email || "",
        password: "",
        role: member.role || "staff",
        permissions: Array.isArray(
          member.permissions
        )
          ? member.permissions
          : [],
        _id: memberId(member),
      },
    });
  }

  function closeModal() {
    if (saving) return;

    setModal(null);
  }

  function updateField(
    field,
    value
  ) {
    setModal((current) => ({
      ...current,
      data: {
        ...current.data,
        [field]: value,
      },
    }));
  }

  function togglePermission(
    permission
  ) {
    setModal((current) => {
      const currentPermissions =
        current.data.permissions || [];

      const exists =
        currentPermissions.includes(
          permission
        );

      return {
        ...current,
        data: {
          ...current.data,
          permissions: exists
            ? currentPermissions.filter(
                (item) =>
                  item !== permission
              )
            : [
                ...currentPermissions,
                permission,
              ],
        },
      };
    });
  }

  function selectAllPermissions() {
    updateField(
      "permissions",
      PERMISSIONS.map(
        (item) => item.value
      )
    );
  }

  function clearPermissions() {
    updateField(
      "permissions",
      []
    );
  }

  async function saveMember(event) {
    event.preventDefault();

    if (!modal?.data.name.trim()) {
      alert("Name is required.");
      return;
    }

    if (!modal?.data.email.trim()) {
      alert("Email is required.");
      return;
    }

    if (
      modal.mode === "create" &&
      (!modal.data.password ||
        modal.data.password.length < 8)
    ) {
      alert(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (
      modal.mode === "edit" &&
      modal.data.password &&
      modal.data.password.length < 8
    ) {
      alert(
        "Password must be at least 8 characters long."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: modal.data.name.trim(),
        email:
          modal.data.email
            .trim()
            .toLowerCase(),
        role: modal.data.role,
        permissions:
          modal.data.permissions || [],
      };

      if (modal.data.password) {
        payload.password =
          modal.data.password;
      }

      const isEdit =
        modal.mode === "edit";

      const result = await api(
        isEdit
          ? `/team/${modal.data._id}`
          : "/team",
        {
          method: isEdit
            ? "PUT"
            : "POST",
          body: JSON.stringify(
            payload
          ),
        }
      );

      const saved =
        result.data;

      if (isEdit) {
        setMembers(
          (current) =>
            current.map(
              (member) =>
                memberId(member) ===
                memberId(saved)
                  ? {
                      ...member,
                      ...saved,
                    }
                  : member
            )
        );
      } else {
        setMembers(
          (current) => [
            saved,
            ...current,
          ]
        );
      }

      setModal(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    member
  ) {
    try {
      const result = await api(
        `/team/${memberId(
          member
        )}/status`,
        {
          method: "PATCH",
        }
      );

      const updated =
        result.data;

      setMembers(
        (current) =>
          current.map(
            (item) =>
              memberId(item) ===
              memberId(member)
                ? {
                    ...item,
                    ...updated,
                  }
                : item
          )
      );
    } catch (error) {
      alert(error.message);
    }
  }

  async function deleteMember(
    member
  ) {
    const confirmed =
      window.confirm(
        `Delete team member "${member.name}"?`
      );

    if (!confirmed) return;

    try {
      await api(
        `/team/${memberId(
          member
        )}`,
        {
          method: "DELETE",
        }
      );

      setMembers(
        (current) =>
          current.filter(
            (item) =>
              memberId(item) !==
              memberId(member)
          )
      );
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <section className="team-page">
      <style>{`
        .team-page {
          --team-orange: #ff641f;
          --team-green: #42d392;
          --team-red: #ff6872;
          --team-bg: #0b0d0f;
          --team-panel: rgba(22,25,29,.88);
          --team-border: rgba(255,255,255,.09);
          --team-text: #f3f4f6;
          --team-muted: #8c939b;

          width: min(100%, 1280px);
          margin: 0 auto;
          padding: 34px 0 70px;
          color: var(--team-text);
        }

        .team-page,
        .team-page * {
          box-sizing: border-box;
        }

        .team-page button,
        .team-page input,
        .team-page select {
          font: inherit;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 28px;
        }

        .team-eyebrow {
          display: block;
          margin-bottom: 7px;
          color: var(--team-orange);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .team-header h1 {
          margin: 0;
          font-size: 38px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -.04em;
        }

        .team-header p {
          margin: 9px 0 0;
          color: var(--team-muted);
          font-size: 14px;
        }

        .team-add {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 17px;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            #ff762f,
            #f05213
          );
          color: #fff;
          cursor: pointer;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .07em;
          box-shadow:
            0 10px 30px
            rgba(255,91,22,.2);
        }

        .team-stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .team-stat {
          min-height: 105px;
          padding: 16px;
          border: 1px solid
            var(--team-border);
          border-radius: 14px;
          background:
            linear-gradient(
              145deg,
              rgba(31,35,40,.86),
              rgba(17,20,23,.78)
            );
        }

        .team-stat-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          margin-bottom: 11px;
          border-radius: 9px;
          color: var(--team-orange);
          background: rgba(
            255,
            100,
            31,
            .11
          );
        }

        .team-stat strong {
          display: block;
          font-size: 25px;
          line-height: 1;
        }

        .team-stat span {
          display: block;
          margin-top: 5px;
          color: var(--team-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .team-toolbar {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr) 190px;
          gap: 10px;
          padding: 12px;
          margin-bottom: 18px;
          border: 1px solid
            var(--team-border);
          border-radius: 14px;
          background:
            rgba(21,24,28,.74);
          backdrop-filter: blur(18px);
        }

        .team-search {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 44px;
          padding: 0 13px;
          border: 1px solid
            rgba(255,255,255,.08);
          border-radius: 10px;
          background: #0b0d0f;
          color: #747b83;
        }

        .team-search input,
        .team-filter select {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #e8eaed;
        }

        .team-filter {
          display: flex;
          align-items: center;
          min-height: 44px;
          padding: 0 12px;
          border: 1px solid
            rgba(255,255,255,.08);
          border-radius: 10px;
          background: #0b0d0f;
        }

        .team-card {
          overflow: hidden;
          border: 1px solid
            var(--team-border);
          border-radius: 16px;
          background:
            linear-gradient(
              145deg,
              rgba(25,29,33,.88),
              rgba(16,19,22,.9)
            );
        }

        .team-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-bottom: 1px solid
            var(--team-border);
        }

        .team-card-head h2 {
          margin: 0;
          font-size: 18px;
        }

        .team-count {
          color: var(--team-muted);
          font-size: 11px;
        }

        .member-row {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            145px
            105px
            110px;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid
            rgba(255,255,255,.055);
        }

        .member-row:last-child {
          border-bottom: 0;
        }

        .member-main {
          display: flex;
          align-items: center;
          min-width: 0;
          gap: 12px;
        }

        .member-avatar {
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: var(--team-orange);
          background:
            rgba(255,100,31,.1);
          border: 1px solid
            rgba(255,100,31,.14);
        }

        .member-info {
          min-width: 0;
        }

        .member-name {
          margin: 0;
          color: #f2f3f5;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-email {
          margin: 4px 0 0;
          color: var(--team-muted);
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-role {
          display: inline-flex;
          width: max-content;
          padding: 6px 9px;
          border-radius: 999px;
          color: #ffb27b;
          background:
            rgba(255,100,31,.08);
          border: 1px solid
            rgba(255,100,31,.14);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .member-permissions {
          color: var(--team-muted);
          font-size: 10px;
        }

        .member-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: max-content;
          font-size: 10px;
          font-weight: 800;
        }

        .member-status.active {
          color: var(--team-green);
        }

        .member-status.inactive {
          color: var(--team-red);
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .member-actions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
        }

        .member-action {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(255,255,255,.08);
          border-radius: 9px;
          background: #101316;
          color: #aeb4bc;
          cursor: pointer;
        }

        .member-action:hover {
          color: #fff;
          border-color:
            rgba(255,255,255,.18);
        }

        .member-action.danger:hover {
          color: var(--team-red);
          border-color:
            rgba(255,104,114,.25);
        }

        .team-empty {
          padding: 70px 20px;
          text-align: center;
        }

        .team-empty-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          border-radius: 14px;
          color: var(--team-orange);
          background:
            rgba(255,100,31,.11);
        }

        .team-empty h3 {
          margin: 0;
          font-size: 17px;
        }

        .team-empty p {
          margin: 7px 0 17px;
          color: var(--team-muted);
          font-size: 12px;
        }

        .team-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 20px;
          background:
            rgba(0,0,0,.72);
          backdrop-filter: blur(12px);
        }

        .team-modal {
          width: min(700px,100%);
          max-height: 90vh;
          overflow: auto;
          border: 1px solid
            rgba(255,255,255,.12);
          border-radius: 17px;
          background: #15181b;
          box-shadow:
            0 30px 100px
            rgba(0,0,0,.6);
        }

        .team-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid
            var(--team-border);
        }

        .team-modal-head h2 {
          margin: 0;
          font-size: 18px;
        }

        .team-close {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #0d1012;
          color: #aeb4bb;
          cursor: pointer;
        }

        .team-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          padding: 20px;
        }

        .team-form label {
          display: grid;
          gap: 7px;
          color: #aeb4bb;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .team-form .full {
          grid-column: 1 / -1;
        }

        .team-form input,
        .team-form select {
          width: 100%;
          min-height: 42px;
          padding: 0 11px;
          border: 1px solid
            rgba(255,255,255,.09);
          border-radius: 9px;
          outline: 0;
          background: #0d1012;
          color: #f0f2f4;
          font-size: 12px;
        }

        .permission-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 4px;
        }

        .permission-buttons {
          display: flex;
          gap: 7px;
        }

        .permission-buttons button {
          padding: 5px 8px;
          border: 1px solid
            rgba(255,255,255,.08);
          border-radius: 7px;
          background: #0d1012;
          color: #aeb4bb;
          cursor: pointer;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .05em;
        }

        .permissions-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 7px;
          margin-top: 9px;
          padding: 11px;
          border: 1px solid
            rgba(255,255,255,.07);
          border-radius: 10px;
          background: #0d1012;
        }

        .permission-item {
          display: flex !important;
          grid-template-columns: none !important;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 7px;
          color: #adb3bb !important;
          font-size: 9px !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
        }

        .permission-item:hover {
          background:
            rgba(255,255,255,.035);
        }

        .permission-item input {
          width: 14px !important;
          min-height: 14px !important;
          accent-color:
            var(--team-orange);
        }

        .team-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 0 20px 20px;
        }

        .team-secondary,
        .team-primary {
          min-height: 40px;
          padding: 0 15px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 900;
        }

        .team-secondary {
          color: #c7ccd2;
          background: #0d1012;
          border: 1px solid
            rgba(255,255,255,.08);
        }

        .team-primary {
          color: #fff;
          background:
            linear-gradient(
              135deg,
              #ff762f,
              #f05213
            );
        }

        @media (max-width: 1000px) {
          .team-stats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .member-row {
            grid-template-columns:
              minmax(0,1fr)
              130px
              100px;
          }

          .member-permissions {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .team-page {
            padding: 24px 0 50px;
          }

          .team-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .team-header h1 {
            font-size: 31px;
          }

          .team-add {
            width: 100%;
          }

          .team-stats {
            grid-template-columns: 1fr 1fr;
          }

          .team-toolbar {
            grid-template-columns: 1fr;
          }

          .member-row {
            grid-template-columns:
              minmax(0,1fr) auto;
          }

          .member-role,
          .member-status {
            display: none;
          }

          .member-actions {
            grid-column: 2;
            grid-row: 1;
          }

          .team-form {
            grid-template-columns: 1fr;
          }

          .team-form .full {
            grid-column: auto;
          }

          .permissions-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .team-stats {
            grid-template-columns: 1fr;
          }

          .member-row {
            padding: 14px;
          }
        }
      `}</style>

      <div className="team-header">
        <div>
          <span className="team-eyebrow">
            PEOPLE & ACCESS
          </span>

          <h1>TEAM</h1>

          <p>
            Manage team members, roles
            and module permissions.
          </p>
        </div>

        <button
          type="button"
          className="team-add"
          onClick={openCreate}
        >
          <Plus size={16} />
          ADD MEMBER
        </button>
      </div>

      <div className="team-stats">
        <div className="team-stat">
          <div className="team-stat-icon">
            <UserRound size={17} />
          </div>
          <strong>
            {stats.total}
          </strong>
          <span>
            Total Members
          </span>
        </div>

        <div className="team-stat">
          <div className="team-stat-icon">
            <Power size={17} />
          </div>
          <strong>
            {stats.active}
          </strong>
          <span>
            Active
          </span>
        </div>

        <div className="team-stat">
          <div className="team-stat-icon">
            <ShieldCheck size={17} />
          </div>
          <strong>
            {stats.managers}
          </strong>
          <span>
            Managers
          </span>
        </div>

        <div className="team-stat">
          <div className="team-stat-icon">
            <Power size={17} />
          </div>
          <strong>
            {stats.inactive}
          </strong>
          <span>
            Inactive
          </span>
        </div>
      </div>

      <div className="team-toolbar">
        <label className="team-search">
          <Search size={16} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search team members..."
          />
        </label>

        <label className="team-filter">
          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              ALL ROLES
            </option>

            {ROLES.map((role) => (
              <option
                key={role.value}
                value={role.value}
              >
                {role.label.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="team-card">
        <div className="team-card-head">
          <h2>
            TEAM MEMBERS
          </h2>

          <span className="team-count">
            {filteredMembers.length} shown
          </span>
        </div>

        {loading ? (
          <div className="team-empty">
            Loading team members...
          </div>
        ) : !filteredMembers.length ? (
          <div className="team-empty">
            <div className="team-empty-icon">
              <UserRound size={25} />
            </div>

            <h3>
              No team members found
            </h3>

            <p>
              Add your first team member
              to start managing access.
            </p>

            <button
              type="button"
              className="team-add"
              onClick={openCreate}
            >
              <Plus size={16} />
              ADD MEMBER
            </button>
          </div>
        ) : (
          filteredMembers.map(
            (member) => {
              const active =
                member.isActive !==
                false;

              const permissionCount =
                Array.isArray(
                  member.permissions
                )
                  ? member
                      .permissions
                      .length
                  : 0;

              return (
                <article
                  className="member-row"
                  key={memberId(
                    member
                  )}
                >
                  <div className="member-main">
                    <div className="member-avatar">
                      <UserRound
                        size={18}
                      />
                    </div>

                    <div className="member-info">
                      <h3 className="member-name">
                        {member.name}
                      </h3>

                      <p className="member-email">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="member-role">
                      {roleLabel(
                        member.role
                      )}
                    </span>
                  </div>

                  <div className="member-permissions">
                    {permissionCount} permission
                    {permissionCount === 1
                      ? ""
                      : "s"}
                  </div>

                  <div className="member-actions">
                    <span
                      className={`member-status ${
                        active
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      <span className="status-dot" />
                      {active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>

                    <button
                      type="button"
                      className="member-action"
                      onClick={() =>
                        openEdit(
                          member
                        )
                      }
                      title="Edit member"
                    >
                      <Pencil
                        size={14}
                      />
                    </button>

                    <button
                      type="button"
                      className="member-action"
                      onClick={() =>
                        toggleStatus(
                          member
                        )
                      }
                      title={
                        active
                          ? "Deactivate"
                          : "Activate"
                      }
                    >
                      <Power
                        size={14}
                      />
                    </button>

                    <button
                      type="button"
                      className="member-action danger"
                      onClick={() =>
                        deleteMember(
                          member
                        )
                      }
                      title="Delete member"
                    >
                      <Trash2
                        size={14}
                      />
                    </button>
                  </div>
                </article>
              );
            }
          )
        )}
      </section>

      {modal && (
        <div
          className="team-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="team-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="team-modal-head">
              <h2>
                {modal.mode ===
                "edit"
                  ? "EDIT TEAM MEMBER"
                  : "ADD TEAM MEMBER"}
              </h2>

              <button
                type="button"
                className="team-close"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="team-form"
              onSubmit={saveMember}
            >
              <label>
                NAME

                <input
                  value={
                    modal.data.name
                  }
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target
                        .value
                    )
                  }
                  placeholder="Team member name"
                  required
                />
              </label>

              <label>
                EMAIL

                <input
                  type="email"
                  value={
                    modal.data.email
                  }
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target
                        .value
                    )
                  }
                  placeholder="member@example.com"
                  required
                />
              </label>

              <label>
                {modal.mode ===
                "edit"
                  ? "NEW PASSWORD (OPTIONAL)"
                  : "PASSWORD"}

                <input
                  type="password"
                  value={
                    modal.data
                      .password
                  }
                  onChange={(event) =>
                    updateField(
                      "password",
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    modal.mode ===
                    "edit"
                      ? "Leave blank to keep current password"
                      : "Minimum 8 characters"
                  }
                  required={
                    modal.mode ===
                    "create"
                  }
                />
              </label>

              <label>
                ROLE

                <select
                  value={
                    modal.data.role
                  }
                  onChange={(event) =>
                    updateField(
                      "role",
                      event.target
                        .value
                    )
                  }
                >
                  {ROLES.map(
                    (role) => (
                      <option
                        key={
                          role.value
                        }
                        value={
                          role.value
                        }
                      >
                        {role.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="full">
                <div className="permission-head">
                  <label>
                    PERMISSIONS
                  </label>

                  <div className="permission-buttons">
                    <button
                      type="button"
                      onClick={
                        selectAllPermissions
                      }
                    >
                      SELECT ALL
                    </button>

                    <button
                      type="button"
                      onClick={
                        clearPermissions
                      }
                    >
                      CLEAR
                    </button>
                  </div>
                </div>

                <div className="permissions-grid">
                  {PERMISSIONS.map(
                    (permission) => (
                      <label
                        className="permission-item"
                        key={
                          permission.value
                        }
                      >
                        <input
                          type="checkbox"
                          checked={
                            (
                              modal.data
                                .permissions ||
                              []
                            ).includes(
                              permission.value
                            )
                          }
                          onChange={() =>
                            togglePermission(
                              permission.value
                            )
                          }
                        />

                        {permission.label}
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="team-modal-actions full">
                <button
                  type="button"
                  className="team-secondary"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="team-primary"
                  disabled={saving}
                >
                  {saving
                    ? "SAVING..."
                    : modal.mode ===
                      "edit"
                    ? "SAVE CHANGES"
                    : "CREATE MEMBER"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}