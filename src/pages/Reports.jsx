import { useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  MessageSquare,
  UsersRound,
  Wallet,
  TrendingUp,
} from "lucide-react";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="report-stat">
      <div className="report-stat-top">
        <span>{label}</span>
        <div className="report-stat-icon">
          <Icon size={18} />
        </div>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export default function Reports({
  projects = [],
  packages = [],
  enquiries = [],
  clients = [],
  invoices = [],
  payments = [],
}) {
  const [period, setPeriod] = useState("all");

  const data = useMemo(() => {
    const now = new Date();
    const start = new Date(now);

    if (period === "month") start.setMonth(now.getMonth() - 1);
    if (period === "quarter") start.setMonth(now.getMonth() - 3);
    if (period === "year") start.setFullYear(now.getFullYear() - 1);

    const inPeriod = (item) => {
      if (period === "all") return true;
      const raw = item.createdAt || item.issueDate || item.paymentDate;
      if (!raw) return true;
      const date = new Date(raw);
      return !Number.isNaN(date.getTime()) && date >= start;
    };

    const periodInvoices = invoices.filter(inPeriod);
    const periodPayments = payments.filter(inPeriod);
    const periodEnquiries = enquiries.filter(inPeriod);
    const periodProjects = projects.filter(inPeriod);

    const invoiced = periodInvoices.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const paidInvoices = periodInvoices
      .filter((item) => String(item.status).toLowerCase() === "paid")
      .reduce((sum, item) => sum + Number(item.total || 0), 0);

    const received = periodPayments
      .filter((item) => String(item.status).toLowerCase() === "success")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const pending = periodPayments
      .filter((item) => String(item.status).toLowerCase() === "pending")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const failed = periodPayments
      .filter((item) => String(item.status).toLowerCase() === "failed")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const enquiryStatus = ["new", "contacted", "in-progress", "closed"].map(
      (status) => ({
        status,
        count: periodEnquiries.filter(
          (item) => String(item.status || "new").toLowerCase() === status
        ).length,
      })
    );

    const invoiceStatus = ["paid", "pending", "overdue"].map((status) => ({
      status,
      count: periodInvoices.filter(
        (item) => String(item.status || "").toLowerCase() === status
      ).length,
    }));

    return {
      invoices: periodInvoices.length,
      invoiced,
      paidInvoices,
      received,
      pending,
      failed,
      enquiries: periodEnquiries.length,
      projects: periodProjects.length,
      clients: clients.length,
      packages: packages.length,
      enquiryStatus,
      invoiceStatus,
    };
  }, [period, projects, packages, enquiries, clients, invoices, payments]);

  return (
    <section className="content reports-module">
      <style>{`
        .reports-module .report-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
        }

        .reports-module .report-header small {
          color: #ff5a00;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .reports-module .report-header h2 {
          margin: 5px 0 0;
          color: var(--text, #111827);
        }

        .reports-module .report-period {
          min-height: 42px;
          border: 1px solid var(--border, #dfe4ea);
          border-radius: 11px;
          background: var(--surface, #fff);
          color: var(--text, #111827);
          padding: 0 12px;
          font-weight: 800;
          outline: none;
        }

        .reports-module .report-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .reports-module .report-stat,
        .reports-module .report-card {
          border: 1px solid var(--border, #dfe4ea);
          border-radius: 15px;
          background: var(--surface, #fff);
        }

        .reports-module .report-stat {
          padding: 17px;
        }

        .reports-module .report-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .reports-module .report-stat-top > span {
          color: #64748b;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .reports-module .report-stat-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #ff5a00;
          background: rgba(255, 90, 0, .09);
        }

        .reports-module .report-stat strong {
          display: block;
          margin: 13px 0 5px;
          color: var(--text, #111827);
          font-size: 25px;
        }

        .reports-module .report-stat small {
          color: #64748b;
        }

        .reports-module .report-grid {
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 18px;
        }

        .reports-module .report-card {
          padding: 18px;
        }

        .reports-module .report-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .reports-module .report-card-head h3 {
          margin: 0;
          color: var(--text, #111827);
          font-size: 16px;
        }

        .reports-module .report-card-head span {
          color: #64748b;
          font-size: 11px;
        }

        .reports-module .report-total {
          color: #ff5a00;
          font-size: 20px;
          font-weight: 900;
        }

        .reports-module .report-bar {
          margin: 15px 0;
        }

        .reports-module .report-bar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #64748b;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .reports-module .report-track {
          height: 9px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--muted-surface, #eef1f4);
        }

        .reports-module .report-track > span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #ff5a00;
        }

        .reports-module .report-breakdown {
          display: grid;
          gap: 10px;
        }

        .reports-module .report-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 12px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 10px;
        }

        .reports-module .report-line span {
          color: #64748b;
        }

        .reports-module .report-line strong {
          color: var(--text, #111827);
        }

        html[data-theme="dark"] .reports-module .report-period,
        html[data-theme="dark"] .reports-module .report-stat,
        html[data-theme="dark"] .reports-module .report-card,
        html[data-theme="dark"] .reports-module .report-line {
          background: #15181d;
          border-color: #2b3139;
        }

        html[data-theme="dark"] .reports-module .report-header h2,
        html[data-theme="dark"] .reports-module .report-stat strong,
        html[data-theme="dark"] .reports-module .report-card-head h3,
        html[data-theme="dark"] .reports-module .report-line strong {
          color: #f3f4f6;
        }

        @media (max-width: 900px) {
          .reports-module .report-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .reports-module .report-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .reports-module .report-header {
            align-items: stretch;
            flex-direction: column;
          }
          .reports-module .report-stats {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div className="report-header">
        <div>
          <small>REAL BACKEND DATA</small>
          <h2>Reports & Analytics</h2>
        </div>

        <select
          className="report-period"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          aria-label="Report period"
        >
          <option value="all">All Time</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 3 Months</option>
          <option value="year">Last 12 Months</option>
        </select>
      </div>

      <div className="report-stats">
        <StatCard
          label="RECEIVED"
          value={money(data.received)}
          detail={`${payments.length} payment records total`}
          icon={Wallet}
        />
        <StatCard
          label="INVOICED"
          value={money(data.invoiced)}
          detail={`${data.invoices} invoices in period`}
          icon={FileText}
        />
        <StatCard
          label="ENQUIRIES"
          value={data.enquiries}
          detail="Client enquiries in period"
          icon={MessageSquare}
        />
        <StatCard
          label="PROJECTS"
          value={data.projects}
          detail={`${data.clients} total clients`}
          icon={BriefcaseBusiness}
        />
      </div>

      <div className="report-grid">
        <section className="report-card">
          <div className="report-card-head">
            <div>
              <h3>Financial Overview</h3>
              <span>Based on loaded invoices and payments</span>
            </div>
            <CircleDollarSign size={20} />
          </div>

          <div className="report-total">{money(data.received)}</div>

          <div className="report-bar">
            <div className="report-bar-row">
              <span>Received vs Invoiced</span>
              <strong>
                {data.invoiced
                  ? Math.min(
                      100,
                      Math.round((data.received / data.invoiced) * 100)
                    )
                  : 0}
                %
              </strong>
            </div>
            <div className="report-track">
              <span
                style={{
                  width: `${
                    data.invoiced
                      ? Math.min(
                          100,
                          Math.round((data.received / data.invoiced) * 100)
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="report-breakdown">
            <div className="report-line">
              <span>Paid invoices</span>
              <strong>{money(data.paidInvoices)}</strong>
            </div>
            <div className="report-line">
              <span>Pending payments</span>
              <strong>{money(data.pending)}</strong>
            </div>
            <div className="report-line">
              <span>Failed payments</span>
              <strong>{money(data.failed)}</strong>
            </div>
          </div>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <div>
              <h3>Enquiry Pipeline</h3>
              <span>Current enquiry distribution</span>
            </div>
            <TrendingUp size={20} />
          </div>

          {data.enquiryStatus.map((item) => {
            const max = Math.max(
              1,
              ...data.enquiryStatus.map((entry) => entry.count)
            );
            return (
              <div className="report-bar" key={item.status}>
                <div className="report-bar-row">
                  <span>{item.status.replace(/-/g, " ").toUpperCase()}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="report-track">
                  <span
                    style={{
                      width: `${Math.round((item.count / max) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <div>
              <h3>Invoice Status</h3>
              <span>Invoice count by status</span>
            </div>
            <CheckCircle2 size={20} />
          </div>

          <div className="report-breakdown">
            {data.invoiceStatus.map((item) => (
              <div className="report-line" key={item.status}>
                <span>{item.status.toUpperCase()}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <div>
              <h3>Business Snapshot</h3>
              <span>Current backend records</span>
            </div>
            <BarChart3 size={20} />
          </div>

          <div className="report-breakdown">
            <div className="report-line">
              <span><UsersRound size={14} /> Clients</span>
              <strong>{data.clients}</strong>
            </div>
            <div className="report-line">
              <span>Projects</span>
              <strong>{projects.length}</strong>
            </div>
            <div className="report-line">
              <span>Packages</span>
              <strong>{data.packages}</strong>
            </div>
            <div className="report-line">
              <span>Invoices</span>
              <strong>{invoices.length}</strong>
            </div>
            <div className="report-line">
              <span>Payments</span>
              <strong>{payments.length}</strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
