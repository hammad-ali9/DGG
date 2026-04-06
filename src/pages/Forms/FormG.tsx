import React, { useState } from 'react';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface FormGProps {
  onBack: () => void;
  onComplete: () => void;
}

const FormG: React.FC<FormGProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [releaseFunds, setReleaseFunds] = useState(false);

  const steps = [
    { id: 1, label: 'Personal Info' },
    { id: 2, label: 'Graduation Details' },
    { id: 3, label: 'Banking & Release' },
    { id: 4, label: 'Declaration' }
  ];

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
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
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Application Received</h2>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '4px', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '24px' }}>
            REF: GRD-2026-V881
          </div>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            Congratulations on your graduation! Your award application is being processed. Payments are typically issued via direct deposit within 15 business days.
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
      title="Form G \u2014 Graduation Award"
      subtitle={currentStep === 1 
        ? "Verify your identity and mailing address for award processing." 
        : currentStep === 2
          ? "Tell us about your achievement and upload your proof of completion."
          : currentStep === 3
            ? "Provide your banking details for the award payment."
            : "Review and sign your application."
      }
      steps={steps}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      isLastStep={currentStep === 4}
      onSubmit={handleSubmit}
    >
      {currentStep === 1 && (
        <div className="fade-in">
          <div className="policy-note info" style={{ marginBottom: 24 }}>
            <strong>Eligibility Note:</strong> Applications must be submitted within 6 months of your graduation date. A clear copy of your certificate or diploma is required.
          </div>

          <div className="section-divider">1. Personal Information</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="33%">
                  <label className="field-label">Full Legal Name *</label>
                  <input className="field-input" type="text" placeholder="Marie Beaulieu" defaultValue="Marie Beaulieu" />
                </td>
                <td width="33%">
                  <label className="field-label">Date of Birth *</label>
                  <input className="field-input" type="text" placeholder="YYYY/MM/DD" />
                </td>
                <td width="33%">
                  <label className="field-label">Treaty / SCN # *</label>
                  <input className="field-input" type="text" placeholder="DGG-00412" />
                </td>
              </tr>
              <tr>
                <td>
                  <label className="field-label">Social Insurance # *</label>
                  <input className="field-input" type="password" placeholder="\u2022\u2022\u2022-\u2022\u2022\u2022-\u2022\u2022\u2022" />
                </td>
                <td>
                  <label className="field-label">Phone *</label>
                  <input className="field-input" type="tel" placeholder="(867) 589-3515" />
                </td>
                <td>
                  <label className="field-label">Email *</label>
                  <input className="field-input" type="email" placeholder="marie@example.com" />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section-divider" style={{ marginTop: 24 }}>Permanent Mailing Address</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="40%">
                  <label className="field-label">Town / City *</label>
                  <input className="field-input" type="text" placeholder="D\u00e9l\u012c\u0328\u029f\u0119" />
                </td>
                <td width="30%">
                  <label className="field-label">Province / Territory *</label>
                  <input className="field-input" type="text" placeholder="NT" />
                </td>
                <td width="30%">
                  <label className="field-label">Postal Code *</label>
                  <input className="field-input" type="text" placeholder="X0E 0G0" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          <div className="section-divider">2. Graduation Details</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="50%">
                  <label className="field-label">Educational Institution *</label>
                  <input className="field-input" type="text" placeholder="e.g. University of Calgary" />
                </td>
                <td width="50%">
                  <label className="field-label">Program of Study *</label>
                  <input className="field-input" type="text" placeholder="e.g. Bachelor of Nursing" />
                </td>
              </tr>
              <tr>
                <td>
                  <label className="field-label">Program Completion Date *</label>
                  <input className="field-input" type="text" placeholder="YYYY/MM/DD" />
                </td>
                <td>
                  <label className="field-label">Credential Earned *</label>
                  <select className="field-input" style={{ width: '100%', height: '36px' }}>
                    <option>Certificate</option>
                    <option>Diploma</option>
                    <option>Degree (Bachelors)</option>
                    <option>Masters</option>
                    <option>Doctorate</option>
                    <option>Apprenticeship</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section-divider" style={{ marginTop: 24 }}>Document Upload</div>
          <div className="doc-item">
            <div className="doc-name">Proof of Completion / Certificate *</div>
            <div className="doc-meta">Upload a clear photo or PDF of your diploma or official notation of graduation.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <button className="btn-ghost" style={{ fontSize: 10 }}>Upload File</button>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>No file chosen</span>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
          <div className="section-divider">3. Banking Information</div>
          <div className="policy-note info" style={{ marginBottom: 24 }}>
            Enter your direct deposit details. You can find these on a void cheque or in your banking app.
          </div>

          <table className="form-grid">
            <tbody>
              <tr>
                <td width="33%">
                  <label className="field-label">Institution # (3 digits) *</label>
                  <input className="field-input" type="text" placeholder="000" />
                </td>
                <td width="33%">
                  <label className="field-label">Transit # (5 digits) *</label>
                  <input className="field-input" type="text" placeholder="00000" />
                </td>
                <td width="33%">
                  <label className="field-label">Account # *</label>
                  <input className="field-input" type="text" placeholder="7-12 digits" />
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 24, padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={releaseFunds} 
                onChange={(e) => setReleaseFunds(e.target.checked)} 
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Payment goes to another person (Release of Funds)</span>
            </label>
            
            {releaseFunds && (
              <div className="fade-in" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #cbd5e1' }}>
                <table className="form-grid">
                  <tbody>
                    <tr>
                      <td width="50%">
                        <label className="field-label">Recipient Name *</label>
                        <input className="field-input" type="text" placeholder="Full legal name" />
                      </td>
                      <td width="50%">
                        <label className="field-label">Relationship *</label>
                        <input className="field-input" type="text" placeholder="e.g. Parent, Spouse" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="fade-in">
          <div className="section-divider">4. Final Declaration</div>
          <div className="decl-panel">
            I declare that the information provided is true and complete. I understand that any false information will result in the suspension of my graduation award and potentially other DGG funding.
          </div>
          
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="70%">
                  <label className="field-label">Student Digital Signature *</label>
                  <input className="field-input" type="text" placeholder="Type your full legal name" />
                </td>
                <td width="30%">
                  <label className="field-label">Date *</label>
                  <input className="field-input" type="text" defaultValue="2026/03/28" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </FormWizard>
  );
};

const Icons = {
  Check: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  )
};

export default FormG;
