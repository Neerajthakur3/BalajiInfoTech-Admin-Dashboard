import { useEffect, useState } from "react";
import {
  UserRound,
  LockKeyhole,
  Palette,
  Bell,
  Save,
  ShieldCheck,
  Sun,
  Moon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";

const API =
  import.meta.env.VITE_API_URL ||
  "https://balajiinfotech-backend-1.onrender.com/api";

const TOKEN_KEY = "balaji_admin_token";

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  businessName: "BalajiInfoTech",
  avatarUrl: "",
};

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const response = await fetch(`${API}${path}`, {
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

export default function Settings({ admin }) {
  const [form, setForm] =
    useState(defaultForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [theme, setTheme] =
    useState(
      () =>
        localStorage.getItem(
          "balaji_theme"
        ) || "light"
    );

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwords, setPasswords] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const result =
        await api("/auth/me");

      const data =
        result.data ||
        admin?.data ||
        admin ||
        {};

      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        businessName:
          data.businessName ||
          "BalajiInfoTech",
        avatarUrl:
          data.avatarUrl || "",
      });
    } catch (err) {
      console.error(
        "PROFILE LOAD ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        avatarUrl: reader.result,
      }));

      setMessage("");
      setError("");
    };

    reader.onerror = () => {
      setError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (saving) return;

    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    const profileEmail =
      form.email?.trim() ||
      admin?.email?.trim() ||
      "";

    setSaving(true);

    try {
      const result =
        await api("/auth/profile", {
          method: "PUT",

          body: JSON.stringify({
            name: form.name.trim(),
            email: profileEmail,
            phone:
              form.phone.trim(),
            businessName:
              form.businessName.trim(),
            avatarUrl:
              form.avatarUrl.trim(),
          }),
        });

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to update profile."
        );
      }

      setMessage(
        "Profile updated successfully."
      );

      /*
       * Reload the application so App.jsx
       * calls /auth/me again and the updated
       * name/avatar appears everywhere.
       */
      setTimeout(() => {
        window.location.reload();
      }, 900);

    } catch (err) {
      console.error(
        "PROFILE UPDATE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function changeTheme(nextTheme) {
    setTheme(nextTheme);

    localStorage.setItem(
      "balaji_theme",
      nextTheme
    );

    document.documentElement.dataset.theme =
      nextTheme;

    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );

    document.documentElement.classList.toggle(
      "light",
      nextTheme === "light"
    );
  }

  function updatePasswordField(
    field,
    value
  ) {
    setPasswords((current) => ({
      ...current,
      [field]: value,
    }));

    setPasswordMessage("");
    setPasswordError("");
  }

  async function changePassword(
    event
  ) {
    event.preventDefault();

    if (passwordLoading) return;

    setPasswordMessage("");
    setPasswordError("");

    if (
      !passwords.currentPassword
    ) {
      setPasswordError(
        "Enter your current password."
      );
      return;
    }

    if (
      !passwords.newPassword
    ) {
      setPasswordError(
        "Enter a new password."
      );
      return;
    }

    if (
      passwords.newPassword.length < 8
    ) {
      setPasswordError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    if (
      passwords.currentPassword ===
      passwords.newPassword
    ) {
      setPasswordError(
        "New password must be different from current password."
      );
      return;
    }

    setPasswordLoading(true);

    try {
      const result =
        await api(
          "/auth/change-password",
          {
            method: "POST",

            body: JSON.stringify({
              currentPassword:
                passwords.currentPassword,

              newPassword:
                passwords.newPassword,
            }),
          }
        );

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to change password."
        );
      }

      setPasswordMessage(
        "Password changed successfully."
      );

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

    } catch (err) {
      console.error(
        "PASSWORD CHANGE ERROR:",
        err
      );

      setPasswordError(
        err.message ||
          "Unable to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  const avatarLetter =
    form.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "A";

  if (loading) {
    return (
      <section className="content">
        <div className="profile-loading">
          LOADING PROFILE...
        </div>
      </section>
    );
  }

  return (
    <section className="content profile-settings">
      <style>{`

        .profile-settings {
          max-width: 1180px;
          margin: 0 auto;
        }

        .profile-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .profile-header small {
          display: block;
          color: #ff5a00;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .profile-header h2 {
          margin: 5px 0 0;
          color: var(--dash-text, #111827);
          font-size: 26px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.4fr)
            minmax(300px, .8fr);
          gap: 18px;
        }

        .profile-card {
          background: var(--dash-surface, #fff);
          border: 1px solid
            var(--dash-border, #dfe4ea);
          border-radius: 16px;
          padding: 20px;
          box-sizing: border-box;
        }

        .profile-card.full {
          grid-column: 1 / -1;
        }

        .profile-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .profile-card-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(255, 90, 0, .09);
          color: #ff5a00;
          flex: 0 0 auto;
        }

        .profile-card-header h3 {
          margin: 0;
          color: var(--dash-text, #111827);
          font-size: 15px;
        }

        .profile-card-header p {
          margin: 3px 0 0;
          color: var(--dash-muted, #64748b);
          font-size: 10px;
        }

        .profile-avatar-section {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          margin-bottom: 18px;
          border-radius: 12px;
          background:
            var(--dash-surface-2, #f7f8fa);
          border: 1px solid
            var(--dash-border, #e3e7ec);
        }

        .profile-avatar {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          overflow: hidden;
          flex: 0 0 auto;
          background: #ff5a00;
          color: #fff;
          font-size: 23px;
          font-weight: 900;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar-info strong {
          display: block;
          color: var(--dash-text, #111827);
          font-size: 14px;
        }

        .profile-avatar-info span {
          display: block;
          margin-top: 4px;
          color: var(--dash-muted, #64748b);
          font-size: 10px;
        }

        .profile-fields {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .profile-field {
          display: grid;
          gap: 7px;
        }

        .profile-field.full {
          grid-column: 1 / -1;
        }

        .profile-field label {
          color: var(--dash-muted, #64748b);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .06em;
        }

        .profile-field input {
          width: 100%;
          min-height: 44px;
          box-sizing: border-box;
          border: 1px solid
            var(--dash-border, #dfe4ea);
          border-radius: 10px;
          padding: 0 12px;
          outline: none;
          background:
            var(--dash-surface-2, #fff);
          color:
            var(--dash-text, #111827);
          font-size: 13px;
        }

        .profile-field input:focus {
          border-color: #ff5a00;
          box-shadow:
            0 0 0 3px
            rgba(255, 90, 0, .09);
        }

        .profile-upload-box {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 14px;
          border: 1px solid var(--dash-border, #dfe4ea);
          border-radius: 12px;
          background: var(--dash-surface-2, #f7f8fa);
        }

        .profile-upload-preview {
          width: 70px;
          height: 70px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 50%;
          background: #ff5a00;
          color: #fff;
        }

        .profile-upload-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-upload-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
        }

        .profile-upload-info strong {
          color: var(--dash-text, #111827);
          font-size: 12px;
        }

        .profile-upload-info span {
          color: var(--dash-muted, #64748b);
          font-size: 9px;
        }

        .profile-upload-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 5px;
          padding: 9px 12px;
          border-radius: 8px;
          background: #ff5a00;
          color: #fff !important;
          font-size: 9px;
          font-weight: 900;
          cursor: pointer;
        }

        .profile-upload-button svg {
          color: #fff !important;
          stroke: currentColor;
        }

        .profile-upload-button:hover {
          opacity: .9;
        }

        .profile-save-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 18px;
        }

        .profile-save-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 18px;
          border: 0;
          border-radius: 10px;
          background: #ff5a00;
          color: #fff !important;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .profile-save-button svg {
          color: #fff !important;
          stroke: currentColor;
        }

        .profile-save-button:hover,
        .profile-upload-button:hover,
        .password-save:hover {
          background: #e95100;
          color: #fff !important;
        }

        .profile-save-button:disabled {
          opacity: .65;
          cursor: not-allowed;
          color: #fff !important;
        }

        .status-message {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 10px;
          font-weight: 800;
        }

        .status-success {
          color: #15803d;
          background: rgba(22, 163, 74, .08);
        }

        .status-error {
          color: #dc2626;
          background: rgba(220, 38, 38, .08);
        }

        .password-field {
          position: relative;
        }

        .password-field input {
          padding-right: 43px;
        }

        .password-eye {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 0;
          background: transparent;
          color: var(--dash-muted, #64748b);
          cursor: pointer;
        }

        .password-fields {
          display: grid;
          gap: 14px;
        }

        .password-save {
          width: 100%;
          min-height: 43px;
          margin-top: 16px;
          border: 0;
          border-radius: 10px;
          background: #ff5a00;
          color: #fff !important;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .password-save svg {
          color: #fff !important;
        }

        .password-save:disabled {
          opacity: .65;
          color: #fff !important;
        }

        .security-box {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 13px 14px;
          border-radius: 10px;
          background: rgba(37, 99, 235, .07);
          border: 1px solid rgba(37, 99, 235, .08);
          color: var(--dash-text, #475569);
          font-size: 10px;
          line-height: 1.6;
        }

        .security-box svg {
          color: #2563eb;
          flex: 0 0 auto;
        }

        .theme-options {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .theme-button {
          min-height: 82px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid
            var(--dash-border, #dfe4ea);
          border-radius: 11px;
          background:
            var(--dash-surface-2, #fff);
          color: var(--dash-muted, #64748b);
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .theme-button.active {
          color: #ff5a00;
          border-color: #ff5a00;
          box-shadow:
            0 0 0 2px
            rgba(255, 90, 0, .08);
        }

        .profile-loading {
          min-height: 300px;
          display: grid;
          place-items: center;
          color: var(--dash-muted, #64748b);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        html[data-theme="dark"]
          .profile-card {
          background: #15181d;
          border-color: #2b3139;
        }

        html[data-theme="dark"]
          .profile-avatar-section,
        html[data-theme="dark"]
          .profile-field input,
        html[data-theme="dark"]
          .theme-button {
          background: #101318;
          border-color: #2b3139;
        }

        html[data-theme="dark"]
          .profile-header h2,
        html[data-theme="dark"]
          .profile-card-header h3,
        html[data-theme="dark"]
          .profile-avatar-info strong,
        html[data-theme="dark"]
          .profile-field input {
          color: #f3f4f6;
        }

        html[data-theme="dark"] .security-box {
          background: rgba(37, 99, 235, .10);
          border-color: rgba(96, 165, 250, .10);
          color: #cbd5e1;
        }

        html[data-theme="dark"] .security-box svg {
          color: #60a5fa;
        }

        html[data-theme="dark"] .profile-upload-box {
          background: #101318;
          border-color: #2b3139;
        }

        @media (max-width: 600px) {
          .profile-upload-box {
            align-items: flex-start;
          }

          .profile-upload-preview {
            width: 58px;
            height: 58px;
          }

          .profile-upload-info {
            min-width: 0;
          }
        }


        /* FINAL BUTTON TEXT COLOR OVERRIDE */
        button.profile-save-button,
        button.password-save,
        label.profile-upload-button {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          text-decoration: none !important;
        }

        button.profile-save-button *,
        button.password-save *,
        label.profile-upload-button * {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        button.profile-save-button svg,
        button.password-save svg,
        label.profile-upload-button svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        @media (max-width: 850px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }

          .profile-card.full {
            grid-column: auto;
          }
        }

        @media (max-width: 600px) {
          .profile-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .profile-fields {
            grid-template-columns: 1fr;
          }

          .profile-field.full {
            grid-column: auto;
          }

          .theme-options {
            grid-template-columns: 1fr 1fr;
          }
        }

      
        /* FINAL ACTION BUTTON COLORS */
        .profile-settings .profile-save-button,
        .profile-settings .password-save {
          background: #ff5a00 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          text-shadow: none !important;
        }

        .profile-settings .profile-save-button *,
        .profile-settings .password-save * {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        .profile-settings .profile-save-button svg,
        .profile-settings .password-save svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
          fill: none !important;
        }

        .profile-settings .profile-save-button:hover,
        .profile-settings .password-save:hover {
          background: #e95100 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        .profile-settings .profile-save-button:disabled,
        .profile-settings .password-save:disabled {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
`}
</style>


      <div className="profile-header">
        <div>
          <small>
            ACCOUNT & SECURITY
          </small>

          <h2>Profile Settings</h2>
        </div>
      </div>


      <div className="profile-grid">

        {/* =========================
            PROFILE
        ========================= */}

        <section className="profile-card full">

          <div className="profile-card-header">
            <div className="profile-card-icon">
              <UserRound size={18} />
            </div>

            <div>
              <h3>Admin Profile</h3>
              <p>
                Manage your administrator
                account information.
              </p>
            </div>
          </div>


          <form onSubmit={saveProfile}>

            <div className="profile-avatar-section">

              <div className="profile-avatar">

                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt="Admin profile"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  avatarLetter
                )}

              </div>


              <div className="profile-avatar-info">

                <strong>
                  {form.name ||
                    "Administrator"}
                </strong>

                <span>
                  Administrator Account
                </span>

              </div>

            </div>


            <div className="profile-fields">

              <div className="profile-field">

                <label>
                  FULL NAME
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Admin Name"
                />

              </div>


              <div className="profile-field">

                <label>
                  EMAIL ADDRESS
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="admin@example.com"
                />

              </div>


              <div className="profile-field">

                <label>
                  PHONE NUMBER
                </label>

                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="+91 XXXXX XXXXX"
                />

              </div>


              <div className="profile-field">

                <label>
                  BUSINESS NAME
                </label>

                <input
                  type="text"
                  value={
                    form.businessName
                  }
                  onChange={(event) =>
                    updateField(
                      "businessName",
                      event.target.value
                    )
                  }
                  placeholder="BalajiInfoTech"
                />

              </div>


              <div className="profile-field full">

                <label>
                  PROFILE PHOTO
                </label>

                <div className="profile-upload-box">

                  <div className="profile-upload-preview">
                    {form.avatarUrl ? (
                      <img
                        src={form.avatarUrl}
                        alt="Profile preview"
                      />
                    ) : (
                      <UserRound size={25} />
                    )}
                  </div>

                  <div className="profile-upload-info">
                    <strong>
                      Upload your profile photo
                    </strong>

                    <span>
                      JPG, JPEG, PNG or WEBP · Max 2 MB
                    </span>

                    <label
                      htmlFor="profile-image-upload"
                      className="profile-upload-button"
                    >
                      <Upload size={14} />
                      CHOOSE IMAGE
                    </label>

                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      hidden
                    />
                  </div>

                </div>

              </div>

            </div>


            {message && (
              <div className="status-message status-success">
                <CheckCircle2
                  size={15}
                />
                {message}
              </div>
            )}


            {error && (
              <div className="status-message status-error">
                <AlertCircle
                  size={15}
                />
                {error}
              </div>
            )}


            <div className="profile-save-row">

              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                <Save size={15} />

                {saving
                  ? "SAVING..."
                  : "SAVE PROFILE"}
              </button>

            </div>

          </form>

        </section>


        {/* =========================
            PASSWORD
        ========================= */}

        <section className="profile-card">

          <div className="profile-card-header">
            <div className="profile-card-icon">
              <LockKeyhole
                size={18}
              />
            </div>

            <div>
              <h3>
                Change Password
              </h3>

              <p>
                Keep your admin account secure.
              </p>
            </div>
          </div>


          <form
            onSubmit={changePassword}
          >

            <div className="password-fields">

              <div className="profile-field">

                <label>
                  CURRENT PASSWORD
                </label>

                <div className="password-field">

                  <input
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      passwords.currentPassword
                    }
                    onChange={(event) =>
                      updatePasswordField(
                        "currentPassword",
                        event.target.value
                      )
                    }
                    autoComplete="current-password"
                    placeholder="Current password"
                  />

                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowCurrentPassword(
                        (value) => !value
                      )
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>

              </div>


              <div className="profile-field">

                <label>
                  NEW PASSWORD
                </label>

                <div className="password-field">

                  <input
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      passwords.newPassword
                    }
                    onChange={(event) =>
                      updatePasswordField(
                        "newPassword",
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                  />

                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowNewPassword(
                        (value) => !value
                      )
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>

              </div>


              <div className="profile-field">

                <label>
                  CONFIRM PASSWORD
                </label>

                <div className="password-field">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      passwords.confirmPassword
                    }
                    onChange={(event) =>
                      updatePasswordField(
                        "confirmPassword",
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                  />

                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>

              </div>

            </div>


            {passwordMessage && (
              <div className="status-message status-success">
                <CheckCircle2
                  size={15}
                />
                {passwordMessage}
              </div>
            )}


            {passwordError && (
              <div className="status-message status-error">
                <AlertCircle
                  size={15}
                />
                {passwordError}
              </div>
            )}


            <button
              type="submit"
              className="password-save"
              disabled={
                passwordLoading
              }
            >
              {passwordLoading
                ? "UPDATING..."
                : "CHANGE PASSWORD"}
            </button>

          </form>

        </section>


        {/* =========================
            APPEARANCE
        ========================= */}

        <section className="profile-card">

          <div className="profile-card-header">
            <div className="profile-card-icon">
              <Palette size={18} />
            </div>

            <div>
              <h3>
                Appearance
              </h3>

              <p>
                Dashboard theme preference.
              </p>
            </div>
          </div>


          <div className="theme-options">

            <button
              type="button"
              className={`theme-button ${
                theme === "light"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                changeTheme("light")
              }
            >
              <Sun size={19} />
              LIGHT
            </button>


            <button
              type="button"
              className={`theme-button ${
                theme === "dark"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                changeTheme("dark")
              }
            >
              <Moon size={19} />
              DARK
            </button>

          </div>

        </section>


        {/* =========================
            SECURITY
        ========================= */}

        <section className="profile-card full">

          <div className="profile-card-header">
            <div className="profile-card-icon">
              <ShieldCheck
                size={18}
              />
            </div>

            <div>
              <h3>
                Account Security
              </h3>

              <p>
                Authentication information.
              </p>
            </div>
          </div>


          <div className="security-box">

            <ShieldCheck
              size={18}
            />

            <span>
              Your profile updates are
              authenticated using the existing
              admin session. Passwords are
              never stored as plain text and
              are handled by the backend
              password hashing system.
            </span>

          </div>

        </section>

      </div>
    </section>
  );
}