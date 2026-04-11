import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css';

const InternalSignIn: React.FC = () => {
    const [role, setRole] = useState<'ssw' | 'director'>('ssw');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = () => {
        // In a real app, this would verify credentials and set a token
        // For this demo, we'll navigate to /staff and let the dashboard know the role
        // We'll pass it via state or use the role switcher for now
        navigate('/staff', { state: { role } });
    };

    return (
    <div className="auth-root">
      <div className="page-layout">
        {/* Left Branding Panel */}
        <div className="left-panel">
          <div>
            <div className="brand-name">Deline Got'ı̨nę Government</div>
            <div className="brand-sub">Internal Administration Portal</div>
            <div className="left-headline" style={{ marginTop: '56px' }}>
              <h1>Governing with <br/><span style={{ color: 'var(--admin-accent, #e5a662)' }}>Integrity & Vision</span></h1>
              <p>Access the secure administrative suite to manage student financial applications, policy rates, and government reporting.</p>
            </div>
          </div>

          <div className="left-footer">
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '8px' }}>Security Notice</div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
              This portal is for authorized DGG personnel only. All access and actions are strictly monitored and logged for audit compliance.
            </p>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="right-panel">
          <div className="form-title">Internal Access</div>
          <div className="form-sub">Authorized Personnel Only</div>

          {/* Role Selector */}
          <div className="field-group" style={{ marginBottom: '32px' }}>
            <label className="field-label" style={{ color: '#64748b' }}>Access Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              <button 
                className={`btn-auth-secondary ${role === 'ssw' ? 'active' : ''}`}
                onClick={() => setRole('ssw')}
                style={{ 
                  margin: 0,
                  background: role === 'ssw' ? 'var(--admin-accent, #e5a662)' : '#fff',
                  color: role === 'ssw' ? '#111' : '#64748b',
                  borderColor: role === 'ssw' ? 'var(--admin-accent, #e5a662)' : '#e2e8f0',
                  fontWeight: '700'
                }}
              >
                SSW / Staff
              </button>
              <button 
                className={`btn-auth-secondary ${role === 'director' ? 'active' : ''}`}
                onClick={() => setRole('director')}
                style={{ 
                  margin: 0,
                  background: role === 'director' ? 'var(--admin-accent, #e5a662)' : '#fff',
                  color: role === 'director' ? '#111' : '#64748b',
                  borderColor: role === 'director' ? 'var(--admin-accent, #e5a662)' : '#e2e8f0',
                  fontWeight: '700'
                }}
              >
                Director
              </button>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" style={{ color: '#64748b' }}>Government ID / Email</label>
            <input className="field-input" type="text" placeholder="e.g. j.villeneuve@gov.deline.ca" style={{ background: '#fff' }} />
          </div>

          <div className="field-group">
            <label className="field-label" style={{ color: '#64748b' }}>Password</label>
            <div className="password-wrap">
              <input 
                className="field-input" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••••••"
                style={{ background: '#fff' }}
              />
              <button className="pw-toggle" type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: '#64748b' }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '8px', background: '#1a6b3a', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>RSA TOKEN REQUIRED</span>
            </div>
            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>Multi-factor authentication (MFA) will be requested on the next step via your government-issued token.</p>
          </div>

          <button 
            className="btn-auth-primary" 
            style={{ background: 'var(--admin-accent, #e5a662)', color: '#111' }}
            onClick={handleLogin}
          >
            SECURE ACCESS &nbsp;→
          </button>

          <Link to="/signin" style={{ display: 'block', textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#64748b', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Student Portal
          </Link>
        </div>
      </div>
    </div>
    );
};

export default InternalSignIn;
