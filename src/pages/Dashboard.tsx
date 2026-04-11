import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import FormA from './Forms/FormA';
import FormC from './Forms/FormC';
import FormD from './Forms/FormD';
import FormE from './Forms/FormE';
import FormF from './Forms/FormF';
import FormG from './Forms/FormG';
import FormH from './Forms/FormH';
import HardshipBursary from './Forms/HardshipBursary';
import AcademicScholarship from './Forms/AcademicScholarship';
import StudentProfile from './StudentProfile';

type DashboardView = 
  | 'dashboard' 
  | 'applications' 
  | 'payments' 
  | 'documents' 
  | 'notifications' 
  | 'help' 
  | 'profile'
  | 'formA' 
  | 'formC' 
  | 'formD' 
  | 'formE' 
  | 'formF' 
  | 'formG' 
  | 'formH' 
  | 'hardship' 
  | 'scholarship';

// SVG Icons for professional look
const Icons = {
  Home: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  Files: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14.5 2 14.5 7.5 20 7.5"/></svg>
  ),
  Payments: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
  ),
  Documents: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
  ),
  Bell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
  Help: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Star: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  )
};

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [isNotificationsRead, setIsNotificationsRead] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const submitMockForm = (label: string) => {
    setShowToast(`✓ ${label} submitted · You will receive an email confirmation`);
    setCurrentView('applications');
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (view: DashboardView) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const renderSidebarNav = (id: DashboardView, label: string, icon: React.ReactNode) => (
    <div
      className={`snav ${currentView === id ? 'active' : ''}`}
      onClick={() => handleNavClick(id)}
    >
      <span className="snav-icon">{icon}</span> {label}
      {id === 'notifications' && !isNotificationsRead && <span className="notif-dot"></span>}
    </div>
  );

  return (
    <div className={`dashboard-root ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>

        <div className="user-block" onClick={() => handleNavClick('profile')} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">MB</div>
          <div className="user-name">Marie Beaulieu</div>
          <div className="user-meta">ID: DGG-00412 · Student</div>
        </div>

        <div className="sidebar-section-title">Main</div>
        {renderSidebarNav('dashboard', 'Dashboard', <Icons.Home />)}
        {renderSidebarNav('profile', 'My Profile', <Icons.Info />)}
        {renderSidebarNav('applications', 'My Applications', <Icons.Files />)}
        {renderSidebarNav('payments', 'My Payments', <Icons.Payments />)}
        {renderSidebarNav('documents', 'My Documents', <Icons.Documents />)}
        {renderSidebarNav('notifications', 'Notifications', <Icons.Bell />)}

        <div className="sidebar-divider"></div>

        <div className="sidebar-section-title">Applications</div>
        {renderSidebarNav('formA', 'Form A — New Student', <Icons.Files />)}
        {renderSidebarNav('formC', 'Form C — Continuing', <Icons.Files />)}
        {renderSidebarNav('formD', 'Form D — Change of Info', <Icons.Files />)}

        <div className="sidebar-divider"></div>

        <div className="sidebar-section-title">Claims</div>
        {renderSidebarNav('formE', 'Form E — Travel Claim', <Icons.Files />)}
        {renderSidebarNav('formF', 'Form F — Practicum Award', <Icons.Files />)}
        {renderSidebarNav('formG', 'Form G — Grad Award', <Icons.Files />)}
        {renderSidebarNav('formH', 'Form H — Appeal', <Icons.Files />)}

        <div className="sidebar-divider"></div>

        <div className="sidebar-section-title">Special</div>
        {renderSidebarNav('scholarship', 'Academic Scholarship', <Icons.Files />)}
        {renderSidebarNav('hardship', 'Hardship Bursary', <Icons.Files />)}

        <div className="sidebar-divider"></div>

        <div className="sidebar-section-title">Other</div>
        {renderSidebarNav('help', 'Help & FAQ', <Icons.Help />)}
        <div className="snav" onClick={() => navigate('/signin')}>
          <span className="snav-icon"><Icons.LogOut /></span> Sign Out
        </div>
      </div>

      <div className="dashboard-shell">
        {/* Top Nav */}
        <div className="top-nav">
          <div className="top-nav-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="top-nav-brand">Délı̨nę Got'ı̨nę Government — Student Portal</div>
          </div>
          <div className="round-menu-bar desktop-only">
            <span className="top-nav-link" onClick={() => setCurrentView('dashboard')}>Home</span>
            <span className="top-nav-link" onClick={() => setCurrentView('applications')}>My Applications</span>
            <span className="top-nav-link" onClick={() => setCurrentView('payments')}>Payments</span>
            <span className="top-nav-link" onClick={() => setCurrentView('notifications')}>
              Notifications {!isNotificationsRead && <span className="nav-badge">3</span>}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Deadline Ticker */}
          <div className="deadline-bar">
            <span className="dl-item"><span className="dl-label">Fall deadline</span><span className="dl-date">Aug 1</span></span>
            <span className="dl-sep">·</span>
            <span className="dl-item"><span className="dl-label">Winter</span><span className="dl-date">Dec 1</span></span>
            <span className="dl-sep">·</span>
            <span className="dl-item"><span className="dl-label">Travel claims</span><span className="dl-urgent">within 30 days of travel</span></span>
          </div>

          {/* View Container */}
          <div className="view-container">
              
              {/* ── DASHBOARD VIEW ── */}
              {currentView === 'dashboard' && (
                <div className="view-content fade-in">
                  <div className="view-header">
                    <div className="view-title">Dashboard</div>
                    <button className="btn-primary" onClick={() => setCurrentView('formA')}>+ Start Your Application</button>
                  </div>
                  <div className="view-body">
                    {/* Welcome Alert */}
                    <div className="welcome-alert">
                      <div className="welcome-alert-main">
                        <div className="welcome-icon-wrap"><Icons.Info /></div>
                        <div className="welcome-text">
                          <div className="welcome-title">Welcome to the DGG Student Portal</div>
                          <div className="welcome-desc">To begin, please establish your student file by completing <strong>Form A — New Student Application</strong> below.</div>
                        </div>
                      </div>
                      <button className="btn-primary welcome-btn" onClick={() => setCurrentView('formA')}>Get Started</button>
                    </div>

                    {/* KPI Row */}
                    <div className="kpi-row">
                      <div className="kpi-card"><div className="kpi-val">$0</div><div className="kpi-label">Approved This Semester</div></div>
                      <div className="kpi-card"><div className="kpi-val">$0</div><div className="kpi-label">Paid To Date</div></div>
                      <div className="kpi-card"><div className="kpi-val">$0</div><div className="kpi-label">Upcoming Payments</div></div>
                      <div className="kpi-card"><div className="kpi-val">0</div><div className="kpi-label">Active Applications</div></div>
                    </div>

                    {/* ── Journey Progress Indicator ── */}
                    <div className="journey-progress-bar fade-in">
                      <div className="phase-info">
                        <div className="phase-status">
                          <div className="phase-label">Current Phase</div>
                          <div className="phase-title">1. Getting Started</div>
                        </div>
                        <div className="progress-pips">
                          <div className="pip completed"></div>
                          <div className="progress-line partial"></div>
                          <div className="pip"></div>
                          <div className="progress-line"></div>
                          <div className="pip"></div>
                        </div>
                      </div>
                      <div className="next-milestone">
                        <div className="milestone-label">Next Milestone</div>
                        <div className="milestone-val">⏳ Registrar Confirmation (Form B)</div>
                      </div>
                    </div>

                    {/* Journey Sections */}
                    <div className="journey-section">
                      <div className="journey-header">
                        <div className="journey-num">01</div>
                        <div>
                          <div className="journey-title">Get Started</div>
                          <div className="journey-sub">Establish your file and secure initial funding eligibility</div>
                        </div>
                      </div>
                      <div className="form-cards-grid">
                        <div className="form-card primary-card active-step" onClick={() => setCurrentView('formA')}>
                          <div className="form-card-inner">
                            <div className="form-card-header">
                              <span className="form-tag">Form A</span>
                              <span className="recommended-tag"><Icons.Star /> RECOMMENDED NEXT STEP</span>
                            </div>
                            <div className="form-card-title">New Student Application</div>
                            <div className="form-card-desc">Your gateway to all DGG funding. Complete this first to map your eligibility.</div>
                            <div style={{ fontSize: '9px', color: '#718096', marginBottom: '12px' }}>Required once per program · Establishes your stream</div>
                            <button className="btn-auth-primary form-btn">Start Application &nbsp;<Icons.ChevronRight /></button>
                          </div>
                        </div>
                        <div className="form-card" style={{ borderLeft: '3px solid #3182ce', opacity: 0.9 }}>
                          <div className="form-card-inner">
                            <div className="form-card-header">
                              <span className="form-tag" style={{ background: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8' }}>Form B</span>
                              <span style={{ fontSize: '8px', color: '#dd6b20', fontWeight: '700' }}>⏳ Tracking Active</span>
                            </div>
                            <div className="form-card-title">Enrollment Confirmation</div>
                            <div className="form-card-desc">Registrar verification. Generated automatically after Form A is submitted.</div>
                            <div style={{ fontSize: '9px', color: '#718096', marginBottom: '12px' }}>Auto-generated from Form A · Sent to Registrar</div>
                            <button className="btn-ghost form-btn">Manage Tracking &nbsp;<Icons.ChevronRight /></button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Paper Forms Section */}
                    <div className="paper-forms-alert fade-in">
                      <div className="paper-icon">🖨️</div>
                      <div className="paper-text">
                        <div className="paper-text-title">Prefer paper forms?</div>
                        <div className="paper-text-desc">
                          You can download printable versions of all DGG forms to fill out by hand. 
                          Once completed, you can mail them to the DGG office or drop them off in person. 
                        </div>
                        <button className="btn-ghost" style={{ fontWeight: 700, color: '#2b6cb0', borderColor: '#bee3f8' }}>
                          Download Printable Forms Packet (PDF) →
                        </button>
                        <div className="paper-meta">
                          Note: Paper forms may take 5–7 business days longer to process.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── APPLICATIONS VIEW ── */}
              {currentView === 'applications' && (
                <div className="view-content fade-in">
                  <div className="view-header">
                    <div className="view-title">My Applications</div>
                    <button className="btn-primary" onClick={() => setCurrentView('formA')}>+ New Application</button>
                  </div>
                  <div className="view-body">
                    <div className="sec-card">
                      <div className="sec-head"><span className="sec-title">Active & Recent Submissions</span></div>
                      <div className="empty-state">
                        <Icons.Files />
                        <div className="empty-title">No Submissions Yet</div>
                        <div className="empty-desc">Once you submit a form, you can track its progress and approval status here.</div>
                        <button className="btn-primary" onClick={() => setCurrentView('dashboard')}>Browse Forms</button>
                      </div>
                    </div>

                    <div className="sec-card">
                      <div className="sec-head"><span className="sec-title">Situation vs Required Form</span></div>
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Situation</th>
                              <th>Required Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr><td>First time applying for funding</td><td>Complete <strong>Form A</strong></td></tr>
                            <tr><td>Returning for a new semester</td><td>Complete <strong>Form C</strong></td></tr>
                            <tr><td>Changed school or program</td><td>Complete <strong>Form D</strong></td></tr>
                            <tr><td>Claiming travel reimbursement</td><td>Complete <strong>Form E</strong></td></tr>
                            <tr><td>Reporting graduation</td><td>Complete <strong>Form G</strong></td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PAYMENTS VIEW ── */}
              {currentView === 'payments' && (
                <div className="view-content fade-in">
                  <div className="view-header">
                    <div className="view-title">My Payments</div>
                  </div>
                  <div className="view-body">
                    <div className="kpi-row">
                      <div className="kpi-card"><div className="kpi-val">$0</div><div className="kpi-label">Paid This Year</div></div>
                      <div className="kpi-card"><div className="kpi-val">$0</div><div className="kpi-label">Upcoming Scheduled</div></div>
                    </div>
                    <div className="sec-card">
                      <div className="sec-head"><span className="sec-title">Payment History & Schedule</span></div>
                      <div className="empty-state">
                        <Icons.Payments />
                        <div className="empty-title">No Payments Scheduled</div>
                        <div className="empty-desc">Your payment schedule will appear here after your application is approved by the Director.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── NOTIFICATIONS VIEW ── */}
              {currentView === 'notifications' && (
                <div className="view-content fade-in">
                  <div className="view-header">
                    <div className="view-title">Notifications</div>
                    <button className="btn-ghost" onClick={() => setIsNotificationsRead(true)}>Mark All Read</button>
                  </div>
                  <div className="view-body">
                    <div className={`notif-item ${!isNotificationsRead ? 'unread' : ''}`}>
                      <div className="notif-icon"><Icons.Bell /></div>
                      <div className="notif-body">
                        <div className="notif-title">Welcome to your DGG Student Portal</div>
                        <div className="notif-detail">Your account has been successfully created. Use this portal to apply for funding, track your status, and manage payments.</div>
                        <div className="notif-time">Just now · Education Department</div>
                        {!isNotificationsRead && <div className="notif-action" onClick={() => setCurrentView('dashboard')}>Get Started →</div>}
                      </div>
                      {!isNotificationsRead && <div className="unread-pip"></div>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── HELP & FAQ VIEW ── */}
              {currentView === 'help' && (
                <div className="view-content fade-in">
                  <div className="view-header"><div className="view-title">Help & FAQ</div></div>
                  <div className="view-body">
                    <div className="sec-card contact-card">
                      <div className="sec-head"><span className="sec-title">Contact Support</span></div>
                      <div className="contact-grid">
                        <div className="contact-item">
                          <div className="contact-label">Email Support</div>
                          <div className="contact-val">education.support@gov.deline.ca</div>
                        </div>
                        <div className="contact-item">
                          <div className="contact-label">Phone</div>
                          <div className="contact-val">(867) 589-3515 ext. 1110</div>
                        </div>
                        <div className="contact-item">
                          <div className="contact-label">Mailing Address</div>
                          <div className="contact-val">P.O. Box 156, Délı̨nę, NT X0E 0G0</div>
                        </div>
                      </div>
                    </div>

                    <div className="sec-card">
                      <div className="sec-head"><span className="sec-title">Frequently Asked Questions</span></div>
                      {[
                        { q: "When is my application due?", a: "Deadlines are: Fall (Aug 1), Winter (Dec 1), Spring (Apr 1), and Summer (Jun 1). Late applications are not guaranteed funding." },
                        { q: "What is Form B?", a: "Form B is enrollment verification from your registrar. DGG requests this automatically once your Form A or C is submitted." },
                        { q: "How do I claim travel?", a: "Use Form E. You must submit within 30 days of travel and include all receipts." }
                      ].map((item, i) => (
                        <div className="faq-item" key={i}>
                          <div className="faq-q" onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}>
                            {item.q}
                            <span className={`faq-chevron ${openFaqIndex === i ? 'open' : ''}`}><Icons.ChevronRight /></span>
                          </div>
                          <div className={`faq-a ${openFaqIndex === i ? 'open' : ''}`}>
                            {item.a}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* \u2500\u2500 FORM A VIEW \u2500\u2500 */}
              {currentView === 'formA' && (
                <FormA 
                  onBack={() => setCurrentView('dashboard')} 
                  onComplete={() => submitMockForm('Form A')} 
                />
              )}

              {/* \u2500\u2500 FORM C VIEW \u2500\u2500 */}
              {currentView === 'formC' && (
                <FormC 
                  onBack={() => setCurrentView('dashboard')} 
                  onComplete={() => submitMockForm('Form C')} 
                />
              )}

              {/* \u2500\u2500 FORM D VIEW \u2500\u2500 */}
              {currentView === 'formD' && (
                <FormD 
                  onBack={() => setCurrentView('dashboard')} 
                  onComplete={() => submitMockForm('Form D')} 
                />
              )}

              {/* \u2500\u2500 FORM E VIEW \u2500\u2500 */}
              {currentView === 'formE' && (
                <FormE 
                  onBack={() => setCurrentView('dashboard')} 
                  onComplete={() => submitMockForm('Form E')} 
                />
              )}

              {/* \u2500\u2500 FORM F VIEW \u2500\u2500 */}
              {currentView === 'formF' && (
                <FormF 
                  onBack={() => setCurrentView('dashboard')} 
                  onComplete={() => submitMockForm('Form F')} 
                />
              )}

              {/* \u2500\u2500 FORM G VIEW \u2500\u2500 */}
              {currentView === 'formG' && (
                <FormG 
                  onBack={() => setCurrentView('dashboard')} 
                  onComplete={() => submitMockForm('Form G')} 
                />
              )}

              {/* \u2500\u2500 FORM H VIEW \u2500\u2500 */}
              {currentView === 'formH' && (
                <FormH 
                  onBack={() => setCurrentView('dashboard')} 
                  onComplete={() => submitMockForm('Form H')} 
                />
              )}

              {/* \u2500\u2500 HARDSHIP VIEW \u2500\u2500 */}
              {currentView === 'hardship' && (
                <HardshipBursary 
                  onBack={() => setCurrentView('dashboard')} 
                  onComplete={() => submitMockForm('Hardship Bursary')} 
                />
              )}

              {/* \u2500\u2500 SCHOLARSHIP VIEW \u2500\u2500 */}
              {currentView === 'scholarship' && (
                <AcademicScholarship 
                  onBack={() => setCurrentView('dashboard')} 
                  onComplete={() => submitMockForm('Scholarship')} 
                />
              )}

              {/* \u2500\u2500 PROFILE VIEW \u2500\u2500 */}
              {currentView === 'profile' && (
                <StudentProfile 
                  onUpdateInfo={() => setCurrentView('formD')} 
                />
              )}

            </div>
          </div>
        </div>

        {/* Toast */}
        <div className={`toast ${showToast ? 'show' : ''}`}>
          {showToast}
        </div>
      </div>
    );
  };

export default Dashboard;
