import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';
import { jsPDF } from 'jspdf';
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
  const [payments, setPayments] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  const fetchApplications = async () => {
    try {
      const data = await API.getSubmissions() as any;
      setApplications(data);
      
      const statsData = await API.getDashboardStats() as any;
      setBackendStats(statsData);

      const notifsData = await API.getNotifications() as any;
      setNotifications(notifsData);

      // Verify role from profile to ensure absolute sync
      const me = await API.getMe() as any;
      setUserData(me);
      if (me.role === 'director' && role !== 'director') {
        setRole('director');
        localStorage.setItem('dgg_role', 'director');
      } else if (me.role === 'admin' && role !== 'ssw') {
        setRole('ssw');
        localStorage.setItem('dgg_role', 'admin');
      }

      // Sync Payments, Appeals and Policies for real-time overview widgets
      if (currentView === 'dashboard' || currentView === 'director-queue') {
         const [pay, app, pol] = await Promise.all([
            API.getPayments(),
            API.getAppeals(),
            API.getPolicySettings()
         ]) as any[];
         setPayments(pay);
         setAppeals(app);
         if (pol.tuition) setTuitionPolicy(pol.tuition.data);
         if (pol.extraTuition) setExtraTuitionPolicy(pol.extraTuition.data);
         if (pol.living) setLivingPolicy(pol.living.data);
         if (pol.travel) setTravelPolicy(pol.travel.data);
         if (pol.onetime) setOnetimePolicy(pol.onetime.data);
         if (pol.deadlines) setDeadlinesPolicy(pol.deadlines.data);
         if (pol.timing) setTimingPolicy(pol.timing.data);
      }
    } catch (err: any) {
      console.error('Data sync failed:', err);
      // If it's a 401, the Axios interceptor will handle redirect
      setError(err.message || 'Failed to sync with database');
    } finally {
      setIsLoading(false);
    }
  };

  // ── FORCE STOP LOADER AFTER 3 SECONDS FOR UI RESPONSIVENESS ──
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // ── POLLING FOR REAL-TIME UPDATES ──
  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 5000); // 5-second polling
    return () => clearInterval(interval);
  }, []);

  const [backendStats, setBackendStats] = useState<any>(null);

  const getStats = () => {
    return { 
      totalApps: backendStats?.total_submissions || 0, 
      approvedAmount: backendStats?.total_funding_approved || 0, 
      underReview: (backendStats?.submissions_by_status?.pending || 0) + (backendStats?.submissions_by_status?.reviewed || 0) + (backendStats?.submissions_by_status?.forwarded || 0), 
      activeStudents: backendStats?.total_students || 0, 
      pssspCount: backendStats?.submissions_by_form?.['FormA'] || 0, 
      otherCount: (backendStats?.total_submissions || 0) - (backendStats?.submissions_by_form?.['FormA'] || 0), 
      pssspPercent: (backendStats?.total_submissions || 0) > 0 ? ((backendStats?.submissions_by_form?.['FormA'] || 0) / backendStats.total_submissions) * 100 : 0, 
      livingApps: backendStats?.submissions_by_status?.pending || 0, 
      travelApps: backendStats?.submissions_by_form?.['FormE'] || 0, 
      scholarshipApps: backendStats?.submissions_by_form?.['scholarship'] || 0 
    };
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

  const handleShareView = async () => {
    if (!selectedAppId) return;
    try {
       const resp = await API.generateShareLink(Number(selectedAppId));
       const url = `${window.location.origin}/shared/${resp.token}`;
       await navigator.clipboard.writeText(url);
       alert('Secure share link (valid for 7 days) copied to clipboard!');
    } catch (err: any) {
       alert('Share failed: ' + err.message);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedAppId) return;
    try {
       await API.requestMoreInfo(Number(selectedAppId));
       alert('Application status updated to RE-OPENED and student notified.');
       fetchApplications();
    } catch (err: any) {
       alert('Action failed: ' + err.message);
    }
  };

  const handlePDFExport = () => {
    if (!selectedAppId) return;
    const app = applications.find(a => String(a.id) === String(selectedAppId));
    if (!app) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('DGG Application Summary', 20, 20);
    doc.setFontSize(12);
    doc.text(`Reference: # ${app.id}`, 20, 30);
    doc.text(`Student: ${app.student_details?.full_name || 'N/A'}`, 20, 40);
    doc.text(`Form: ${app.form_title || 'N/A'}`, 20, 50);
    doc.text(`Status: ${app.status.toUpperCase()}`, 20, 60);
    doc.text(`Submitted: ${new Date(app.submitted_at).toLocaleDateString()}`, 20, 70);
    
    doc.text('------------------------------------------------', 20, 80);
    doc.text('Decision Details:', 20, 90);
    doc.text(`Authorized Amount: $${app.amount || 0}`, 20, 100);
    doc.text(`Notes: ${app.office_use_data?.notes || 'None'}`, 20, 110);
    
    doc.save(`Application_${app.id}.pdf`);
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

  const handleAppClick = (appId: number) => {
    setSelectedAppId(appId);
    setCurrentView(role === 'director' ? 'director-detail' : 'detail');
  };

  const [officeUseInputs, setOfficeUseInputs] = useState({ dateReceived: '', approvedBy: '', commitmentNum: '' });
  const [isSavingOffice, setIsSavingOffice] = useState(false);

  // ── POLICY SETTINGS STATE ──
  const [tuitionPolicy, setTuitionPolicy] = useState<any[]>([
    { stream: 'C-DFN PSSSP', desc: 'Standard tuition bursary for valid status students', amt: '5000', notes: 'Per Semester', color: '#1a6b3a' },
    { stream: 'DGGR', desc: 'Top-up bursary for community members', amt: '2500', notes: 'Semester Max', color: '#1e293b' }
  ]);
  const [extraTuitionPolicy, setExtraTuitionPolicy] = useState<any>({
    effectiveDate: '2024-04-01',
    params: [
      { param: 'Books & Supplies', val: '1000', rule: 'Standard award' },
      { param: 'Equipment', val: '500', rule: 'One-time per year' }
    ]
  });
  const [livingPolicy, setLivingPolicy] = useState<any>({
    effectiveDate: '2024-04-01',
    sections: [
      { label: 'Single Student', amount: '1500', rule: 'Standard Monthly' },
      { label: 'Student with 1 Dependent', amount: '2200', rule: 'Increased rate' },
      { label: 'Student with 2+ Dependents', amount: '2800', rule: 'Max rate' }
    ]
  });
  const [travelPolicy, setTravelPolicy] = useState<any[]>([
    { region: 'Northern', amt: '1200' },
    { region: 'Urban', amt: '400' }
  ]);
  const [onetimePolicy, setOnetimePolicy] = useState<any[]>([
    { award: 'Graduation Award', amt: '1000' }
  ]);
  const [deadlinesPolicy, setDeadlinesPolicy] = useState<any[]>([
    { sem: 'Fall', deadline: 'Jul 15' },
    { sem: 'Winter', deadline: 'Nov 15' }
  ]);
  const [timingPolicy, setTimingPolicy] = useState('15');
  const [policyHistory, setPolicyHistory] = useState<any[]>([]);

  const [isPolicyLoading, setIsPolicyLoading] = useState(false);

  const fetchPolicySettings = async () => {
    setIsPolicyLoading(true);
    try {
      const data = await API.getPolicySettings() as any;
      if (data.tuition) setTuitionPolicy(data.tuition.data);
      if (data.extraTuition) setExtraTuitionPolicy(data.extraTuition.data);
      if (data.living) setLivingPolicy(data.living.data);
      if (data.travel) setTravelPolicy(data.travel.data);
      if (data.onetime) setOnetimePolicy(data.onetime.data);
      if (data.deadlines) setDeadlinesPolicy(data.deadlines.data);
      if (data.timing) setTimingPolicy(data.timing.data);
      
      // Combine all history
      const allHistory: any[] = [];
      Object.keys(data).forEach(key => {
        if (data[key].history) {
          data[key].history.forEach((h: any) => {
            allHistory.push({
              time: h.timestamp,
              user: h.user_name,
              field: h.field_changed,
              old: h.old_value,
              new: h.new_value,
              effective: h.effective_date
            });
          });
        }
      });
      if (allHistory.length > 0) {
        setPolicyHistory(allHistory.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      }
    } catch (err) {
      console.error('Failed to fetch policy settings:', err);
    } finally {
      setIsPolicyLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'policy') {
      fetchPolicySettings();
    }
    if (currentView === 'payments') {
       API.getPayments().then(setPayments).catch(e => console.error('Payments fetch failed', e));
    }
    if (currentView === 'appeals') {
       API.getAppeals().then(setAppeals).catch(e => console.error('Appeals fetch failed', e));
    }
  }, [currentView]);

  useEffect(() => {
     if (selectedAppId) {
        const app = applications.find(a => Number(a.id) === Number(selectedAppId));
        if (app && app.office_use_data) {
           setOfficeUseInputs({
              dateReceived: app.office_use_data.dateReceived || '',
              approvedBy: app.office_use_data.approvedBy || '',
              commitmentNum: app.office_use_data.commitmentNum || ''
           });
        } else {
           setOfficeUseInputs({ dateReceived: '', approvedBy: '', commitmentNum: '' });
        }
     }
  }, [selectedAppId, applications]);

  const handleSaveOfficeUse = async () => {
     if (!selectedAppId) return;
     setIsSavingOffice(true);
     try {
       const app = applications.find(a => Number(a.id) === Number(selectedAppId));
       if (!app) throw new Error("Application not found in state");
       await API.updateSubmissionStatus(Number(selectedAppId), app.status, { office_use_data: officeUseInputs });
       alert('Office use data saved successfully');
       fetchApplications();
     } catch (err: any) {
       alert(err.message || 'Failed to save office use data');
     } finally {
       setIsSavingOffice(false);
     }
  };

  const [isPolicySaving, setIsPolicySaving] = useState(false);
  const handleSavePolicy = async () => {
    setIsPolicySaving(true);
    try {
      // Save all categories — in a real app, you might only save the active tab
      await API.updatePolicySetting('tuition', tuitionPolicy);
      await API.updatePolicySetting('extraTuition', extraTuitionPolicy);
      await API.updatePolicySetting('living', livingPolicy);
      await API.updatePolicySetting('travel', travelPolicy);
      await API.updatePolicySetting('onetime', onetimePolicy);
      await API.updatePolicySetting('deadlines', deadlinesPolicy);
      await API.updatePolicySetting('timing', timingPolicy);
      
      alert('Policy settings saved successfully across all categories.');
      fetchPolicySettings(); // Refresh to get updated history
    } catch (err: any) {
      alert(err.message || 'Failed to save policy changes');
    } finally {
      setIsPolicySaving(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [policyTab, setPolicyTab] = useState('tuition');
  const [reportTab, setReportTab] = useState('overview');

  const filteredApps = applications.filter(app => {
    const fullName = (app.student_details?.full_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) ||
      String(app.id).includes(query) ||
      (app.form_title || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedApp = applications.find(a => String(a.id) === String(selectedAppId));

  const calculateAutoFunding = (app: any) => {
    if (!app || !app.answers) return null;
    
    // helper to get answer by label (case-insensitive fuzzy match)
    const getAns = (label: string) => app.answers.find((a: any) => a.field_label?.toLowerCase().includes(label.toLowerCase()))?.answer_text;

    const stream = getAns('bursaryStream') || 'DGGR';
    const requestedTuition = parseFloat(getAns('tuition') || '0');
    const startStr = getAns('semStart');
    const endStr = getAns('semEnd');
    const hasDeps = getAns('hasDependents') === 'yes';
    const numDeps = parseInt(getAns('dependentCount') || '0');

    // 1. Duration Calculation (standardize to integer months)
    let months = 4; // Default standard semester
    if (startStr && endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        if (months <= 0) months = 4;
      }
    }

    // 2. Living Allowance
    let livingRate = 1500; // base fallback
    if (livingPolicy?.sections && livingPolicy.sections.length > 0) {
      if (!hasDeps) {
        livingRate = parseFloat(livingPolicy.sections[0]?.amount || '1500');
      } else {
        // match by dependent count in label if available, else pick "With Dependent" one
        const section = livingPolicy.sections.find((s: any) => s.label?.includes(String(numDeps))) || livingPolicy.sections[1] || livingPolicy.sections[0];
        livingRate = parseFloat(section?.amount || '2200');
      }
    }
    const totalLiving = livingRate * months;

    // 3. Tuition
    let tuitionLimit = 5000;
    if (tuitionPolicy && tuitionPolicy.length > 0) {
      tuitionLimit = parseFloat(tuitionPolicy[0]?.limit || '5000');
    }
    const finalTuition = requestedTuition > 0 ? Math.min(requestedTuition, tuitionLimit) : tuitionLimit;

    // 4. Books (Extra Tuition)
    let booksAmount = 1000;
    if (extraTuitionPolicy?.params) {
      const bookParam = extraTuitionPolicy.params.find((p: any) => p.param?.toLowerCase().includes('book'));
      booksAmount = parseFloat(bookParam?.val || '1000');
    }

    return {
      tuition: { system: finalTuition, requested: requestedTuition, rule: `Max $${tuitionLimit} per semester` },
      living: { system: totalLiving, rate: livingRate, months, rule: `$${livingRate}/mo for ${months} mons` },
      books: { system: booksAmount, rule: 'Standard award' },
      total: finalTuition + totalLiving + booksAmount,
      stream
    };
  };

  const autoSuggested = calculateAutoFunding(selectedApp);

  const getFormDisplayName = (title: string) => {
    const mapping: Record<string, string> = {
      'FormA': 'Admission Application',
      'FormB': 'Enrolment Verification',
      'FormC': 'Continuing Funding',
      'FormD': 'Information Update',
      'FormE': 'Travel Claim',
      'FormF': 'Practicum Report',
      'FormG': 'Graduation Award',
      'FormH': 'Appeal Request'
    };
    return mapping[title] || title;
  };

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
            <div className="staff-user-name">{userData?.full_name || (role === 'director' ? 'Director' : 'Staff')}</div>
            <div className="staff-user-role">{userData?.role === 'director' ? 'Director of Education' : 'Student Support Worker'}</div>
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
                  onClick={() => alert("Paper Form entry coming soon.")}
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
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Waiting Enrollment Verification</span>
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
                <div 
                  className={`policy-tab ${statusFilter === 'all' ? 'active' : ''}`} 
                  onClick={() => setStatusFilter('all')}
                >
                  All ({applications.length})
                </div>
                <div 
                  className={`policy-tab ${statusFilter === 'pending' ? 'active' : ''}`} 
                  style={{ color: '#1a6b3a' }}
                  onClick={() => setStatusFilter('pending')}
                >
                  New ({applications.filter(a => a.status === 'pending').length})
                </div>
                <div 
                  className={`policy-tab ${statusFilter === 'reviewed' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('reviewed')}
                >
                  Review ({applications.filter(a => a.status === 'reviewed').length})
                </div>
                <div 
                  className={`policy-tab ${statusFilter === 'forwarded' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('forwarded')}
                >
                  Pending Director ({applications.filter(a => a.status === 'forwarded').length})
                </div>
                <div 
                  className={`policy-tab ${statusFilter === 'accepted' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('accepted')}
                >
                  Approved ({applications.filter(a => a.status === 'accepted').length})
                </div>
                <div 
                  className={`policy-tab ${statusFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('rejected')}
                >
                  Denied ({applications.filter(a => a.status === 'rejected').length})
                </div>
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
                      <th>VERIFICATION</th>
                      <th>FUNDING $</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map(app => (
                      <tr key={app.id}>
                        <td><span style={{ fontSize: '11px', color: '#64748b' }}>{app.id}</span></td>
                        <td><strong>{app.student_details?.full_name}</strong></td>
                        <td style={{ fontSize: '12px' }}>{getFormDisplayName(app.form_title || app.form?.title)}</td>
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

          {/* Detail View (Shared by Staff and Director) */}
          {((currentView === 'detail' || currentView === 'director-detail') && selectedAppId) && (
            <div className="fade-in">
              {/* Header Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  All Applications / <span style={{ fontWeight: '700', color: '#1e293b' }}>{selectedAppId}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="admin-badge" style={{ border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }} onClick={handlePDFExport}>Export PDF</button>
                  <button className="admin-badge" style={{ border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }} onClick={handleShareView}>Share View</button>
                  <button className="admin-input" style={{ width: 'auto', fontSize: '11px', fontWeight: '700' }} onClick={handleRequestInfo}>REQUEST MORE INFO</button>
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
                        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{applications.find(a => String(a.id) === String(selectedAppId))?.name} — Post-Secondary Application</h2>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Submitted Mar 3, 2025 · Admission Application</div>
                      </div>
                      <button className="admin-badge badge-review" style={{ height: 'fit-content' }}>UNDER REVIEW</button>
                    </div>

                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div className="admin-nav-title" style={{ marginBottom: '16px', padding: '0' }}>STUDENT & PROGRAM</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>NAME</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => String(a.id) === String(selectedAppId))?.student_details?.full_name}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>BENEFICIARY #</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => String(a.id) === String(selectedAppId))?.student_details?.beneficiary_number || 'None'}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>DOB</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => String(a.id) === String(selectedAppId))?.student_details?.dob || 'Not Provided'}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>PHONE</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => String(a.id) === String(selectedAppId))?.student_details?.phone || 'None'}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>ENROLLMENT</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => String(a.id) === String(selectedAppId))?.form_title || 'Application'}</div>
                        </div>
                        <div>
                          <label className="admin-kpi-label" style={{ fontSize: '9px' }}>STATUS</label>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{applications.find(a => String(a.id) === String(selectedAppId))?.status.toUpperCase()}</div>
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
                              <td style={{ fontSize: '11px' }}><span className="admin-badge" style={{ background: '#dcfce7', color: '#166534' }}>{autoSuggested?.stream || 'DGGR'}</span></td>
                              <td style={{ fontSize: '11px', color: '#64748b' }}>{autoSuggested?.tuition?.rule}</td>
                              <td style={{ fontSize: '13px', fontWeight: '700' }}>${autoSuggested?.tuition?.system.toLocaleString()}</td>
                              <td><input type="text" className="admin-input" defaultValue={autoSuggested?.tuition?.system} style={{ width: '100px', padding: '4px 8px' }} /></td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '12px' }}>Living Allowance</td>
                              <td style={{ fontSize: '11px' }}><span className="admin-badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>PSSSP</span></td>
                              <td style={{ fontSize: '11px', color: '#64748b' }}>{autoSuggested?.living?.rule}</td>
                              <td style={{ fontSize: '13px', fontWeight: '700' }}>${autoSuggested?.living?.system.toLocaleString()}</td>
                              <td><input type="text" className="admin-input" defaultValue={autoSuggested?.living?.system} style={{ width: '100px', padding: '4px 8px' }} /></td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '12px' }}>Books & Supplies</td>
                              <td style={{ fontSize: '11px' }}><span className="admin-badge" style={{ background: '#fff7ed', color: '#c2410c' }}>DGGR</span></td>
                              <td style={{ fontSize: '11px', color: '#64748b' }}>{autoSuggested?.books?.rule}</td>
                              <td style={{ fontSize: '13px', fontWeight: '700' }}>${autoSuggested?.books?.system.toLocaleString()}</td>
                              <td><input type="text" className="admin-input" defaultValue={autoSuggested?.books?.system} style={{ width: '100px', padding: '4px 8px' }} /></td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                              <td colSpan={3} style={{ textAlign: 'left', fontWeight: '700', padding: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  <span>Total Suggested</span>
                                  <button 
                                    className="admin-badge badge-approved" 
                                    style={{ border: 'none', cursor: 'pointer', fontSize: '9px' }}
                                    onClick={async () => {
                                      if (autoSuggested && selectedApp) {
                                        try {
                                          await API.updateSubmissionStatus(selectedApp.id, selectedApp.status, { amount: autoSuggested.total });
                                          fetchApplications();
                                          alert("System suggested total applied!");
                                        } catch (er) { alert("Failed to apply total"); }
                                      }
                                    }}
                                  >
                                    APPLY SYSTEM TOTAL →
                                  </button>
                                </div>
                              </td>
                              <td style={{ fontSize: '15px' }}><strong>${autoSuggested?.total.toLocaleString()}</strong></td>
                              <td><div className="admin-badge badge-approved" style={{ width: '100px', textAlign: 'center' }}>${selectedApp?.amount?.toLocaleString() || '0'}</div></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                      <div className="admin-nav-title" style={{ marginBottom: '16px', padding: '0' }}>DOCUMENTS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedApp?.documents?.map((doc: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '18px' }}>{doc.file?.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}</span>
                              <span style={{ fontSize: '12px', fontWeight: '600' }}>{doc.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span className={`admin-badge ${doc.is_verified ? 'badge-approved' : 'badge-review'}`} style={{ fontSize: '9px' }}>
                                {doc.is_verified ? 'VERIFIED' : 'PENDING'}
                              </span>
                              <a href={doc.file} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '10px', padding: '4px 8px' }}>View</a>
                            </div>
                          </div>
                        ))}
                        {(!selectedApp?.documents || selectedApp.documents.length === 0) && (
                          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '20px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>No documents uploaded.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Sidebar Actions & Logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="admin-chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="admin-badge" style={{ border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', textAlign: 'center', padding: '8px' }} onClick={() => alert('Download receipt coming soon')}>DOWNLOAD RECEIPT</button>
                    <button className="admin-badge" style={{ border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', textAlign: 'center', padding: '8px' }} onClick={() => alert('Message student coming soon')}>MESSAGE STUDENT</button>
                  </div>

                  <div className="admin-chart-card">
                    <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '20px', color: '#64748b' }}>AUDIT LOG</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e2e8f0' }}>
                        <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', background: '#1a6b3a', borderRadius: '50%' }}></div>
                        <div style={{ fontSize: '12px', fontWeight: '700' }}>Application Received</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{selectedApp ? new Date(selectedApp.submitted_at).toLocaleString() : 'N/A'} via online portal</div>
                      </div>
                      {selectedApp?.ssw_submitted_at && (
                        <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e2e8f0' }}>
                           <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', background: '#3a4aaa', borderRadius: '50%' }}></div>
                           <div style={{ fontSize: '12px', fontWeight: '700' }}>SSW Review Completed</div>
                           <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{new Date(selectedApp.ssw_submitted_at).toLocaleString()}</div>
                        </div>
                      )}
                      {selectedApp?.decision_at && (
                        <div style={{ position: 'relative', paddingLeft: '24px' }}>
                           <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', background: selectedApp.status === 'accepted' ? '#1a6b3a' : '#c53030', borderRadius: '50%' }}></div>
                           <div style={{ fontSize: '12px', fontWeight: '700' }}>Director Decision: {selectedApp.status.toUpperCase()}</div>
                           <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{new Date(selectedApp.decision_at).toLocaleString()} by {selectedApp.decision_by || 'Director'}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-chart-card">
                    <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '20px', color: '#64748b' }}>STAFF NOTES (INTERNAL ONLY)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                        {applications.find(a => Number(a.id) === Number(selectedAppId))?.notes?.length > 0 ? (
                          applications.find(a => Number(a.id) === Number(selectedAppId))!.notes.map((note: any) => (
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
                  
                  <div className="admin-chart-card" style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', color: '#64748b' }}>OFFICE USE ONLY</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label className="admin-kpi-label" style={{ fontSize: '9px', marginBottom: '4px', display: 'block' }}>DATE RECEIVED</label>
                        <input className="admin-input" type="date" value={officeUseInputs.dateReceived} onChange={e => setOfficeUseInputs({...officeUseInputs, dateReceived: e.target.value})} style={{ width: '100%', padding: '8px' }} />
                      </div>
                      <div>
                        <label className="admin-kpi-label" style={{ fontSize: '9px', marginBottom: '4px', display: 'block' }}>APPROVED BY</label>
                        <input className="admin-input" type="text" value={officeUseInputs.approvedBy} onChange={e => setOfficeUseInputs({...officeUseInputs, approvedBy: e.target.value})} style={{ width: '100%', padding: '8px' }} placeholder="Admin Name" />
                      </div>
                      <div>
                        <label className="admin-kpi-label" style={{ fontSize: '9px', marginBottom: '4px', display: 'block' }}>COMMITMENT #</label>
                        <input className="admin-input" type="text" value={officeUseInputs.commitmentNum} onChange={e => setOfficeUseInputs({...officeUseInputs, commitmentNum: e.target.value})} style={{ width: '100%', padding: '8px' }} placeholder="CM-00000" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button 
                          className="admin-badge badge-review" 
                          style={{ cursor: 'pointer', border: 'none', opacity: isSavingOffice ? 0.5 : 1, padding: '8px 16px', fontWeight: '800' }}
                          onClick={handleSaveOfficeUse}
                          disabled={isSavingOffice}
                        >
                          {isSavingOffice ? 'Saving...' : 'Save Office Data'}
                        </button>
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
                            {tuitionPolicy.map((row, i) => (
                              <tr key={i}>
                                <td><span className="admin-badge" style={{ background: row.color, display: 'inline-block', width: '100px', textAlign: 'center' }}>{row.stream}</span></td>
                                <td style={{ fontSize: '12px' }}>{row.desc}</td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="admin-input" 
                                    value={row.amt} 
                                    style={{ width: '100px', textAlign: 'center' }} 
                                    onChange={(e) => {
                                      const newVal = [...tuitionPolicy];
                                      newVal[i].amt = e.target.value;
                                      setTuitionPolicy(newVal);
                                    }}
                                  />
                                </td>
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
                            {extraTuitionPolicy.params.map((row, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: '700' }}>{row.param}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input 
                                      type="text" 
                                      className="admin-input" 
                                      value={row.val} 
                                      style={{ width: '100px', textAlign: 'center' }} 
                                      onChange={(e) => {
                                        const newVal = {...extraTuitionPolicy};
                                        newVal.params[i].val = e.target.value;
                                        setExtraTuitionPolicy(newVal);
                                      }}
                                    />
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
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={extraTuitionPolicy.effectiveDate} 
                        style={{ width: '140px' }} 
                        onChange={(e) => setExtraTuitionPolicy({...extraTuitionPolicy, effectiveDate: e.target.value})}
                      />
                      <div style={{ fontSize: '11px', color: '#b45309' }}>Changes apply to all applications submitted on or after this date (same semester → same rate for all students).</div>
                    </div>
                  </div>
                )}

                {policyTab === 'living' && (
                  <div className="fade-in">
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                      Monthly living allowances are paid on the 1st of each month the student is enrolled. Full-time vs. part-time is determined by the institution's Form B, not the student's self-report. A documented disability allows full-time classification at a lower course load.
                    </div>

                    {livingPolicy.sections.map((section, idx) => (
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
                                  <td>
                                    <input 
                                      type="text" 
                                      className="admin-input" 
                                      value={row.noDep} 
                                      style={{ width: '100px', textAlign: 'center' }} 
                                      onChange={(e) => {
                                        const newVal = {...livingPolicy};
                                        newVal.sections[idx].data[rIdx].noDep = e.target.value;
                                        setLivingPolicy(newVal);
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <input 
                                      type="text" 
                                      className="admin-input" 
                                      value={row.withDep} 
                                      style={{ width: '100px', textAlign: 'center' }} 
                                      onChange={(e) => {
                                        const newVal = {...livingPolicy};
                                        newVal.sections[idx].data[rIdx].withDep = e.target.value;
                                        setLivingPolicy(newVal);
                                      }}
                                    />
                                  </td>
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
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={livingPolicy.effectiveDate} 
                        style={{ width: '140px' }} 
                        onChange={(e) => setLivingPolicy({...livingPolicy, effectiveDate: e.target.value})}
                      />
                      <div style={{ fontSize: '11px', color: '#b45309' }}>Same semester — same rate applies to all students regardless of application date within that semester.</div>
                    </div>
                  </div>
                )}

                {policyTab === 'travel' && (
                  <div className="fade-in">
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                      Travel bursaries are reimbursement-only — no advance payments. Students must submit receipts within 1 month of travel completing. Students studying &gt;200km from home and not receiving SFA are eligible for the Travel Bursary.
                    </div>

                    {travelPolicy.map((section, idx) => (
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
                                {(section.data[0] as any).value !== undefined ? <th>VALUE</th> : <><th>NO DEPENDENTS ($)</th><th>WITH DEPENDENTS ($)</th></>}
                                <th>NOTES</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.data.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td style={{ fontWeight: '700' }}>{row.param}</td>
                                  {(row as any).value !== undefined ? (
                                    <td>
                                      <input 
                                        type="text" 
                                        className="admin-input" 
                                        value={(row as any).value} 
                                        style={{ width: '100px', textAlign: 'center' }} 
                                        onChange={(e) => {
                                          const newVal = [...travelPolicy];
                                          (newVal[idx].data[rIdx] as any).value = e.target.value;
                                          setTravelPolicy(newVal);
                                        }}
                                      />
                                    </td>
                                  ) : (
                                    <>
                                      <td>
                                        <input 
                                          type="text" 
                                          className="admin-input" 
                                          value={(row as any).noDep} 
                                          style={{ width: '100px', textAlign: 'center' }} 
                                          onChange={(e) => {
                                            const newVal = [...travelPolicy];
                                            (newVal[idx].data[rIdx] as any).noDep = e.target.value;
                                            setTravelPolicy(newVal);
                                          }}
                                        />
                                      </td>
                                      <td>
                                        {(row as any).withDep !== undefined ? (
                                          <input 
                                            type="text" 
                                            className="admin-input" 
                                            value={(row as any).withDep} 
                                            style={{ width: '100px', textAlign: 'center' }} 
                                            onChange={(e) => {
                                              const newVal = [...travelPolicy];
                                              (newVal[idx].data[rIdx] as any).withDep = e.target.value;
                                              setTravelPolicy(newVal);
                                            }}
                                          />
                                        ) : ''}
                                      </td>
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

                    {onetimePolicy.map((section, idx) => (
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
                                  <td>
                                    <input 
                                      type="text" 
                                      className="admin-input" 
                                      value={row.amt} 
                                      style={{ width: '100px', textAlign: 'center' }} 
                                      onChange={(e) => {
                                        const newVal = [...onetimePolicy];
                                        newVal[idx].data[rIdx].amt = e.target.value;
                                        setOnetimePolicy(newVal);
                                      }}
                                    />
                                  </td>
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
                    <div style={{ padding: '20px' }}>Deadlines content here.</div>
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
                          {policyHistory.map((log, i) => (
                            <tr key={i}>
                              <td style={{ fontSize: '10px', color: '#64748b' }}>{new Date(log.time).toLocaleString()}</td>
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
                  style={{ width: 'auto', background: 'var(--admin-accent)', color: '#111', border: 'none', fontWeight: '800', padding: '10px 24px', opacity: isPolicySaving ? 0.5 : 1 }}
                  onClick={handleSavePolicy}
                  disabled={isPolicySaving}
                >
                  {isPolicySaving ? 'SAVING...' : 'SAVE POLICY CHANGES'}
                </button>
                <button className="admin-input" style={{ width: 'auto', background: '#fff', border: '1px solid #e2e8f0', fontWeight: '600', padding: '10px 24px' }}>
                  CANCEL
                </button>
              </div>
            </div>
        )}

          {currentView === 'reports' && (
            <div className="fade-in">
              {(!backendStats && isLoading) ? (
                <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="admin-loading-spinner" style={{ margin: '0 auto 20px' }}></div>
                  <div style={{ color: '#64748b', fontWeight: '600' }}>Aggregating real-time database records...</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Connecting to LIVE reporting engine</div>
                </div>
              ) : (
                <React.Fragment>
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
                            <td><strong>{row.student_details?.full_name || row.student_name || 'Anonymous Student'}</strong></td>
                            <td><span style={{ fontSize: '10px', color: '#64748b' }}>DGG-{row.id.toString().padStart(5, '0')}</span></td>
                            <td><span className="admin-badge" style={{ fontSize: '9px', background: (row.form_title || '').includes('FormA') ? '#dcfce7' : '#fff7ed' }}>{(row.form_title || 'Application')}</span></td>
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
                    <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', color: '#92400e' }}>PENDING REVIEWS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {applications.filter(a => a.status === 'review').slice(0, 3).map((a, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800' }}>{a.student_details?.full_name || 'Student'}</div>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>#{a.id} · {a.form_title}</div>
                          </div>
                          <button className="admin-input" onClick={() => handleAppClick(a.id)} style={{ width: 'auto', background: 'var(--admin-accent)', color: '#111', fontSize: '10px', fontWeight: '800', height: '30px', padding: '0 12px' }}>OPEN</button>
                        </div>
                      ))}
                      {applications.filter(a => a.status === 'review').length === 0 && (
                        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '10px' }}>No pending reviews.</div>
                      )}
                    </div>
                  </div>

                  <div className="admin-chart-card">
                    <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', color: '#64748b' }}>UPCOMING DEADLINES</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {deadlinesPolicy.slice(0, 2).map((d, i) => (
                        <div key={i}>
                          <div style={{ fontSize: '10px', fontWeight: '800' }}>{d.sem} Semester</div>
                          <div style={{ fontSize: '9px', color: '#92400e', fontWeight: '800', marginTop: '4px' }}>DUE {d.deadline.toUpperCase()}</div>
                        </div>
                      ))}
                      {deadlinesPolicy.length === 0 && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>No deadlines set.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
      )}

          {/* Director Approval Queue View */}
          {currentView === 'director-queue' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>APPROVAL QUEUE</h2>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{applications.filter(a => a.status === 'forwarded').length} awaiting decision</span>
              </div>

              <div className="admin-kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val">{(backendStats?.submissions_by_status?.forwarded || 0)}</div>
                  <div className="admin-kpi-label">STANDARD</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val" style={{ color: '#e5a662' }}>{applications.filter(a => a.status === 'forwarded' && (a.office_use_data?.commitmentNum === 'OVERRIDE')).length}</div>
                  <div className="admin-kpi-label">WITH OVERRIDES</div>
                </div>
                <div className="admin-kpi-card">
                  <div className="admin-kpi-val" style={{ color: '#cc3333' }}>{applications.filter(a => a.status === 'forwarded' && a.amount > 10000).length}</div>
                  <div className="admin-kpi-label">HIGH VALUE</div>
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
                        <td><span style={{ fontSize: '11px', color: '#64748b' }}>#{app.id}</span></td>
                        <td><strong>{app.student_details?.full_name || 'Student'}</strong></td>
                        <td style={{ fontSize: '12px' }}>{app.form_title}</td>
                        <td style={{ fontSize: '13px', fontWeight: '700' }}>${parseFloat(app.amount || 0).toLocaleString()}</td>
                        <td>
                          {app.amount > 10000 && <span className="admin-badge badge-review" style={{ fontSize: '9px', padding: '2px 6px' }}>HIGH VALUE</span>}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{new Date(app.submitted_at).toLocaleDateString()}</td>
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
                      </div>
                      {(() => {
                        const app = applications.find(a => Number(a.id) === Number(selectedAppId));
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginTop: '24px' }}>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>INSTITUTION</label>
                              <div style={{ fontSize: '13px', fontWeight: '700' }}>{app?.student_details?.institute || app?.form_data?.institute || 'N/A'}</div>
                            </div>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>PROGRAM</label>
                              <div style={{ fontSize: '13px', fontWeight: '700' }}>{app?.form_data?.program || 'N/A'}</div>
                            </div>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>ENROLLMENT</label>
                              <div style={{ fontSize: '13px', fontWeight: '700' }}>{app?.form_data?.enrollmentStatus || 'Full-Time'}</div>
                            </div>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>SEMESTER</label>
                              <div style={{ fontSize: '13px', fontWeight: '700' }}>{app?.form_data?.semester || 'N/A'}</div>
                            </div>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>DEPENDENTS</label>
                              <div style={{ fontSize: '13px', fontWeight: '700' }}>{app?.form_data?.dependentsCount || '0'}</div>
                            </div>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>STATUS</label>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: app?.status === 'forwarded' ? '#c2410c' : '#166534' }}>{app?.status.toUpperCase()}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FUNDING BREAKDOWN</h3>
                      </div>
                      <div className="admin-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                        {(() => {
                          const app = applications.find(a => Number(a.id) === Number(selectedAppId));
                          return (
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
                                  <td style={{ fontWeight: '600' }}>Approved Funding</td>
                                  <td><span className="admin-badge" style={{ background: '#e0e7ff' }}>{app?.form_title}</span></td>
                                  <td style={{ fontSize: '10px', color: '#64748b' }}>Full calculated payout</td>
                                  <td><strong>${parseFloat(app?.amount || 0).toLocaleString()}</strong></td>
                                  <td><span style={{ fontSize: '10px', color: '#64748b' }}>—</span></td>
                                </tr>
                                <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                  <td colSpan={3} style={{ fontWeight: '800', textAlign: 'right', paddingRight: '20px' }}>Total Authorized</td>
                                  <td colSpan={2} style={{ fontSize: '16px', fontWeight: '800' }}>${parseFloat(app?.amount || 0).toLocaleString()}</td>
                                </tr>
                              </tbody>
                            </table>
                          );
                        })()}
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
                        {(() => {
                           const app = applications.find(a => Number(a.id) === Number(selectedAppId));
                           return app?.documents?.map((doc: any, i: number) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontSize: '16px' }}>📄</span>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '600' }}>{doc.name}</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Verified Document</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <span className={`admin-badge ${doc.is_verified ? 'badge-approved' : 'badge-review'}`} style={{ fontSize: '8px' }}>{doc.is_verified ? 'VERIFIED' : 'PENDING'}</span>
                                  <a href={doc.file} target="_blank" rel="noopener noreferrer" style={{ border: 'none', background: 'none', color: 'var(--admin-accent)', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textDecoration: 'none' }}>View</a>
                                </div>
                              </div>
                           ));
                        })()}
                        {(!applications.find(a => Number(a.id) === Number(selectedAppId))?.documents?.length) && (
                           <div style={{ gridColumn: 'span 2', fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '16px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>No documents uploaded.</div>
                        )}
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
                        {(() => {
                           const app = applications.find(a => Number(a.id) === Number(selectedAppId));
                           return (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                               <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '1px solid #e2e8f0' }}>
                                 <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', background: '#166534', borderRadius: '50%', border: '2px solid #fff' }}></div>
                                 <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Application Received</div>
                                 <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{app ? new Date(app.submitted_at).toLocaleString() : 'N/A'} via online portal</div>
                               </div>
                               {app?.ssw_submitted_at && (
                                 <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '1px solid #e2e8f0' }}>
                                   <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', background: '#166534', borderRadius: '50%', border: '2px solid #fff' }}></div>
                                   <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Forwarded to Director</div>
                                   <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{new Date(app.ssw_submitted_at).toLocaleString()} by SSW</div>
                                 </div>
                               )}
                               {app?.decision_at && (
                                 <div style={{ position: 'relative', paddingLeft: '24px' }}>
                                   <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', background: app.status === 'accepted' ? '#166534' : '#c53030', borderRadius: '50%', border: '2px solid #fff' }}></div>
                                   <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Final Decision: {app.status.toUpperCase()}</div>
                                   <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{new Date(app.decision_at).toLocaleString()} by {app.decision_by || 'Director'}</div>
                                 </div>
                               )}
                             </div>
                           );
                        })()}
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
                    You are approving <strong>#{selectedAppId} — {applications.find(a => Number(a.id) === Number(selectedAppId))?.student_details?.full_name}</strong>.<br/>
                    Funding amount: <strong>${parseFloat(applications.find(a => Number(a.id) === Number(selectedAppId))?.amount || 0).toLocaleString()}</strong>.
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
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td><span style={{ fontSize: '11px', color: '#64748b' }}>PAY-{p.id}</span></td>
                        <td><strong>{p.student_details?.full_name || 'Student'}</strong></td>
                        <td style={{ fontSize: '12px' }}>{p.category}</td>
                        <td style={{ fontSize: '13px', fontWeight: '700' }}>${p.amount.toLocaleString()}</td>
                        <td>
                          <span className={`admin-badge ${p.status === 'released' ? 'badge-approved' : 'badge-pending'}`}>
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No payment records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Appeals View */}
          {currentView === 'appeals' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>APPEAL REQUESTS</h2>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student</th>
                      <th>Application</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appeals.map(a => (
                      <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => handleAppClick(a.submission)}>
                        <td><span style={{ fontSize: '11px', color: '#64748b' }}>APP-{a.id}</span></td>
                        <td><strong>{a.student_details?.full_name || 'Student'}</strong></td>
                        <td style={{ fontSize: '12px' }}>{a.submission_details?.form_title || 'Application'}</td>
                        <td style={{ fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason}</td>
                        <td>
                          <span className={`admin-badge ${a.status === 'resolved' ? 'badge-approved' : 'badge-review'}`}>
                            {a.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {appeals.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No appeal requests found.</td></tr>
                    )}
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
