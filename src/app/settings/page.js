'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Home, LogOut } from 'lucide-react';

const defaults = {
  brandName: 'LavishstarTechnologies',
  dashboardTitle: 'Management Dashboard',
  applyTitle: 'Employee ID Card Application',
  adminLoginLabel: 'ADMIN LOGIN',
  logoUrl: ''
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState(defaults);
  const [logoUpload, setLogoUpload] = useState('');
  const [saving, setSaving] = useState(false);
  const [credentialsForm, setCredentialsForm] = useState({
    usernameGroupCurrentUsername: '',
    usernameGroupCurrentPassword: '',
    newUsername: '',
    passwordGroupCurrentUsername: '',
    passwordGroupCurrentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [credentialsSaving, setCredentialsSaving] = useState({
    username: false,
    password: false
  });
  const [showPasswords, setShowPasswords] = useState({
    usernameGroupCurrentPassword: false,
    passwordGroupCurrentPassword: false,
    newPassword: false,
    confirmNewPassword: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        setForm({
          brandName: data?.brandName || defaults.brandName,
          dashboardTitle: data?.dashboardTitle || defaults.dashboardTitle,
          applyTitle: data?.applyTitle || defaults.applyTitle,
          adminLoginLabel: data?.adminLoginLabel || defaults.adminLoginLabel,
          logoUrl: data?.logoUrl || defaults.logoUrl
        });
      } catch {
        // keep defaults
      }
    };
    fetchSettings();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = String(event.target?.result || '');
      setLogoUpload(result);
      setForm((prev) => ({ ...prev, logoUrl: result || prev.logoUrl }));
    };
    reader.readAsDataURL(file);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        brandName: form.brandName,
        dashboardTitle: form.dashboardTitle,
        applyTitle: form.applyTitle,
        adminLoginLabel: form.adminLoginLabel
      };
      if (logoUpload) payload.logoUrl = logoUpload;

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to save settings');
        return;
      }
      alert('Brand settings saved');
      setLogoUpload('');
      setForm({
        brandName: data?.data?.brandName || form.brandName,
        dashboardTitle: data?.data?.dashboardTitle || form.dashboardTitle,
        applyTitle: data?.data?.applyTitle || form.applyTitle,
        adminLoginLabel: data?.data?.adminLoginLabel || form.adminLoginLabel,
        logoUrl: data?.data?.logoUrl || form.logoUrl
      });
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const onCredentialsChange = (e) => {
    const { name, value } = e.target;
    setCredentialsForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const saveUsername = async () => {
    if (!credentialsForm.usernameGroupCurrentUsername || !credentialsForm.usernameGroupCurrentPassword || !credentialsForm.newUsername) {
      alert('Please fill current username, current password and new username');
      return;
    }

    setCredentialsSaving((prev) => ({ ...prev, username: true }));
    try {
      const res = await fetch('/api/admin-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'username',
          currentUsername: credentialsForm.usernameGroupCurrentUsername.trim(),
          currentPassword: credentialsForm.usernameGroupCurrentPassword,
          newUsername: credentialsForm.newUsername.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update username');
        return;
      }
      alert('Username updated successfully');
      setCredentialsForm((prev) => ({
        ...prev,
        usernameGroupCurrentUsername: prev.newUsername.trim(),
        usernameGroupCurrentPassword: '',
        newUsername: ''
      }));
    } catch {
      alert('Failed to update username');
    } finally {
      setCredentialsSaving((prev) => ({ ...prev, username: false }));
    }
  };

  const savePassword = async () => {
    if (!credentialsForm.passwordGroupCurrentUsername || !credentialsForm.passwordGroupCurrentPassword || !credentialsForm.newPassword) {
      alert('Please fill current username, current password and new password');
      return;
    }

    if (credentialsForm.newPassword !== credentialsForm.confirmNewPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    setCredentialsSaving((prev) => ({ ...prev, password: true }));
    try {
      const res = await fetch('/api/admin-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'password',
          currentUsername: credentialsForm.passwordGroupCurrentUsername.trim(),
          currentPassword: credentialsForm.passwordGroupCurrentPassword,
          newPassword: credentialsForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update password');
        return;
      }
      alert('Password updated successfully');
      setCredentialsForm((prev) => ({
        ...prev,
        passwordGroupCurrentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));
    } catch {
      alert('Failed to update password');
    } finally {
      setCredentialsSaving((prev) => ({ ...prev, password: false }));
    }
  };

  return (
    <main className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-box">
            {form.logoUrl ? <img src={form.logoUrl} alt="Brand Logo" className="dashboard-logo" /> : null}
          </div>
          <div>
            <h1>{form.dashboardTitle || 'Management Dashboard'}</h1>
            <p className="header-brand-name">{form.brandName || 'LavishstarTechnologies'}</p>
          </div>
        </div>

        <div className="header-right">
          <button
            onClick={() => router.push('/dashboard')}
            className="icon-refresh-btn"
            title="Home"
          >
            <Home size={20} />
          </button>
          <button onClick={handleLogout} className="logout-btn-minimal" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="branding-settings-card">
          <div className="branding-settings-header">
            <h2>Brand Settings</h2>
            <span>Change logo and app names for product customization.</span>
          </div>
          <div className="branding-settings-grid">
            <label>
              Brand Name
              <input name="brandName" value={form.brandName} onChange={onChange} />
            </label>
            <label>
              Dashboard Title
              <input name="dashboardTitle" value={form.dashboardTitle} onChange={onChange} />
            </label>
            <label>
              Apply Page Title
              <input name="applyTitle" value={form.applyTitle} onChange={onChange} />
            </label>
            <label>
              Login Badge Label
              <input name="adminLoginLabel" value={form.adminLoginLabel} onChange={onChange} />
            </label>
            <label>
              Upload New Logo
              <input type="file" accept="image/*" onChange={onLogoUpload} />
            </label>
            <div className="branding-logo-preview">
              <span>Logo Preview</span>
              {form.logoUrl ? <img src={form.logoUrl} alt="Brand logo preview" /> : <span>No logo selected</span>}
            </div>
          </div>
          <div className="branding-settings-actions">
            <button type="button" onClick={() => router.push('/dashboard')} className="secondary-btn">
              Back to Dashboard
            </button>
            <button type="button" onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Brand Settings'}
            </button>
          </div>
        </div>

        <div className="branding-settings-card">
          <div className="branding-settings-header">
            <h2>Admin Credentials</h2>
            <span>Change admin username and password securely.</span>
          </div>
          <div className="credentials-groups">
            <div className="credentials-group">
              <h3>Username Group</h3>
              <div className="branding-settings-grid">
                <label>
                  Current Username
                  <input
                    name="usernameGroupCurrentUsername"
                    value={credentialsForm.usernameGroupCurrentUsername}
                    onChange={onCredentialsChange}
                  />
                </label>
                <label>
                  Current Password
                  <div className="password-input-wrap">
                    <input
                      type={showPasswords.usernameGroupCurrentPassword ? 'text' : 'password'}
                      name="usernameGroupCurrentPassword"
                      value={credentialsForm.usernameGroupCurrentPassword}
                      onChange={onCredentialsChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('usernameGroupCurrentPassword')}
                      title={showPasswords.usernameGroupCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPasswords.usernameGroupCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <label>
                  New Username
                  <input
                    name="newUsername"
                    value={credentialsForm.newUsername}
                    onChange={onCredentialsChange}
                  />
                </label>
              </div>
              <div className="branding-settings-actions">
                <button type="button" onClick={saveUsername} disabled={credentialsSaving.username}>
                  {credentialsSaving.username ? 'Saving...' : 'Save Username'}
                </button>
              </div>
            </div>

            <div className="credentials-group">
              <h3>Password Group</h3>
              <div className="branding-settings-grid">
                <label>
                  Current Username
                  <input
                    name="passwordGroupCurrentUsername"
                    value={credentialsForm.passwordGroupCurrentUsername}
                    onChange={onCredentialsChange}
                  />
                </label>
                <label>
                  Current Password
                  <div className="password-input-wrap">
                    <input
                      type={showPasswords.passwordGroupCurrentPassword ? 'text' : 'password'}
                      name="passwordGroupCurrentPassword"
                      value={credentialsForm.passwordGroupCurrentPassword}
                      onChange={onCredentialsChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('passwordGroupCurrentPassword')}
                      title={showPasswords.passwordGroupCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPasswords.passwordGroupCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <label>
                  New Password
                  <div className="password-input-wrap">
                    <input
                      type={showPasswords.newPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={credentialsForm.newPassword}
                      onChange={onCredentialsChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('newPassword')}
                      title={showPasswords.newPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPasswords.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <label>
                  Confirm New Password
                  <div className="password-input-wrap">
                    <input
                      type={showPasswords.confirmNewPassword ? 'text' : 'password'}
                      name="confirmNewPassword"
                      value={credentialsForm.confirmNewPassword}
                      onChange={onCredentialsChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('confirmNewPassword')}
                      title={showPasswords.confirmNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPasswords.confirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              </div>
              <div className="branding-settings-actions">
                <button type="button" onClick={savePassword} disabled={credentialsSaving.password}>
                  {credentialsSaving.password ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
