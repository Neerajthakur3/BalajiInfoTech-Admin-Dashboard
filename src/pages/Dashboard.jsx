import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Database,
  DollarSign,
  Eye,
  Mail,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

const FileInvoiceIcon = Database;

import DashboardShell from "../components/DashboardShell.jsx";
import Tasks from "./Tasks.jsx";
import Messages from "./Messages.jsx";
import Reports from "./Reports.jsx";
import Team from "../components/Team.jsx";
import Calendar from "./Calendar.jsx";
import Notifications from "./Notifications.jsx";
import Settings from "../components/Settings.jsx";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ADMIN_TOKEN_KEY = "balaji_admin_token";
const TEAM_TOKEN_KEY = "balaji_team_token";
const SESSION_KEY = "balaji_session_type";

const blankProject = {
  title: "",
  category: "Website",
  description: "",
  tech: "",
  image: "",
  demoUrl: "",
  featured: false,
  published: true,
};

const blankPackage = {
  name: "",
  category: "Website",
  description: "",
  price: "",
  offerPrice: "",
  currency: "INR",
  features: "",
  popular: false,
  published: true,
};

const blankClient = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  status: "active",
  notes: "",
};

const blankService = {
  title: "",
  slug: "",
  category: "Website",
  description: "",
  price: "",
  icon: "",
  published: true,
};

const blankInvoice = {
  invoiceNumber: "",
  client: "",
  items: [
    {
      service: "",
      description: "",
      quantity: 1,
      price: "",
    },
  ],
  discount: 0,
  tax: 0,
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  status: "draft",
  notes: "",
};

const blankPayment = {
  invoice: "",
  client: "",
  amount: "",
  paymentMethod: "UPI",
  transactionId: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  notes: "",
  status: "Success",
};

async function api(path, options = {}) {
  const sessionType = localStorage.getItem(SESSION_KEY);
  const tokenKey =
    sessionType === "team"
      ? TEAM_TOKEN_KEY
      : ADMIN_TOKEN_KEY;
  const token = localStorage.getItem(tokenKey);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

function Modal({ title, close, children, wide = false }) {
  return (
    <div className="backdrop" onMouseDown={close}>
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={close} aria-label="Close">
            <X size={19} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function ProjectForm({ initial, close, saved }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);

    try {
      const payload = {
        ...form,
        tech:
          typeof form.tech === "string"
            ? form.tech.split(",").map((item) => item.trim()).filter(Boolean)
            : form.tech || [],
      };

      const editing = Boolean(form._id);

      await api(editing ? `/projects/${form._id}` : "/projects", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      if (!editing) {
        pushDashboardNotification({
          type: "project",
          tone: "info",
          title: "New project added",
          message: `${form.title || "A new project"} was added.`,
          entityId: form.title || "project",
        });
      }

      saved();
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={form._id ? "EDIT PROJECT" : "ADD PROJECT"}
      close={close}
    >
      <form className="form" onSubmit={submit}>
        <Field
          label="PROJECT NAME"
          value={form.title}
          onChange={(value) => update("title", value)}
          required
        />
        <Field
          label="CATEGORY"
          value={form.category}
          onChange={(value) => update("category", value)}
          required
        />
        <Field
          label="TECHNOLOGIES"
          value={form.tech}
          onChange={(value) => update("tech", value)}
        />
        <Field
          label="IMAGE URL"
          value={form.image}
          onChange={(value) => update("image", value)}
        />
        <Field
          label="LIVE DEMO URL"
          value={form.demoUrl}
          onChange={(value) => update("demoUrl", value)}
        />

        <label className="full">
          DESCRIPTION
          <textarea
            value={form.description}
            onChange={(event) =>
              update("description", event.target.value)
            }
          />
        </label>

        <div className="checks full">
          <label>
            <input
              type="checkbox"
              checked={Boolean(form.featured)}
              onChange={(event) =>
                update("featured", event.target.checked)
              }
            />
            FEATURED
          </label>

          <label>
            <input
              type="checkbox"
              checked={Boolean(form.published)}
              onChange={(event) =>
                update("published", event.target.checked)
              }
            />
            PUBLISHED
          </label>
        </div>

        <button type="submit" className="primary full" disabled={busy}>
          {busy ? "SAVING..." : "SAVE PROJECT"}
        </button>
      </form>
    </Modal>
  );
}

function PackageForm({ initial, close, saved }) {
  const [form, setForm] = useState({
    ...initial,
    name: initial.name || "",
    category: initial.category || "Website",
    description: initial.description || "",
    price: initial.price ?? "",
    offerPrice: initial.offerPrice ?? "",
    currency: initial.currency || "INR",
    features: Array.isArray(initial.features)
      ? initial.features.join("\n")
      : initial.features || "",
    popular: Boolean(initial.popular),
    published: initial.published !== false,
  });

  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    const cleanName = form.name.trim();
    const cleanPrice = Number(form.price);
    const cleanOfferPrice =
      form.offerPrice === "" || form.offerPrice === null
        ? null
        : Number(form.offerPrice);

    if (!cleanName) {
      alert("Please enter package name.");
      return;
    }

    if (!cleanPrice || cleanPrice <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (
      cleanOfferPrice !== null &&
      (!Number.isFinite(cleanOfferPrice) ||
        cleanOfferPrice <= 0 ||
        cleanOfferPrice >= cleanPrice)
    ) {
      alert("Offer Price must be lower than Price.");
      return;
    }

    const features =
      typeof form.features === "string"
        ? form.features.split("\n").map((item) => item.trim()).filter(Boolean)
        : form.features || [];

    setBusy(true);

    try {
      const payload = {
        ...form,
        name: cleanName,
        description: form.description?.trim() || "",
        price: cleanPrice,
        offerPrice: cleanOfferPrice,
        currency: form.currency?.trim().toUpperCase() || "INR",
        features,
        popular: Boolean(form.popular),
        published: Boolean(form.published),
      };

      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;

      const editing = Boolean(initial._id);

      await api(editing ? `/packages/${initial._id}` : "/packages", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      if (!editing) {
        pushDashboardNotification({
          type: "package",
          tone: "info",
          title: "New package added",
          message: `${cleanName || "A new package"} was added.`,
          entityId: cleanName || "package",
        });
      }

      saved();
    } catch (error) {
      alert(error.message || "Unable to save package.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={initial._id ? "EDIT PACKAGE" : "ADD PACKAGE"}
      close={close}
    >
      <form className="form" onSubmit={submit}>
        <Field
          label="PACKAGE NAME"
          value={form.name}
          onChange={(value) => update("name", value)}
          required
        />

        <label>
          CATEGORY
          <select
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
          >
            {[
              "Website",
              "Digital Marketing",
              "Graphic Design",
              "E-Commerce",
              "Other",
            ].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <Field
          label="PRICE"
          type="number"
          value={form.price}
          onChange={(value) => update("price", value)}
          required
        />

        <Field
          label="OFFER PRICE"
          type="number"
          value={form.offerPrice ?? ""}
          onChange={(value) => update("offerPrice", value)}
        />

        <Field
          label="CURRENCY"
          value={form.currency}
          onChange={(value) => update("currency", value.toUpperCase())}
        />

        <Field
          label="DESCRIPTION"
          value={form.description}
          onChange={(value) => update("description", value)}
        />

        <label className="full">
          FEATURES — ONE PER LINE
          <textarea
            value={form.features}
            onChange={(event) => update("features", event.target.value)}
            placeholder={
              "Responsive Design\nMobile Friendly\nSEO Ready\nContact Form"
            }
          />
        </label>

        <div className="checks full">
          <label>
            <input
              type="checkbox"
              checked={Boolean(form.popular)}
              onChange={(event) => update("popular", event.target.checked)}
            />
            POPULAR
          </label>

          <label>
            <input
              type="checkbox"
              checked={Boolean(form.published)}
              onChange={(event) => update("published", event.target.checked)}
            />
            PUBLISHED
          </label>
        </div>

        <button type="submit" className="primary full" disabled={busy}>
          {busy
            ? "SAVING..."
            : initial._id
              ? "UPDATE PACKAGE"
              : "SAVE PACKAGE"}
        </button>
      </form>
    </Modal>
  );
}

function ClientForm({ initial, close, saved }) {
  const [form, setForm] = useState({
    ...blankClient,
    ...initial,
    name: initial.name || "",
    email: initial.email || "",
    phone: initial.phone || "",
    company: initial.company || "",
    address: initial.address || "",
    status: initial.status || "active",
    notes: initial.notes || "",
  });
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) {
      alert("Please enter client name.");
      return;
    }

    if (!email) {
      alert("Please enter client email.");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        name,
        email: email.toLowerCase(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        address: form.address.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };

      const editing = Boolean(initial._id);

      await api(editing ? `/clients/${initial._id}` : "/clients", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      saved();
    } catch (error) {
      alert(error.message || "Unable to save client.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={initial._id ? "EDIT CLIENT" : "ADD CLIENT"}
      close={close}
      wide
    >
      <form className="form" onSubmit={submit}>
        <Field
          label="CLIENT NAME"
          value={form.name}
          onChange={(value) => update("name", value)}
          required
        />

        <Field
          label="EMAIL"
          type="email"
          value={form.email}
          onChange={(value) => update("email", value)}
          required
        />

        <Field
          label="PHONE"
          value={form.phone}
          onChange={(value) => update("phone", value)}
        />

        <Field
          label="COMPANY"
          value={form.company}
          onChange={(value) => update("company", value)}
        />

        <Field
          label="ADDRESS"
          value={form.address}
          onChange={(value) => update("address", value)}
        />

        <label>
          STATUS
          <select
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label className="full">
          NOTES
          <textarea
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Add internal notes about this client..."
          />
        </label>

        <button type="submit" className="primary full" disabled={busy}>
          {busy
            ? "SAVING..."
            : initial._id
              ? "UPDATE CLIENT"
              : "SAVE CLIENT"}
        </button>
      </form>
    </Modal>
  );
}

function ServiceForm({ initial, close, saved }) {
  const [form, setForm] = useState({
    ...blankService,
    ...initial,
    title: initial.title || "",
    slug: initial.slug || "",
    category: initial.category || "Website",
    description: initial.description || "",
    price: initial.price ?? "",
    icon: initial.icon || "",
    published: initial.published !== false,
  });

  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function makeSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function submit(event) {
    event.preventDefault();

    if (busy) return;

    const title = form.title.trim();
    const slug = form.slug.trim() || makeSlug(title);
    const category = form.category.trim();
    const price =
      form.price === "" || form.price === null
        ? 0
        : Number(form.price);

    if (!title) {
      alert("Please enter service title.");
      return;
    }

    if (!slug) {
      alert("Please enter a valid service slug.");
      return;
    }

    if (!category) {
      alert("Please enter service category.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert("Please enter a valid service price.");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        title,
        slug,
        category,
        description: form.description.trim(),
        price,
        icon: form.icon.trim(),
        published: Boolean(form.published),
      };

      const editing = Boolean(initial._id);

      await api(
        editing
          ? `/services/${initial._id}`
          : "/services",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!editing) {
        pushDashboardNotification({
          type: "service",
          tone: "info",
          title: "New service added",
          message: `${title || "A new service"} was added.`,
          entityId: title || "service",
        });
      }

      saved();
    } catch (error) {
      alert(
        error.message ||
          "Unable to save service."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={
        initial._id
          ? "EDIT SERVICE"
          : "ADD SERVICE"
      }
      close={close}
      wide
    >
      <form className="form" onSubmit={submit}>
        <Field
          label="SERVICE TITLE"
          value={form.title}
          onChange={(value) => {
            update("title", value);

            if (!initial._id) {
              update("slug", makeSlug(value));
            }
          }}
          required
        />

        <Field
          label="SLUG"
          value={form.slug}
          onChange={(value) =>
            update("slug", makeSlug(value))
          }
          required
        />

        <label>
          CATEGORY
          <select
            value={form.category}
            onChange={(event) =>
              update(
                "category",
                event.target.value
              )
            }
          >
            {[
              "Website",
              "WordPress",
              "E-Commerce",
              "Graphic Design",
              "Digital Marketing",
              "SEO",
              "IT Support",
              "Other",
            ].map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </label>

        <Field
          label="PRICE (₹)"
          type="number"
          value={form.price}
          onChange={(value) =>
            update("price", value)
          }
          required
        />

        <Field
          label="ICON"
          value={form.icon}
          onChange={(value) =>
            update("icon", value)
          }
          placeholder="e.g. Globe"
        />

        <label className="full">
          DESCRIPTION
          <textarea
            value={form.description}
            onChange={(event) =>
              update(
                "description",
                event.target.value
              )
            }
            placeholder="Describe this service..."
          />
        </label>

        <div className="checks full">
          <label>
            <input
              type="checkbox"
              checked={Boolean(
                form.published
              )}
              onChange={(event) =>
                update(
                  "published",
                  event.target.checked
                )
              }
            />
            PUBLISHED
          </label>
        </div>

        <button
          type="submit"
          className="primary full"
          disabled={busy}
        >
          {busy
            ? "SAVING..."
            : initial._id
              ? "UPDATE SERVICE"
              : "SAVE SERVICE"}
        </button>
      </form>
    </Modal>
  );
}


function StatusSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const options = [
    { value: "draft", label: "Draft", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.10)" },
    { value: "pending", label: "Pending", color: "#ff9f0a", bg: "rgba(255, 159, 10, 0.10)" },
    { value: "paid", label: "Paid", color: "#32d74b", bg: "rgba(50, 215, 75, 0.10)" },
    { value: "overdue", label: "Overdue", color: "#ff453a", bg: "rgba(255, 69, 58, 0.10)" },
    { value: "cancelled", label: "Cancelled", color: "#a1a1aa", bg: "rgba(161, 161, 170, 0.10)" },
  ];

  const selected =
    options.find((option) => option.value === value) || options[0];

  return (
    <>
      <style>{`
        .status-select-wrap {
          position: relative;
          width: 100%;
        }

        .status-select-trigger {
          width: 100%;
          min-height: 54px;
          padding: 0 15px;
          border: 1px solid var(--border, #292d34);
          border-radius: 12px;
          background: #0d0f12;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font: inherit;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .status-select-trigger:hover,
        .status-select-trigger:focus-visible {
          border-color: #ff6a00;
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 106, 0, .12);
        }

        .status-select-value {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .status-select-dot {
          width: 9px;
          height: 9px;
          flex: 0 0 9px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
        }

        .status-select-chevron {
          flex: 0 0 auto;
          transition: transform .18s ease;
        }

        .status-select-chevron.open {
          transform: rotate(180deg);
        }

        .status-select-menu {
          position: absolute;
          z-index: 10050;
          top: calc(100% + 7px);
          left: 0;
          right: 0;
          padding: 6px;
          border: 1px solid #30353d;
          border-radius: 12px;
          background: #15181d;
          box-shadow: 0 18px 40px rgba(0, 0, 0, .45);
          overflow: hidden;
        }

        .status-select-option {
          width: 100%;
          min-height: 46px;
          padding: 0 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
          font: inherit;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
        }

        .status-select-option:hover,
        .status-select-option.selected {
          background: rgba(255, 106, 0, .09);
        }

        .status-select-option-text {
          flex: 1;
        }

        .status-select-check {
          font-size: 17px;
          font-weight: 800;
        }
      `}</style>

      <div className="status-select-wrap">
      <button
        type="button"
        className="status-select-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="status-select-value">
          <span
            className="status-select-dot"
            style={{ background: selected.color }}
          />
          <span style={{ color: selected.color }}>
            {selected.label}
          </span>
        </span>

        <ChevronDown
          size={17}
          className={open ? "status-select-chevron open" : "status-select-chevron"}
        />
      </button>

      {open && (
        <div className="status-select-menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`status-select-option ${
                value === option.value ? "selected" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span
                className="status-select-dot"
                style={{ background: option.color }}
              />
              <span
                className="status-select-option-text"
                style={{ color: option.color }}
              >
                {option.label}
              </span>

              {value === option.value && (
                <span
                  className="status-select-check"
                  style={{ color: option.color }}
                >
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      </div>
    </>
  );
}

function InvoiceForm({ initial, clients, services, close, saved }) {
  const [form, setForm] = useState(() => ({
    ...blankInvoice,
    ...initial,
    invoiceNumber:
      initial.invoiceNumber ||
      `INV-${new Date()
        .toISOString()
        .replace(/\D/g, "")
        .slice(0, 14)}`,
    client: initial.client?._id || initial.client || "",
    issueDate: initial.issueDate
      ? new Date(initial.issueDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    dueDate: initial.dueDate
      ? new Date(initial.dueDate).toISOString().slice(0, 10)
      : "",
    items: (initial.items || blankInvoice.items).map((item, index) => ({
      _invoiceItemId:
        item._invoiceItemId ||
        `invoice-item-${Date.now()}-${index}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
      service: item.service?._id || item.service || "",
      description: item.description || "",
      quantity: item.quantity ?? 1,
      price: item.price ?? "",
    })),
    discount: initial.discount ?? 0,
    tax: initial.tax ?? 0,
    status: initial.status || "draft",
    notes: initial.notes || "",
  }));

  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index, key, value) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [key]: value }
          : item
      ),
    }));
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          _invoiceItemId: `invoice-item-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          service: "",
          description: "",
          quantity: 1,
          price: "",
        },
      ],
    }));
  }

  function removeItem(itemId) {
    setForm((current) => {
      if (current.items.length <= 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter(
          (item) => item._invoiceItemId !== itemId
        ),
      };
    });
  }

  function selectService(index, serviceId) {
    const service = services.find(
      (item) => item._id === serviceId
    );

    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              service: serviceId,
              description:
                item.description ||
                service?.title ||
                "",
              price:
                item.price === "" || item.price === null
                  ? service?.price ?? ""
                  : item.price,
            }
          : item
      ),
    }));
  }

  const subtotal = useMemo(
    () =>
      form.items.reduce(
        (sum, item) =>
          sum +
          (Number(item.quantity) || 0) *
            (Number(item.price) || 0),
        0
      ),
    [form.items]
  );

  const discount = Math.max(
    Number(form.discount) || 0,
    0
  );
  const tax = Math.max(
    Number(form.tax) || 0,
    0
  );
  const total = Math.max(
    subtotal - discount + tax,
    0
  );

  async function submit(event) {
    event.preventDefault();

    if (busy) return;

    if (!form.invoiceNumber.trim()) {
      alert("Please enter invoice number.");
      return;
    }

    if (!form.client) {
      alert("Please select a client.");
      return;
    }

    if (!form.dueDate) {
      alert("Please select due date.");
      return;
    }

    if (!form.items.length) {
      alert("Add at least one invoice item.");
      return;
    }

    const items = form.items.map((item) => ({
      service: item.service || null,
      description: item.description.trim(),
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    if (
      items.some(
        (item) =>
          !item.description ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.price) ||
          item.price < 0
      )
    ) {
      alert(
        "Please check every item description, quantity and price."
      );
      return;
    }

    if (discount > subtotal) {
      alert("Discount cannot be greater than subtotal.");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        invoiceNumber: form.invoiceNumber.trim().toUpperCase(),
        client: form.client,
        items,
        discount,
        tax,
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        status: form.status,
        notes: form.notes.trim(),
      };

      const editing = Boolean(initial._id);

      await api(
        editing
          ? `/invoices/${initial._id}`
          : "/invoices",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      saved();
    } catch (error) {
      alert(
        error.message ||
          "Unable to save invoice."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={
        initial._id
          ? "EDIT INVOICE"
          : "CREATE INVOICE"
      }
      close={close}
      wide
    >
      <form className="form invoice-form" onSubmit={submit}>
        <Field
          label="INVOICE NUMBER"
          value={form.invoiceNumber}
          onChange={(value) =>
            update("invoiceNumber", value)
          }
          required
        />

        <label>
          CLIENT
          <select
            value={form.client}
            onChange={(event) =>
              update("client", event.target.value)
            }
            required
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option
                key={client._id}
                value={client._id}
              >
                {client.name}
                {client.company
                  ? ` · ${client.company}`
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <Field
          label="ISSUE DATE"
          type="date"
          value={form.issueDate}
          onChange={(value) =>
            update("issueDate", value)
          }
          required
        />

        <Field
          label="DUE DATE"
          type="date"
          value={form.dueDate}
          onChange={(value) =>
            update("dueDate", value)
          }
          required
        />

        <label>
          STATUS
          <StatusSelect
            value={form.status}
            onChange={(value) => update("status", value)}
          />
        </label>

        <div className="invoice-summary-top">
          <span>LIVE TOTAL</span>
          <strong>
            ₹{total.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>

        <div className="invoice-items full">
          <div className="invoice-items-heading">
            <div>
              <small>INVOICE ITEMS</small>
              <h3>Services & Charges</h3>
            </div>
            <button
              type="button"
              className="secondary small"
              onClick={addItem}
            >
              <Plus size={15} />
              ADD ITEM
            </button>
          </div>

          {form.items.map((item, index) => (
            <div
              className="invoice-item-row"
              key={item._invoiceItemId}
            >
              <label>
                SERVICE
                <select
                  value={item.service}
                  onChange={(event) =>
                    selectService(
                      index,
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Custom / Other
                  </option>
                  {services.map((service) => (
                    <option
                      key={service._id}
                      value={service._id}
                    >
                      {service.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                DESCRIPTION
                <input
                  value={item.description}
                  onChange={(event) =>
                    updateItem(
                      index,
                      "description",
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                QTY
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(
                      index,
                      "quantity",
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                PRICE
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(event) =>
                    updateItem(
                      index,
                      "price",
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <div className="invoice-item-total">
                <small>AMOUNT</small>
                <strong>
                  ₹
                  {(
                    (Number(item.quantity) || 0) *
                    (Number(item.price) || 0)
                  ).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </div>

              <button
                type="button"
                className="danger invoice-remove-item"
                onClick={() => removeItem(item._invoiceItemId)}
                disabled={form.items.length === 1}
                title="Remove item"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="invoice-calculation full">
          <div className="invoice-calculation-spacer" />

          <div className="invoice-calculation-box">
            <div>
              <span>SUBTOTAL</span>
              <strong>
                ₹{subtotal.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>

            <label>
              DISCOUNT
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(event) =>
                  update("discount", event.target.value)
                }
              />
            </label>

            <label>
              TAX / OTHER
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.tax}
                onChange={(event) =>
                  update("tax", event.target.value)
                }
              />
            </label>

            <div className="invoice-grand-total">
              <span>GRAND TOTAL</span>
              <strong>
                ₹{total.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>
        </div>

        <label className="full">
          NOTES
          <textarea
            value={form.notes}
            onChange={(event) =>
              update("notes", event.target.value)
            }
            placeholder="Payment notes, terms or internal notes..."
          />
        </label>

        <button
          type="submit"
          className="primary full"
          disabled={busy}
        >
          {busy
            ? "SAVING..."
            : initial._id
              ? "UPDATE INVOICE"
              : "CREATE INVOICE"}
        </button>
      </form>
    </Modal>
  );
}

function PaymentForm({ initial, invoices, clients, payments, close, saved }) {
  const [form, setForm] = useState({ ...blankPayment, ...initial });
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const selectedInvoice = invoices.find((invoice) => invoice._id === form.invoice);
  const invoiceTotal = Number(selectedInvoice?.total || 0);

  const paidBeforeThisPayment = payments
    .filter((payment) => {
      const paymentInvoiceId = payment.invoice?._id || payment.invoice;
      return (
        paymentInvoiceId === form.invoice &&
        payment.status === "Success" &&
        payment._id !== initial?._id
      );
    })
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const remainingAmount = Math.max(invoiceTotal - paidBeforeThisPayment, 0);

  useEffect(() => {
    const clientId = selectedInvoice?.client?._id || selectedInvoice?.client || "";
    if (clientId && !form.client) update("client", clientId);
  }, [selectedInvoice]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!form.invoice) return alert("Please select an invoice.");

    if (!form.paymentMethod) {
      return alert("Please select a payment method.");
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return alert("Please enter a valid payment amount.");
    }

    if (!form.paymentDate) {
      return alert("Please select payment date.");
    }

    if (invoiceTotal > 0 && amount > remainingAmount) {
      return alert(
        `Payment cannot exceed the remaining amount of ₹${remainingAmount.toLocaleString("en-IN")}.`
      );
    }

    setBusy(true);
    try {
      const payload = {
        invoice: form.invoice,
        client: form.client || null,
        amount,
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId?.trim() || "",
        paymentDate: form.paymentDate || new Date().toISOString().slice(0, 10),
        notes: form.notes?.trim() || "",
        status: form.status || "Success",
      };

      const editing = Boolean(initial?._id);
      await api(editing ? `/payments/${initial._id}` : "/payments", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      saved();
    } catch (error) {
      alert(error.message || "Unable to save payment.");
    } finally {
      setBusy(false);
    }
  }

  const summaryBox = {
    minWidth: 0,
    boxSizing: "border-box",
    padding: "16px 18px",
    border: "1px solid var(--border, #292d34)",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.025)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "8px",
  };

  const summaryLabel = {
    display: "block", margin: 0, fontSize: "11px", fontWeight: 700,
    lineHeight: 1.3, letterSpacing: "0.06em",
    color: "var(--text-muted, #8d939d)", whiteSpace: "nowrap",
  };

  const summaryValue = {
    display: "block", margin: 0, fontSize: "20px", fontWeight: 700,
    lineHeight: 1.2, color: "var(--text-primary, #ffffff)", whiteSpace: "nowrap",
  };

  return (
    <Modal title={initial?._id ? "EDIT PAYMENT" : "ADD PAYMENT"} close={close} wide>
      <form className="form" onSubmit={submit}>
        <label>
          INVOICE
          <select value={form.invoice} onChange={(event) => {
            const invoiceId = event.target.value;
            const invoice = invoices.find((item) => item._id === invoiceId);
            update("invoice", invoiceId);
            update("client", invoice?.client?._id || invoice?.client || "");
          }} required>
            <option value="">Select Invoice</option>
            {invoices.map((invoice) => (
              <option key={invoice._id} value={invoice._id}>
                {invoice.invoiceNumber || "Invoice"} — ₹{Number(invoice.total || 0).toLocaleString("en-IN")}
              </option>
            ))}
          </select>
        </label>

        <label>
          CLIENT
          <select value={form.client} onChange={(event) => update("client", event.target.value)}>
            <option value="">Select Client</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>{client.name}</option>
            ))}
          </select>
        </label>

        <div className="payment-amount-summary full" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", width: "100%", margin: "4px 0 6px" }}>
          <div style={summaryBox}>
            <span style={summaryLabel}>INVOICE TOTAL</span>
            <strong style={summaryValue}>₹{invoiceTotal.toLocaleString("en-IN")}</strong>
          </div>
          <div style={summaryBox}>
            <span style={summaryLabel}>ALREADY PAID</span>
            <strong style={summaryValue}>₹{paidBeforeThisPayment.toLocaleString("en-IN")}</strong>
          </div>
          <div style={summaryBox}>
            <span style={summaryLabel}>REMAINING</span>
            <strong style={summaryValue}>₹{remainingAmount.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <label>
          PAYMENT AMOUNT (₹)
          <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => update("amount", event.target.value)} required />
        </label>

        <label>
          PAYMENT METHOD
          <select value={form.paymentMethod} onChange={(event) => update("paymentMethod", event.target.value)}>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          TRANSACTION ID
          <input type="text" value={form.transactionId} onChange={(event) => update("transactionId", event.target.value)} placeholder="UPI / bank reference ID" />
        </label>

        <label>
          PAYMENT DATE
          <input type="date" value={form.paymentDate} onChange={(event) => update("paymentDate", event.target.value)} />
        </label>

        <label>
          STATUS
          <select value={form.status} onChange={(event) => update("status", event.target.value)}>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </label>

        <label className="full">
          NOTES
          <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Payment notes..." />
        </label>

        <button type="submit" className="primary full" disabled={busy}>
          {busy ? "SAVING..." : initial?._id ? "UPDATE PAYMENT" : "SAVE PAYMENT"}
        </button>
      </form>
    </Modal>
  );
}


function isDashboardAdmin(user) {
  const role=String(user?.role||"").trim().toLowerCase();
  return role==="admin" || role==="administrator" ||
    user?.isAdmin===true || user?.isAdmin==="true";
}
function dashboardPermissions(user) {
  const list=Array.isArray(user?.permissions)?user.permissions:[];
  return list.flatMap(x=>{
    if(typeof x==="string") return [x];
    if(x && typeof x==="object") return [x.value,x.permission,x.key,x.name].filter(Boolean);
    return [];
  }).map(x=>String(x).trim().toLowerCase()).filter(Boolean);
}
function dashboardCanView(user,module) {
  if(isDashboardAdmin(user)) return true;
  const p=dashboardPermissions(user);
  return p.includes(`${module}.view`) || p.includes(`${module}.manage`) || p.includes(`${module}.admin`);
}
function dashboardCanManage(user,module) {
  if(isDashboardAdmin(user)) return true;
  const p=dashboardPermissions(user);
  return p.includes(`${module}.manage`) || p.includes(`${module}.admin`);
}

export default function Dashboard({ admin, logout, sessionType, isTeamMember }) {
  const [tab, setTabState] = useState("overview");
  const TAB_PERMISSIONS = {
    projects:"projects", packages:"packages", enquiries:"enquiries",
    clients:"clients", services:"services", invoices:"invoices",
    payments:"payments", tasks:"tasks", messages:"messages",
    reports:"reports", notifications:"notifications", calendar:"calendar",
    revenue:"revenue",
  };
  const isAdmin = sessionType === "admin" || isDashboardAdmin(admin);
  const canView = (m) => isAdmin || dashboardCanView(admin,m);
  const canManage = (m) => isAdmin || dashboardCanManage(admin,m);

  function setTab(nextTab) {
    if (nextTab==="overview" || nextTab==="settings") {
      setTabState(nextTab); return;
    }
    const module=TAB_PERMISSIONS[nextTab];
    if (module && !canView(module)) return;
    setTabState(nextTab);
  }
  const [projects, setProjects] = useState([]);
  const [packages, setPackages] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("all");
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceStatus, setServiceStatus] = useState("all");
  const [serviceCategory, setServiceCategory] = useState("all");
  const [modal, setModal] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoadingData(true);

      const results = await Promise.allSettled([
        api("/projects"), api("/packages"), api("/enquiries"),
        api("/clients"), api("/services?status=all&limit=100"),
        api("/invoices?limit=100"), api("/payments"), api("/tasks"),
      ]);
      const value=(i)=>results[i]?.status==="fulfilled" ? results[i].value : {data:[]};
      setProjects(value(0).data || []);
      setPackages(value(1).data || []);
      setEnquiries(value(2).data || []);
      setClients(value(3).data || []);
      setServices(value(4).data || []);
      setInvoices(value(5).data || []);
      setPayments(value(6).data || []);
      setTasks(value(7).data || []);
      if(results.some(r=>r.status==="rejected" && /invalid|expired|authentication required/i.test(r.reason?.message||""))){
        logout(); return;
      }
    } catch (error) {
      const message = error.message?.toLowerCase() || "";

      if (
        message.includes("authentication") ||
        message.includes("session") ||
        message.includes("expired") ||
        message.includes("unauthorized")
      ) {
        logout();
      } else {
        console.error("Dashboard data load error:", error);
      }
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      projects: projects.length,
      packages: packages.length,
      enquiries: enquiries.length,
      clients: clients.length,
      newEnquiries: enquiries.filter((item) => item.status === "new").length,
      contacted: enquiries.filter((item) => item.status === "contacted").length,
      inProgress: enquiries.filter(
        (item) => item.status === "in-progress"
      ).length,
      closed: enquiries.filter((item) => item.status === "closed").length,
      invoices: invoices.length,
      invoicePaid: invoices.filter((item) => item.status === "paid").length,
      invoicePending: invoices.filter(
        (item) =>
          item.status === "pending" ||
          item.status === "overdue"
      ).length,
      invoiceRevenue: invoices
        .filter((item) => item.status === "paid")
        .reduce(
          (sum, item) => sum + Number(item.total || 0),
          0
        ),
      paymentTotal: payments.length,
      paymentReceived: payments
        .filter((item) => item.status === "Success")
        .reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        ),
      paymentPending: payments.filter(
        (item) => item.status === "Pending"
      ).length,
      paymentFailed: payments.filter(
        (item) => item.status === "Failed"
      ).length,
      tasks: tasks.length,
    };
  }, [projects, packages, enquiries, clients, invoices, payments, tasks]);

  async function remove(type, id) {
    if (!canManage(String(type||"").toLowerCase())) return;
    if (!window.confirm("Delete this item?")) return;

    try {
      await api(`/${type}/${id}`, { method: "DELETE" });
      await load(true);
    } catch (error) {
      alert(error.message);
    }
  }

  async function updateEnquiry(id, status) {
    if (!canManage("enquiries")) return;
    try {
      await api(`/enquiries/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await load(true);
    } catch (error) {
      alert(error.message);
    }
  }

  function openProjectForm(data = blankProject) {
    if (!canManage("projects")) return;
    setModal({ type: "project", data: { ...data } });
  }

  function openPackageForm(data = blankPackage) {
    if (!canManage("packages")) return;
    setModal({ type: "package", data: { ...data } });
  }

  function openClientForm(data = blankClient) {
    if (!canManage("clients")) return;
    setModal({ type: "client", data: { ...data } });
  }

  function openServiceForm(data = blankService) {
    if (!canManage("services")) return;
    setModal({
      type: "service",
      data: { ...data },
    });
  }

  function openInvoiceForm(data = blankInvoice) {
    if (!canManage("invoices")) return;
    setModal({
      type: "invoice",
      data: { ...data },
    });
  }

  function openPaymentForm(data = blankPayment) {
    if (!canManage("payments")) return;
    setModal({
      type: "payment",
      data: {
        ...blankPayment,
        ...data,
        invoice: data.invoice?._id || data.invoice || "",
        client: data.client?._id || data.client || "",
        paymentDate: data.paymentDate
          ? new Date(data.paymentDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      },
    });
  }



function pushDashboardNotification(notification) {
  try {
    const current = JSON.parse(
      localStorage.getItem("balaji_dashboard_notifications") || "[]"
    );
    const item = {
      id: `${notification.type || "system"}-${notification.entityId || "item"}-${Date.now()}`,
      type: notification.type || "system",
      tone: notification.tone || "info",
      title: notification.title,
      message: notification.message,
      date: new Date().toISOString(),
      read: false,
    };
    localStorage.setItem(
      "balaji_dashboard_notifications",
      JSON.stringify([item, ...current].slice(0, 300))
    );
    window.dispatchEvent(
      new CustomEvent("balaji:notification", { detail: item })
    );
  } catch (error) {
    console.warn("Notification event could not be stored.", error);
  }
}

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }

  function formatDate() {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function renderOverview() {
    const recentProjects = projects.slice(0, 4);
    const latestEnquiries = enquiries.slice(0, 5);

    return (
      <section className="content dashboard-overview">
        <div className="dashboard-welcome">
          <div>
            <span className="eyebrow">
              BALAJIINFOTECH / CONTROL CENTER
            </span>
            <h1>
              {getGreeting()},{" "}
              <strong>{admin?.name || "Admin"}</strong>
            </h1>
            <p>{formatDate()}</p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "spin" : ""}
              />
              {refreshing ? "REFRESHING" : "REFRESH"}
            </button>

            {isAdmin && (
              <button type="button" className="primary" onClick={() => openProjectForm()}>
                <Plus size={17} />
                ADD NEW
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-kpis">
          <DashboardKpi
            label="PROJECTS"
            value={stats.projects}
            description="Total projects"
            icon={BriefcaseBusiness}
            onClick={() => setTab("projects")}
          />
          <DashboardKpi
            label="PACKAGES"
            value={stats.packages}
            description="Active packages"
            icon={Package}
            onClick={() => setTab("packages")}
          />
          <DashboardKpi
            label="ENQUIRIES"
            value={stats.enquiries}
            description="Total enquiries"
            icon={Mail}
            onClick={() => setTab("enquiries")}
          />
          <DashboardKpi
            label="NEW ENQUIRIES"
            value={stats.newEnquiries}
            description="Awaiting response"
            icon={Bell}
            accent
            onClick={() => setTab("enquiries")}
          />
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card analytics-card">
            <div className="card-heading">
              <div>
                <span className="card-label">REAL DATA</span>
                <h2>Enquiry Overview</h2>
              </div>
              <div className="card-icon">
                <MessageSquare size={19} />
              </div>
            </div>

            <div className="enquiry-overview">
              <div className="overview-total">
                <strong>{stats.enquiries}</strong>
                <span>Total enquiries</span>
              </div>

              <EnquiryBar
                label="New"
                value={stats.newEnquiries}
                total={stats.enquiries}
              />
              <EnquiryBar
                label="Contacted"
                value={stats.contacted}
                total={stats.enquiries}
              />
              <EnquiryBar
                label="In Progress"
                value={stats.inProgress}
                total={stats.enquiries}
              />
              <EnquiryBar
                label="Closed"
                value={stats.closed}
                total={stats.enquiries}
              />
            </div>
          </section>

          <section className="dashboard-card">
            <div className="card-heading">
              <div>
                <span className="card-label">PROJECT STATUS</span>
                <h2>Portfolio</h2>
              </div>
              <div className="card-icon">
                <BriefcaseBusiness size={19} />
              </div>
            </div>

            <div className="project-status-summary">
              <StatusMetric
                label="Published"
                value={
                  projects.filter(
                    (item) => item.published !== false
                  ).length
                }
                icon={CheckCircle2}
              />
              <StatusMetric
                label="Featured"
                value={projects.filter((item) => item.featured).length}
                icon={Eye}
              />
              <StatusMetric
                label="Total"
                value={projects.length}
                icon={Database}
              />
            </div>

            <button
              type="button"
              className="text-action"
              onClick={() => setTab("projects")}
            >
              VIEW ALL PROJECTS
              <ArrowUpRight size={15} />
            </button>
          </section>
        </div>

        <section className="dashboard-card enquiries-card">
          <div className="card-heading">
            <div>
              <span className="card-label">CLIENT ACTIVITY</span>
              <h2>Latest Enquiries</h2>
            </div>
            <button
              type="button"
              className="text-action"
              onClick={() => setTab("enquiries")}
            >
              VIEW ALL
              <ArrowUpRight size={15} />
            </button>
          </div>

          <EnquiriesTable
            items={latestEnquiries}
            update={updateEnquiry}
            del={(id) => remove("enquiries", id)}
            onView={setSelectedEnquiry}
          />
        </section>

        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <span className="card-label">CONTENT</span>
              <h2>Recent Projects</h2>
            </div>
            <button
              type="button"
              className="text-action"
              onClick={() => setTab("projects")}
            >
              VIEW ALL
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="recent-projects">
            {recentProjects.map((project) => (
              <article className="recent-project" key={project._id}>
                <div className="recent-project-icon">
                  <BriefcaseBusiness size={18} />
                </div>

                <div>
                  <strong>{project.title}</strong>
                  <span>{project.category || "Website"}</span>
                </div>

                <div className="project-published">
                  {project.published !== false ? (
                    <>
                      <CheckCircle2 size={15} />
                      Published
                    </>
                  ) : (
                    <>
                      <Clock3 size={15} />
                      Draft
                    </>
                  )}
                </div>
              </article>
            ))}

            {!loadingData && !recentProjects.length && <Empty />}
          </div>
        </section>

        <section className="quick-actions">
          <button type="button" onClick={() => openProjectForm()}>
            <Plus size={20} />
            <div>
              <strong>ADD PROJECT</strong>
              <span>Publish completed work</span>
            </div>
            <ArrowUpRight size={17} />
          </button>

          <button type="button" onClick={() => openPackageForm()}>
            <Plus size={20} />
            <div>
              <strong>ADD PACKAGE</strong>
              <span>Manage pricing & offers</span>
            </div>
            <ArrowUpRight size={17} />
          </button>
        </section>
      </section>
    );
  }

  function renderProjects() {
    return (
      <section className="content">
        {
<style>{`
  .client-meta {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
  }

  .client-company {
    color: var(--text, #111827);
    -webkit-text-fill-color: var(--text, #111827);
  }

  .client-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: .02em;
    border: 1px solid transparent;
  }

  .client-status-dot {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 50%;
  }

  .client-status.active {
    color: #15803d !important;
    -webkit-text-fill-color: #15803d !important;
    background: rgba(34, 197, 94, .10);
    border-color: rgba(34, 197, 94, .26);
  }

  .client-status.active .client-status-dot {
    background: #22c55e;
  }

  .client-status.inactive {
    color: #dc2626 !important;
    -webkit-text-fill-color: #dc2626 !important;
    background: rgba(239, 68, 68, .09);
    border-color: rgba(239, 68, 68, .25);
  }

  .client-status.inactive .client-status-dot {
    background: #ef4444;
  }

  html[data-theme="dark"] .client-company {
    color: #e5e7eb;
    -webkit-text-fill-color: #e5e7eb;
  }

  html[data-theme="dark"] .client-status.active {
    color: #4ade80 !important;
    -webkit-text-fill-color: #4ade80 !important;
    background: rgba(34, 197, 94, .12);
    border-color: rgba(74, 222, 128, .25);
  }

  html[data-theme="dark"] .client-status.inactive {
    color: #ff7078 !important;
    -webkit-text-fill-color: #ff7078 !important;
    background: rgba(239, 68, 68, .12);
    border-color: rgba(255, 112, 120, .25);
  }
`}</style>
}
        <PageHeading
          eyebrow="CONTENT"
          title="Projects"
          action={
            <button
              type="button"
              className="primary small"
              onClick={() => openProjectForm()}
            >
              <Plus size={16} />
              ADD PROJECT
            </button>
          }
        />

        <div className="list">
          {projects.map((project) => (
            <article className="item" key={project._id}>
              <div>
                <h3>{project.title}</h3>
                <b>{project.category}</b>
                <p>{(project.tech || []).join(" · ")}</p>
              </div>

              <div className="item-actions">
                <span
                  className={`service-status ${
                    project.published !== false
                      ? "published"
                      : "draft"
                  }`}
                >
                  <span className="service-status-dot" />
                  <span className="service-status-text">
                    {project.published !== false
                      ? "PUBLISHED"
                      : "DRAFT"}
                  </span>
                </span>

                <button
                  type="button"
                  className="dashboard-action-button"
                  onClick={() =>
                    openProjectForm({
                      ...project,
                      tech: (project.tech || []).join(", "),
                    })
                  }
                >
                  <Pencil size={14} />
                  EDIT
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() => remove("projects", project._id)}
                >
                  <Trash2 size={14} />
                  DELETE
                </button>
              </div>
            </article>
          ))}

          {!loadingData && !projects.length && <Empty />}
        </div>
      </section>
    );
  }

  function renderPackages() {
    return (
      <section className="content">
        <PageHeading
          eyebrow="PRICING"
          title="Packages"
          action={
            <button
              type="button"
              className="primary small"
              onClick={() => openPackageForm()}
            >
              <Plus size={16} />
              ADD PACKAGE
            </button>
          }
        />

        <div className="list">
          {packages.map((pkg) => (
            <article className="item" key={pkg._id}>
              <div>
                <h3>{pkg.name}</h3>
                <b>
                  {pkg.category} · {pkg.currency}{" "}
                  {pkg.offerPrice ?? pkg.price}
                </b>
                <p>
                  {(pkg.features || []).slice(0, 3).join(" · ")}
                </p>
              </div>

              <div className="item-actions">
                <span
                  className={`service-status ${
                    pkg.published !== false
                      ? "published"
                      : "draft"
                  }`}
                >
                  <span className="service-status-dot" />
                  <span className="service-status-text">
                    {pkg.published !== false
                      ? "PUBLISHED"
                      : "DRAFT"}
                  </span>
                </span>

                <button
                  type="button"
                  className="dashboard-action-button"
                  onClick={() =>
                    openPackageForm({
                      ...pkg,
                      features: (pkg.features || []).join("\n"),
                    })
                  }
                >
                  <Pencil size={14} />
                  EDIT
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() => remove("packages", pkg._id)}
                >
                  <Trash2 size={14} />
                  DELETE
                </button>
              </div>
            </article>
          ))}

          {!loadingData && !packages.length && <Empty />}
        </div>
      </section>
    );
  }

  function renderServices() {
    const categories = [
      ...new Set(
        services
          .map((service) => service.category)
          .filter(Boolean)
      ),
    ];

    const filteredServices = services.filter(
      (service) => {
        const matchesStatus =
          serviceStatus === "all" ||
          (serviceStatus === "published" &&
            service.published !== false) ||
          (serviceStatus === "draft" &&
            service.published === false);

        const matchesCategory =
          serviceCategory === "all" ||
          service.category === serviceCategory;

        const query =
          serviceSearch.trim().toLowerCase();

        const matchesSearch =
          !query ||
          service.title
            ?.toLowerCase()
            .includes(query) ||
          service.slug
            ?.toLowerCase()
            .includes(query) ||
          service.category
            ?.toLowerCase()
            .includes(query) ||
          service.description
            ?.toLowerCase()
            .includes(query);

        return (
          matchesStatus &&
          matchesCategory &&
          matchesSearch
        );
      }
    );

    return (
      <section className="content">
        <PageHeading
          eyebrow="SERVICES"
          title="Services"
          action={
            <button
              type="button"
              className="primary small"
              onClick={() =>
                openServiceForm()
              }
            >
              <Plus size={16} />
              ADD SERVICE
            </button>
          }
        />

        <div className="dashboard-kpis">
          <DashboardKpi
            label="TOTAL SERVICES"
            value={services.length}
            description="All service records"
            icon={BriefcaseBusiness}
          />

          <DashboardKpi
            label="PUBLISHED"
            value={
              services.filter(
                (service) =>
                  service.published !== false
              ).length
            }
            description="Visible services"
            icon={CheckCircle2}
          />

          <DashboardKpi
            label="DRAFTS"
            value={
              services.filter(
                (service) =>
                  service.published === false
              ).length
            }
            description="Unpublished services"
            icon={Clock3}
          />
        </div>

        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <span className="card-label">
                REAL BACKEND DATA
              </span>
              <h2>Service Management</h2>
            </div>

            <div className="card-icon">
              <BriefcaseBusiness size={19} />
            </div>
          </div>

          <div className="service-filters">
            <label className="service-search">
              <Search size={16} />
              <input
                type="search"
                value={serviceSearch}
                onChange={(event) =>
                  setServiceSearch(
                    event.target.value
                  )
                }
                placeholder="Search services..."
              />
            </label>

            <label>
              STATUS
              <select
                value={serviceStatus}
                onChange={(event) =>
                  setServiceStatus(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All
                </option>
                <option value="published">
                  Published
                </option>
                <option value="draft">
                  Draft
                </option>
              </select>
            </label>

            <label>
              CATEGORY
              <select
                value={serviceCategory}
                onChange={(event) =>
                  setServiceCategory(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <div className="list">
            {filteredServices.map(
              (service) => (
                <article
                  className="item"
                  key={service._id}
                >
                  <div>
                    <h3>
                      {service.title}
                    </h3>

                    <b>
                      {service.category}
                      {" · "}
                      ₹
                      {Number(
                        service.price || 0
                      ).toLocaleString("en-IN")}
                    </b>

                    <p>
                      {service.slug}
                      {service.description
                        ? ` · ${service.description}`
                        : ""}
                    </p>
                  </div>

                  <div className="item-actions">
                    <span
                      className={`service-status ${
                        service.published !== false
                          ? "published"
                          : "draft"
                      }`}
                    >
                      <span className="service-status-dot" />

                      <span className="service-status-text">
                        {service.published !== false
                          ? "PUBLISHED"
                          : "DRAFT"}
                      </span>
                    </span>

                    <button
                      type="button"
                      className="dashboard-action-button"
                      onClick={() =>
                        openServiceForm(
                          service
                        )
                      }
                    >
                      <Pencil size={14} />
                      EDIT
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        remove(
                          "services",
                          service._id
                        )
                      }
                    >
                      <Trash2 size={14} />
                      DELETE
                    </button>
                  </div>
                </article>
              )
            )}

            {!loadingData &&
              !filteredServices.length && (
                <Empty />
              )}
          </div>
        </section>
      </section>
    );
  }

  function renderEnquiries() {
    return (
      <section className="content">
        <PageHeading eyebrow="CLIENTS" title="Enquiries" />

        <section className="dashboard-card enquiries-card">
          <EnquiriesTable
            items={enquiries}
            update={updateEnquiry}
            del={(id) => remove("enquiries", id)}
            onView={setSelectedEnquiry}
          />
        </section>
      </section>
    );
  }

  function renderClients() {
    const activeClients = clients.filter(
      (client) => client.status !== "inactive"
    ).length;
    const inactiveClients = clients.filter(
      (client) => client.status === "inactive"
    ).length;

    return (
      <section className="content">
        <PageHeading
          eyebrow="CLIENTS"
          title="Clients"
          action={
            <button
              type="button"
              className="primary small"
              onClick={() => openClientForm()}
            >
              <Plus size={16} />
              ADD CLIENT
            </button>
          }
        />

        <div className="dashboard-kpis">
          <DashboardKpi
            label="TOTAL CLIENTS"
            value={clients.length}
            description="Real client records"
            icon={UserRound}
          />
          <DashboardKpi
            label="ACTIVE"
            value={activeClients}
            description="Active clients"
            icon={CheckCircle2}
          />
          <DashboardKpi
            label="INACTIVE"
            value={inactiveClients}
            description="Inactive clients"
            icon={Clock3}
          />
        </div>

        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <span className="card-label">REAL BACKEND DATA</span>
              <h2>Client Records</h2>
            </div>
            <div className="card-icon">
              <UsersRound size={19} />
            </div>
          </div>

          <div className="list">
            {clients.map((client) => (
              <article className="item" key={client._id}>
                <div>
                  <h3>{client.name}</h3>
                  <b className="client-meta">
                    <span className="client-company">
                      {client.company || "Individual Client"}
                    </span>
                    <span
                      className={`client-status ${
                        String(client.status || "active").toLowerCase() === "inactive"
                          ? "inactive"
                          : "active"
                      }`}
                    >
                      <span className="client-status-dot" />
                      {String(client.status || "active").toLowerCase() === "inactive"
                        ? "Inactive"
                        : "Active"}
                    </span>
                  </b>
                  <p>
                    {client.email || "—"}
                    {client.phone ? ` · ${client.phone}` : ""}
                  </p>
                  {client.address && <p>{client.address}</p>}
                </div>

                <div className="item-actions">
                  <button
                    type="button"
                    onClick={() => openClientForm(client)}
                  >
                    <Pencil size={14} />
                    EDIT
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => remove("clients", client._id)}
                  >
                    <Trash2 size={14} />
                    DELETE
                  </button>
                </div>
              </article>
            ))}

            {!loadingData && !clients.length && <Empty />}
          </div>
        </section>
      </section>
    );
  }

  function renderInvoices() {
    const query = invoiceSearch.trim().toLowerCase();

    const filteredInvoices = invoices.filter((invoice) => {
      const matchesStatus =
        invoiceStatus === "all" ||
        invoice.status === invoiceStatus;

      const clientName =
        invoice.client?.name ||
        clients.find(
          (client) => client._id === invoice.client
        )?.name ||
        "";

      const matchesSearch =
        !query ||
        invoice.invoiceNumber
          ?.toLowerCase()
          .includes(query) ||
        clientName.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });

    const formatMoney = (value) =>
      `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`;

    const formatDateValue = (value) =>
      value
        ? new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    return (
      <section className="content">
        <PageHeading
          eyebrow="FINANCE"
          title="Invoices"
          action={
            <button
              type="button"
              className="primary small"
              onClick={() => openInvoiceForm()}
            >
              <Plus size={16} />
              CREATE INVOICE
            </button>
          }
        />

        <div className="dashboard-kpis">
          <DashboardKpi
            label="TOTAL INVOICES"
            value={stats.invoices}
            description="All invoice records"
            icon={FileInvoiceIcon}
          />
          <DashboardKpi
            label="PAID"
            value={stats.invoicePaid}
            description={formatMoney(stats.invoiceRevenue)}
            icon={CheckCircle2}
          />
          <DashboardKpi
            label="PENDING"
            value={stats.invoicePending}
            description="Pending + overdue"
            icon={Clock3}
          />
        </div>

        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <span className="card-label">
                REAL BACKEND DATA
              </span>
              <h2>Invoice Management</h2>
            </div>

            <div className="card-icon">
              <Database size={19} />
            </div>
          </div>

          <div className="invoice-toolbar">
            <label className="invoice-search">
              <Search size={16} />
              <input
                type="search"
                value={invoiceSearch}
                onChange={(event) =>
                  setInvoiceSearch(event.target.value)
                }
                placeholder="Search invoice or client..."
              />
            </label>

            <label>
              STATUS
              <select
                value={invoiceStatus}
                onChange={(event) =>
                  setInvoiceStatus(event.target.value)
                }
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          <div className="list invoice-list">
            {filteredInvoices.map((invoice) => {
              const clientName =
                invoice.client?.name ||
                clients.find(
                  (client) =>
                    client._id === invoice.client
                )?.name ||
                "Unknown client";

              const statusClass =
                invoice.status || "draft";

              return (
                <article
                  className="item invoice-item"
                  key={invoice._id}
                >
                  <div className="invoice-main">
                    <div className="invoice-number">
                      <strong>
                        {invoice.invoiceNumber}
                      </strong>
                      <span>
                        {clientName}
                      </span>
                    </div>

                    <div className="invoice-meta">
                      <span>
                        ISSUE{" "}
                        {formatDateValue(
                          invoice.issueDate
                        )}
                      </span>
                      <span>
                        DUE{" "}
                        {formatDateValue(
                          invoice.dueDate
                        )}
                      </span>
                      <strong>
                        {formatMoney(invoice.total)}
                      </strong>
                    </div>
                  </div>

                  <div className="item-actions">
                    <span
                      className={`invoice-status ${statusClass}`}
                    >
                      <span className="service-status-dot" />
                      {statusClass.toUpperCase()}
                    </span>

                    <button
                      type="button"
                      className="dashboard-action-button"
                      onClick={() =>
                        openInvoiceForm(invoice)
                      }
                    >
                      <Pencil size={14} />
                      EDIT
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        remove(
                          "invoices",
                          invoice._id
                        )
                      }
                    >
                      <Trash2 size={14} />
                      DELETE
                    </button>
                  </div>
                </article>
              );
            })}

            {!loadingData &&
              !filteredInvoices.length && (
                <Empty />
              )}
          </div>
        </section>
      </section>
    );
  }

  function renderPayments() {
    const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    const formatDateValue = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    const getInvoiceNumber = (payment) => {
      if (payment.invoice?.invoiceNumber) return payment.invoice.invoiceNumber;
      const invoiceId = payment.invoice?._id || payment.invoice;
      return invoices.find((item) => item._id === invoiceId)?.invoiceNumber || "—";
    };

    const getClientName = (payment) => {
      if (payment.client?.name) return payment.client.name;
      if (payment.invoice?.client?.name) return payment.invoice.client.name;
      const clientId = payment.client?._id || payment.client || payment.invoice?.client?._id || payment.invoice?.client;
      return clients.find((item) => item._id === clientId)?.name || "Unknown client";
    };

    return (
      <section className="content">
        <PageHeading eyebrow="FINANCE" title="Payments" action={
          <button type="button" className="primary small" onClick={() => openPaymentForm()}>
            <Plus size={16} /> ADD PAYMENT
          </button>
        } />

        <div className="dashboard-kpis">
          <DashboardKpi label="TOTAL PAYMENTS" value={stats.paymentTotal} description="All transactions" icon={CreditCard} />
          <DashboardKpi label="RECEIVED" value={formatMoney(stats.paymentReceived)} description="Successful payments" icon={CheckCircle2} />
          <DashboardKpi label="PENDING" value={stats.paymentPending} description="Pending transactions" icon={Clock3} />
          <DashboardKpi label="FAILED" value={stats.paymentFailed} description="Failed transactions" icon={X} />
        </div>

        <section className="dashboard-card">
          <div className="card-heading">
            <div><span className="card-label">REAL BACKEND DATA</span><h2>Payment Management</h2></div>
            <div className="card-icon"><CreditCard size={19} /></div>
          </div>

          <div className="list payment-list">
            {payments.map((payment) => {
              const status = payment.status || "Success";
              return (
                <article className="item payment-item" key={payment._id}>
                  <div className="payment-main">
                    <div className="payment-number">
                      <strong>{formatMoney(payment.amount)}</strong>
                      <span>{getClientName(payment)}</span>
                    </div>
                    <div className="payment-meta">
                      <span>INVOICE {getInvoiceNumber(payment)}</span>
                      <span>{payment.paymentMethod || "Other"}</span>
                      <span>{formatDateValue(payment.paymentDate)}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <span
                      className={`payment-status payment-status-${String(status).toLowerCase()}`}
                    >
                      <span className="service-status-dot" />
                      {String(status).toUpperCase()}
                    </span>
                    <button type="button" onClick={() => openPaymentForm(payment)}><Pencil size={14} /> EDIT</button>
                    <button type="button" className="danger" onClick={() => remove("payments", payment._id)}><Trash2 size={14} /> DELETE</button>
                  </div>
                </article>
              );
            })}
            {!loadingData && !payments.length && <Empty />}
          </div>
        </section>
      </section>
    );
  }


  function renderRevenueAnalytics() {
    const money = (value) =>
      `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`;

    const dateValue = (value) =>
      value
        ? new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    const successfulPayments = payments.filter(
      (item) => String(item.status || "").toLowerCase() === "success"
    );

    const activeInvoices = invoices.filter(
      (item) => String(item.status || "").toLowerCase() !== "cancelled"
    );

    const invoicedValue = activeInvoices
      .filter((item) => String(item.status || "").toLowerCase() !== "draft")
      .reduce((sum, item) => sum + Number(item.total || 0), 0);

    const collectedValue = successfulPayments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const paidInvoiceValue = invoices
      .filter((item) => String(item.status || "").toLowerCase() === "paid")
      .reduce((sum, item) => sum + Number(item.total || 0), 0);

    const outstandingValue = Math.max(invoicedValue - collectedValue, 0);
    const collectionRate = invoicedValue
      ? Math.min(100, Math.round((collectedValue / invoicedValue) * 100))
      : 0;

    const averagePayment = successfulPayments.length
      ? collectedValue / successfulPayments.length
      : 0;

    const monthKeys = [];
    const now = new Date();
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      monthKeys.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("en-IN", { month: "short" }),
      });
    }

    const monthlyRevenue = monthKeys.map((month) => {
      const total = successfulPayments.reduce((sum, payment) => {
        const date = new Date(payment.paymentDate || payment.createdAt);
        if (Number.isNaN(date.getTime())) return sum;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return key === month.key ? sum + Number(payment.amount || 0) : sum;
      }, 0);

      return { ...month, total };
    });

    const maxMonth = Math.max(...monthlyRevenue.map((item) => item.total), 1);

    const clientRevenue = {};
    successfulPayments.forEach((payment) => {
      const clientName =
        payment.client?.name ||
        payment.invoice?.client?.name ||
        (typeof payment.client === "string" ? payment.client : "Unknown client");
      clientRevenue[clientName] =
        (clientRevenue[clientName] || 0) + Number(payment.amount || 0);
    });

    const topClients = Object.entries(clientRevenue)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const statusCounts = {
      paid: invoices.filter((item) => String(item.status || "").toLowerCase() === "paid").length,
      pending: invoices.filter((item) => ["pending", "overdue"].includes(String(item.status || "").toLowerCase())).length,
      draft: invoices.filter((item) => String(item.status || "").toLowerCase() === "draft").length,
    };

    return (
      <section className="content revenue-page">
        <PageHeading
          eyebrow="FINANCE / INSIGHTS"
          title="Revenue Analytics"
          action={
            <button
              type="button"
              className="primary small"
              onClick={() => load(true)}
              disabled={refreshing}
              style={{ color: "#fff", WebkitTextFillColor: "#fff" }}
            >
              <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              {refreshing ? "REFRESHING..." : "REFRESH DATA"}
            </button>
          }
        />

        <div className="dashboard-kpis revenue-kpis">
          <DashboardKpi
            label="TOTAL INVOICED"
            value={money(invoicedValue)}
            description={`${activeInvoices.filter((item) => String(item.status || "").toLowerCase() !== "draft").length} active invoices`}
            icon={FileInvoiceIcon}
          />
          <DashboardKpi
            label="REVENUE RECEIVED"
            value={money(collectedValue)}
            description={`${successfulPayments.length} successful payments`}
            icon={CheckCircle2}
            accent
          />
          <DashboardKpi
            label="OUTSTANDING"
            value={money(outstandingValue)}
            description="Invoice value not collected"
            icon={Clock3}
          />
          <DashboardKpi
            label="COLLECTION RATE"
            value={`${collectionRate}%`}
            description={`Avg payment ${money(averagePayment)}`}
            icon={ArrowUpRight}
          />
        </div>

        <div className="revenue-grid">
          <section className="dashboard-card revenue-chart-card">
            <div className="card-heading">
              <div>
                <span className="card-label">CASH FLOW</span>
                <h2>Monthly Revenue</h2>
              </div>
              <div className="card-icon"><DollarSign size={19} /></div>
            </div>

            <div className="revenue-chart">
              {monthlyRevenue.map((month) => (
                <div className="revenue-bar-item" key={month.key} title={`${month.label}: ${money(month.total)}`}>
                  <div className="revenue-bar-value">{month.total ? money(month.total) : "₹0"}</div>
                  <div className="revenue-bar-track">
                    <div
                      className="revenue-bar-fill"
                      style={{ height: `${Math.max((month.total / maxMonth) * 100, month.total ? 8 : 3)}%` }}
                    />
                  </div>
                  <span>{month.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-card revenue-summary-card">
            <div className="card-heading">
              <div>
                <span className="card-label">INVOICE HEALTH</span>
                <h2>Revenue Summary</h2>
              </div>
              <div className="card-icon"><BarChart3 size={19} /></div>
            </div>

            <div className="revenue-summary-list">
              <div><span>Paid invoices</span><strong>{statusCounts.paid}</strong></div>
              <div><span>Pending / overdue</span><strong>{statusCounts.pending}</strong></div>
              <div><span>Draft invoices</span><strong>{statusCounts.draft}</strong></div>
              <div><span>Paid invoice value</span><strong>{money(paidInvoiceValue)}</strong></div>
            </div>

            <div className="collection-meter">
              <div><span>Collection progress</span><strong>{collectionRate}%</strong></div>
              <div className="collection-track"><span style={{ width: `${collectionRate}%` }} /></div>
            </div>
          </section>
        </div>

        <div className="revenue-grid revenue-grid-bottom">
          <section className="dashboard-card revenue-panel">
            <div className="card-heading">
              <div>
                <span className="card-label">TOP CLIENTS</span>
                <h2>Revenue by Client</h2>
              </div>
              <div className="card-icon"><UsersRound size={19} /></div>
            </div>

            {topClients.length ? (
              <div className="revenue-client-list">
                {topClients.map((client) => {
                  const percentage = collectedValue ? Math.round((client.total / collectedValue) * 100) : 0;
                  return (
                    <div className="revenue-client-row" key={client.name}>
                      <div className="revenue-client-top">
                        <strong>{client.name}</strong>
                        <span>{money(client.total)}</span>
                      </div>
                      <div className="revenue-client-track"><span style={{ width: `${percentage}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            ) : <Empty />}
          </section>

          <section className="dashboard-card revenue-panel">
            <div className="card-heading">
              <div>
                <span className="card-label">REAL BACKEND DATA</span>
                <h2>Recent Payments</h2>
              </div>
              <div className="card-icon"><CreditCard size={19} /></div>
            </div>

            {successfulPayments.length ? (
              <div className="table-wrap">
                <table className="data-table revenue-table">
                  <thead>
                    <tr><th>CLIENT</th><th>AMOUNT</th><th>METHOD</th><th>DATE</th></tr>
                  </thead>
                  <tbody>
                    {successfulPayments.slice(0, 8).map((payment) => (
                      <tr key={payment._id || payment.id}>
                        <td>{payment.client?.name || payment.invoice?.client?.name || "Unknown client"}</td>
                        <td><strong>{money(payment.amount)}</strong></td>
                        <td>{payment.paymentMethod || "—"}</td>
                        <td>{dateValue(payment.paymentDate || payment.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty />}
          </section>
        </div>
      </section>
    );
  }

  function renderUnavailableModule(title, description) {
    return (
      <section className="content">
        <PageHeading eyebrow="MODULE" title={title} />

        <div className="dashboard-card module-placeholder">
          <div className="module-placeholder-icon">
            <Database size={28} />
          </div>

          <h2>{title} module</h2>
          <p>{description}</p>

          <span>
            This section is intentionally not using demo data. It will be
            connected to the real backend when its database/API layer is
            implemented.
          </span>
        </div>
      </section>
    );
  }

  function renderContent() {
    if (tab === "overview") return renderOverview();
    if (tab === "projects") return renderProjects();
    if (tab === "packages") return renderPackages();
    if (tab === "enquiries") return renderEnquiries();
    if (tab === "clients") return renderClients();
    if (tab === "services") return renderServices();
    if (tab === "invoices") return renderInvoices();
    if (tab === "payments") return renderPayments();
    if (tab === "revenue") return renderRevenueAnalytics();
    if (tab === "tasks") {
      return <Tasks clients={clients} projects={projects} initialTasks={tasks} />;
    }
    if (tab === "messages") {
      return (
        <Messages
          items={enquiries}
          update={updateEnquiry}
          onView={setSelectedEnquiry}
        />
      );
    }

    if (tab === "reports") {
      return (
        <Reports
          projects={projects}
          packages={packages}
          enquiries={enquiries}
          clients={clients}
          invoices={invoices}
          payments={payments}
        />
      );
    }

    if (tab === "team") {
      return <Team />;
    }

    if (tab === "calendar") {
      return (
        <Calendar
          tasks={tasks}
          projects={projects}
          invoices={invoices}
        />
      );
    }

    if (tab === "notifications") {
      return (
        <Notifications
          enquiries={enquiries}
          invoices={invoices}
          projects={projects}
        />
      );
    }

    if (tab === "settings") {
      return <Settings admin={admin} isTeamMember={Boolean(isTeamMember)} />;
    }

    const futureModules = {
      invoices: [
        "Invoices",
        "Invoice records and invoice management will be implemented here.",
      ],
    };

    const module = futureModules[tab];

    if (module) {
      return renderUnavailableModule(module[0], module[1]);
    }

    return renderUnavailableModule(
      "Module",
      "This section is not available yet."
    );
  }

  return (
    <DashboardShell
      activeTab={tab}
      onNavigate={setTab}
      admin={admin}
      onLogout={logout}
      isTeamMember={Boolean(isTeamMember)}
      notificationCount={stats.newEnquiries}
      onAddProject={() => {
        if (isAdmin) openProjectForm();
      }}
      onAddPackage={() => {
        if (isAdmin) openPackageForm();
      }}
      onNotificationClick={() => setTab("notifications")}
    >
      {renderContent()}

      {loadingData && (
        <div className="dashboard-loading-bar">
          Loading latest data...
        </div>
      )}

      {modal?.type === "project" && (
        <ProjectForm
          initial={modal.data}
          close={() => setModal(null)}
          saved={() => {
            setModal(null);
            load(true);
          }}
        />
      )}

      {modal?.type === "package" && (
        <PackageForm
          initial={modal.data}
          close={() => setModal(null)}
          saved={() => {
            setModal(null);
            load(true);
          }}
        />
      )}

      {modal?.type === "client" && (
        <ClientForm
          initial={modal.data}
          close={() => setModal(null)}
          saved={() => {
            setModal(null);
            load(true);
          }}
        />
      )}

      {modal?.type === "service" && (
        <ServiceForm
          initial={modal.data}
          close={() => setModal(null)}
          saved={() => {
            setModal(null);
            load(true);
          }}
        />
      )}

      {modal?.type === "invoice" && (
        <InvoiceForm
          initial={modal.data}
          clients={clients}
          services={services}
          close={() => setModal(null)}
          saved={() => {
            setModal(null);
            load(true);
          }}
        />
      )}

      {modal?.type === "payment" && (
        <PaymentForm
          initial={modal.data}
          invoices={invoices}
          clients={clients}
          payments={payments}
          close={() => setModal(null)}
          saved={() => {
            setModal(null);
            load(true);
          }}
        />
      )}

      {selectedEnquiry && (
        <EnquiryDetails
          item={selectedEnquiry}
          close={() => setSelectedEnquiry(null)}
        />
      )}
    </DashboardShell>
  );
}

function DashboardKpi({
  label,
  value,
  description,
  icon: Icon,
  accent,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`dashboard-kpi ${accent ? "dashboard-kpi-accent" : ""}`}
      onClick={onClick}
    >
      <div className="kpi-top">
        <span>{label}</span>
        <div className="kpi-icon">
          <Icon size={19} />
        </div>
      </div>

      <strong>{value}</strong>

      <div className="kpi-bottom">
        <span>{description}</span>
        <ArrowUpRight size={15} />
      </div>
    </button>
  );
}

function EnquiryBar({ label, value, total }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="enquiry-bar">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="bar-track">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function StatusMetric({ label, value, icon: Icon }) {
  return (
    <div className="status-metric">
      <div>
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function PageHeading({ eyebrow, title, action }) {
  return (
    <div className="heading">
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EnquiriesTable({ items, update, del, onView }) {
  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            <th>
              <span className="table-heading">
                <UserRound size={16} />
                CLIENT
              </span>
            </th>
            <th>
              <span className="table-heading">
                <BriefcaseBusiness size={16} />
                SERVICE
              </span>
            </th>
            <th>
              <span className="table-heading">
                <MessageSquare size={16} />
                MESSAGE
              </span>
            </th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>
                <strong>{item.name || "—"}</strong>
                <small>{item.email || "—"}</small>
                {item.phone && <small>{item.phone}</small>}
              </td>

              <td>
                <strong>{item.service || "—"}</strong>
                <small>
                  {item.packageName || "No package selected"}
                </small>
              </td>

              <td>
                <span className="message-preview">
                  {item.message || "No message"}
                </span>
                {item.createdAt && (
                  <small>
                    {new Date(item.createdAt).toLocaleString("en-IN")}
                  </small>
                )}
              </td>

              <td>
                <select
                  value={item.status || "new"}
                  onChange={(event) =>
                    update(item._id, event.target.value)
                  }
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="in-progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </td>

              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    onClick={() => onView(item)}
                  >
                    <Eye size={14} />
                    VIEW
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      if (window.confirm("Delete this enquiry?")) {
                        del(item._id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!items.length && <Empty />}
    </div>
  );
}

function EnquiryDetails({ item, close }) {
  return (
    <Modal title="ENQUIRY DETAILS" close={close}>
      <div className="enquiry-details">
        <Detail label="CLIENT" value={item.name} />
        <Detail label="EMAIL" value={item.email} />
        <Detail label="PHONE" value={item.phone} />
        <Detail label="SERVICE" value={item.service} />
        <Detail label="PACKAGE" value={item.packageName} />
        <Detail label="REGION" value={item.region || "India"} />

        <div className="detail-full">
          <small>MESSAGE</small>
          <p>{item.message || "No message"}</p>
        </div>

        {item.createdAt && (
          <div className="detail-full">
            <small>SUBMITTED</small>
            <p>
              {new Date(item.createdAt).toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function Empty() {
  return (
    <div className="empty">
      <Database size={20} />
      <span>Nothing here yet.</span>
    </div>
  );
}
