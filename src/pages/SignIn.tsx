import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const SignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-root">
      <div className="page-layout">
        {/* Left dark panel */}
        <div className="left-panel">
          <div>
            <div className="brand-name">Deline Got'ine Government</div>
            <div className="brand-sub">Student Financial Support Program</div>
            <div className="left-headline">
              <h1>Welcome to your Education Portal</h1>
              <p>Apply for funding, track status, manage your support—all in one place.</p>
              <ul className="feature-list">
                <li>No downloads required</li>
                <li>Funding calculated automatically</li>
                <li>Real-time application tracking</li>
                <li>Progress never lost on disconnect</li>
              </ul>
            </div>
          </div>
          <div className="left-footer">
            <Link to="/signup">Apply for Student Funding</Link>
            <p>(867) 589-3515 ext. 1110</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="right-panel">
          <div className="form-title">Sign In</div>
          <div className="form-sub">No account? <Link to="/signup">Create one →</Link></div>

          <div className="field-group">
            <label className="field-label" htmlFor="email">Email or Phone</label>
            <input
              className="field-input"
              id="email"
              type="text"
              placeholder="Enter email or phone number"
              autoComplete="username"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                className="field-input"
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                autoComplete="current-password"
              />
              <button
                className="pw-toggle"
                onClick={togglePassword}
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
              <Link to="/forgot-password" data-forgot-link className="forgot-link">Forgot password? →</Link>
          </div>

          <button 
            className="btn-auth-primary" 
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            SIGN IN &nbsp;→
          </button>
          <Link to="/signup" className="btn-auth-secondary" style={{ textDecoration: 'none' }}>SIGN UP &nbsp;→</Link>

          <div style={{ marginTop: '32px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '24px' }}>
            <button 
              type="button"
              onClick={() => setShowGuestModal(true)}
              style={{ background: 'none', border: 'none', color: '#d89146', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
            >
              Applying for a one-off award? Learn More →
            </button>
          </div>

          <div className="help-text">
            Need help? <a href="mailto:education.support@gov.deline.ca">Contact Student Support Worker</a>
          </div>
        </div>
      </div>

      {/* ── Guest Application Modal ── */}
      {showGuestModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowGuestModal(false)}>
          <div className="modal-content animate-slide-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowGuestModal(false)}>✕</button>
            <div className="modal-header">
              <h3>One-Off Award Applications</h3>
              <p>Continue without an account for these specific short-term programs.</p>
            </div>
            
            <div className="guest-modal-options">
              <Link to="/forms/hardship" className="guest-modal-btn">
                <span className="btn-title">Hardship Award</span>
                <span className="btn-desc">Emergency support for unexpected financial challenges.</span>
              </Link>
              <Link to="/forms/practicum" className="guest-modal-btn">
                <span className="btn-title">Practicum Award</span>
                <span className="btn-desc">Support for clinical placements or work experience.</span>
              </Link>
              <Link to="/forms/graduation" className="guest-modal-btn">
                <span className="btn-title">Graduation Award</span>
                <span className="btn-desc">One-time recognition for successful program completion.</span>
              </Link>
            </div>

            <div className="modal-footer">
              <p>Guest records can be later merged to a full profile by staff using your SIN or Treaty/Beneficiary number.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
