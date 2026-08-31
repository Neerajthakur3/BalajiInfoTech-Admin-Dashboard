import { useEffect, useMemo, useState } from "react";
import {
  UserRound, LockKeyhole, Save, Upload, Eye, EyeOff,
  WalletCards, CheckCircle2, AlertCircle
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SESSION_KEY = "balaji_session_type";
const ADMIN_TOKEN_KEY = "balaji_admin_token";
const TEAM_TOKEN_KEY = "balaji_team_token";

function getToken() {
  const team = localStorage.getItem(SESSION_KEY) === "team";
  return localStorage.getItem(team ? TEAM_TOKEN_KEY : ADMIN_TOKEN_KEY);
}

async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

const emptyProfile = {
  fullName: "", phone: "", designation: "", department: "",
  dateOfBirth: "", joiningDate: "", address: "", city: "",
  state: "", pincode: "", emergencyContactName: "",
  emergencyContactPhone: "", avatarUrl: "",
  bank: {
    accountHolder: "", bankName: "", accountNumber: "", ifsc: "", upiId: ""
  }
};

function mergeProfile(value) {
  return {
    ...emptyProfile,
    ...(value || {}),
    bank: { ...emptyProfile.bank, ...(value?.bank || {}) }
  };
}

export default function Settings({ admin, isTeamMember = false }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "", newPassword: "", confirmPassword: ""
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [earnings, setEarnings] = useState({ data: [], totals: { total: 0, earned: 0, pending: 0, paid: 0 } });

  useEffect(() => {
    load();
  }, [isTeamMember, admin]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      if (!isTeamMember) {
        const result = await api("/auth/me");
        const data = result.data || admin || {};
        setProfile({
          ...emptyProfile,
          fullName: data.name || "",
          phone: data.phone || "",
          avatarUrl: data.avatarUrl || "",
          department: "Administration",
          designation: "Administrator",
        });
      } else {
        const [profileResult, earningsResult] = await Promise.all([
          api("/team-auth/me"),
          api("/team-auth/earnings")
        ]);
        const data = profileResult.data || {};
        setProfile(mergeProfile(data.profile));
        setEarnings({
          data: earningsResult.data || [],
          totals: earningsResult.totals || { total: 0, earned: 0, pending: 0, paid: 0 }
        });
      }
    } catch (e) {
      setError(e.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }

  function update(key, value) {
    setProfile(current => ({ ...current, [key]: value }));
    setMessage(""); setError("");
  }

  function updateBank(key, value) {
    setProfile(current => ({
      ...current,
      bank: { ...current.bank, [key]: value }
    }));
    setMessage(""); setError("");
  }

  function handleImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please select an image.");
    if (file.size > 2 * 1024 * 1024) return setError("Image must be under 2 MB.");
    const reader = new FileReader();
    reader.onload = () => update("avatarUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try {
      if (isTeamMember) {
        await api("/team-auth/profile", {
          method: "PUT",
          body: JSON.stringify(profile)
        });
        setMessage("Team profile saved successfully.");
        await load();
      } else {
        await api("/auth/profile", {
          method: "PUT",
          body: JSON.stringify({
            name: profile.fullName,
            phone: profile.phone,
            avatarUrl: profile.avatarUrl
          })
        });
        setMessage("Admin profile saved successfully.");
        setTimeout(() => window.location.reload(), 700);
      }
    } catch (e) {
      setError(e.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setMessage(""); setError("");
    if (passwords.newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (passwords.newPassword !== passwords.confirmPassword) return setError("Passwords do not match.");
    setPasswordSaving(true);
    try {
      await api(isTeamMember ? "/team-auth/password" : "/auth/change-password", {
        method: isTeamMember ? "PUT" : "POST",
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Password changed successfully.");
    } catch (e) {
      setError(e.message || "Unable to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  const total = useMemo(() => Number(earnings.totals?.total || 0), [earnings]);

  if (loading) return <section className="content"><div className="dashboard-card">LOADING PROFILE...</div></section>;

  return (
    <section className="content team-settings-page">
      <style>{`
        .team-settings-page{
          display:grid;
          gap:18px;
          color:var(--dash-text,#172033);
        }
        .ts-head{display:flex;justify-content:space-between;align-items:end;gap:16px}
        .ts-head small{color:#ff5a00;font-weight:900;letter-spacing:.16em}
        .ts-head h1{margin:6px 0 0;color:var(--dash-text,#172033)}
        .ts-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
        .ts-card{
          background:var(--dash-surface,#fff);
          border:1px solid var(--dash-border,#dfe4ea);
          border-radius:18px;
          padding:20px;
          color:var(--dash-text,#172033);
        }
        .ts-title{display:flex;align-items:center;gap:11px;margin-bottom:16px}
        .ts-icon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:rgba(255,90,0,.12);color:#ff5a00}
        .ts-title h3{margin:0;font-size:15px;color:var(--dash-text,#172033)}
        .ts-title p{margin:3px 0 0;color:var(--dash-muted,#64748b);font-size:12px}
        .ts-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
        .ts-field{display:grid;gap:7px}
        .ts-field.full{grid-column:1/-1}
        .ts-field label{font-size:10px;font-weight:900;letter-spacing:.1em;color:var(--dash-muted,#64748b)}
        .ts-field input,.ts-field textarea{
          width:100%;
          box-sizing:border-box;
          border:1px solid var(--dash-border,#dfe4ea);
          background:var(--dash-input,#fff);
          color:var(--dash-text,#172033);
          border-radius:10px;
          padding:11px 12px;
          outline:none;
        }
        .ts-field input::placeholder,.ts-field textarea::placeholder{color:var(--dash-muted,#98a2b3)}
        .ts-field input:focus,.ts-field textarea:focus{border-color:#ff5a00;box-shadow:0 0 0 3px rgba(255,90,0,.10)}
        .ts-avatar{display:flex;align-items:center;gap:14px;margin-bottom:16px}
        .ts-avatar-img{width:76px;height:76px;border-radius:50%;overflow:hidden;background:var(--dash-surface-2,#f4f6f8);display:grid;place-items:center;color:#ff5a00;font-weight:900;font-size:26px;border:2px solid rgba(255,90,0,.35)}
        .ts-avatar-img img{width:100%;height:100%;object-fit:cover}
        .ts-upload{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:9px 12px;
          border:1px solid var(--dash-border,#dfe4ea);
          background:var(--dash-surface-2,#fff);
          color:var(--dash-text,#172033);
          border-radius:10px;
          cursor:pointer;
          font-size:12px;
          font-weight:800;
        }
        .ts-upload:hover{border-color:#ff5a00;color:#ff5a00}
        .ts-upload input{display:none}
        .ts-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
        .ts-save{
          border:0;
          background:#ff5a00;
          color:#fff !important;
          -webkit-text-fill-color:#fff !important;
          border-radius:10px;
          padding:11px 17px;
          font-weight:900;
          cursor:pointer;
          box-shadow:0 8px 20px rgba(255,90,0,.18);
        }
        .ts-save *{color:#fff !important;-webkit-text-fill-color:#fff !important}
        .ts-save svg{color:#fff !important;stroke:#fff !important}
        .ts-save:hover{background:#e95100;color:#fff !important;-webkit-text-fill-color:#fff !important}
        .ts-save:disabled{opacity:.6;color:#fff !important;-webkit-text-fill-color:#fff !important}
        .ts-alert{padding:11px 13px;border-radius:10px;background:rgba(255,90,0,.1);border:1px solid rgba(255,90,0,.25);color:#b54708;font-size:12px}
        .ts-success{padding:11px 13px;border-radius:10px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:#16803c;font-size:12px}
        .ts-earnings{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
        .ts-stat{padding:13px;border-radius:12px;background:var(--dash-surface-2,#f7f8fa);border:1px solid var(--dash-border,#e5e7eb)}
        .ts-stat span{display:block;color:var(--dash-muted,#64748b);font-size:10px;font-weight:800}
        .ts-stat strong{display:block;margin-top:5px;font-size:18px;color:var(--dash-text,#172033)}
        .ts-table{width:100%;border-collapse:collapse;font-size:12px;color:var(--dash-text,#172033)}
        .ts-table th,.ts-table td{text-align:left;padding:10px;border-bottom:1px solid var(--dash-border,#e5e7eb)}
        .ts-table th{color:var(--dash-muted,#64748b);font-size:10px;letter-spacing:.08em}
        html[data-theme="dark"] .ts-card{background:#15181d;border-color:#2b3139;color:#f3f4f6}
        html[data-theme="dark"] .ts-title h3,
        html[data-theme="dark"] .ts-head h1,
        html[data-theme="dark"] .ts-stat strong,
        html[data-theme="dark"] .ts-table{color:#f3f4f6}
        html[data-theme="dark"] .ts-field input,
        html[data-theme="dark"] .ts-field textarea{
          background:#0d0f12;
          border-color:#30353d;
          color:#fff;
        }
        html[data-theme="dark"] .ts-avatar-img{background:#252a31}
        html[data-theme="dark"] .ts-upload{background:#101318;border-color:#3b424c;color:#f3f4f6}
        html[data-theme="dark"] .ts-stat{background:#0d0f12;border-color:#252b33}
        html[data-theme="dark"] .ts-table th,
        html[data-theme="dark"] .ts-field label,
        html[data-theme="dark"] .ts-title p{color:#8f98a5}
        @media(max-width:800px){.ts-grid,.ts-fields{grid-template-columns:1fr}.ts-card.full{grid-column:auto}.ts-earnings{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      <div className="ts-head">
        <div>
          <small>{isTeamMember ? "TEAM MEMBER ACCOUNT" : "ADMIN CONTROL"}</small>
          <h1>{isTeamMember ? "My Settings" : "Settings"}</h1>
        </div>
      </div>

      {error && <div className="ts-alert"><AlertCircle size={14}/> {error}</div>}
      {message && <div className="ts-success"><CheckCircle2 size={14}/> {message}</div>}

      <form onSubmit={saveProfile}>
        <div className="ts-grid">
          <section className="ts-card full">
            <div className="ts-title"><div className="ts-icon"><UserRound size={18}/></div><div><h3>Profile</h3><p>{isTeamMember ? "Your personal and work information" : "Administrator account information"}</p></div></div>
            <div className="ts-avatar">
              <div className="ts-avatar-img">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Profile"/> : (profile.fullName || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{profile.fullName || admin?.name || "Team Member"}</strong>
                <div style={{color:"var(--dash-muted,#64748b)",fontSize:12,margin:"4px 0 9px"}}>{admin?.email || ""}</div>
                <label className="ts-upload"><Upload size={14}/> Upload photo<input type="file" accept="image/*" onChange={handleImage}/></label>
              </div>
            </div>
            <div className="ts-fields">
              <div className="ts-field"><label>FULL NAME</label><input value={profile.fullName} onChange={e=>update("fullName",e.target.value)}/></div>
              <div className="ts-field"><label>PHONE</label><input value={profile.phone} onChange={e=>update("phone",e.target.value)}/></div>
              <div className="ts-field"><label>DESIGNATION</label><input value={profile.designation} onChange={e=>update("designation",e.target.value)}/></div>
              <div className="ts-field"><label>DEPARTMENT</label><input value={profile.department} onChange={e=>update("department",e.target.value)}/></div>
              <div className="ts-field"><label>DATE OF BIRTH</label><input type="date" value={profile.dateOfBirth} onChange={e=>update("dateOfBirth",e.target.value)}/></div>
              <div className="ts-field"><label>JOINING DATE</label><input type="date" value={profile.joiningDate} onChange={e=>update("joiningDate",e.target.value)}/></div>
              <div className="ts-field full"><label>ADDRESS</label><textarea value={profile.address} onChange={e=>update("address",e.target.value)}/></div>
              <div className="ts-field"><label>CITY</label><input value={profile.city} onChange={e=>update("city",e.target.value)}/></div>
              <div className="ts-field"><label>STATE</label><input value={profile.state} onChange={e=>update("state",e.target.value)}/></div>
              <div className="ts-field"><label>PINCODE</label><input value={profile.pincode} onChange={e=>update("pincode",e.target.value)}/></div>
              <div className="ts-field"><label>EMERGENCY CONTACT</label><input value={profile.emergencyContactName} onChange={e=>update("emergencyContactName",e.target.value)}/></div>
              <div className="ts-field"><label>EMERGENCY PHONE</label><input value={profile.emergencyContactPhone} onChange={e=>update("emergencyContactPhone",e.target.value)}/></div>
            </div>
          </section>

          {isTeamMember && <section className="ts-card full">
            <div className="ts-title"><div className="ts-icon"><WalletCards size={18}/></div><div><h3>Payment Details</h3><p>Bank account and UPI used for your team payouts</p></div></div>
            <div className="ts-fields">
              <div className="ts-field"><label>ACCOUNT HOLDER</label><input value={profile.bank.accountHolder} onChange={e=>updateBank("accountHolder",e.target.value)}/></div>
              <div className="ts-field"><label>BANK NAME</label><input value={profile.bank.bankName} onChange={e=>updateBank("bankName",e.target.value)}/></div>
              <div className="ts-field"><label>ACCOUNT NUMBER</label><input value={profile.bank.accountNumber} onChange={e=>updateBank("accountNumber",e.target.value)}/></div>
              <div className="ts-field"><label>IFSC</label><input value={profile.bank.ifsc} onChange={e=>updateBank("ifsc",e.target.value.toUpperCase())}/></div>
              <div className="ts-field"><label>UPI ID</label><input value={profile.bank.upiId} onChange={e=>updateBank("upiId",e.target.value)}/></div>
            </div>
          </section>}

          <section className="ts-card full">
            <div className="ts-title"><div className="ts-icon"><LockKeyhole size={18}/></div><div><h3>Security</h3><p>Change only your own account password</p></div></div>
            <div className="ts-fields">
              <div className="ts-field"><label>CURRENT PASSWORD</label><input type={showPasswords ? "text":"password"} value={passwords.currentPassword} onChange={e=>setPasswords(p=>({...p,currentPassword:e.target.value}))}/></div>
              <div className="ts-field"><label>NEW PASSWORD</label><input type={showPasswords ? "text":"password"} value={passwords.newPassword} onChange={e=>setPasswords(p=>({...p,newPassword:e.target.value}))}/></div>
              <div className="ts-field"><label>CONFIRM PASSWORD</label><input type={showPasswords ? "text":"password"} value={passwords.confirmPassword} onChange={e=>setPasswords(p=>({...p,confirmPassword:e.target.value}))}/></div>
              <div className="ts-actions" style={{alignItems:"end"}}><button
                  type="button"
                  className="ts-upload"
                  onClick={()=>setShowPasswords(v=>!v)}
                  style={{color:"var(--dash-text,#172033)"}}
                >
                  {showPasswords
                    ? <EyeOff size={14} style={{color:"#fff",stroke:"#fff"}}/>
                    : <Eye size={14} style={{color:"#fff",stroke:"#fff"}}/>
                  }
                  <span style={{color:"#fff",WebkitTextFillColor:"#fff"}}>
                    {showPasswords?"HIDE":"SHOW"}
                  </span>
                </button><button
                  type="button"
                  className="ts-save"
                  disabled={passwordSaving}
                  onClick={changePassword}
                  style={{color:"#fff",WebkitTextFillColor:"#fff",backgroundColor:"#ff5a00"}}
                >
                  <span style={{color:"#fff",WebkitTextFillColor:"#fff"}}>
                    {passwordSaving?"SAVING...":"CHANGE PASSWORD"}
                  </span>
                </button></div>
            </div>
          </section>

          {isTeamMember && <section className="ts-card full">
            <div className="ts-title"><div className="ts-icon"><WalletCards size={18}/></div><div><h3>My Earnings</h3><p>Project-based earnings recorded by Admin</p></div></div>
            <div className="ts-earnings">
              <div className="ts-stat"><span>TOTAL</span><strong>₹{total.toLocaleString("en-IN")}</strong></div>
              <div className="ts-stat"><span>EARNED</span><strong>₹{Number(earnings.totals?.earned||0).toLocaleString("en-IN")}</strong></div>
              <div className="ts-stat"><span>PENDING</span><strong>₹{Number(earnings.totals?.pending||0).toLocaleString("en-IN")}</strong></div>
              <div className="ts-stat"><span>PAID</span><strong>₹{Number(earnings.totals?.paid||0).toLocaleString("en-IN")}</strong></div>
            </div>
            <table className="ts-table"><thead><tr><th>PROJECT</th><th>AMOUNT</th><th>STATUS</th><th>DATE</th></tr></thead><tbody>
              {earnings.data.map(row=><tr key={row._id}><td>{row.project?.title || row.projectTitle || "Project"}</td><td>₹{Number(row.amount||0).toLocaleString("en-IN")}</td><td>{String(row.status||"earned").toUpperCase()}</td><td>{row.earnedAt ? new Date(row.earnedAt).toLocaleDateString("en-IN") : "-"}</td></tr>)}
              {!earnings.data.length && <tr><td colSpan="4">No project earnings recorded yet.</td></tr>}
            </tbody></table>
          </section>}
        </div>
        <div className="ts-actions">
          <button
            className="ts-save"
            type="submit"
            disabled={saving}
            style={{color:"#fff",WebkitTextFillColor:"#fff",backgroundColor:"#ff5a00"}}
          >
            <Save size={15} style={{color:"#fff",stroke:"#fff"}}/>
            <span style={{color:"#fff",WebkitTextFillColor:"#fff"}}>
              {saving?"SAVING...":"SAVE PROFILE"}
            </span>
          </button>
        </div>
      </form>
    </section>
  );
}
