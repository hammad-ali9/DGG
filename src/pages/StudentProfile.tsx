import React, { useState } from 'react';
import '../styles/profile.css';

interface StudentProfileProps {
  onUpdateInfo: () => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ onUpdateInfo }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showUPI, setShowUPI] = useState(false);

  const closeModal = () => setActiveModal(null);

  // Mock icons for the profile
  const Icons = {
    Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    Alert: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    File: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14.5 2 14.5 7.5 20 7.5"/></svg>,
    Bank: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    Lock: () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  };

  return (
    <div className="view-content fade-in">
      <div className="view-header">
        <div className="view-title" style={{ fontSize: '20px' }}>My Profile</div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>
          <Icons.Lock /> Information is encrypted and accessible only to authorized DGG staff.
        </div>
      </div>

      <div className="view-body" style={{ padding: 0 }}>
        
        {/* Profile Completeness */}
        <div className="completeness-wrap">
          <div className="completeness-header">
            <div className="completeness-label">Profile Completeness</div>
            <div className="completeness-pct">65%</div>
          </div>
          <div className="bar-track">
            <div className="bar-fill amber" style={{ width: '65%' }}></div>
          </div>
          <div className="completeness-items">
            <span className="ci done"><Icons.Check /> Personal Info</span>
            <span className="ci done"><Icons.Check /> Eligibility IDs</span>
            <span className="ci missing">✕ Banking Details</span>
            <span className="ci partial">⚑ Documents (2 pending)</span>
            <span className="ci done"><Icons.Check /> Enrollment Info</span>
            <span className="ci missing">✕ Void Cheque</span>
          </div>
        </div>

        {/* Alert: Banking missing */}
        <div className="alert-box info" style={{ background: '#fff8f1', borderColor: '#ffedd5', color: '#9a3412', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Icons.Alert />
            <div>
              <strong>Action required:</strong> Your banking details are incomplete. Payments cannot be processed until a void cheque is uploaded and banking information is verified.
              <span 
                onClick={() => setActiveModal('banking')} 
                style={{ color: '#ea580c', fontWeight: '700', cursor: 'pointer', marginLeft: '8px', textDecoration: 'underline' }}
              >
                Add Banking Info \u2192
              </span>
            </div>
          </div>
        </div>

        {/* 1. PERSONAL INFORMATION */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-title">Personal Information</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="sensitivity-tag st-standard">Standard Sensitivity</span>
              <button className="section-edit-btn" onClick={() => setActiveModal('personal')}>Edit</button>
            </div>
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <div className="p-label">Legal First Name</div>
              <div className="p-val">Marie</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Legal Last Name</div>
              <div className="p-val">Beaulieu</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Preferred Name</div>
              <div className="p-val muted">\u2014</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Date of Birth</div>
              <div className="p-val">1998 / 04 / 12</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Gender</div>
              <div className="p-val">Female</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Pronouns</div>
              <div className="p-val muted">She / Her</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Phone Number</div>
              <div className="p-val">867-555-0199</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Email Address</div>
              <div className="p-val">marie.b@email.com</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Alternate Phone</div>
              <div className="p-val muted">\u2014</div>
            </div>
            <div className="profile-field full">
              <div className="p-label">Mailing Address</div>
              <div className="p-val">PO Box 47, Deline, NT X0E 0G0</div>
            </div>
          </div>
        </div>

        {/* 2. ELIGIBILITY IDENTIFIERS */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-title">Eligibility Identifiers</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="sensitivity-tag st-high">High Sensitivity</span>
              <button className="section-edit-btn" onClick={() => setActiveModal('eligibility')}>Edit</button>
            </div>
          </div>
          <div className="info-bar warn">
            These fields are verified by DGG staff against official registries. Changes trigger a re-verification flag.
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <div className="p-label">Deline Beneficiary # <span className="vb-verified verify-badge"><Icons.Check /> Verified</span></div>
              <div className="p-val">DGG-00412</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Indian Status / Treaty # <span className="vb-verified verify-badge"><Icons.Check /> Verified</span></div>
              <div className="p-val">SCN 123456789</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Primary Funding Source</div>
              <div className="p-val">C-DFN PSSSP + DGGR</div>
            </div>
            <div className="profile-field half">
              <div className="p-label">Unique Personal Identifier (UPI) <span className="sensitivity-tag st-extreme" style={{ marginLeft: 8 }}>Extreme Sensitivity</span></div>
              <div style={{ fontSize: '10px', color: '#991b1b', marginTop: 4 }}>
                \ud83d\udd12 For duplicate-profile detection only. Displayed only to you and the Privacy Officer.
              </div>
              <div className="p-val sensitive" style={{ marginTop: 8, fontFamily: 'monospace' }}>
                {showUPI ? '774-991-002-X' : '\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf'}
                <button 
                  onClick={() => setShowUPI(!showUPI)} 
                  style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '9px', padding: '2px 8px', marginLeft: 12, cursor: 'pointer' }}
                >
                  {showUPI ? 'Hide' : 'Reveal'}
                </button>
              </div>
            </div>
            <div className="profile-field">
              <div className="p-label">GNWT SFA Status</div>
              <div className="p-val">Not receiving SFA</div>
            </div>
          </div>
        </div>

        {/* 3. BANKING DETAILS */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-title">Banking & Payment Details</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="sensitivity-tag st-high">High Sensitivity</span>
              <span className="vb-pending verify-badge">⚑ Incomplete</span>
              <button className="section-edit-btn" onClick={() => setActiveModal('banking')}>Add / Update</button>
            </div>
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <div className="p-label">Financial Institution</div>
              <div className="p-val muted">Not entered</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Account Holder</div>
              <div className="p-val muted">Not entered</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Account Type</div>
              <div className="p-val muted">Not entered</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Void Cheque Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
                <span className="doc-badge db-required">Required</span>
                <button 
                  className="section-edit-btn" 
                  style={{ fontSize: '9px', padding: '4px 8px' }}
                  onClick={() => setActiveModal('banking')}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. ENROLLMENT INFORMATION */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-title">Enrollment Information</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="sensitivity-tag st-standard">Standard Sensitivity</span>
              <button className="section-edit-btn" onClick={() => setActiveModal('enrollment')}>Edit</button>
            </div>
          </div>
          <div className="info-bar">
            Confirmed via Form B. Drives eligibility decisions and payment calculations.
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <div className="p-label">Institution</div>
              <div className="p-val">University of Calgary</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Program</div>
              <div className="p-val">Bachelor of Nursing Science</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Current Semester</div>
              <div className="p-val">Fall 2025</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Status</div>
              <div className="p-val verified">Full-Time <span className="vb-verified verify-badge"><Icons.Check /> Form B</span></div>
            </div>
            <div className="profile-field">
              <div className="p-label">Course Load</div>
              <div className="p-val">100% (Confirmed)</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Expected Grad</div>
              <div className="p-val">April 2027</div>
            </div>
          </div>
        </div>

        {/* 5. DOCUMENTS & UPLOADS */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-title">Documents & Uploads</div>
            <button className="section-edit-btn">Upload Document</button>
          </div>
          
          <div className="doc-row">
            <div>
              <div className="doc-name">Indian Status Card \u2014 Front & Back</div>
              <div className="doc-meta">Required for C-DFN eligibility \u00b7 Uploaded Mar 3, 2025</div>
            </div>
            <div><span className="doc-badge db-verified">Verified</span></div>
          </div>
          <div className="doc-row">
            <div>
              <div className="doc-name">Acceptance Letter \u2014 University of Calgary</div>
              <div className="doc-meta">Enrollment confirmation \u00b7 Uploaded Mar 3, 2025</div>
            </div>
            <div><span className="doc-badge db-verified">Verified</span></div>
          </div>
          <div className="doc-row">
            <div>
              <div className="doc-name">Form B \u2014 Enrollment Verification</div>
              <div className="doc-meta">Sent to registrar Mar 3 \u00b7 Status confirmed</div>
            </div>
            <div><span className="doc-badge db-verified">Verified</span></div>
          </div>
          <div className="doc-row">
            <div>
              <div className="doc-name">Void Cheque \u2014 Banking Verification</div>
              <div className="doc-meta">Required before payments can be processed</div>
            </div>
            <div><span className="doc-badge db-required">Required</span></div>
          </div>
        </div>

        <div className="decl-panel" style={{ marginTop: 24, padding: 16 }}>
          \ud83d\udd12 <strong>Privacy:</strong> Your personal information is collected under the authority of the Deline Got'ine Government Post-Secondary Funding Policy and used solely for processing your funding application.
        </div>
      </div>

      {/* ── MODALS ── */}
      {activeModal === 'personal' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>\u00d7</button>
            <h3>Edit Personal Information</h3>
            <div className="modal-sub">Update your core identity and contact details.</div>
            
            <table className="form-grid" style={{ marginBottom: 24 }}>
              <tbody>
                <tr>
                  <td>
                    <label className="field-label">Legal First Name *</label>
                    <input className="field-input" type="text" defaultValue="Marie" />
                  </td>
                  <td>
                    <label className="field-label">Legal Last Name *</label>
                    <input className="field-input" type="text" defaultValue="Beaulieu" />
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <label className="field-label">Mailing Address *</label>
                    <input className="field-input" type="text" defaultValue="PO Box 47, Deline, NT X0E 0G0" />
                  </td>
                </tr>
              </tbody>
            </table>
            
            <button className="btn-primary" style={{ width: '100%' }} onClick={closeModal}>Save Changes</button>
          </div>
        </div>
      )}

      {activeModal === 'banking' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>\u00d7</button>
            <h3>Banking & Payment Details</h3>
            <div className="modal-sub">Direct deposit only. Void cheque required for verification.</div>
            
            <table className="form-grid" style={{ marginBottom: 24 }}>
              <tbody>
                <tr>
                  <td colSpan={2}>
                    <label className="field-label">Account Holder Name *</label>
                    <input className="field-input" type="text" placeholder="As it appears on your account" />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label className="field-label">Transit Number *</label>
                    <input className="field-input" type="text" placeholder="5 digits" />
                  </td>
                  <td>
                    <label className="field-label">Account Number *</label>
                    <input className="field-input" type="text" placeholder="7-12 digits" />
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div className="doc-item" style={{ marginBottom: 20 }}>
              <div className="doc-name">Upload Void Cheque *</div>
              <input type="file" style={{ fontSize: 11, marginTop: 8 }} />
            </div>
            
            <button className="btn-primary" style={{ width: '100%' }} onClick={closeModal}>Submit Banking Info</button>
          </div>
        </div>
      )}

      {activeModal === 'eligibility' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>\u00d7</button>
            <h3>Eligibility Identifiers</h3>
            <div className="modal-sub">Verification triggers for DGG registries.</div>
            
            <div className="sensitivity-note st-high" style={{ padding: 12, marginBottom: 20 }}>
              🔒 <strong>High Sensitivity:</strong> Any changes submitted here require manual verification by DGG staff before your profile reflects the updates.
            </div>

            <table className="form-grid" style={{ marginBottom: 24 }}>
              <tbody>
                <tr>
                  <td>
                    <label className="field-label">Beneficiary # *</label>
                    <input className="field-input" type="text" defaultValue="DGG-00412" />
                  </td>
                  <td>
                    <label className="field-label">Indian Status # *</label>
                    <input className="field-input" type="text" defaultValue="SCN 123456789" />
                  </td>
                </tr>
              </tbody>
            </table>
            
            <button className="btn-primary" style={{ width: '100%' }} onClick={closeModal}>Request Data Update</button>
          </div>
        </div>
      )}

      {activeModal === 'enrollment' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>\u00d7</button>
            <h3>Enrollment Information</h3>
            <div className="modal-sub">Update your current academic status.</div>
            
            <table className="form-grid" style={{ marginBottom: 24 }}>
              <tbody>
                <tr>
                  <td colSpan={2}>
                    <label className="field-label">Institution Name *</label>
                    <input className="field-input" type="text" defaultValue="University of Calgary" />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label className="field-label">Enrollment Status *</label>
                    <select className="field-input">
                      <option>Full-Time</option>
                      <option>Part-Time</option>
                    </select>
                  </td>
                  <td>
                    <label className="field-label">Expected Graduation *</label>
                    <input className="field-input" type="text" defaultValue="April 2027" />
                  </td>
                </tr>
              </tbody>
            </table>
            
            <button className="btn-primary" style={{ width: '100%' }} onClick={closeModal}>Save Enrollment Data</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentProfile;
