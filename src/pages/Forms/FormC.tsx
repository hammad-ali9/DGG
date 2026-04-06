import React, { useState } from 'react';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface FormCProps {
  onBack: () => void;
  onComplete: () => void;
  onUpdateInfo?: () => void;
}

const FormC: React.FC<FormCProps> = ({ onBack, onComplete, onUpdateInfo }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const steps = [
    { id: 1, label: 'Information Review' },
    { id: 2, label: 'Documents & Declaration' }
  ];

  const handleNext = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else onBack();
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="wizard-root fade-in">
        <div className="wizard-shell" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div className="success-icon" style={{ margin: '0 auto 24px', width: '64px', height: '64px', border: '2px solid #38a169', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38a169' }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Renewal Submitted</h2>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '4px', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '24px' }}>
            REF: REN-2026-X992
          </div>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            Your Form C has been received. We will verify your transcripts and next-semester enrollment shortly.
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
      title="Form C \u2014 Continuing Student"
      subtitle={currentStep === 1
        ? "Review your current enrollment on file and confirm accuracy."
        : "Upload required semester records and sign the declaration."
      }
      steps={steps}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      isLastStep={currentStep === 2}
      onSubmit={handleSubmit}
    >
      <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '-32px -40px 24px -40px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8', padding: '12px 20px 11px' }}>
              <table cellPadding="0" cellSpacing="0" border={0} width="100%">
                {/* <tbody>
                  <tr>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        Form C &mdash; Continuing Student</div>
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '3px', lineHeight: '1.5' }}>Student Financial Support Program &middot; Submit each semester to renew funding &middot; Form A must be on file</div>
                    </td>
                    <td align="right" valign="top" style={{ fontSize: '9px', color: '#888', lineHeight: '1.7', whiteSpace: 'nowrap' }}>
                      (867) 589-3515 ext. 1110<br />education.support@gov.deline.ca
                    </td>
                  </tr>
                </tbody> */}
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {currentStep === 1 && (
        <div className="fade-in">
          <div style={{ background: '#f0f4ff', border: '1px solid #c0ccf0', borderLeft: '3px solid #1a4aaa', borderRadius: '3px', padding: '10px 12px', fontSize: '10px', color: '#1a4aaa', lineHeight: '1.6', marginBottom: '12px' }}>
            <strong>Submit each semester to renew your funding.</strong> Deadlines: Fall = Aug 1 &middot; Winter = Dec 1 &middot; Spring = Apr 1 &middot; Summer = Jun 1. Form A must be on file. DGG will send Form B to your registrar after receiving this form.
          </div>

          {/* REVIEW SECTION */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              1. Review Your Information</div>
            <div style={{ fontSize: '10.5px', color: '#555', marginBottom: '16px', lineHeight: '1.5' }}>Since you are a continuing student, we have your information on file. Please verify that the details below are still accurate. If anything has changed, please submit a <a href="#" onClick={(e) => { e.preventDefault(); onUpdateInfo?.(); }} style={{ color: '#1a4aaa', textDecoration: 'none', fontWeight: '600' }}>Change of Information (Form D)</a> instead of continuing here.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#f9f9f9', padding: '12px', borderRadius: '4px', border: '1px solid #eee', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Name</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#333' }}>Marie Beaulieu</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>DGG Beneficiary #</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#333' }}>DGG-00412</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Contact</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#333' }}>(867) 589-3515<br />marie.b@email.com</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', background: '#f9f9f9', padding: '12px', borderRadius: '4px', border: '1px solid #eee' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Institution</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#333' }}>University of Calgary</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Program</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#333' }}>Bachelor of Nursing Science</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Course Load</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#333' }}>Full-Time</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Dependents</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#333' }}>2</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          {/* UPLOAD SECTION */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              2. Upload Required Documents</div>
            <div style={{ fontSize: '10.5px', color: '#555', marginBottom: '16px', lineHeight: '1.5' }}>To continue your funding, you must provide your latest transcripts and proof of registration for the upcoming semester. <strong style={{ color: '#111' }}>If using a mobile phone, use your camera. Ensure documents are well-lit and legible.</strong></div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1, background: '#fafafa', padding: '14px', border: '1px solid #ddd', borderRadius: '3px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#111', marginBottom: '4px' }}>Previous Semester Transcripts</div>
                <div style={{ fontSize: '9.5px', color: '#777', marginBottom: '10px' }}>Unofficial transcripts are acceptable. Must show grades for all courses.</div>
                <input type="file" style={{ fontSize: '10px' }} accept="image/*,.pdf" capture="environment" />
              </div>
              <div style={{ flex: 1, background: '#fafafa', padding: '14px', border: '1px solid #ddd', borderRadius: '3px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#111', marginBottom: '4px' }}>Next Semester Enrollment Confirmation</div>
                <div style={{ fontSize: '9.5px', color: '#777', marginBottom: '10px' }}>Proof of course registration or enrollment letter for the upcoming semester.</div>
                <input type="file" style={{ fontSize: '10px' }} accept="image/*,.pdf" capture="environment" />
              </div>
            </div>
          </div>

          <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '9px 14px', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444' }}>
                  Student Declaration</td>
              </tr>
              <tr>
                <td colSpan={4} style={{ padding: '14px 14px 2px' }}>
                  <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td colSpan={4} style={{ padding: '0 0 10px 0' }}>
                          <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '3px', padding: '12px 14px', fontSize: '10.5px', color: '#555', lineHeight: '1.7', marginBottom: '10px' }}>
                            I declare that all information given on this application along with provided documentation is true and any false information regarding eligibility determination will result in suspension from the program.</div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ padding: '0 0 12px 0' }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#333', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ marginTop: '2px', flexShrink: 0 }} /><span><strong>I confirm the above declaration. <span style={{ color: '#cc0000' }}>*</span></strong></span>
                          </label>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Student Signature &mdash; Type Full Legal Name <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="Type your full legal name" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff', outline: 'none' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Date <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="YYYY/MM/DD" defaultValue="2026/03/28" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff', outline: 'none' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            &nbsp;</div><input type="text" placeholder="" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff', outline: 'none' }} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '40px', background: '#f5f5f5', borderTop: '1px solid #e0e0e0', padding: '13px 20px', margin: '24px -40px -32px -40px' }}>
            <div style={{ fontSize: '9.5px', color: '#888', lineHeight: '1.6' }}>
              Department of Education, D&#233;l&#x12C;&#x328;&#x29F;&#x119; Got&#x2019;&#x12C;&#x328;&#x29F;&#x119; Government<br />
              P.O. Box 156, D&#233;l&#x12C;&#x328;&#x29F;&#x119;, NT X0E 0G0 &nbsp;&middot;&nbsp; education.support@gov.deline.ca &nbsp;&middot;&nbsp; (867) 589-3515 ext. 1110
            </div>
          </div>
        </div>
      )}
    </FormWizard>
  );
};

const Icons = {
  Check: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  )
};

export default FormC;
