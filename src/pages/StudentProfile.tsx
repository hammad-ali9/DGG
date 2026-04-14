import React, { useState } from 'react';
import API from '../api/client';
import '../styles/profile.css';

interface StudentProfileProps {
  profile?: any;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ profile }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const closeModal = () => setActiveModal(null);

  const handleEditClick = (type: string) => {
    setEditData({ ...profile });
    setActiveModal(type);
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await API.updateMe(editData);
      setActiveModal(null);
      window.location.reload(); 
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return dateStr.split('-').join(' / ');
  };

  // Profile completeness logic
  const getCompleteness = () => {
    if (!profile) return 0;
    const fields = [
      profile.full_name, profile.email,
      profile.phone, profile.beneficiary_number,
      profile.treaty_number, profile.dob
    ];
    const completed = fields.filter(f => f && f !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const completeness = getCompleteness();

  const Icons = {
    Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    Alert: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
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
        
        <div className="completeness-wrap">
          <div className="completeness-header">
            <div className="completeness-label">Profile Completeness</div>
            <div className="completeness-pct">{completeness}%</div>
          </div>
          <div className="bar-track">
            <div 
              className={`bar-fill ${completeness < 50 ? 'red' : completeness < 80 ? 'amber' : 'green'}`} 
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
          <div className="completeness-items">
            <span className={`ci ${profile?.full_name ? 'done' : 'missing'}`}>
              {profile?.full_name ? <Icons.Check /> : '✕'} Personal Info
            </span>
            <span className={`ci ${profile?.beneficiary_number ? 'done' : 'missing'}`}>
              {profile?.beneficiary_number ? <Icons.Check /> : '✕'} Eligibility IDs
            </span>
            <span className="ci missing">✕ Banking Details</span>
            <span className="ci partial">⚑ Documents (Verified)</span>
            <span className="ci done"><Icons.Check /> Enrollment Info</span>
          </div>
        </div>

        {/* 1. PERSONAL INFORMATION */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-title">Personal Information</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="sensitivity-tag st-standard">Standard Sensitivity</span>
              <button className="section-edit-btn" onClick={() => handleEditClick('personal')}>Edit</button>
            </div>
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <div className="p-label">Full Legal Name</div>
              <div className="p-val">{profile?.full_name || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Email Address</div>
              <div className="p-val">{profile?.email || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Phone Number</div>
              <div className="p-val">{profile?.phone || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Date of Birth</div>
              <div className="p-val">{formatDate(profile?.dob)}</div>
            </div>
          </div>
        </div>

        {/* 2. ELIGIBILITY IDENTIFIERS */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-title">Eligibility Identifiers</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="sensitivity-tag st-high">High Sensitivity</span>
              <button className="section-edit-btn" onClick={() => handleEditClick('eligibility')}>Edit</button>
            </div>
          </div>
          <div className="info-bar warn">
            These fields are verified by DGG staff against official registries. Changes trigger a re-verification flag.
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <div className="p-label">Deline Beneficiary # <span className="vb-verified verify-badge"><Icons.Check /> Verified</span></div>
              <div className="p-val">{profile?.beneficiary_number || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Indian Status / Treaty # <span className="vb-verified verify-badge"><Icons.Check /> Verified</span></div>
              <div className="p-val">{profile?.treaty_number || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Primary Funding Source</div>
              <div className="p-val">C-DFN PSSSP + DGGR</div>
            </div>
          </div>
        </div>

        {/* 3. ENROLLMENT INFORMATION (Sample) */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div className="profile-section-title">Enrollment Information</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="sensitivity-tag st-standard">Standard Sensitivity</span>
              <button className="section-edit-btn">Edit</button>
            </div>
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <div className="p-label">Institution</div>
              <div className="p-val">Aurora College (Verified via Form B)</div>
            </div>
            <div className="profile-field">
              <div className="p-label">Program</div>
              <div className="p-val">Environment & Natural Resources</div>
            </div>
          </div>
        </div>

        <div className="decl-panel" style={{ marginTop: 24, padding: 16 }}>
          🔒 <strong>Privacy:</strong> Your personal information is collected under the authority of the Deline Got'ine Government Post-Secondary Funding Policy and used solely for processing your funding application.
        </div>
      </div>

      {/* MODALS */}
      {activeModal === 'personal' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h3>Edit Personal Information</h3>
            
            <table className="form-grid" style={{ marginBottom: 24 }}>
              <tbody>
                <tr>
                  <td>
                    <label className="field-label">Full Legal Name *</label>
                    <input className="field-input" type="text" value={editData.full_name || ""} onChange={e => setEditData({...editData, full_name: e.target.value})} />
                  </td>
                  <td>
                    <label className="field-label">Email Address *</label>
                    <input className="field-input" type="email" value={editData.email || ""} onChange={e => setEditData({...editData, email: e.target.value})} />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label className="field-label">Phone Number *</label>
                    <input className="field-input" type="text" value={editData.phone || ""} onChange={e => setEditData({...editData, phone: e.target.value})} />
                  </td>
                  <td>
                    <label className="field-label">Date of Birth *</label>
                    <input className="field-input" type="date" value={editData.dob || ""} onChange={e => setEditData({...editData, dob: e.target.value})} />
                  </td>
                </tr>
              </tbody>
            </table>
            
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {activeModal === 'eligibility' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h3>Eligibility Identifiers</h3>
            
            <table className="form-grid" style={{ marginBottom: 24 }}>
              <tbody>
                <tr>
                  <td>
                    <label className="field-label">Beneficiary # *</label>
                    <input className="field-input" type="text" value={editData.beneficiary_number || ""} onChange={e => setEditData({...editData, beneficiary_number: e.target.value})} />
                  </td>
                  <td>
                    <label className="field-label">Indian Status # *</label>
                    <input className="field-input" type="text" value={editData.treaty_number || ""} onChange={e => setEditData({...editData, treaty_number: e.target.value})} />
                  </td>
                </tr>
              </tbody>
            </table>
            
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={isUpdating}>
               {isUpdating ? 'Submitting...' : 'Request Data Update'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentProfile;
