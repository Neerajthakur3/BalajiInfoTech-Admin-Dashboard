import React, { useEffect, useState } from "react";
import DashboardPage from "./pages/Dashboard.jsx";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const ADMIN_TOKEN_KEY = "balaji_admin_token";
const TEAM_TOKEN_KEY = "balaji_team_token";
const SESSION_KEY = "balaji_session_type";

async function api(path, options = {}, tokenKey = ADMIN_TOKEN_KEY) {
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

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {
  const [mode, setMode] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    const isTeam = mode === "team";
    const tokenKey = isTeam ? TEAM_TOKEN_KEY : ADMIN_TOKEN_KEY;
    try {
      const result = await api(
        isTeam ? "/team-auth/login" : "/auth/login",
        { method: "POST", body: JSON.stringify({ email: email.trim(), password }) },
        tokenKey
      );
      if (!result.success || !result.token) throw new Error("Invalid login response.");
      localStorage.setItem(tokenKey, result.token);
      localStorage.setItem(SESSION_KEY, mode);
      onLogin(result.data || {}, mode);
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setError(error.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <small>BALAJIINFOTECH / {mode === "team" ? "TEAM MEMBER" : "ADMIN"}</small>
        <h1
          style={{
            color: "#f5f5f5",
            WebkitTextFillColor: "#f5f5f5",
          }}
        >
          CONTROL<br />
          <span style={{ color: "#555555", WebkitTextFillColor: "#555555" }}>
            CENTER.
          </span>
        </h1>
        <p style={{ color: "#747474" }}>
          {mode === "team"
            ? "Sign in to access your assigned team workspace."
            : "Manage your website content, pricing and client enquiries."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          <button type="button" onClick={() => { setMode("admin"); setError(""); }} style={{ minHeight: 42, borderRadius: 8, cursor: "pointer", border: "1px solid rgba(127,127,127,.25)", background: mode === "admin" ? "#ff5a00" : "transparent", color: mode === "admin" ? "#FFFFFF" : "#F5F5F5", WebkitTextFillColor: mode === "admin" ? "#FFFFFF" : "#F5F5F5" }}>ADMIN</button>
          <button type="button" onClick={() => { setMode("team"); setError(""); }} style={{ minHeight: 42, borderRadius: 8, cursor: "pointer", border: "1px solid rgba(127,127,127,.25)", background: mode === "team" ? "#ff5a00" : "transparent", color: mode === "team" ? "#FFFFFF" : "#F5F5F5", WebkitTextFillColor: mode === "team" ? "#FFFFFF" : "#F5F5F5" }}>TEAM MEMBER</button>
        </div>
        <form onSubmit={handleLogin} noValidate>
          <label>EMAIL<input type="email" value={email} autoComplete="username" onChange={e => setEmail(e.target.value)} /></label>
          <label>PASSWORD<input type="password" value={password} autoComplete="current-password" onChange={e => setPassword(e.target.value)} /></label>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="primary" disabled={loading}>{loading ? "SIGNING IN..." : mode === "team" ? "ENTER TEAM DASHBOARD ↗" : "ENTER DASHBOARD ↗"}</button>
        </form>
      </div>
    </main>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [sessionType, setSessionType] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const type = localStorage.getItem(SESSION_KEY);
    const tokenKey = type === "team" ? TEAM_TOKEN_KEY : ADMIN_TOKEN_KEY;
    const token = localStorage.getItem(tokenKey);
    if (!type || !token) { setChecking(false); return; }
    const mePath = type === "team" ? "/team-auth/me" : "/auth/me";
    api(mePath, {}, tokenKey)
      .then(result => { if (mounted) { setAdmin(result.data || null); setSessionType(type); } })
      .catch(error => {
        console.error("SESSION CHECK ERROR:", error);
        if (mounted) { localStorage.removeItem(tokenKey); localStorage.removeItem(SESSION_KEY); setAdmin(null); setSessionType(null); }
      })
      .finally(() => { if (mounted) setChecking(false); });
    return () => { mounted = false; };
  }, []);

  if (checking) return <div className="loading">LOADING...</div>;
  if (!admin) return <Login onLogin={(data, type) => { setAdmin(data); setSessionType(type); }} />;

  const logout = () => {
    const tokenKey = sessionType === "team" ? TEAM_TOKEN_KEY : ADMIN_TOKEN_KEY;
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(SESSION_KEY);
    setAdmin(null);
    setSessionType(null);
  };

  return <DashboardPage admin={admin} sessionType={sessionType} isTeamMember={sessionType === "team"} logout={logout} />;
}
