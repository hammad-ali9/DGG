import React, { useState, useEffect } from 'react';
import API from '../../api/client';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface FormDProps {
  profile?: any;
  onBack: () => void;
  onComplete: () => void;
}

const FormD: React.FC<FormDProps> = ({ profile, onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Selection state
  const [categories, setCategories] = useState({
    drop: false,
    withdraw: false,
    school: false,
    dependents: false,
    contact: false,
    sfa: false,
    other: false
  });

  const [details, setDetails] = useState({
    status: '',
    effDate: '',
    reason: '',
    institution: '',
    program: '',
    dependentCount: '',
    dependentAges: '',
    address: '',
    phone: '',
    email: '',
    sfaStatus: '',
    declarationConfirmed: false
  });

  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({
    enrollmentDoc: null,
    sfaLetter: null
  });

  // Fix: Only auto-fill if the fields are currently empty to avoid overwriting user input during polling
  useEffect(() => {
    if (profile) {
      setDetails(prev => ({
        ...prev,
        address: prev.address || profile.address || '',
        phone: prev.phone || profile.phone || '',
        email: prev.email || profile.email || ''
      }));
    }
  }, [profile]);

  const handleToggleCategory = (cat: keyof typeof categories) => {
    setCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const steps = [
    { id: 1, label: 'Select Category' },
    { id: 2, label: 'Change Details' },
    { id: 3, label: 'Review & Impact' }
  ];

  // BUG 5: Validation
  const canGoNext = () => {
    if (currentStep === 1) {
      return Object.values(categories).some(v => v);
    }
    if (currentStep === 2) {
      return details.effDate && details.reason;
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      setError(currentStep === 1 ? 'Please select at least one change category.' : 'Please provide an effective date and a description of the change.');
      return;
    }
    setError(null);
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else onBack();
  };

  // BUG 4: Connected Submission Flow
  const handleSubmit = async () => {
    if (!details.declarationConfirmed) {
      setError('Please confirm the declaration before submitting.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const submissionData = new FormData();
      
      const answers = [
        { field_label: 'Change Categories', answer_text: Object.entries(categories).filter(([_, v]) => v).map(([k]) => k).join(', ') },
        { field_label: 'Effective Date', answer_text: details.effDate },
        { field_label: 'Reason for Change', answer_text: details.reason },
        { field_label: 'New Status', answer_text: details.status },
        { field_label: 'New Institution', answer_text: details.institution },
        { field_label: 'New Program', answer_text: details.program },
        { field_label: 'Dependent Change', answer_text: `Count: ${details.dependentCount}, Ages: ${details.dependentAges}` },
        { field_label: 'Contact Info Change', answer_text: `Address: ${details.address}, Phone: ${details.phone}, Email: ${details.email}` },
        { field_label: 'SFA Status', answer_text: details.sfaStatus },
        { field_label: 'Impact Summary', answer_text: getImpactText() }
      ];

      answers.forEach((ans, i) => {
        submissionData.append(`answers[${i}]field_label`, ans.field_label);
        submissionData.append(`answers[${i}]answer_text`, ans.answer_text);
      });

      if (selectedFiles.enrollmentDoc) {
          submissionData.append('answers[10]field_label', 'Enrollment Document');
          submissionData.append('answers[10]answer_file', selectedFiles.enrollmentDoc);
      }
      if (selectedFiles.sfaLetter) {
          submissionData.append('answers[11]field_label', 'SFA Letter');
          submissionData.append('answers[11]answer_file', selectedFiles.sfaLetter);
      }

      await API.submitApplication({
        form_type: 'FormD',
        form_data: submissionData
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit change report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactText = () => {
    let summary = `You reported a change effective ${details.effDate || "[No Date Selected]"}. `;
    if (categories.drop || categories.withdraw) {
      summary += "Reducing your course load or withdrawing will immediately affect your living allowance. Staff will recalculate your eligibility. If an overpayment has already been issued, you will be notified of the repayment process.";
    } else if (categories.school) {
      summary += "Your school or program change will be reviewed to ensure the new program is eligible for funding. Tuition payments may be redirected.";
    } else if (categories.dependents) {
      summary += "Your dependent update may result in an adjustment to your monthly allowance starting from the reported effective date.";
    } else {
      summary += "DGG staff will review your report and update your profile. You will receive an email once the changes have been processed.";
    }
    return summary;
  };

  if (isSubmitted) {
    return (
      <div className="wizard-root fade-in">
        <div className="wizard-shell" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div className="success-icon" style={{ margin: '0 auto 24px', width: '64px', height: '64px', border: '2px solid #38a169', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38a169' }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Change Reported</h2>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            Your change of information has been submitted. A counselor will review the impact on your funding and contact you if further action is needed.
          </p>
          <button className="wizard-btn-next" style={{ margin: '0 auto' }} onClick={() => onComplete()}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormWizard
      title="Form D \u2014 Change of Information"
      subtitle={currentStep === 1
        ? "Something changed in your school or life? Pick the categories that apply."
        : currentStep === 2
          ? "Provide the specific details for the changes you selected."
          : "Review the potential impact on your funding before finalizing."
      }
      steps={steps}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      isLastStep={currentStep === 3}
      nextDisabled={isLoading}
      onSubmit={handleSubmit}
    >
      {error && (
        <div className="alert-box error fade-in" style={{ background: '#fff2f2', border: '1px solid #ffcccc', color: '#cc0000', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ background: '#fff8f0', border: '1px solid #ffcc80', borderLeft: '3px solid #e65100', borderRadius: '3px', padding: '10px 12px', fontSize: '10px', color: '#7a4a00', lineHeight: '1.6', marginBottom: '12px', marginTop: '20px' }}>
        <strong>Submit immediately whenever any information changes.</strong> Failing to report enrollment changes (e.g. dropping to part-time) can result in overpayments you will be required to repay.
      </div>

      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: '700', color: currentStep === 1 ? '#111' : '#aaa', borderBottom: `3px solid ${currentStep === 1 ? '#111' : '#eee'}`, paddingBottom: '10px' }}>1. What changed?</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: '700', color: currentStep === 2 ? '#111' : '#aaa', borderBottom: `3px solid ${currentStep === 2 ? '#111' : '#eee'}`, paddingBottom: '10px' }}>2. Details of the change</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: '700', color: currentStep === 3 ? '#111' : '#aaa', borderBottom: `3px solid ${currentStep === 3 ? '#111' : '#eee'}`, paddingBottom: '10px' }}>3. Review & Impact Summary</div>
      </div>

      {currentStep === 1 && (
        <div className="fade-in">
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>Something changed in my school or life.</div>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Pick one or more categories that apply to your current situation:</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <CategoryLabel active={categories.drop} onClick={() => handleToggleCategory('drop')} label="Dropped / added courses (load changed)" />
            <CategoryLabel active={categories.withdraw} onClick={() => handleToggleCategory('withdraw')} label="Withdrew from my program (temp/perm)" />
            <CategoryLabel active={categories.school} onClick={() => handleToggleCategory('school')} label="Changed schools or programs" />
            <CategoryLabel active={categories.dependents} onClick={() => handleToggleCategory('dependents')} label="My dependents changed" />
            <CategoryLabel active={categories.contact} onClick={() => handleToggleCategory('contact')} label="Address or contact details changed" />
            <CategoryLabel active={categories.sfa} onClick={() => handleToggleCategory('sfa')} label="My SFA / other funding status changed" />
            <CategoryLabel active={categories.other} onClick={() => handleToggleCategory('other')} label="Something else happened" span2 />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>Details of the change.</div>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Please provide the key details for each category you selected.</p>

          {(categories.drop || categories.withdraw) && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#f8f9fa', borderBottom: '1px solid #eee', padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#1a4a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🎓</span> Enrollment & Course Load
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>New Status</div>
                    <select value={details.status} onChange={e => setDetails({ ...details, status: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
                      <option value="">Select status</option>
                      <option>Full-Time</option>
                      <option>Part-Time</option>
                      <option>Withdrawn (Temporary)</option>
                      <option>Withdrawn (Permanent)</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Effective Date</div>
                    <input type="date" value={details.effDate} onChange={e => setDetails({ ...details, effDate: e.target.value })} style={{ width: '100%', padding: '9px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Supporting Document (Optional)</div>
                  <input type="file" onChange={e => setSelectedFiles({ ...selectedFiles, enrollmentDoc: e.target.files?.[0] || null })} style={{ fontSize: '11px', color: '#555' }} />
                </div>
              </div>
            </div>
          )}

          {categories.school && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#f8f9fa', borderBottom: '1px solid #eee', padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#1a4a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🏫</span> School or Program Change
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>New Institution Name</div>
                    <input type="text" value={details.institution} onChange={e => setDetails({ ...details, institution: e.target.value })} placeholder="e.g., Aurora College" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>New Program of Study</div>
                    <input type="text" value={details.program} onChange={e => setDetails({ ...details, program: e.target.value })} placeholder="e.g., Business Administration" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {categories.dependents && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#f8f9fa', borderBottom: '1px solid #eee', padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#1a4a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>👥</span> Dependents Changed
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>New Total Count</div>
                    <input type="number" value={details.dependentCount} onChange={e => setDetails({ ...details, dependentCount: e.target.value })} min="0" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Ages of Dependents</div>
                    <input type="text" value={details.dependentAges} onChange={e => setDetails({ ...details, dependentAges: e.target.value })} placeholder="e.g., 4, 7, 12" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {categories.contact && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#f8f9fa', borderBottom: '1px solid #eee', padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#1a4a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🏠</span> Address or Contact Details
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>New Primary Address</div>
                  <textarea rows={2} value={details.address} onChange={e => setDetails({ ...details, address: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', fontFamily: 'inherit' }}></textarea>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</div>
                    <input type="text" value={details.phone} onChange={e => setDetails({ ...details, phone: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Email (if changed)</div>
                    <input type="email" value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {categories.sfa && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#f8f9fa', borderBottom: '1px solid #eee', padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#1a4a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>💰</span> SFA / Other Funding Status
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Current SFA Status</div>
                    <select value={details.sfaStatus} onChange={e => setDetails({ ...details, sfaStatus: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
                      <option value="">Select</option>
                      <option>Now receiving SFA</option>
                      <option>Stopped receiving SFA</option>
                      <option>Receiving other 3rd party funding</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>New Letter (Optional)</div>
                    <input type="file" onChange={e => setSelectedFiles({ ...selectedFiles, sfaLetter: e.target.files?.[0] || null })} style={{ fontSize: '11px', color: '#555' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#f8f9fa', borderBottom: '1px solid #eee', padding: '12px 16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#333' }}>Timing & Context</div>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Effective Date of Change <span style={{ color: '#cc0000' }}>*</span></div>
                  <input type="date" value={details.effDate} onChange={e => setDetails({ ...details, effDate: e.target.value })} style={{ width: '100%', maxWidth: '260px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Please describe what happened in your own words. <span style={{ color: '#cc0000' }}>*</span></div>
                  <textarea rows={3} value={details.reason} onChange={e => setDetails({ ...details, reason: e.target.value })} placeholder="e.g., I dropped Nursing 201 due to personal reasons, which changes my status to part-time." style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', fontFamily: 'inherit' }}></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>Review and Impact Summary.</div>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Please read the following policy summary before submitting.</p>

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ background: '#f0f7ff', border: '1px solid #cce3ff', borderLeft: '4px solid #1a73e8', borderRadius: '4px', padding: '20px', lineHeight: '1.6', color: '#0b4c9e', fontSize: '12.5px' }}>
              <strong>Impact Estimate:</strong> <span>{getImpactText()}</span>
            </div>

            <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input 
                    type="checkbox" 
                    checked={details.declarationConfirmed}
                    onChange={e => setDetails({ ...details, declarationConfirmed: e.target.checked })}
                    style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} 
                />
                <span style={{ fontSize: '12px', color: '#111', lineHeight: '1.5' }}>
                  <strong>Declaration:</strong> I confirm that the information provided is correct and complete. I understand that reporting this change may trigger a <strong>recalculation of my funding</strong> from the effective date provided, and may result in an <strong>overpayment</strong> that I will be required to repay.
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </FormWizard>
  );
};

const CategoryLabel: React.FC<{ active: boolean; onClick: () => void; label: string; span2?: boolean }> = ({ active, onClick, label, span2 }) => (
  <label
    onClick={onClick}
    style={{
      border: `1.5px solid ${active ? '#1a4a8a' : '#e0e0e0'}`,
      borderRadius: '6px',
      padding: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      background: active ? '#f0f7ff' : '#fff',
      gridColumn: span2 ? 'span 2' : 'auto',
      transition: 'all 0.2s ease'
    }}
  >
    <input type="checkbox" checked={active} onChange={() => { }} style={{ width: '18px', height: '18px', marginRight: '12px' }} />
    <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{label}</span>
  </label>
);

const Icons = {
  Check: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  )
};

export default FormD;
