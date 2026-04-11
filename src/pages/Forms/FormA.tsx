import React, { useState } from 'react';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface FormAProps {
  onBack: () => void;
  onComplete: () => void;
}

const FormA: React.FC<FormAProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showFormBPreview, setShowFormBPreview] = useState(false);

  // Form State for Preview Mapping
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    studentId: '',
    institution: '',
    program: '',
    semStart: '',
    semEnd: '',
    registrarEmail: '',
    registrarPhone: '',
    tuition: '',
    beneficiaryNo: ''
  });

  // Eligibility state
  const [eligAnswers, setEligAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '', q5: '', q6: ''
  });

  const steps = [
    { id: 1, label: 'Student Information' },
    { id: 2, label: 'Program & Institution' },
    { id: 3, label: 'Bank Deposit Info' },
    { id: 4, label: 'Documents & Declaration' }
  ];

  const handleNext = () => {
    if (currentStep === 1 && !isEligible()) return;
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else onBack();
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const isEligible = () => {
    if (eligAnswers.q1 === 'no' && eligAnswers.q2 === 'no') return false;
    if (eligAnswers.q5 === 'no' || eligAnswers.q6 === 'no') return false;
    return true;
  };

  const isPartiallyAnswered = () => {
    return Object.values(eligAnswers).some(val => val !== '');
  };

  const getBursaryStream = () => {
    if (eligAnswers.q4 === 'nwt') return 'DGGR Top-Up (SFA Primary)';
    if (eligAnswers.q1 === 'yes' && eligAnswers.q2 === 'yes') return 'PSSSP + DGGR Top-up';
    if (eligAnswers.q1 === 'yes') return 'Federal PSSSP / UCEPP';
    if (eligAnswers.q2 === 'yes') return 'DGGR Top-Up Only';
    return 'Pending Eligibility Check';
  };

  if (isSubmitted) {
    return (
      <div className="wizard-root fade-in">
        <div className="wizard-shell" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div className="success-icon" style={{ margin: '0 auto 24px', width: '64px', height: '64px', border: '2px solid #1a6b3a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a6b3a' }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Application Submitted Successfully</h2>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 16px', borderRadius: '4px', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#166534', marginBottom: '24px' }}>
            Reference: APP-2026-N{Math.floor(1000 + Math.random() * 9000)}
          </div>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 24px' }}>
            Your Form A has been received by the DGG Education Department.
          </p>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '20px', borderRadius: '8px', textAlign: 'left', marginBottom: '32px' }}>
            <div style={{ fontWeight: '700', color: '#1e40af', marginBottom: '8px', fontSize: '14px' }}>📧 Form B Sent Automatically</div>
            <div style={{ fontSize: '12.5px', color: '#1e40af', lineHeight: '1.6' }}>
              An enrollment confirmation request (Form B) has been pre-filled and emailed to your institution's registrar at <strong>{formData.registrarEmail || 'the official address provided'}</strong>.
              <br /><br />
              The institution has <strong>14 days</strong> to complete and return it. You can track this in your dashboard.
            </div>
          </div>
          <button className="wizard-btn-next" style={{ margin: '0 auto' }} onClick={() => onComplete()}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormWizard
      title="Form A \u2014 New Student Application"
      subtitle={currentStep === 1
        ? "Complete all required fields. This info will auto-fill Form B for your registrar."
        : currentStep === 4
          ? "Upload supporting documents and sign the declaration to finalize."
          : "Living allowance and tuition are auto-calculated from your eligibility and confirmed by your institution. Please provide your direct deposit details below to ensure timely payments."
      }
      steps={steps}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      isLastStep={currentStep === 4}
      nextDisabled={currentStep === 1 && isPartiallyAnswered() && !isEligible()}
      onSubmit={handleSubmit}
    >
      {currentStep === 1 && (
        <div className="fade-in">
          {/* Eligibility Checkbox */}
          <div className="elig-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '8px', marginBottom: '32px' }}>
            <div className="section-divider" style={{ border: 'none', background: 'transparent', padding: 0, marginBottom: 16, color: '#1a3a6b' }}>Eligibility Questionnaire</div>

            <div className="elig-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div className="elig-item">
                <div className="elig-q" style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: 8 }}>
                  1. Are you registered under the Indian Act with Délı̨nę First Nation?
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label className="radio-label"><input type="radio" name="e1" checked={eligAnswers.q1 === 'yes'} onChange={() => setEligAnswers({ ...eligAnswers, q1: 'yes' })} /> Yes</label>
                  <label className="radio-label"><input type="radio" name="e1" checked={eligAnswers.q1 === 'no'} onChange={() => setEligAnswers({ ...eligAnswers, q1: 'no' })} /> No</label>
                </div>
              </div>

              <div className="elig-item">
                <div className="elig-q" style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: 8 }}>
                  2. Are you a Délı̨nę Beneficiary? <span style={{ fontWeight: 400, color: '#38a169', fontSize: '10px', marginLeft: 8, cursor: 'help' }}>[?] View Definition</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label className="radio-label"><input type="radio" name="e2" checked={eligAnswers.q2 === 'yes'} onChange={() => setEligAnswers({ ...eligAnswers, q2: 'yes' })} /> Yes</label>
                  <label className="radio-label"><input type="radio" name="e2" checked={eligAnswers.q2 === 'no'} onChange={() => setEligAnswers({ ...eligAnswers, q2: 'no' })} /> No</label>
                </div>
              </div>

              <div className="elig-item">
                <div className="elig-q" style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: 8 }}>
                  3. Are you currently receiving GNWT Student Financial Assistance (SFA)?
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label className="radio-label"><input type="radio" name="e3" checked={eligAnswers.q3 === 'yes'} onChange={() => setEligAnswers({ ...eligAnswers, q3: 'yes' })} /> Yes</label>
                  <label className="radio-label"><input type="radio" name="e3" checked={eligAnswers.q3 === 'no'} onChange={() => setEligAnswers({ ...eligAnswers, q3: 'no' })} /> No</label>
                </div>
              </div>

              <div className="elig-item">
                <div className="elig-q" style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: 8 }}>
                  4. Where do you currently live?
                </div>
                <select
                  className="field-input"
                  style={{ width: '220px' }}
                  value={eligAnswers.q4}
                  onChange={(e) => setEligAnswers({ ...eligAnswers, q4: e.target.value })}
                >
                  <option value="">Select location...</option>
                  <option value="nwt">Northwest Territories</option>
                  <option value="other">Other CA Province/Territory</option>
                  <option value="outside">Outside Canada</option>
                </select>
              </div>

              <div className="elig-item">
                <div className="elig-q" style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: 8 }}>
                  5. Enrolled in an Accredited Institution? <a href="#" style={{ fontWeight: 400, color: '#3182ce', textDecoration: 'underline', fontSize: '10px', marginLeft: 8 }}>Federal Master List</a>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label className="radio-label"><input type="radio" name="e4" checked={eligAnswers.q5 === 'yes'} onChange={() => setEligAnswers({ ...eligAnswers, q5: 'yes' })} /> Yes</label>
                  <label className="radio-label"><input type="radio" name="e4" checked={eligAnswers.q5 === 'no'} onChange={() => setEligAnswers({ ...eligAnswers, q5: 'no' })} /> No</label>
                </div>
              </div>

              <div className="elig-item">
                <div className="elig-q" style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: 8 }}>
                  6. Approved program (at least 12 continuous weeks)?
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label className="radio-label"><input type="radio" name="e5" checked={eligAnswers.q6 === 'yes'} onChange={() => setEligAnswers({ ...eligAnswers, q6: 'yes' })} /> Yes</label>
                  <label className="radio-label"><input type="radio" name="e5" checked={eligAnswers.q6 === 'no'} onChange={() => setEligAnswers({ ...eligAnswers, q6: 'no' })} /> No</label>
                </div>
              </div>

              {isPartiallyAnswered() && !isEligible() && (
                <div className="alert-box error fade-in" style={{ background: '#fff2f2', border: '1px solid #ffcccc', color: '#cc0000', padding: '16px', borderRadius: '6px' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Intake Stopped</strong>
                  <div style={{ fontSize: '11.5px', lineHeight: '1.6' }}>
                    Based on your answers, you do not meet the baseline eligibility for DGG funding streams. Please contact our support team at education.support@gov.deline.ca for guidance.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="section-divider">Student Information</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="50%">
                  <label className="field-label">First Name *</label>
                  <input
                    className="field-input" type="text" placeholder="Marie"
                    value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </td>
                <td width="50%">
                  <label className="field-label">Last Name *</label>
                  <input
                    className="field-input" type="text" placeholder="Beaulieu"
                    value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label className="field-label">Permanent Address in NT *</label>
                  <input className="field-input" type="text" placeholder="Street address or PO Box" />
                </td>
              </tr>
              <tr>
                <td width="40%">
                  <label className="field-label">Town / City *</label>
                  <input className="field-input" type="text" placeholder="Deline" />
                </td>
                <td width="30%">
                  <label className="field-label">Territory / Province *</label>
                  <input className="field-input" type="text" defaultValue="NT" />
                </td>
                <td width="30%">
                  <label className="field-label">Postal Code *</label>
                  <input className="field-input" type="text" placeholder="X0E 0G0" />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label className="field-label">Current Address (Leave blank if same as above)</label>
                  <input className="field-input" type="text" placeholder="In-school address" />
                </td>
              </tr>
              <tr>
                <td width="50%">
                  <label className="field-label">Phone *</label>
                  <input
                    className="field-input" type="tel" placeholder="(867) 555-0199"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </td>
                <td width="50%">
                  <label className="field-label">Email Address *</label>
                  <input
                    className="field-input" type="email" placeholder="marie.b@email.com"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <label className="field-label">SIN (For T4A purposes) *</label>
                  <input className="field-input" type="password" placeholder="000-000-000" />
                </td>
                <td>
                  <label className="field-label">Sex *</label>
                  <select className="field-input" style={{ width: '100%', height: '36px' }}>
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </td>
                <td>
                  <label className="field-label">Date of Birth *</label>
                  <input className="field-input" type="text" placeholder="YYYY/MM/DD" />
                </td>
              </tr>
              <tr>
                <td>
                  <label className="field-label">Délı̨nę Beneficiary #</label>
                  <input
                    className="field-input" type="text" placeholder="DGG-00412"
                    value={formData.beneficiaryNo} onChange={e => setFormData({ ...formData, beneficiaryNo: e.target.value })}
                  />
                </td>
                <td colSpan={2}>
                  <label className="field-label">Dependents? (if yes, provide count)</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: 8 }}>
                    <label className="radio-label"><input type="radio" name="dep" /> Yes</label>
                    <label className="radio-label"><input type="radio" name="dep" /> No</label>
                    <input className="field-input" type="number" placeholder="0" style={{ width: '80px' }} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          <div className="section-divider">Educational Institution</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="60%">
                  <label className="field-label">Institution Name *</label>
                  <input
                    className="field-input" type="text" placeholder="e.g. Aurora College"
                    value={formData.institution} onChange={e => setFormData({ ...formData, institution: e.target.value })}
                  />
                </td>
                <td width="40%">
                  <label className="field-label">Institution Location</label>
                  <input className="field-input" type="text" placeholder="City, Prov" />
                </td>
              </tr>
              <tr>
                <td width="60%">
                  <label className="field-label">Program Name *</label>
                  <input
                    className="field-input" type="text" placeholder="e.g. Environmental Science Diploma"
                    value={formData.program} onChange={e => setFormData({ ...formData, program: e.target.value })}
                  />
                </td>
                <td width="40%">
                  <label className="field-label">Course Load *</label>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <label className="radio-label"><input type="radio" name="load" /> Full-time</label>
                    <label className="radio-label"><input type="radio" name="load" /> Part-time</label>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label className="field-label">Learning Style</label>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <label className="radio-label"><input type="radio" name="style" /> In-person</label>
                    <label className="radio-label"><input type="radio" name="style" /> Online / Hybrid</label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section-divider">Academic Schedule</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="33%">
                  <label className="field-label">Semester (e.g. Fall 2026) *</label>
                  <input className="field-input" type="text" placeholder="Fall 2026" />
                </td>
                <td width="33%">
                  <label className="field-label">Semester Start (YY/MM/DD) *</label>
                  <input
                    className="field-input" type="text" placeholder="26/09/01"
                    value={formData.semStart} onChange={e => setFormData({ ...formData, semStart: e.target.value })}
                  />
                </td>
                <td width="33%">
                  <label className="field-label">Semester End (YY/MM/DD) *</label>
                  <input
                    className="field-input" type="text" placeholder="26/12/15"
                    value={formData.semEnd} onChange={e => setFormData({ ...formData, semEnd: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td width="50%">
                  <label className="field-label">Total Program Start *</label>
                  <input className="field-input" type="text" placeholder="26/09/01" />
                </td>
                <td width="50%">
                  <label className="field-label">Total Program End (Expected) *</label>
                  <input className="field-input" type="text" placeholder="28/05/15" />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section-divider">Registrar Contact (Form B Delivery)</div>
          <div className="policy-note info" style={{ marginBottom: 16 }}>
            Form B (Enrolment Confirmation) will be pre-filled and emailed to this address for registrar verification.
          </div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="60%">
                  <label className="field-label">Registrar / Official Email *</label>
                  <input
                    className="field-input" type="email" placeholder="registrar@auroracollege.nt.ca"
                    value={formData.registrarEmail} onChange={e => setFormData({ ...formData, registrarEmail: e.target.value })}
                  />
                </td>
                <td width="40%">
                  <label className="field-label">Student ID (if assigned)</label>
                  <input
                    className="field-input" type="text" placeholder="SID-012"
                    value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
          <div className="section-divider">Direct Deposit Information</div>
          <div className="policy-note info" style={{ marginBottom: 24 }}>
            Ensuring accurate banking details prevents payment delays. Funds are released based on eligibility confirmed in Step 1.
          </div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td colSpan={3}>
                  <label className="field-label">Account Holder Name *</label>
                  <input className="field-input" type="text" placeholder="Full legal name as on bank record" />
                </td>
              </tr>
              <tr>
                <td width="33%">
                  <label className="field-label">Transit # (5 digits)</label>
                  <input className="field-input" type="text" maxLength={5} placeholder="00000" />
                </td>
                <td width="33%">
                  <label className="field-label">Inst # (3 digits)</label>
                  <input className="field-input" type="text" maxLength={3} placeholder="000" />
                </td>
                <td width="33%">
                  <label className="field-label">Account # (7-12 digits)</label>
                  <input className="field-input" type="text" placeholder="000000000" />
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: 16, background: '#f8fafc', padding: 12, borderRadius: 6 }}>
            <strong>Note:</strong> You will be required to upload a void cheque or direct deposit form in the next step to verify these details.
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="fade-in">
          <div className="section-divider">Supporting Documents</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 20, lineHeight: '1.6' }}>
            To have a full and complete application you must also include the following documents. If using a mobile phone, use your camera. Please ensure documents are well-lit and legible. If a document is not legible, you will be asked to rescan or retake the picture properly.
          </div>
          <div className="doc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Transcripts *', desc: 'Recent high school or post-secondary' },
              { label: 'Letter of Intent *', desc: 'Explanation of program goals' },
              { label: 'Reference Letter', desc: 'Non-family reference' },
              { label: 'Status Card *', desc: 'Deline Beneficiary / First Nation ID' },
              { label: 'Void Cheque *', desc: 'For banking verification' },
              { label: 'Extra Docs', desc: 'Acceptance, etc.' }
            ].map((doc, idx) => (
              <div key={idx} className="doc-item" style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#1e293b' }}>{doc.label}</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: 2 }}>{doc.desc}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button className="btn-ghost" style={{ fontSize: 9 }}>Choose File</button>
                  <span style={{ fontSize: 9, color: '#94a3b8', alignSelf: 'center' }}>No file chosen</span>
                </div>
              </div>
            ))}
          </div>

          <div className="section-divider">Student Declaration</div>
          <div className="decl-panel" style={{ fontSize: '11px', lineHeight: '1.6', background: '#f8fafc', padding: 16, borderLeft: '4px solid #1a1a1a', marginBottom: 24 }}>
            I declare that all information given on this application along with provided documentation is true and any false information regarding eligibility determination will result in suspension from the program. I authorize DGG to contact my educational institution for verification.
          </div>

          <table className="form-grid">
            <tbody>
              <tr>
                <td width="70%">
                  <label className="field-label">Student Signature (Full Legal Name) *</label>
                  <input className="field-input" type="text" placeholder="Marie Beaulieu" />
                </td>
                <td width="30%">
                  <label className="field-label">Date *</label>
                  <input className="field-input" type="text" defaultValue="2026/03/28" readOnly />
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '16px', borderRadius: '8px', marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, paddingRight: 20 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1' }}>📋 Form B Auto-Generated Preview</div>
              <div style={{ fontSize: '11px', color: '#0369a1', marginTop: 4 }}>This document is pre-filled from your entries and sent to your registrar. Please check for accuracy before finalizing.</div>
            </div>
            <button className="btn-primary" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }} onClick={() => setShowFormBPreview(true)}>👁️ Preview Form B</button>
          </div>
        </div>
      )}

      {/* ══ FORM B PREVIEW MODAL ══ */}
      {showFormBPreview && (
        <div className="modal-overlay" onClick={() => setShowFormBPreview(false)}>
          <div className="modal-box animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Form B — Student Enrolment Confirmation (Auto-Generated Preview)</h3>
              <button className="modal-close" onClick={() => setShowFormBPreview(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-b-notice">
                This form has been <strong>automatically pre-filled</strong> from your Form A entries. It will be emailed to your institution's registrar upon submission. The institution completes the lower section and returns it — <strong>they do not need a portal account</strong>.<br /><br />
                <strong style={{ color: '#111' }}>Privacy Note:</strong> Your Social Insurance Number and Date of Birth have been omitted from this form to protect your identity. If you see anything here that seems inaccurate, misleading, or wrong, please let us know before submitting.
              </div>

              {/* Bursary type */}
              <div style={{ border: '1px solid #ddd', borderRadius: '3px', padding: '10px 12px', marginBottom: '14px', background: '#fafafa', fontSize: '11px', color: '#333' }}>
                <strong>Applying for:</strong> <span>{getBursaryStream()}</span>
              </div>

              {/* Student section (auto-filled, read-only) */}
              <div className="formb-section">To Be Completed by Student (Auto-filled from your Form A)</div>
              <table className="formb-table">
                <tbody>
                  <tr>
                    <td colSpan={3}>
                      <span className="fb-label">First and Last Name</span>
                      <span className="fb-val">{formData.firstName} {formData.lastName || '—'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td width="33%">
                      <span className="fb-label">Student ID</span>
                      <span className="fb-val">{formData.studentId || '—'}</span>
                    </td>
                    <td width="33%">
                      <span className="fb-label">Phone</span>
                      <span className="fb-val">{formData.phone || '—'}</span>
                    </td>
                    <td width="34%">
                      <span className="fb-label">Email</span>
                      <span className="fb-val">{formData.email || '—'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <span className="fb-label">Note to Registrar</span>
                      <span className="fb-val" style={{ color: '#888', fontSize: '9.5px' }}>Student has verified their identity and contact information via DGG Student Portal.</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Institution section (to be completed by registrar) */}
              <div className="formb-section" style={{ marginTop: '16px' }}>To Be Completed by Education Institution (Sent to Registrar)</div>
              <div style={{ fontSize: '10.5px', color: '#555', border: '1px solid #ddd', borderTop: 'none', padding: '8px 12px', background: '#fffbe6' }}>
                This form is used to confirm the student's enrolment to be eligible for the DGG Student Financial Support Program. Please return to address below or to student.
              </div>
              <table className="formb-table">
                <tbody>
                  <tr>
                    <td width="50%">
                      <span className="fb-label">Name of Institution (pre-filled)</span>
                      <span className="fb-val">{formData.institution || '—'}</span>
                    </td>
                    <td width="50%">
                      <span className="fb-label">Name of Student's Program (pre-filled)</span>
                      <span className="fb-val">{formData.program || '—'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="cb-val">
                      <span style={{ fontSize: '11px', color: '#555', marginRight: '8px' }}>Student's course load (Registrar to confirm):</span>
                      ☐ Full-Time &nbsp;&nbsp; ☐ Part-Time
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="cb-val">
                      Working towards: ☐ Certificate &nbsp; ☐ Diploma &nbsp; ☐ Degree &nbsp; ☐ Masters &nbsp; ☐ Doctorate &nbsp; ☐ Other: ___________
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="cb-val">
                      Semester Enrolled: ☐ Fall &nbsp; ☐ Winter &nbsp; ☐ Spring &nbsp; ☐ Summer &nbsp;&nbsp; Year ______ of ______ year program
                    </td>
                  </tr>
                  <tr>
                    <td width="25%">
                      <span className="fb-label">Semester Start Date (pre-filled)</span>
                      <span className="fb-val">{formData.semStart || '—'}</span>
                    </td>
                    <td width="25%">
                      <span className="fb-label">Semester End Date (pre-filled)</span>
                      <span className="fb-val">{formData.semEnd || '—'}</span>
                    </td>
                    <td width="25%">
                      <span className="fb-label">Tuition $ (pre-filled)</span>
                      <span className="fb-val">{formData.tuition ? `$${formData.tuition}` : '—'}</span>
                    </td>
                    <td width="25%">
                      <span className="fb-label">Books $</span>
                      <span className="fb-val">_______________</span>
                    </td>
                  </tr>
                  <tr>
                    <td width="33%">
                      <span className="fb-label">Institution Email (pre-filled)</span>
                      <span className="fb-val">{formData.registrarEmail || '—'}</span>
                    </td>
                    <td width="33%">
                      <span className="fb-label">Institution Phone (pre-filled)</span>
                      <span className="fb-val">{formData.registrarPhone || '—'}</span>
                    </td>
                    <td width="34%">
                      <span className="fb-label">Other Fees (Explanation Required) $</span>
                      <span className="fb-val">_______________</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="fb-label">Title of Official</span>
                      <span className="fb-val" style={{ color: '#bbb' }}>To be completed by institution</span>
                    </td>
                    <td>
                      <span className="fb-label">Signature of Official</span>
                      <span className="fb-val" style={{ color: '#bbb' }}>To be completed by institution</span>
                    </td>
                    <td>
                      <span className="fb-label">Date (YYYY/MM/DD)</span>
                      <span className="fb-val" style={{ color: '#bbb' }}>To be completed by institution</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <span className="fb-label">Additional Registrar Notes (Pre-submission)</span>
                      <span className="fb-val" style={{ color: '#bbb' }}>To be completed by institution (e.g. discrepancies, inaccuracies, partial loads)</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '14px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '3px', padding: '10px 14px', fontSize: '10px', color: '#555', textAlign: 'center', lineHeight: '1.7' }}>
                <strong>Please submit application and supporting documents to:</strong><br />
                Department of Education, Délı̨nę Got'ı̨nę Government<br />
                P.O. Box 156 Délı̨nę, NT X0E 0G0<br />
                Email: education.support@gov.deline.ca · Ph: (867) 589-3515 ext. 1110
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-footer-note">
                This form will be automatically emailed to your institution's registrar at <strong>{formData.registrarEmail || 'the official address'}</strong> when you submit Form A. They have 14 days to complete and return it.
              </div>
              <button className="btn-confirm" onClick={() => setShowFormBPreview(false)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </FormWizard>
  );
};

// SVG Icons for professional look
const Icons = {
  Check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  ),
  Star: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  ),
  ChevronRight: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
  )
};

export default FormA;
