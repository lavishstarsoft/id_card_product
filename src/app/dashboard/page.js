'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCw,
  LogOut,
  UserPlus,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Settings,
  Eye
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [journalists, setJournalists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, recent: 0 });
  const PROTECTED_PRESS_ID = 'RKV00003';
  const [authModal, setAuthModal] = useState({
    open: false,
    action: null,
    journalist: null
  });
  const [secretPassword, setSecretPassword] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [idRequests, setIdRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [previewRequest, setPreviewRequest] = useState(null);
  const [branding, setBranding] = useState({
    logoUrl: '',
    brandName: 'LavishstarTechnologies',
    dashboardTitle: 'Management Dashboard'
  });

  async function fetchJournalists(query = '') {
    setLoading(true);
    try {
      const res = await fetch(`/api/journalists${query ? `?q=${query}` : ''}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setJournalists(data);
        const today = new Date().setHours(0,0,0,0);
        const recentCount = data.filter(j => new Date(j.createdAt).setHours(0,0,0,0) === today).length;
        setStats({ total: data.length, recent: recentCount });
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJournalists();
      fetchIdRequests();
      fetchBranding();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function fetchBranding() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();
      const next = {
        logoUrl: data?.logoUrl || '',
        brandName: data?.brandName || 'LavishstarTechnologies',
        dashboardTitle: data?.dashboardTitle || 'Management Dashboard'
      };
      setBranding(next);
    } catch (error) {
      console.error('Branding fetch error:', error);
    }
  }

  async function fetchIdRequests() {
    setRequestsLoading(true);
    try {
      const res = await fetch('/api/id-card-requests');
      const data = await res.json();
      if (Array.isArray(data)) {
        setIdRequests(data);
      }
    } catch (error) {
      console.error('Request fetch error:', error);
    } finally {
      setRequestsLoading(false);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJournalists(searchTerm);
  };

  const handleDelete = async (journalist) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    if (journalist.pressId === PROTECTED_PRESS_ID) {
      setSecretPassword('');
      setShowSecret(false);
      setAuthModal({ open: true, action: 'delete', journalist });
      return;
    }

    await runDelete(journalist);
  };

  const runDelete = async (journalist, password = '') => {
    try {
      const headers = {};
      if (journalist.pressId === PROTECTED_PRESS_ID) {
        headers['x-admin-password'] = password;
      }

      const res = await fetch(`/api/journalists/${journalist._id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setJournalists(prev => prev.filter(j => j._id !== journalist._id));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete');
      }
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const handleEdit = (journalist) => {
    if (journalist.pressId === PROTECTED_PRESS_ID) {
      setSecretPassword('');
      setShowSecret(false);
      setAuthModal({ open: true, action: 'edit', journalist });
    } else {
      sessionStorage.removeItem('editJournalistAdminPassword');
      sessionStorage.setItem('editJournalist', JSON.stringify(journalist));
      router.push('/generate');
    }
  };

  const closeAuthModal = () => {
    setAuthModal({ open: false, action: null, journalist: null });
    setSecretPassword('');
    setShowSecret(false);
  };

  const submitProtectedAction = async () => {
    if (!secretPassword.trim()) {
      alert('Please enter secret password');
      return;
    }
    const { action, journalist } = authModal;
    if (!journalist) return;

    if (action === 'edit') {
      sessionStorage.setItem('editJournalistAdminPassword', secretPassword);
      sessionStorage.setItem('editJournalist', JSON.stringify(journalist));
      closeAuthModal();
      router.push('/generate');
      return;
    }

    if (action === 'delete') {
      await runDelete(journalist, secretPassword);
      closeAuthModal();
    }
  };

  const handleToggleRevoke = async (journalist) => {
    const nextStatus = journalist.status === 'revoked' ? 'active' : 'revoked';
    const confirmText = nextStatus === 'revoked'
      ? 'Are you sure you want to revoke this card?'
      : 'Do you want to activate this card again?';

    if (!confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/journalists/${journalist._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to update status');
        return;
      }

      const result = await res.json();
      setJournalists((prev) => prev.map((j) => (
        j._id === journalist._id ? { ...j, ...result.data } : j
      )));
    } catch (error) {
      alert('Failed to update status');
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

  const handleCreateFromRequest = (requestItem) => {
    sessionStorage.removeItem('editJournalistAdminPassword');
    sessionStorage.setItem('editJournalist', JSON.stringify({
      _requestId: requestItem._id,
      name: requestItem.fullName,
      mobile: requestItem.mobile,
      area: requestItem.area || requestItem.workLocation,
      bloodGroup: requestItem.bloodGroup,
      profileImage: requestItem.profileImage,
      signatureImage: requestItem.signatureImage
    }));
    router.push('/generate');
  };

  const openRequestPreview = (requestItem) => {
    setPreviewRequest(requestItem);
  };

  const closeRequestPreview = () => {
    setPreviewRequest(null);
  };

  const updateRequestStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/id-card-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to update request');
        return;
      }
      fetchIdRequests();
    } catch {
      alert('Failed to update request');
    }
  };

  const deleteRequest = async (id) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      const res = await fetch(`/api/id-card-requests/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to delete request');
        return;
      }
      setIdRequests((prev) => prev.filter((item) => item._id !== id));
      if (previewRequest?._id === id) {
        setPreviewRequest(null);
      }
    } catch {
      alert('Failed to delete request');
    }
  };

  const requestCounts = {
    all: idRequests.length,
    approved: idRequests.filter((item) => item.status === 'approved').length,
    pending: idRequests.filter((item) => item.status === 'pending').length,
    rejected: idRequests.filter((item) => item.status === 'rejected').length
  };

  const filteredRequests = idRequests.filter((item) => {
    const byStatus = requestStatusFilter === 'all' ? true : item.status === requestStatusFilter;
    const searchValue = requestSearch.trim().toLowerCase();
    const bySearch = !searchValue
      ? true
      : `${item.fullName || ''} ${item.mobile || ''} ${item.email || ''} ${item.area || ''} ${item.workLocation || ''}`
          .toLowerCase()
          .includes(searchValue);
    return byStatus && bySearch;
  });

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-box">
            {branding.logoUrl ? <img src={branding.logoUrl} alt="Brand Logo" className="dashboard-logo" /> : null}
          </div>
          <div>
            <h1>{branding.dashboardTitle || 'Management Dashboard'}</h1>
            <p className="header-brand-name">{branding.brandName || 'LavishstarTechnologies'}</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Total IDs</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Added Today</span>
              <span className="stat-value highlight">{stats.recent}</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="icon-refresh-btn"
            title="Brand Settings"
          >
            <Settings size={20} />
          </button>
          <button onClick={handleLogout} className="logout-btn-minimal" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-top-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`dashboard-top-tab ${activeTab === 'requests' ? 'active' : ''}`}
          >
            Employee ID Card Requests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`dashboard-top-tab ${activeTab === 'history' ? 'active' : ''}`}
          >
            ID Card History
          </button>
        </div>

        {activeTab === 'requests' && (
          <div className="table-container" style={{ marginBottom: '16px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Employee ID Card Requests</h2>
              <button onClick={fetchIdRequests} className="icon-refresh-btn" title="Refresh Requests">
                <RefreshCw size={16} className={requestsLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="request-controls">
              <div className="request-search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, email, area..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                />
              </div>
              <select
                className="request-filter-select"
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="request-status-tabs">
              <button
                type="button"
                onClick={() => setRequestStatusFilter('approved')}
                className={`request-status-tab ${requestStatusFilter === 'approved' ? 'active' : ''}`}
              >
                APPROVED <span className="count-badge blue">{requestCounts.approved}</span>
              </button>
              <button
                type="button"
                onClick={() => setRequestStatusFilter('pending')}
                className={`request-status-tab ${requestStatusFilter === 'pending' ? 'active' : ''}`}
              >
                PENDING <span className="count-badge red">{requestCounts.pending}</span>
              </button>
              <button
                type="button"
                onClick={() => setRequestStatusFilter('rejected')}
                className={`request-status-tab ${requestStatusFilter === 'rejected' ? 'active' : ''}`}
              >
                REJECTED <span className="count-badge gray">{requestCounts.rejected}</span>
              </button>
              <button
                type="button"
                onClick={() => setRequestStatusFilter('all')}
                className={`request-status-tab ${requestStatusFilter === 'all' ? 'active' : ''}`}
              >
                ALL <span className="count-badge dark">{requestCounts.all}</span>
              </button>
            </div>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requestsLoading ? (
                  <tr><td colSpan="6" className="table-loader">Loading applications...</td></tr>
                ) : filteredRequests.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">No employee applications found for current search/filter.</td></tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req._id}>
                      <td>
                        <div className="info-cell">
                          <span className="info-name">{req.fullName}</span>
                          <span className="info-sub">{req.gender || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="info-cell">
                          <span className="info-main">{req.mobile}</span>
                          <span className="info-sub">{req.email || '-'}</span>
                        </div>
                      </td>
                      <td>{req.area || req.workLocation || '-'}</td>
                      <td>
                        <span className={`status-pill ${req.status === 'approved' ? 'status-active' : req.status === 'rejected' ? 'status-revoked' : ''}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>{new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() => openRequestPreview(req)}
                            className="action-icon verify"
                            title="Preview Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleCreateFromRequest(req)}
                            className="action-icon edit"
                            title="Create ID Card"
                          >
                            <UserPlus size={16} />
                          </button>
                          <button
                            onClick={() => updateRequestStatus(req._id, 'approved')}
                            className="action-icon activate"
                            title="Mark Approved"
                          >
                            <ShieldCheck size={16} />
                          </button>
                          <button
                            onClick={() => updateRequestStatus(req._id, 'rejected')}
                            className="action-icon revoke"
                            title="Mark Rejected"
                          >
                            <ShieldX size={16} />
                          </button>
                          <button
                            onClick={() => deleteRequest(req._id)}
                            className="action-icon delete"
                            title="Delete Request"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <>
            <div className="actions-bar">
              <form onSubmit={handleSearch} className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by Journalist Name, Press ID, Mobile or Area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button type="button" onClick={() => { setSearchTerm(''); fetchJournalists(); }} className="clear-search">×</button>
                )}
                <button type="submit" className="search-btn">Search</button>
              </form>

              <div className="action-buttons">
                <button onClick={() => fetchJournalists(searchTerm)} className="icon-refresh-btn" title="Refresh List">
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => router.push('/generate')} className="create-new-btn">
                  <UserPlus size={18} />
                  <span>Create New ID Card</span>
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Journalist Info</th>
                    <th>Press ID</th>
                    <th>Contact & Location</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" className="table-loader">Loading records...</td></tr>
                  ) : journalists.length === 0 ? (
                    <tr><td colSpan="7" className="empty-state">No records found. Click &quot;Create New ID Card&quot; to add one.</td></tr>
                  ) : (
                    journalists.map((j) => (
                      <tr key={j._id}>
                        <td>
                          <div className="profile-thumb">
                            {j.profileImage ? (
                              <img src={j.profileImage} alt={j.name} />
                            ) : (
                              <Users size={20} color="#9ca3af" />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="info-cell">
                            <span className="info-name">{j.name}</span>
                            <span className="info-sub">{j.designation}</span>
                          </div>
                        </td>
                        <td><span className="id-pill">{j.pressId}</span></td>
                        <td>
                          <div className="info-cell">
                            <span className="info-main">{j.mobile}</span>
                            <span className="info-sub">{j.area}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${j.status === 'revoked' ? 'status-revoked' : 'status-active'}`}>
                            {j.status === 'revoked' ? 'Revoked' : 'Active'}
                          </span>
                        </td>
                        <td>{new Date(j.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td>
                          <div className="row-actions">
                            {j.verifyUrl && (
                              <a href={j.verifyUrl} target="_blank" rel="noreferrer" className="action-icon verify" title="Open Verify Page">
                                <ExternalLink size={16} />
                              </a>
                            )}
                            <button
                              onClick={() => handleToggleRevoke(j)}
                              className={`action-icon ${j.status === 'revoked' ? 'activate' : 'revoke'}`}
                              title={j.status === 'revoked' ? 'Activate Card' : 'Revoke Card'}
                            >
                              {j.status === 'revoked' ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
                            </button>
                            <button onClick={() => handleEdit(j)} className="action-icon edit" title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(j)} className="action-icon delete" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {authModal.open && (
        <div className="secret-modal-overlay">
          <div className="secret-modal">
            <h3>Protected ID Authentication</h3>
            <p>
              Enter secret password to {authModal.action} <strong>{authModal.journalist?.pressId}</strong>.
            </p>
            <div className="secret-input-wrap">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secretPassword}
                onChange={(e) => setSecretPassword(e.target.value)}
                placeholder="Enter secret password"
              />
              <button type="button" onClick={() => setShowSecret((prev) => !prev)}>
                {showSecret ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="secret-modal-actions">
              <button type="button" className="secret-cancel" onClick={closeAuthModal}>Cancel</button>
              <button type="button" className="secret-confirm" onClick={submitProtectedAction}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {previewRequest && (
        <div className="secret-modal-overlay" onClick={closeRequestPreview}>
          <div className="request-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="request-preview-header">
              <h3>Employee Request Preview</h3>
              <button type="button" onClick={closeRequestPreview}>×</button>
            </div>

            <div className="request-preview-images">
              <div>
                <span>Profile Photo</span>
                {previewRequest.profileImage ? (
                  <img src={previewRequest.profileImage} alt={previewRequest.fullName} />
                ) : (
                  <div className="request-preview-empty">No Photo</div>
                )}
              </div>
              <div>
                <span>Signature</span>
                {previewRequest.signatureImage ? (
                  <img src={previewRequest.signatureImage} alt="Signature" />
                ) : (
                  <div className="request-preview-empty">No Signature</div>
                )}
              </div>
            </div>

            <div className="request-preview-grid">
              <div><span>Full Name</span><strong>{previewRequest.fullName || '-'}</strong></div>
              <div><span>Father Name</span><strong>{previewRequest.fatherName || '-'}</strong></div>
              <div><span>Date of Birth</span><strong>{previewRequest.dateOfBirth || '-'}</strong></div>
              <div><span>Gender</span><strong>{previewRequest.gender || '-'}</strong></div>
              <div><span>Email</span><strong>{previewRequest.email || '-'}</strong></div>
              <div><span>Mobile</span><strong>{previewRequest.mobile || '-'}</strong></div>
              <div><span>Emergency</span><strong>{previewRequest.emergencyContact || '-'}</strong></div>
              <div><span>Work Location</span><strong>{previewRequest.workLocation || '-'}</strong></div>
              <div><span>Area</span><strong>{previewRequest.area || '-'}</strong></div>
              <div><span>Blood Group</span><strong>{previewRequest.bloodGroup || '-'}</strong></div>
              <div><span>Experience</span><strong>{previewRequest.experienceYears || '-'}</strong></div>
              <div><span>Aadhaar</span><strong>{previewRequest.aadhaarNumber || '-'}</strong></div>
              <div><span>Status</span><strong>{previewRequest.status || '-'}</strong></div>
              <div><span>Submitted</span><strong>{new Date(previewRequest.createdAt).toLocaleDateString('en-IN')}</strong></div>
              <div><span>Address</span><strong>{previewRequest.address || '-'}</strong></div>
              <div><span>Purpose</span><strong>{previewRequest.purpose || '-'}</strong></div>
            </div>

            <div className="request-preview-actions">
              <button type="button" className="secret-cancel" onClick={closeRequestPreview}>Close</button>
              <button
                type="button"
                className="secret-confirm"
                onClick={() => {
                  closeRequestPreview();
                  handleCreateFromRequest(previewRequest);
                }}
              >
                Create ID Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
