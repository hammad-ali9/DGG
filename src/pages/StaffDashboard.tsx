import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/client';
import '../styles/staff.css';

// Admin Icons
const AdminIcons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
  ),
  Apps: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14.5 2 14.5 7.5 20 7.5" /></svg>
  ),
  Policy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  Reports: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
  ),
  Director: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  ),
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
  )
};

type ViewMode = 'dashboard' | 'applications' | 'detail' | 'policy' | 'reports' | 'director' | 'payments' | 'director-queue' | 'director-detail' | 'appeals';

const StaffDashboard: React.FC = () => {
  const location = useLocation();
  const [role, setRole] = useState<'ssw' | 'director'>((localStorage.getItem('dgg_role') as any) === 'director' ? 'director' : 'ssw');
  const [currentView, setCurrentView] = useState<ViewMode>(role === 'director' ? 'director-queue' : 'dashboard');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [fiscalYear] = useState('2024-2025');
  const navigate = useNavigate();

  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      const data = await API.getSubmissions();
      setApplications(data);
      
      const statsData = await API.getDashboardStats();
      setBackendStats(statsData);

      const notifsData = await API.getNotifications();
      setNotifications(notifsData);

      // Verify role from profile to ensure absolute sync
      const me = await API.getMe();
      if (me.role === 'director' && role !== 'director') {
        setRole('director');
        localStorage.setItem('dgg_role', 'director');
      } else if (me.role === 'admin' && role !== 'ssw') {
        setRole('ssw');
        localStorage.setItem('dgg_role', 'admin');
      }
    } catch (err: any) {
      console.error('Data sync failed:', err);
      // If it's a 401, the Axios interceptor will handle redirect
      setError(err.message || 'Failed to sync with database');
    } finally {
      setIsLoading(false);
    }
  };

  // ── POLLING FOR REAL-TIME UPDATES ──
  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 5000); // 5-second polling
    return () => clearInterval(interval);
  }, []);

  const [backendStats, setBackendStats] = useState<any>(null);

  const getStats = () => {
    if (backendStats) {
      const formStats = backendStats.submissions_by_form || {};
      const statusStats = backendStats.submissions_by_status || {};
      
      return {
        totalApps: backendStats.total_submissions || 0,
        approvedAmount: backendStats.total_funding_approved || 0,
        underReview: (statusStats.pending || 0) + (statusStats.reviewed || 0) + (statusStats.forwarded || 0),
        activeStudents: backendStats.total_students || 0,
        pssspCount: formStats['FormA'] || 0,
        otherCount: (backendStats.total_submissions || 0) - (formStats['FormA'] || 0),
        pssspPercent: backendStats.total_submissions > 0 ? ((formStats['FormA'] || 0) / backendStats.total_submissions) * 100 : 0,
        livingApps: statusStats.pending || 0,
        travelApps: formStats['FormE'] || 0,
        scholarshipApps: formStats['scholarship'] || 0
      };
    }

    return { totalApps: 0, approvedAmount: 0, underReview: 0, activeStudents: 0, pssspCount: 0, otherCount: 0, pssspPercent: 0, livingApps: 0, travelApps: 0, scholarshipApps: 0 };
  };

  const stats = getStats();

  const [staffNote, setStaffNote] = useState('');

  const handleDecision = async (status: 'accepted' | 'rejected' | 'forwarded') => {
    if (!selectedAppId) return;
    try {
      await API.updateSubmissionStatus(Number(selectedAppId), status);
      setShowConfirmModal(false);
      setDecisionNotes('');
      setCurrentView(role === 'director' ? 'director-queue' : 'applications');
      fetchApplications(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleAddNote = async () => {
    if (!selectedAppId || !staffNote.trim()) return;
    setIsLoading(true);
    try {
      await API.addSubmissionNote(Number(selectedAppId), staffNote);
      setStaffNote('');
      await fetchApplications(); // Refresh list to get new notes
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter] = useState('all');
  const [policyTab, setPolicyTab] = useState('tuition');
  const [reportTab, setReportTab] = useState('overview');

  const filteredApps = applications.filter(app => {
    const appName = `${app.student_details?.first_name || ''} ${app.student_details?.last_name || ''}`.toLowerCase();
    const matchesSearch = appName.includes(searchQuery.toLowerCase()) ||
      String(app.id).includes(searchQuery.toLowerCase()) ||
      (app.program || app.form_data?.program || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="admin-badge badge-new">New Submission</span>;
      case 'reviewed': return <span className="admin-badge badge-review">SSW Reviewed</span>;
      case 'forwarded': return <span className="admin-badge badge-pending" style={{ background: '#e0e7ff', color: '#3730a3' }}>Pending Director</span>;
      case 'accepted': return <span className="admin-badge badge-approved">Approved</span>;
      case 'rejected': return <span className="admin-badge badge-denied">Rejected</span>;
      default: return <span className="admin-badge">{status.toUpperCase()}</span>;
    }
  };

  const handleAppClick = (id: string) => {
    setSelectedAppId(id);
    setCurrentView('detail');
  };

  // Mock navigation helper
  const renderNavItem = (id: ViewMode, label: string, icon: React.ReactNode, badge?: number) => (
    <div
      className={`staff-nav-item ${currentView === id ? 'active' : ''}`}
      onClick={() => {
        setCurrentView(id);
        if (id !== 'detail') setSelectedAppId(null);
      }}
    >
      {icon} {label}
      {badge && <span className="staff-nav-badge">{badge}</span>}
    </div>
  );

  return (
    <div className="staff-portal-root">
      {/* Sidebar */}
      <div className="staff-sidebar">
        <div className="staff-sidebar-header">
          <div className="staff-user-block">
            <div className="staff-user-name">{role === 'director' ? 'K. Baton' : 'J. Villeneuve'}</div>
            <div className="staff-user-role">{role === 'director' ? 'Director of Education' : 'Student Support Worker'}</div>
          </div>
        </div>

        <nav className="staff-nav">
          {role === 'director' ? (
            <>
              <div className="staff-nav-group">
                <div className="staff-nav-title">Main</div>
                {renderNavItem('dashboard', 'Dashboard', <AdminIcons.Dashboard />)}
                {renderNavItem('director-queue', 'Approval Queue', <AdminIcons.Apps />, applications.filter(a => a.status === 'forwarded').length)}
                {renderNavItem('applications', 'All Applications', <AdminIcons.Apps />)}
              </div>
              
              <div className="staff-nav-group">
                <div className="staff-nav-title">Governance</div>
                {renderNavItem('reports', 'Reports', <AdminIcons.Reports />)}
                {renderNavItem('policy', 'Policy Settings', <AdminIcons.Policy />)}
                {renderNavItem('appeals', 'Appeals', <AdminIcons.Apps />, 1)}
              </div>
            </>
          ) : (
            <>
              <div className="staff-nav-group">
                <div className="staff-nav-title">Main</div>
                {renderNavItem('dashboard', 'Dashboard', <AdminIcons.Dashboard />)}
                {renderNavItem('applications', 'All Applications', <AdminIcons.Apps />, applications.filter(a => a.status === 'pending').length)}
                {renderNavItem('payments', 'Payments', <AdminIcons.Dashboard />)}
              </div>

              <div className="staff-nav-group">
                <div className="staff-nav-title">Governance</div>
                {renderNavItem('reports', 'Reports', <AdminIcons.Reports />)}
                {renderNavItem('policy', 'Policy Settings', <AdminIcons.Policy />)}
              </div>
            </>
          )}
        </nav>

        <div style={{ marginTop: 'auto', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="staff-nav-item" onClick={() => navigate('/signin')}>
            🚪 Sign Out
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="staff-main">
        <header className="staff-topbar">
          <div className="staff-view-title">
            {currentView === 'dashboard' && (role === 'director' ? 'Director Overview' : 'Admin Overview')}
            {currentView === 'applications' && 'All Applications'}
            {currentView === 'detail' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setCurrentView('applications')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'inherit' }}
                >
                  <AdminIcons.ChevronLeft />
                </button>
                Reviewing {selectedAppId}
              </div>
            )}
            {currentView === 'director-detail' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '800' }}>DIRECTOR</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                <span style={{ fontWeight: '800' }}>{selectedAppId}</span>
              </div>
            )}
            {currentView === 'policy' && 'Policy Settings'}
            {currentView === 'reports' && 'Reports & Analytics'}
            {currentView === 'director-queue' && 'Approval Queue'}
            {currentView === 'director' && 'Director Approval Queue'}
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setCurrentView('notifications' as any)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e11d48', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '2px 5px', borderRadius: '10px', border: '2px solid #fff' }}>
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </div>

            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>FY 2025/2026</span>
            <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }}></div>
            <button className="admin-badge badge-pending" style={{ border: 'none', cursor: 'pointer' }}>
              Support Active
            </button>
          </div>
        </header>

        <main className="staff-content">
          {isLoading && applications.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <div className="admin-spinner" style={{ width: '24px', height: '24px', border: '2px solid #e2e8f0', borderTopColor: 'var(--admin-accent)', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }}></div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Loading staff portal data...
            </div>
          )}

          {error && !isLoading && (
            <div style={{ padding: '24px' }}>
              <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', padding: '16px', borderRadius: '8px', color: '#c53030', fontSize: '13px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Error Loading Data</strong>
                {error}
                <button onClick={fetchApplications} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#c53030', textDecoration: 'underline', fontWeight: '800', cursor: 'pointer' }}>Try Again</button>
              </div>
            </div>
          )}
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select className="admin-input" style={{ width: '130px', background: '#fff' }}>
                    <option>FY 2025/26</option>
                    <option>FY 2024/25</option>
                  </select>
                  <select className="admin-input" style={{ width: '140px', background: '#fff' }}>
                    <option>Q1 (Apr-Jun)</option>
                    <option>Q2 (Jul-Sep)</option>
                    <option>Q3 (Oct-Dec)</option>
                    <option>Q4 (Jan-Mar)</option>
                  </select>
                </div>
                <button 
                  className="btn-auth-primary" 
                  style={{ width: 'auto', background: 'var(--admin-accent)', color: '#111', fontWeight: '800', padding: '10px 24px' }}
                >
                  + ENTER PAPER FORM
                </button>
              </div>

              <div className="admin-kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val">{stats.totalApps}</div>
                  <div className="admin-kpi-label">TOTAL APPLICATIONS</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val">${(stats.approvedAmount / 1000).toFixed(stats.approvedAmount >= 1000 ? 1 : 2)}k</div>
                  <div className="admin-kpi-label">APPROVED ($)</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val" style={{ color: 'var(--admin-accent)' }}>{stats.underReview}</div>
                  <div className="admin-kpi-label">UNDER REVIEW</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val">{stats.activeStudents}</div>
                  <div className="admin-kpi-label">ACTIVE STUDENTS</div>
                </div>
              </div>

              {/* Insights Row - Standardized & Visible */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Stream Split Card */}
                <div className="admin-chart-card" style={{ marginBottom: 0, padding: '24px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STREAM SPLIT</h3>
                  
                  <div className="admin-stat-row">
                    <div className="admin-stat-head">
                      <span className="admin-stat-label">C-DFN (PSSSP / Bursary)</span>
                      <span className="admin-stat-val">{(backendStats?.stream_split?.pssp || 0)} students</span>
                    </div>
                    <div className="admin-progress-bg">
                      <div className="admin-progress-fill" style={{ width: `${(backendStats?.stream_split?.pssp_percent || 0)}%`, background: '#1a6b3a' }}></div>
                    </div>
                  </div>

                  <div className="admin-stat-row">
                    <div className="admin-stat-head">
                      <span className="admin-stat-label">DGGR</span>
                      <span className="admin-stat-val">{(backendStats?.stream_split?.dggr || 0)} students</span>
                    </div>
                    <div className="admin-progress-bg">
                      <div className="admin-progress-fill" style={{ width: `${(backendStats?.stream_split?.dggr_percent || 0)}%`, background: '#1e293b' }}></div>
                    </div>
                  </div>

                  <div className="admin-stat-row" style={{ marginBottom: 0 }}>
                    <div className="admin-stat-head">
                      <span className="admin-stat-label">UCEPP (Upgrading)</span>
                      <span className="admin-stat-val">{(backendStats?.stream_split?.ucepp || 0)} students</span>
                    </div>
                    <div className="admin-progress-bg">
                      <div className="admin-progress-fill" style={{ width: `${(backendStats?.stream_split?.ucepp_percent || 0)}%`, background: '#dd6b20' }}></div>
                    </div>
                  </div>
                </div>

                {/* Application Status Card */}
                <div className="admin-chart-card" style={{ marginBottom: 0, padding: '24px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>APPLICATION STATUS</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="admin-badge badge-approved" style={{ minWidth: '80px', textAlign: 'center' }}>APPROVED</span>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Ready for payment</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '800' }}>{(backendStats?.submissions_by_status?.accepted || 0)}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="admin-badge badge-review" style={{ minWidth: '80px', textAlign: 'center' }}>REVIEW</span>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>In process</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '800' }}>{(backendStats?.submissions_by_status?.pending || 0) + (backendStats?.submissions_by_status?.reviewed || 0)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px' }}>📜</span>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Waiting Form B</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '800' }}>{(backendStats?.form_b_stats?.awaiting || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Table - Spanning Full Width */}
              <div className="admin-table-wrap">
                <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800' }}>RECENT ACTIVITY</div>
                  <button 
                    className="staff-nav-item active" 
                    style={{ fontSize: '10px', padding: '6px 14px', borderRadius: '20px', background: 'var(--admin-accent)', color: '#111', fontWeight: '8400' }} 
                    onClick={() => setCurrentView('applications')}
                  >
                    View All Applications
                  </button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>REF #</th>
                      <th>STUDENT</th>
                      <th>PROGRAM</th>
                      <th>SUBMITTED</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 8).map(app => (
                      <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => handleAppClick(app.id)}>
                        <td><span style={{ fontSize: '11px', color: '#64748b' }}># {app.id}</span></td>
                        <td><strong>{app.student_details?.full_name || 'Anonymous Student'}</strong></td>
                        <td style={{ fontSize: '12px' }}>{app.form_title || app.form?.title || 'General App'}</td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{new Date(app.submitted_at).toLocaleDateString()}</td>
                        <td>{getStatusBadge(app.status)}</td>
                      </tr>
                    ))}
                    {applications.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No submissions found in system.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Applications View */}
          {currentView === 'applications' && (
            <div className="fade-in">
              <div className="admin-filters" style={{ gridTemplateColumns: '1fr auto auto' }}>
                <div className="admin-search">
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Search applicant, ref #, institution..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select className="admin-input" style={{ width: '160px' }}>
                  <option>Status: All</option>
                </select>
                <select className="admin-input" style={{ width: '160px' }}>
                  <option>Semester: All</option>
                </select>
              </div>

              <div className="policy-tabs" style={{ marginBottom: '0', padding: '0 20px' }}>
                <div className="policy-tab active">All (47)</div>
                <div className="policy-tab" style={{ color: '#1a6b3a' }}>New (5)</div>
                <div className="policy-tab">Review (8)</div>
                <div className="policy-tab">Waiting Form B (4)</div>
                <div className="policy-tab">Pending Director (3)</div>
                <div className="policy-tab">Approved (24)</div>
                <div className="policy-tab">Denied (3)</div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>REF #</th>
                      <th>APPLICANT</th>
                      <th>INSTITUTION / PROGRAM</th>
                      <th>SUBMITTED</th>
                      <th>STATUS</th>
                      <th>FORM B</th>
                      <th>FUNDING $</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map(app => (
                      <tr key={app.id}>
                        <td><span style={{ fontSize: '11px', color: '#64748b' }}>{app.id}</span></td>
                        <td><strong>{app.student_details?.full_name}</strong></td>
                        <td style={{ fontSize: '12px' }}>{app.form_title || app.form?.title}</td>
                        <td style={{ fontSize: '12px' }}>{new Date(app.submitted_at).toLocaleDateString()}</td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td>
                          {app.status === 'accepted' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#166534' }}>
                              <div style={{ width: '8px', height: '8px', background: '#1a6b3a', borderRadius: '50%' }}></div> Completed
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                              <div style={{ width: '8px', height: '8px', background: '#cbd5e1', borderRadius: '50%' }}></div> Pending
                            </div>
                          )}
                        </td>
                        <td><strong>{app.amount > 0 ? `$${parseFloat(app.amount).toLocaleString()}` : '—'}</strong></td>
                        <td>
                          <button
                            className="admin-input"
                            style={{
                              width: 'auto',
                              padding: '6px 12px',
                              background: '#000',
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: '700',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleAppClick(app.id)}
                          >
                            {app.status === 'forwarded' && role === 'director' ? 'DECIDE →' : 'Review →'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detail View */}
          {(currentView === 'detail' && selectedAppId) && (
            <div className="fade-in">
              {/* Header Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  All Applications / <span style={{ fontWeight: '700', color: '#1e293b' }}>{selectedAppId}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="admin-input" style={{ width: 'auto', fontSize: '11px', fontWeight: '700' }}>REQUEST MORE INFO</button>
                  <button className="admin-input" style={{ width: 'auto', fontSize: '11px', fontWeight: '700' }} onClick={handleAddNote} disabled={!staffNote.trim() || isLoading}>ADD NOTE</button>
                  {role === 'director' ? (
                    <>
                      <button className="admin-input" style={{ width: 'auto', fontSize: '11px', fontWeight: '700', background: '#1a6b3a', color: '#fff', border: 'none' }} onClick={() => handleDecision('accepted')}>APPROVE APPLICATION</button>
                      <button className="admin-input" style={{ width: 'auto', fontSize: '11px', fontWeight: '700', background: '#991b1b', color: '#fff', border: 'none' }} onClick={() => handleDecision('rejected')}>REJECT</button>
                    </>
                  ) : (
                    <button 
                      className="admin-input" 
                      style={{ width: 'auto', fontSize: '11px', fontWeight: '700', background: 'var(--admin-accent)', color: '#000', border: 'none' }}
                      onClick={() => handleDecision('forwarded')}
                    >
                      SEND TO DIRECTOR →
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
                {/* Left: Detail Forms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="admin-chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedAppId}</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{applications.find(a => a.id === selectedAppId)?.name} — Post-Secondary Application</h2>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Submitted Mar 3, 2025 · Form A · New Student</div>
                      </div>
                      <button className="admin-badge badge-review" style={{ height: 'fit-content' }}>UNDER REVIEW</button>
                    </div>

                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div className="admin-nav-title" style={{ marginBottom: '16px', padding: '0' }}>STUDENT & PROGRAM</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>NAME</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.student_details?.full_name}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>BENEFICIARY #</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.student_details?.beneficiary_number || 'None'}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>DOB</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.student_details?.dob || 'Not Provided'}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>PHONE</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.student_details?.phone || 'None'}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>ENROLLMENT</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.form_title || 'Application'}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>STATUS</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.status.toUpperCase()}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>INSTITUTION</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>U of Calgary</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>PROGRAM</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>Nursing Yr 2</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>SEMESTER</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>Fall 2025</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '800' }}>AUTO FUNDING CALCULATION</h3>
                        <span className="admin-badge badge-pending" style={{ fontSize: '9px', padding: '2px 8px' }}>SYSTEM CALCULATED</span>
                      </div>
                      <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="admin-table">
                          <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                              <th>COMPONENT</th>
                              <th>STREAM</th>
                              <th>POLICY RULE</th>
                              <th>SYSTEM $</th>
                              <th>OVERRIDE $</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontSize: '12px' }}>Tuition Award</td>
                              <td style={{ fontSize: '11px' }}>C-DFN PSSSP</td>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>Up to $8,000 actual tuition</td>
                              <td>$5,000</td>
                              <td><input type="text" className="admin-input" defaultValue="5,000" style={{ width: '80px', padding: '4px 8px' }} /></td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '12px' }}>Tuition Top-Up</td>
                              <td style={{ fontSize: '11px' }}>DGGR</td>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>FT rate</td>
                              <td>$1,500</td>
                              <td><input type="text" className="admin-input" defaultValue="1,500" style={{ width: '80px', padding: '4px 8px' }} /></td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '12px' }}>Living (C-DFN)</td>
                              <td style={{ fontSize: '11px' }}>C-DFN PSSSP</td>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>FT + 2 dep. $1,706/mo</td>
                              <td>$1,706/mo</td>
                              <td><input type="text" className="admin-input" defaultValue="1,706" style={{ width: '80px', padding: '4px 8px' }} /></td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '12px' }}>Living (DGGR)</td>
                              <td style={{ fontSize: '11px' }}>DGGR</td>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>FT + 2 dep. $950/mo</td>
                              <td>$950/mo</td>
                              <td><input type="text" className="admin-input" defaultValue="950" style={{ width: '80px', padding: '4px 8px' }} /></td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                              <td colSpan={3} style={{ textAlign: 'left', fontWeight: '700' }}>Total</td>
                              <td><strong>$12,400</strong></td>
                              <td><strong>$12,400</strong></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                      <div className="admin-nav-title" style={{ marginBottom: '16px', padding: '0' }}>DOCUMENTS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { name: 'StatusCard—scan.jpg', status: 'VERIFIED', type: 'image' },
                          { name: 'AcceptanceLetter—UCalgary.pdf', status: 'VERIFIED', type: 'pdf' },
                          { name: 'Form B — Enrollment Verification', status: 'PENDING — SENT MAR 3', type: 'document' },
                          { name: 'VoidCheque—BankingInfo', status: 'PENDING', type: 'image' },
                        ].map((doc, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '18px' }}>{doc.type === 'image' ? '🖼️' : doc.type === 'pdf' ? '📄' : '📝'}</span>
                              <span style={{ fontSize: '12px', fontWeight: '600' }}>{doc.name}</span>
                            </div>
                            <span className={`admin-badge ${doc.status.includes('VERIFIED') ? 'badge-approved' : doc.status.includes('SENT') ? 'badge-pending' : 'badge-review'}`} style={{ fontSize: '9px' }}>
                              {doc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Sidebar Actions & Logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="admin-chart-card">
                    <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '20px', color: '#64748b' }}>AUDIT LOG</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {[
                        { title: 'Application received', meta: 'Mar 3 · 2:34pm via online portal', color: '#1a6b3a' },
                        { title: 'Funding auto-calculated: $12,400', meta: 'Mar 3 · 2:34pm System auto-calc', color: '#1a6b3a' },
                        { title: 'Form B sent to registrar', meta: 'Mar 3 · 2:34pm System auto-sent', color: '#eab308' },
                        { title: 'Assigned — J. Villeneuve (SSW)', meta: 'Mar 4 · 9:00am Current step', color: '#3a4aaa' },
                      ].map((item, i) => (
                        <div key={i} style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e2e8f0' }}>
                          <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', background: item.color, borderRadius: '50%' }}></div>
                          <div style={{ fontSize: '12px', fontWeight: '700' }}>{item.title}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{item.meta}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-chart-card">
                    <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '20px', color: '#64748b' }}>STAFF NOTES (INTERNAL ONLY)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                        {applications.find(a => a.id === selectedAppId)?.notes?.length > 0 ? (
                          applications.find(a => a.id === selectedAppId).notes.map((note: any) => (
                            <div key={note.id} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: '1.5' }}>{note.text}</div>
                              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{note.added_by_name || 'Staff Member'}</span>
                                <span>{new Date(note.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', padding: '12px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                            No internal notes yet.
                          </div>
                        )}
                      </div>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <textarea
                          className="admin-input"
                          placeholder="Add internal note — not visible to student.."
                          style={{ fontSize: '12px', border: 'none', background: 'transparent', resize: 'none', padding: '0', width: '100%', minHeight: '60px' }}
                          value={staffNote}
                          onChange={(e) => setStaffNote(e.target.value)}
                        ></textarea>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button 
                            className="admin-badge badge-review" 
                            style={{ cursor: 'pointer', border: 'none', opacity: !staffNote.trim() || isLoading ? 0.5 : 1 }}
                            onClick={handleAddNote}
                            disabled={!staffNote.trim() || isLoading}
                          >
                            {isLoading ? 'Posting...' : 'Save Note'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Policy Settings View */}
          {currentView === 'policy' && (
            <div className="fade-in">
              <div className="policy-tabs" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRadius: '8px 8px 0 0', padding: '0 20px' }}>
                <div className={`policy-tab ${policyTab === 'tuition' ? 'active' : ''}`} onClick={() => setPolicyTab('tuition')}>TUITION BURSARIES</div>
                <div className={`policy-tab ${policyTab === 'living' ? 'active' : ''}`} onClick={() => setPolicyTab('living')}>LIVING ALLOWANCES</div>
                <div className={`policy-tab ${policyTab === 'travel' ? 'active' : ''}`} onClick={() => setPolicyTab('travel')}>TRAVEL BURSARIES</div>
                <div className={`policy-tab ${policyTab === 'onetime' ? 'active' : ''}`} onClick={() => setPolicyTab('onetime')}>ONE-TIME AWARDS</div>
                <div className={`policy-tab ${policyTab === 'deadlines' ? 'active' : ''}`} onClick={() => setPolicyTab('deadlines')}>DEADLINES & PAYMENT</div>
                <div className={`policy-tab ${policyTab === 'rules' ? 'active' : ''}`} onClick={() => setPolicyTab('rules')}>ELIGIBILITY RULES</div>
                <div className={`policy-tab ${policyTab === 'history' ? 'active' : ''}`} onClick={() => setPolicyTab('history')}>CHANGE HISTORY</div>
              </div>

              <div className="admin-chart-card" style={{ borderTopLeftRadius: '0', borderTopRightRadius: '0' }}>
                {policyTab === 'tuition' && (
                  <div className="fade-in">
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                      Tuition bursary amounts are paid per semester. Amounts must be stored with an effective date — changes apply to applications submitted from that date onward. All students applying for the same semester receive the same rates.
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>TUITION BURSARIES — PER SEMESTER</h4>
                        <span className="admin-badge badge-approved" style={{ fontSize: '9px', background: '#f0fdf4', color: '#166534' }}>C-DFN PSSSP & DGGR</span>
                      </div>
                      <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="admin-table table-dense">
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th>STREAM</th>
                              <th style={{ width: '300px' }}>DESCRIPTION</th>
                              <th>MAX AMOUNT ($)</th>
                              <th>NOTES / RULE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { stream: 'C-DFN PSSSP', color: '#dcfce7', desc: 'Tuition Bursary', amt: '5,000', notes: 'Actual tuition, books & fees confirmed by institution — whichever is lower. Not available if student receives SFA.' },
                              { stream: 'C-DFN UCEPP', color: '#e0e7ff', desc: 'Tuition Bursary (Upgrading)', amt: '2,000', notes: 'Actual costs — whichever is lower. Not available if student receives SFA.' },
                              { stream: 'DGGR', color: '#fff7ed', desc: 'Tuition Top-Up — Full-Time', amt: '1,500', notes: 'Fixed rate. Not affected by SFA.' },
                              { stream: 'DGGR', color: '#fff7ed', desc: 'Tuition Top-Up — Part-Time', amt: '900', notes: 'Fixed rate. Not affected by SFA.' },
                            ].map((row, i) => (
                              <tr key={i}>
                                <td><span className="admin-badge" style={{ background: row.color, display: 'inline-block', width: '100px', textAlign: 'center' }}>{row.stream}</span></td>
                                <td style={{ fontSize: '12px' }}>{row.desc}</td>
                                <td><input type="text" className="admin-input" defaultValue={row.amt} style={{ width: '100px', textAlign: 'center' }} /></td>
                                <td style={{ fontSize: '11px', color: '#64748b' }}>{row.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>DGGR EXTRA TUITION BURSARY</h4>
                        <span className="admin-badge" style={{ fontSize: '9px', background: '#fff7ed', color: '#c2410c' }}>DGGR ONLY</span>
                      </div>
                      <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="admin-table table-dense">
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th style={{ width: '400px' }}>PARAMETER</th>
                              <th>VALUE</th>
                              <th>NOTES</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { param: 'Rate (% of tuition)', val: '25', unit: '%', notes: 'Only when tuition exceeds the per-semester threshold below.' },
                              { param: 'Per semester cap ($)', val: '4,000', unit: '$', notes: 'Inclusive of regular DGGR tuition bursary — not additive.' },
                              { param: 'Annual cap ($)', val: '12,000', unit: '$', notes: 'Per student per year.' },
                              { param: 'Total annual pool ($)', val: '30,000', unit: '$', notes: 'Combined pool for all students. Director manages allocation.' },
                              { param: 'Trigger threshold — per semester ($)', val: '5,000', unit: '$', notes: 'Extra bursary only applies when tuition exceeds this amount.' },
                              { param: 'Trigger threshold — per year ($)', val: '15,000', unit: '$', notes: 'Annual tuition threshold for eligibility.' },
                            ].map((row, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: '700' }}>{row.param}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="text" className="admin-input" defaultValue={row.val} style={{ width: '100px', textAlign: 'center' }} />
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{row.unit}</span>
                                  </div>
                                </td>
                                <td style={{ fontSize: '11px', color: '#64748b' }}>{row.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ padding: '16px', background: '#fff9f2', borderRadius: '8px', border: '1px solid #fde6d2', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#854d0e' }}>EFFECTIVE DATE:</div>
                      <input type="text" className="admin-input" defaultValue="2025/09/01" style={{ width: '140px' }} />
                      <div style={{ fontSize: '11px', color: '#b45309' }}>Changes apply to all applications submitted on or after this date (same semester → same rate for all students).</div>
                    </div>
                  </div>
                )}

                {policyTab === 'living' && (
                  <div className="fade-in">
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                      Monthly living allowances are paid on the 1st of each month the student is enrolled. Full-time vs. part-time is determined by the institution's Form B, not the student's self-report. A documented disability allows full-time classification at a lower course load.
                    </div>

                    {[
                      {
                        title: 'C-DFN PSSSP — MONTHLY LIVING ALLOWANCES', tag: 'C-DFN PSSSP', data: [
                          { enroll: 'Full-Time', noDep: '1,200', withDep: '1,700', notes: 'Not available to students receiving SFA.' },
                          { enroll: 'Part-Time', noDep: '720', withDep: '1,020', notes: 'Not available to students receiving SFA.' },
                        ]
                      },
                      {
                        title: 'C-DFN UCEPP — MONTHLY LIVING ALLOWANCES', tag: 'C-DFN UCEPP', data: [
                          { enroll: 'Full-Time', noDep: '700', withDep: '1,000', notes: 'Not available to students receiving SFA.' },
                          { enroll: 'Part-Time', noDep: '420', withDep: '600', notes: 'Not available to students receiving SFA.' },
                        ]
                      },
                      {
                        title: 'DGGR — MONTHLY LIVING ALLOWANCES', tag: 'DGGR', data: [
                          { enroll: 'Full-Time', noDep: '700', withDep: '950', notes: 'Not affected by SFA status.' },
                          { enroll: 'Part-Time', noDep: '420', withDep: '570', notes: 'Not affected by SFA status.' },
                        ]
                      }
                    ].map((section, idx) => (
                      <div key={idx} style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{section.title}</h4>
                          <span className="admin-badge badge-review" style={{ fontSize: '9px', opacity: 0.8 }}>{section.tag}</span>
                        </div>
                        <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                          <table className="admin-table">
                            <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                <th style={{ width: '200px' }}>ENROLLMENT</th>
                                <th>NO DEPENDENTS ($/MO)</th>
                                <th>WITH DEPENDENTS ($/MO)</th>
                                <th>NOTES</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.data.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td style={{ fontWeight: '700' }}>{row.enroll}</td>
                                  <td><input type="text" className="admin-input" defaultValue={row.noDep} style={{ width: '100px', textAlign: 'center' }} /></td>
                                  <td><input type="text" className="admin-input" defaultValue={row.withDep} style={{ width: '100px', textAlign: 'center' }} /></td>
                                  <td style={{ fontSize: '11px', color: '#64748b' }}>{row.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '16px', background: '#fff9f2', borderRadius: '8px', border: '1px solid #fde6d2', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#854d0e' }}>EFFECTIVE DATE:</div>
                      <input type="text" className="admin-input" defaultValue="2025/09/01" style={{ width: '140px' }} />
                      <div style={{ fontSize: '11px', color: '#b45309' }}>Same semester — same rate applies to all students regardless of application date within that semester.</div>
                    </div>
                  </div>
                )}

                {policyTab === 'travel' && (
                  <div className="fade-in">
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                      Travel bursaries are reimbursement-only — no advance payments. Students must submit receipts within 1 month of travel completing. Students studying &gt;200km from home and not receiving SFA are eligible for the Travel Bursary.
                    </div>

                    {[
                      {
                        title: 'C-DFN PSSSP TRAVEL BURSARY', tag: 'C-DFN PSSSP ONLY', data: [
                          { param: 'Max per trip', noDep: '2,000', withDep: '3,500', notes: 'Reimbursement only. First come, first served.' },
                          { param: 'Max trips per year', noDep: '2', withDep: '', notes: 'Per student per year.' },
                          { param: 'Distance threshold (km)', noDep: '200', withDep: '', notes: 'Student must be studying more than this distance from home.' },
                          { param: 'Claim deadline (days after travel)', noDep: '30', withDep: '', notes: 'Within 1 month of travel completion.' },
                        ]
                      },
                      {
                        title: 'C-DFN PSSSP GRADUATION TRAVEL BURSARY', tag: 'C-DFN PSSSP ONLY', data: [
                          { param: 'Maximum amount ($)', value: '5,000', notes: 'One-time. Covers airfare for 2 immediate family members + 3 nights accommodation.' },
                          { param: 'Family members covered', value: '2', notes: 'Immediate family members only.' },
                          { param: 'Accommodation nights covered', value: '3', notes: 'Reimbursement only.' },
                          { param: 'Eligible program length (years)', value: '2', notes: 'Student must be completing a program of at least this duration.' },
                          { param: 'Claim deadline (days after travel)', value: '30', notes: '' },
                        ]
                      }
                    ].map((section, idx) => (
                      <div key={idx} style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{section.title}</h4>
                          <span className="admin-badge badge-approved" style={{ fontSize: '9px', opacity: 0.8, color: '#166534', background: '#dcfce7' }}>{section.tag}</span>
                        </div>
                        <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                          <table className="admin-table">
                            <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                <th style={{ width: '280px' }}>PARAMETER</th>
                                {(section.data[0] as any).value ? <th>VALUE</th> : <><th>NO DEPENDENTS ($)</th><th>WITH DEPENDENTS ($)</th></>}
                                <th>NOTES</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.data.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td style={{ fontWeight: '700' }}>{row.param}</td>
                                  {(row as any).value ? (
                                    <td><input type="text" className="admin-input" defaultValue={(row as any).value} style={{ width: '100px', textAlign: 'center' }} /></td>
                                  ) : (
                                    <>
                                      <td><input type="text" className="admin-input" defaultValue={(row as any).noDep} style={{ width: '100px', textAlign: 'center' }} /></td>
                                      <td>{(row as any).withDep !== undefined ? <input type="text" className="admin-input" defaultValue={(row as any).withDep} style={{ width: '100px', textAlign: 'center' }} /> : ''}</td>
                                    </>
                                  )}
                                  <td style={{ fontSize: '11px', color: '#64748b' }}>{row.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {policyTab === 'onetime' && (
                  <div className="fade-in">
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                      All one-time DGGR awards are paid within 15 business days of Director approval. Students must apply within the rolling window — no semester deadlines apply except where noted.
                    </div>

                    {[
                      {
                        title: 'GRADUATION BURSARY — AMOUNT BY CREDENTIAL', tag: 'DGGR', data: [
                          { type: 'High School Diploma', amt: '500', window: 'Within 6 months of program completion.' },
                          { type: 'Certificate', amt: '1,000', window: 'Within 6 months of program completion.' },
                          { type: 'Trades Certificate of Qualification or Diploma', amt: '2,000', window: 'Within 6 months of program completion.' },
                          { type: 'Trades Journeyperson / Professional Pilot / Red Seal', amt: '2,000', window: 'Within 6 months of program completion.' },
                          { type: 'Bachelor\'s Degree (incl. BEd)', amt: '3,000', window: 'Within 6 months of program completion.' },
                          { type: 'Masters / PhD / JD / MD / DDS', amt: '5,000', window: 'Within 6 months of program completion.' },
                        ]
                      },
                      {
                        title: 'ACADEMIC ACHIEVEMENT SCHOLARSHIP', tag: 'DGGR', data: [
                          { type: 'GPA ≥ 80%', amt: '1,000', window: 'Within 6 months of semester end.' },
                          { type: 'GPA 70 — 79.99%', amt: '500', window: 'Within 6 months of semester end.' },
                        ]
                      },
                      {
                        title: 'SUMMER / PRACTICUM AWARD & HARDSHIP BURSARY', tag: 'DGGR', data: [
                          { type: 'Summer / Practicum Award', amt: '500', window: 'Per placement. Employer confirms. Within 6 months of placement completion.' },
                          { type: 'Hardship Bursary (max)', amt: '500', window: 'Director decides amount. No deadline. Unexpected financial hardship while enrolled.' },
                        ]
                      }
                    ].map((section, idx) => (
                      <div key={idx} style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>{section.title}</h4>
                          <span className="admin-badge badge-approved" style={{ fontSize: '9px', background: '#fff7ed', color: '#c2410c' }}>{section.tag}</span>
                        </div>
                        <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                          <table className="admin-table table-dense">
                            <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                <th style={{ width: '400px' }}>{idx === 2 ? 'AWARD' : idx === 1 ? 'GPA THRESHOLD' : 'CREDENTIAL TYPE'}</th>
                                <th>AMOUNT ($)</th>
                                <th>{idx === 2 ? 'TRIGGER / DEADLINE' : 'CLAIM WINDOW'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.data.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td style={{ fontWeight: '700' }}>{row.type}</td>
                                  <td><input type="text" className="admin-input" defaultValue={row.amt} style={{ width: '100px', textAlign: 'center' }} /></td>
                                  <td style={{ fontSize: '11px', color: '#64748b' }}>{row.window}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {policyTab === 'deadlines' && (
                  <div className="fade-in">
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                      Application deadlines determine which semester rates apply. If the Director approves a late application, all missed monthly payments are back-paid from the semester start date. No advance or pre-payments permitted under any circumstances.
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>APPLICATION DEADLINES BY SEMESTER</h4>
                      <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="admin-table table-dense">
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th>SEMESTER</th>
                              <th>DEADLINE</th>
                              <th>STREAMS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['Fall', 'Winter', 'Spring', 'Summer'].map(sem => (
                              <tr key={sem}>
                                <td style={{ fontWeight: '700' }}>{sem}</td>
                                <td><input type="text" className="admin-input" defaultValue={`${sem === 'Fall' ? 'August 1' : sem === 'Winter' ? 'December 1' : sem === 'Spring' ? 'April 1' : 'June 1'}`} style={{ width: '140px' }} /></td>
                                <td style={{ fontSize: '11px', color: '#64748b' }}>DGGR Tuition + Living; C-DFN PSSSP + UCEPP Tuition + Living</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>PAYMENT TIMING RULES</h4>
                      <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="admin-table table-dense">
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th>PAYMENT TYPE</th>
                              <th>TIMING RULE</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: '700' }}>Tuition</td>
                              <td style={{ fontSize: '12px' }}>Within one month of the application deadline for that semester.</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: '700' }}>Monthly Living Allowance</td>
                              <td style={{ fontSize: '12px' }}>On the 1st of each month the student is enrolled.</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: '700' }}>One-Time Awards (days)</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <input type="text" className="admin-input" defaultValue="15" style={{ width: '80px', textAlign: 'center' }} />
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>business days after Director approval.</span>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: '700' }}>Late Application Back-Pay</td>
                              <td style={{ fontSize: '12px' }}>If Director approves a late application, all missed monthly payments are back-paid from the semester start date.</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: '700' }}>C-DFN Travel Bursary claim window</td>
                              <td style={{ fontSize: '12px' }}>Within 1 month of travel completion. First-come, first-served.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {policyTab === 'rules' && (
                  <div className="fade-in">
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                      Eligibility rules are fixed by policy and cannot be changed without a formal policy update approved by the Director. This screen is read-only — contact IT or the system administrator to request a policy change.
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>STREAM ELIGIBILITY</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { stream: 'C-DFN PSSSP', color: '#dcfce7', label: 'Students with Indian Act Status affiliated with the Deline First Nation, in a non-upgrading post-secondary program.', restrictions: 'Not available to students receiving GNWT SFA or already receiving the same funding from another organization.' },
                          { stream: 'C-DFN UCEPP', color: '#e0e7ff', label: 'Same as PSSSP but for upgrading and university entrance preparation programs only.', restrictions: 'Same SFA and other-organization restrictions as PSSSP.' },
                          { stream: 'DGGR', color: '#fff7ed', label: 'Registered Deline Beneficiaries in any approved program.', restrictions: 'SFA status has no effect. Not available to students already receiving funding from another land claim agreement.' }
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                            <span className="admin-badge" style={{ background: item.color, textAlign: 'center' }}>{item.stream}</span>
                            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>{item.label}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' }}><strong>KEY RESTRICTIONS:</strong><br />{item.restrictions}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>STACKING RULES</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbfc1a', borderRadius: '8px', color: '#166534', fontSize: '12px' }}>
                          <span style={{ fontSize: '14px' }}>✔️</span>
                          <span><strong>C-DFN + DGGR stacking is permitted.</strong> A student can receive both C-DFN (PSSSP or UCEPP) and DGGR funding simultaneously if they qualify for both. DGGR supplements C-DFN — it does not replace it.</span>
                        </div>
                        {[
                          'SFA blocks C-DFN. Students receiving GNWT Student Financial Assistance are not eligible for C-DFN tuition or living allowances (DGGR is unaffected).',
                          'Other land claim agreement blocks DGGR. Students already receiving equivalent funding from another land claim agreement are not eligible for DGGR bursaries.',
                          'Other organization blocks C-DFN. Students already receiving C-DFN program funding from another organization are not eligible for C-DFN streams through DGG.'
                        ].map((rule, i) => (
                          <div key={i} style={{ display: 'flex', gap: '12px', padding: '16px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '12px' }}>
                            <span style={{ fontSize: '14px' }}>❌</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>APPEALS PROCESS</h4>
                      <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="admin-table table-dense">
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th>STEP</th>
                              <th>ESCALATION PATH</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr><td style={{ fontWeight: '700' }}>Step 1</td><td style={{ fontSize: '12px' }}>Appeal to Director of Education.</td></tr>
                            <tr><td style={{ fontWeight: '700' }}>Step 2 — DGGR</td><td style={{ fontSize: '12px' }}>If unresolved, escalates to senior DGGR official.</td></tr>
                            <tr><td style={{ fontWeight: '700' }}>Step 2 — C-DFN</td><td style={{ fontSize: '12px' }}>If unresolved, escalates to CEO.</td></tr>
                            <tr><td style={{ fontWeight: '700' }}>Record Keeping</td><td style={{ fontSize: '12px' }}>Full appeal history must be recorded in the system for every appeal at every step.</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {policyTab === 'history' && (
                  <div className="fade-in">
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                      All policy changes are logged automatically with the user, timestamp, and previous value. Changes are immutable — they cannot be deleted. Each change record also records the effective date.
                    </div>
                    <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>POLICY CHANGE LOG</h4>
                    <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                      <table className="admin-table table-dense">
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th>TIMESTAMP</th>
                            <th>USER</th>
                            <th>FIELD CHANGED</th>
                            <th>OLD VALUE</th>
                            <th>NEW VALUE</th>
                            <th>EFFECTIVE DATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { time: '2025-09-01 08:12', user: 'K. Baton (Director)', field: 'DGGR FT Living — No Dep.', old: '$850/mo', new: '$700/mo', effective: '2025/09/01' },
                            { time: '2025-09-01 08:13', user: 'K. Baton (Director)', field: 'DGGR FT Living — With Dep.', old: '$900/mo', new: '$950/mo', effective: '2025/09/01' },
                            { time: '2025-09-01 08:14', user: 'K. Baton (Director)', field: 'DGGR Extra Tuition Pool', old: '$38,000', new: '$36,000', effective: '2025/09/01' },
                            { time: '2024-04-01 10:40', user: 'J. Villeneuve (SSW)', field: 'C-DFN PSSSP Tuition Max', old: '$4,500', new: '$8,000', effective: '2024/04/01' },
                          ].map((log, i) => (
                            <tr key={i}>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>{log.time}</td>
                              <td style={{ fontSize: '11px' }}>{log.user}</td>
                              <td style={{ fontSize: '11px', fontWeight: '700' }}>{log.field}</td>
                              <td style={{ fontSize: '11px' }}>{log.old}</td>
                              <td style={{ fontSize: '11px', color: '#1a6b3a', fontWeight: '700' }}>{log.new}</td>
                              <td style={{ fontSize: '11px' }}>{log.effective}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  className="admin-input" 
                  style={{ width: 'auto', background: 'var(--admin-accent)', color: '#111', border: 'none', fontWeight: '800', padding: '10px 24px' }}
                >
                  SAVE POLICY CHANGES
                </button>
                <button className="admin-input" style={{ width: 'auto', background: '#fff', border: '1px solid #e2e8f0', fontWeight: '600', padding: '10px 24px' }}>
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* Reporting View */}
          {currentView === 'reports' && (
            <div className="fade-in">
              {!backendStats ? (
                <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="admin-loading-spinner" style={{ margin: '0 auto 20px' }}></div>
                  <div style={{ color: '#64748b', fontWeight: '600' }}>Aggregating real-time database records...</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Connecting to LIVE reporting engine</div>
                </div>
              ) : (
                <>
              {/* Report Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111' }}>REPORTING OVERVIEW — FISCAL {fiscalYear}</h2>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })} · All active funding streams
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="admin-input" style={{ width: 'auto', background: '#fff', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '800', padding: '8px 16px', color: '#1e293b' }}>📥 CSV</button>
                  <button className="admin-input" style={{ width: 'auto', background: 'var(--admin-accent)', color: '#111', border: 'none', fontSize: '11px', fontWeight: '800', padding: '8px 16px' }}>📊 EXCEL</button>
                </div>
              </div>

              {/* Sub Tabs */}
              <div className="policy-tabs" style={{ marginBottom: '24px', background: '#f8fafc', padding: '0 20px', borderRadius: '8px' }}>
                <div className={`policy-tab ${reportTab === 'overview' ? 'active' : ''}`} onClick={() => setReportTab('overview')}>OVERVIEW</div>
                <div className={`policy-tab ${reportTab === 'quarterly' ? 'active' : ''}`} onClick={() => setReportTab('quarterly')}>QUARTERLY (DGGR)</div>
                <div className={`policy-tab ${reportTab === 'annual' ? 'active' : ''}`} onClick={() => setReportTab('annual')}>ANNUAL (DGGR)</div>
                <div className={`policy-tab ${reportTab === 'federal' ? 'active' : ''}`} onClick={() => setReportTab('federal')}>FEDERAL — C-DFN</div>
                <div className={`policy-tab ${reportTab === 'adhoc' ? 'active' : ''}`} onClick={() => setReportTab('adhoc')}>AD-HOC</div>
                <div className={`policy-tab ${reportTab === 'scheduled' ? 'active' : ''}`} onClick={() => setReportTab('scheduled')}>SCHEDULED</div>
              </div>

              {/* Filters */}
              <div className="admin-filters" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label className="admin-kpi-label" style={{ fontSize: '9px', marginBottom: '4px', display: 'block' }}>FISCAL YEAR</label>
                  <select className="admin-input" style={{ fontSize: '12px' }}><option>{fiscalYear}</option></select>
                </div>
                <div>
                  <label className="admin-kpi-label" style={{ fontSize: '9px', marginBottom: '4px', display: 'block' }}>QUARTER</label>
                  <select className="admin-input" style={{ fontSize: '12px' }}><option>All Quarters</option></select>
                </div>
                <div>
                  <label className="admin-kpi-label" style={{ fontSize: '9px', marginBottom: '4px', display: 'block' }}>STREAM</label>
                  <select className="admin-input" style={{ fontSize: '12px' }}><option>All Streams</option></select>
                </div>
                <div>
                  <label className="admin-kpi-label" style={{ fontSize: '9px', marginBottom: '4px', display: 'block' }}>AWARD TYPE</label>
                  <select className="admin-input" style={{ fontSize: '12px' }}><option>All Award Types</option></select>
                </div>
                <div>
                  <label className="admin-kpi-label" style={{ fontSize: '9px', marginBottom: '4px', display: 'block' }}>SEMESTER</label>
                  <select className="admin-input" style={{ fontSize: '12px' }}><option>All Semesters</option></select>
                </div>
                <div>
                  <label className="admin-kpi-label" style={{ fontSize: '9px', marginBottom: '4px', display: 'block' }}>STUDENT</label>
                  <input type="text" className="admin-input" placeholder="Name or Beneficiary #" style={{ fontSize: '12px' }} />
                </div>
                <button className="admin-input" style={{ width: 'auto', background: 'var(--admin-accent)', color: '#111', border: 'none', fontWeight: '800', height: '38px', padding: '0 24px' }}>APPLY FILTERS</button>
              </div>

              {/* KPI Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 200px', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'TOTAL DISBURSED', val: `$${(stats.approvedAmount / 1000).toFixed(1)}k`, sub: 'Real-time authorized', color: '#111' },
                  { label: 'STUDENTS FUNDED', val: stats.activeStudents, sub: 'Active in FY', color: '#111' },
                  { label: 'C-DFN TOTAL', val: `$${((backendStats?.stream_totals?.pssp || 0) / 1000).toFixed(1)}k`, sub: 'authorized', color: '#1a6b3a' },
                  { label: 'DGGR TOTAL', val: `$${((backendStats?.stream_totals?.dggr || 0) / 1000).toFixed(1)}k`, sub: 'authorized', color: '#3a4aaa' },
                  { label: 'UCEPP TOTAL', val: `$${((backendStats?.stream_totals?.ucepp || 0) / 1000).toFixed(1)}k`, sub: 'authorized', color: '#cc3333' },
                ].map((kpi, i) => (
                  <div key={i} className="admin-kpi-card" style={{ padding: '16px', borderLeft: i === 0 ? '4px solid #111' : 'none' }}>
                    <div className="admin-kpi-label" style={{ fontSize: '9px' }}>{kpi.label}</div>
                    <div className="admin-kpi-val" style={{ fontSize: '20px', margin: '4px 0', color: kpi.color }}>{kpi.val}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>{kpi.sub}</div>
                  </div>
                ))}
                <div className="admin-kpi-card" style={{ padding: '12px', borderLeft: '4px solid #cc3333', background: '#fff5f5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="admin-kpi-val" style={{ fontSize: '24px', color: '#cc3333' }}>{(backendStats?.flags_count || 0)}</div>
                    <div className="admin-badge" style={{ background: '#cc3333', color: '#fff', fontSize: '8px' }}>URGENT</div>
                  </div>
                  <div className="admin-kpi-label" style={{ fontSize: '9px', marginTop: '4px' }}>OVERRIDE FLAGS</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Awaiting resolution</div>
                </div>
              </div>

              {/* Main Report Dashboard Content */}
              {/* Insights Row - Standardized & Visible (Relocated from sidebar) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Stream Split Card */}
                <div className="admin-chart-card" style={{ marginBottom: 0, padding: '24px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STREAM SPLIT</h3>
                  
                  <div className="admin-stat-row">
                    <div className="admin-stat-head">
                      <span className="admin-stat-label">C-DFN (PSSSP / Bursary)</span>
                      <span className="admin-stat-val">{(backendStats?.stream_split?.pssp || 0)} students</span>
                    </div>
                    <div className="admin-progress-bg">
                      <div className="admin-progress-fill" style={{ width: `${(backendStats?.stream_split?.pssp_percent || 0)}%`, background: '#1a6b3a' }}></div>
                    </div>
                  </div>

                  <div className="admin-stat-row">
                    <div className="admin-stat-head">
                      <span className="admin-stat-label">DGGR</span>
                      <span className="admin-stat-val">{(backendStats?.stream_split?.dggr || 0)} students</span>
                    </div>
                    <div className="admin-progress-bg">
                      <div className="admin-progress-fill" style={{ width: `${(backendStats?.stream_split?.dggr_percent || 0)}%`, background: '#1e293b' }}></div>
                    </div>
                  </div>

                  <div className="admin-stat-row" style={{ marginBottom: 0 }}>
                    <div className="admin-stat-head">
                      <span className="admin-stat-label">UCEPP (Upgrading)</span>
                      <span className="admin-stat-val">{(backendStats?.stream_split?.ucepp || 0)} students</span>
                    </div>
                    <div className="admin-progress-bg">
                      <div className="admin-progress-fill" style={{ width: `${(backendStats?.stream_split?.ucepp_percent || 0)}%`, background: '#e5a662' }}></div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ fontSize: '11px' }}><span style={{ color: '#64748b' }}>C-DFN:</span> <strong>{(backendStats?.stream_split?.pssp || 0)}</strong></div>
                    <div style={{ fontSize: '11px' }}><span style={{ color: '#64748b' }}>DGGR:</span> <strong>{(backendStats?.stream_split?.dggr || 0)}</strong></div>
                    <div style={{ fontSize: '11px' }}><span style={{ color: '#64748b' }}>UCEPP:</span> <strong>{(backendStats?.stream_split?.ucepp || 0)}</strong></div>
                  </div>
                </div>

                {/* Application Status Card */}
                <div className="admin-chart-card" style={{ marginBottom: 0, padding: '24px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>APPLICATION STATUS</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="admin-badge badge-approved" style={{ minWidth: '80px', textAlign: 'center' }}>APPROVED</span>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Ready for payment</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '800' }}>{(backendStats?.submissions_by_status?.accepted || 0)}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="admin-badge badge-review" style={{ minWidth: '80px', textAlign: 'center' }}>REVIEW</span>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>In process</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '800' }}>{(backendStats?.submissions_by_status?.pending || 0) + (backendStats?.submissions_by_status?.reviewed || 0)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px' }}>📜</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', marginLeft: '4px' }}>Waiting Form B</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '800' }}>{(backendStats?.form_b_stats?.awaiting || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* disbursement Charts & Detail Summary - Full Width */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="admin-chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>DISBURSEMENTS BY QUARTER</h3>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Real-time aggregated</div>
                    </div>
                    <div className="stacked-bar-chart" style={{ height: '220px', position: 'relative', display: 'flex', paddingBottom: '30px', borderBottom: '1px solid #e2e8f0', gap: '40px', alignItems: 'flex-end', justifyContent: 'space-around' }}>
                      {(() => {
                        const quarters = [
                          { label: 'Q1', months: [3, 4, 5], meta: 'Apr-Jun' },
                          { label: 'Q2', months: [6, 7, 8], meta: 'Jul-Sep' },
                          { label: 'Q3', months: [9, 10, 11], meta: 'Oct-Dec' },
                          { label: 'Q4', months: [0, 1, 2], meta: 'Jan-Mar' },
                        ];
                        
                        return quarters.map((q, i) => {
                          const qApps = applications.filter(app => {
                            const date = new Date(app.submitted_at || app.date);
                            return q.months.includes(date.getMonth()) && app.status === 'accepted';
                          });
                          
                          const totalAmt = qApps.reduce((sum, app) => sum + parseFloat(app.amount || 0), 0);
                          const totalK = totalAmt > 0 ? (totalAmt / 1000).toFixed(1) + 'k' : '$0';
                          
                          // Precise Proportions from submissions
                          const streamCounts = {
                            pssp: qApps.filter(a => (a.form_type || '').includes('FormA') || (a.form__title || '').includes('FormA')).length,
                            dggr: qApps.filter(a => (a.form_type || '').includes('Top-Up') || (a.form__title || '').includes('Top-Up')).length,
                            ucepp: qApps.filter(a => (a.form_type || '').includes('UCEPP') || (a.form__title || '').includes('UCEPP')).length
                          };
                          const totalQApps = qApps.length || 1;
                          
                          const h1 = (streamCounts.pssp / totalQApps * 100) + '%';
                          const h2 = (streamCounts.dggr / totalQApps * 100) + '%';
                          const h3 = (streamCounts.ucepp / totalQApps * 100) + '%';
                          
                          return (
                            <div key={i} style={{ flex: 1, height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <div style={{ position: 'absolute', top: '-25px', fontSize: '11px', fontWeight: '800' }}>{totalK}</div>
                              <div style={{ width: '100%', maxWidth: '40px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                <div style={{ height: h1, background: '#1a6b3a', borderRadius: '4px 4px 0 0' }}></div>
                                <div style={{ height: h2, background: '#1e293b' }}></div>
                                <div style={{ height: h3, background: 'var(--admin-accent)' }}></div>
                              </div>
                              <div style={{ position: 'absolute', bottom: '-45px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800' }}>{q.label}</div>
                                <div style={{ fontSize: '9px', color: '#64748b' }}>{q.meta}</div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '55px', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#1a6b3a', borderRadius: '2px' }}></div> C-DFN
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#1e293b', borderRadius: '2px' }}></div> DGGR
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                        <div style={{ width: '10px', height: '10px', background: 'var(--admin-accent)', borderRadius: '2px' }}></div> UCEPP
                      </div>
                    </div>
                  </div>

                  <div className="admin-chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>DISBURSEMENTS BY AWARD TYPE</h3>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Real-time distribution</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(() => {
                        const types = [
                          { label: 'Living Allow.', count: applications.filter(a => (a.form__title || '').includes('FormA') || (a.form__title || '').includes('FormC')).length, color: '#1a6b3a' },
                          { label: 'Travel', count: applications.filter(a => (a.form__title || '').includes('FormE')).length, color: '#7c4d12' },
                          { label: 'Scholarship', count: applications.filter(a => (a.form__title || '').includes('Scholarship')).length, color: 'var(--admin-accent)' },
                          { label: 'Hardship', count: applications.filter(a => (a.form__title || '').includes('Hardship')).length, color: '#991b1b' },
                        ];
                        const maxCount = Math.max(...types.map(t => t.count), 1);
                        
                        return types.map((row, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: '16px', alignItems: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>{row.label}</div>
                            <div style={{ height: '20px', background: '#f1f5f9', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(row.count / maxCount) * 100}%`, background: row.color, borderRadius: '4px' }}></div>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '800', textAlign: 'right' }}>{row.count} apps</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Summary Table - Full Width */}
                <div className="admin-chart-card" style={{ padding: '0' }}>
                  <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: '800' }}>ANNUAL SUMMARY RECORD</h3>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{applications.length} records processed</div>
                  </div>
                  <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="admin-table table-dense">
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th>STUDENT</th>
                          <th>ID #</th>
                          <th>STREAM</th>
                          <th>INSTITUTION</th>
                          <th>SEMESTER</th>
                          <th>STATUS</th>
                          <th>CALC $</th>
                          <th>OVERRIDE</th>
                          <th style={{ textAlign: 'right' }}>FINAL $</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            <td><strong>{row.student_details?.first_name} {row.student_details?.last_name}</strong></td>
                            <td><span style={{ fontSize: '10px', color: '#64748b' }}>DGG-{row.id.toString().padStart(5, '0')}</span></td>
                            <td><span className="admin-badge" style={{ fontSize: '9px', background: row.form_type.includes('FormA') ? '#dcfce7' : '#fff7ed' }}>{row.form_type}</span></td>
                            <td style={{ fontSize: '11px' }}>{row.institution || 'N/A'}</td>
                            <td style={{ fontSize: '11px', color: '#64748b' }}>{row.academic_year || 'FY 25/26'}</td>
                            <td>{getStatusBadge(row.status)}</td>
                            <td style={{ fontSize: '11px', color: '#64748b' }}>${parseFloat(row.amount || 0).toLocaleString()}</td>
                            <td style={{ fontSize: '11px', color: '#64748b' }}>No</td>
                            <td style={{ textAlign: 'right', fontWeight: '800' }}>${parseFloat(row.amount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Row: Widgets (Relocated from sidebar) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="admin-chart-card" style={{ background: '#fffcf5', border: '1px solid #fef3c7' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', color: '#92400e' }}>OVERRIDE FLAGS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { name: 'Lisa Modeste', detail: 'APP-2025-0810 · +$700' },
                        { name: 'Robert Tatti', detail: 'APP-2025-0720 · +$500' },
                      ].map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800' }}>{f.name}</div>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>{f.detail}</div>
                          </div>
                          <button className="admin-input" style={{ width: 'auto', background: 'var(--admin-accent)', color: '#111', fontSize: '10px', fontWeight: '800', height: '30px', padding: '0 12px' }}>RESOLVE</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-chart-card">
                    <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', color: '#64748b' }}>UPCOMING DEADLINES</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '800' }}>Q4 DGGR Report</div>
                        <div style={{ fontSize: '9px', color: '#92400e', fontWeight: '800', marginTop: '4px' }}>DUE MAR 31</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '800' }}>C-DFN Annual Report</div>
                        <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>DUE APR 30</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
            )}
          </div>
        )}

          {/* Director Approval Queue View */}
          {currentView === 'director-queue' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>APPROVAL QUEUE</h2>
                <span style={{ fontSize: '11px', color: '#64748b' }}>5 awaiting decision</span>
              </div>

              <div className="admin-kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val">{(backendStats?.submissions_by_status?.forwarded || 0)}</div>
                  <div className="admin-kpi-label">STANDARD</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val" style={{ color: '#e5a662' }}>0</div>
                  <div className="admin-kpi-label">WITH OVERRIDES</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val" style={{ color: '#cc3333' }}>0</div>
                  <div className="admin-kpi-label">EXCEPTION REQUEST</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val">${((backendStats?.pending_funding_total || 0) / 1000).toFixed(1)}k</div>
                  <div className="admin-kpi-label">TOTAL PENDING $</div>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>REF #</th>
                      <th>STUDENT</th>
                      <th>PROGRAM</th>
                      <th>AMOUNT</th>
                      <th>FLAGS</th>
                      <th>SSW SUBMITTED</th>
                      <th>DECISION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.filter(a => a.status === 'forwarded').map(app => (
                      <tr key={app.id}>
                        <td><span style={{ fontSize: '11px', color: '#64748b' }}>{app.id}</span></td>
                        <td><strong>{app.name}</strong></td>
                        <td style={{ fontSize: '12px' }}>{app.program}</td>
                        <td style={{ fontSize: '13px', fontWeight: '700' }}>${app.amount.toLocaleString()}</td>
                        <td>
                          {app.flags?.map((f: string) => (
                            <span key={f} className={`admin-badge badge-${f.toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{f}</span>
                          ))}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{app.date}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="director-action-btn" 
                              onClick={() => { setSelectedAppId(app.id); setCurrentView('director-detail'); }}
                              style={{ color: 'var(--admin-accent)', fontWeight: '800' }}
                            >
                              Review →
                            </button>
                            <button className="director-decision-icon-btn approve"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                            <button className="director-decision-icon-btn deny"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: '#64748b', textTransform: 'uppercase' }}>RECENTLY DECIDED</h3>
                <div className="admin-table-wrap">
                  <table className="admin-table table-dense">
                    <thead>
                      <tr>
                        <th>REF #</th>
                        <th>STUDENT</th>
                        <th>PROGRAM</th>
                        <th>AMOUNT</th>
                        <th>DECISION</th>
                        <th>BY</th>
                        <th>WHEN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.filter(a => a.status === 'accepted' || a.status === 'rejected').map(app => (
                        <tr key={app.id}>
                          <td><span style={{ fontSize: '10px', color: '#64748b' }}>{app.id}</span></td>
                          <td><strong>{app.student_details?.full_name || app.name}</strong></td>
                          <td style={{ fontSize: '11px' }}>{app.program || app.form_data?.program || 'N/A'}</td>
                          <td style={{ fontSize: '12px', fontWeight: '700' }}>${parseFloat(app.amount || 0).toLocaleString()}</td>
                          <td>
                            {app.status === 'accepted' ? (
                              <span style={{ color: '#1a6b3a', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Approved
                              </span>
                            ) : (
                              <span style={{ color: '#cc3333', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Denied
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '11px', color: '#64748b' }}>System</td>
                          <td style={{ fontSize: '11px', color: '#64748b' }}>{new Date(app.submitted_at || Date.now()).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Director Application Detail View */}
          {(currentView === 'director-detail' && selectedAppId) && (
            <div className="fade-in">
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Approval Queue / <span style={{ fontWeight: '700', color: '#1e293b' }}>{selectedAppId}</span></span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
                {/* Left: Application Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="admin-chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedAppId}</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{applications.find(a => a.id === selectedAppId)?.name} — Post-Secondary Application</h2>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>SSW forwarded {applications.find(a => a.id === selectedAppId)?.date} · J. Villeneuve</div>
                      </div>
                      {applications.find(a => a.id === selectedAppId)?.flags?.map((f: string) => (
                        <span key={f} className={`admin-badge badge-${f.toLowerCase()}`} style={{ fontSize: '9px', padding: '4px 10px' }}>{f}</span>
                      ))}
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.05em' }}>STUDENT & PROGRAM</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px 24px' }}>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>NAME</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.student_details?.full_name || applications.find(a => a.id === selectedAppId)?.name}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>BENEFICIARY #</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.student_details?.beneficiary_number || 'DGG-00000'}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>SFA STATUS</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.student_details?.is_sfa_active ? 'Yes' : 'No'}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>INSTITUTION</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.institution || applications.find(a => a.id === selectedAppId)?.form_data?.institution || 'N/A'}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>PROGRAM</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.program || applications.find(a => a.id === selectedAppId)?.form_data?.program || 'N/A'}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>ENROLLMENT</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>Full-Time</div>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>SEMESTER</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.form_data?.semester || 'Fall 2025'}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>DEPENDENTS</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => a.id === selectedAppId)?.form_data?.dependentsCount || '0'}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>FORM B</label>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#c2410c' }}>Pending Verification</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FUNDING BREAKDOWN</h3>
                        <span className="admin-badge badge-override" style={{ fontSize: '8px' }}>OVERRIDE APPLIED</span>
                      </div>
                      <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="admin-table table-dense">
                          <thead style={{ background: '#f8fafc' }}>
                            <tr>
                              <th>COMPONENT</th>
                              <th>STREAM</th>
                              <th>POLICY RULE</th>
                              <th>AMOUNT</th>
                              <th>FLAG</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: '600' }}>Tuition Award</td>
                              <td><span className="admin-badge" style={{ background: '#e0e7ff' }}>C-DFN PSSSP</span></td>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>Up to $8,000, actual tuition</td>
                              <td><strong style={{ color: '#c2410c' }}>$5,000 *</strong></td>
                              <td><span style={{ fontSize: '10px', color: '#c2410c', fontWeight: '800' }}>Overridden</span></td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: '600' }}>Tuition Top-Up</td>
                              <td><span className="admin-badge" style={{ background: '#fff7ed' }}>DGGR</span></td>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>FT rate — fixed</td>
                              <td><strong>$1,500</strong></td>
                              <td style={{ color: '#cbd5e1' }}>—</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: '600' }}>Living (C-DFN)</td>
                              <td><span className="admin-badge" style={{ background: '#e0e7ff' }}>C-DFN PSSSP</span></td>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>FT + 2 dep. $1,700/mo</td>
                              <td><strong>$1,700/mo</strong></td>
                              <td style={{ color: '#cbd5e1' }}>—</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: '600' }}>Living (DGGR)</td>
                              <td><span className="admin-badge" style={{ background: '#fff7ed' }}>DGGR</span></td>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>FT + 2 dep. $950/mo</td>
                              <td><strong>$950/mo</strong></td>
                              <td style={{ color: '#cbd5e1' }}>—</td>
                            </tr>
                            <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                              <td colSpan={3} style={{ fontWeight: '800', textAlign: 'right', paddingRight: '20px' }}>Total Authorized</td>
                              <td colSpan={2} style={{ fontSize: '16px', fontWeight: '800' }}>${parseFloat(applications.find(a => a.id === selectedAppId)?.amount || 0).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '10px', padding: '20px', marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', marginBottom: '8px' }}>SSW RECOMMENDATION</h4>
                      <p style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.5' }}>
                        Recommend Approval — amounts as calculated. Tuition confirmed at $5,000 per institutional invoice.
                      </p>
                      <div style={{ marginTop: '12px', fontSize: '11px', color: '#3b82f6' }}>— J. Villeneuve · Today · 9:45am</div>
                    </div>

                    <div style={{ background: '#fff9f2', border: '1px solid #fef3c7', borderRadius: '10px', padding: '20px', marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#92400e', textTransform: 'uppercase', marginBottom: '8px' }}>⚠️ EXCEPTION / OVERRIDE DETAILS</h4>
                      <p style={{ fontSize: '13px', color: '#854d0e', lineHeight: '1.5' }}>
                        Tuition Award overridden by SSW: actual tuition invoice confirmed at $5,000. System calculated $4,800 based on prior year data.
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '16px' }}>DOCUMENTS</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { name: 'StatusCard—scan.jpg', size: '1.2MB' },
                          { name: 'AcceptanceLetter.pdf', size: '450KB' },
                          { name: 'Form B — Enrollment Verification', size: 'Direct Link' },
                        ].map((doc, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '16px' }}>📄</span>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: '600' }}>{doc.name}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{doc.size}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span className="admin-badge badge-approved" style={{ fontSize: '8px' }}>VERIFIED</span>
                              <button style={{ border: 'none', background: 'none', color: 'var(--admin-accent)', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>View</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Decision Sidebar & Audit */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="admin-chart-card" style={{ padding: '0' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>DIRECTOR DECISION</h3>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>DECISION</label>
                        <select className="admin-input" style={{ fontSize: '13px' }}>
                          <option>— Select —</option>
                          <option>Approve</option>
                          <option>Deny</option>
                          <option>Defer / Info Needed</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>REASON / NOTES</label>
                        <textarea 
                          className="admin-input" 
                          placeholder="Enter reason, exception justification, or notes for the record.."
                          style={{ height: '120px', resize: 'none', fontSize: '13px', lineHeight: '1.5' }}
                          value={decisionNotes}
                          onChange={(e) => setDecisionNotes(e.target.value)}
                        ></textarea>
                        <div style={{ fontSize: '10px', color: '#cc3333', marginTop: '8px' }}>A written reason is required for exceptions, denials, and deferrals.</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button className="director-main-btn approve" onClick={() => handleDecision('accepted')}>✓ APPROVE APPLICATION</button>
                        <button className="director-main-btn deny" onClick={() => handleDecision('rejected')}>✕ DENY APPLICATION</button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-chart-card" style={{ padding: '0' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>AUDIT LOG</h3>
                    </div>
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {[
                          { title: 'Application received via portal', sub: `${new Date(applications.find(a => a.id === selectedAppId)?.submitted_at).toLocaleDateString()} · Automated`, color: '#166534' },
                          { title: `Funding auto-calculated: $${parseFloat(applications.find(a => a.id === selectedAppId)?.amount || 0).toLocaleString()}`, sub: 'System Decision Engine', color: '#166534' },
                          { title: 'Awaiting Form B verification', sub: 'Internal Process', color: '#eab308' },
                          { title: 'Forwarded to Director for approval', sub: 'Action by Staff', color: '#166534' },
                        ].map((item, i) => (
                          <div key={i} style={{ position: 'relative', paddingLeft: '24px', borderLeft: i < 3 ? '1px solid #e2e8f0' : 'none' }}>
                            <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', background: item.color, borderRadius: '50%', border: '2px solid #fff' }}></div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{item.title}</div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{item.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Approval Modal */}
          {showConfirmModal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h3>CONFIRM APPROVAL</h3>
                  <button onClick={() => setShowConfirmModal(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569', marginBottom: '20px' }}>
                    You are approving <strong>{selectedAppId} — {applications.find(a => a.id === selectedAppId)?.name}</strong>.<br/>
                    Funding amount: <strong>${applications.find(a => a.id === selectedAppId)?.amount.toLocaleString()}</strong>.
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                    This decision will be recorded in the audit trail and the student and SSW will be notified.
                  </p>
                  
                  <div className="field-group">
                    <label className="field-label" style={{ fontSize: '11px', fontWeight: '800' }}>NOTES (OPTIONAL)</label>
                    <textarea 
                      className="admin-input" 
                      placeholder="Any final notes for the record..."
                      style={{ height: '80px', resize: 'none' }}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                  <button className="btn-confirm-approval" onClick={() => handleDecision('accepted')}>✓ CONFIRM APPROVAL</button>
                </div>
              </div>
            </div>
          )}
          {/* Payments View Placeholder */}
          {currentView === 'payments' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>PAYMENT DISBURSEMENT LOG</h2>
                <button 
                  className="admin-input" 
                  style={{ width: 'auto', background: 'var(--admin-accent)', color: '#111', border: 'none', fontWeight: '800', padding: '10px 24px' }}
                >
                  + ISSUE NEW PAYMENT
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ref #</th>
                      <th>Student</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>PAY-9042</td><td>Marie Beaulieu</td><td>Tuition</td><td>$5,000</td><td><span className="admin-badge badge-approved">Released</span></td><td>Mar 5, 2025</td></tr>
                    <tr><td>PAY-9043</td><td>Marie Beaulieu</td><td>Living</td><td>$1,706</td><td><span className="admin-badge badge-approved">Released</span></td><td>Mar 1, 2025</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;
