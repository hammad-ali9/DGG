import React, { useState } from 'react';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface FormFProps {
  onBack: () => void;
  onComplete: () => void;
}

const FormF: React.FC<FormFProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const steps = [
    { id: 1, label: 'Employer & Info' },
    { id: 2, label: 'Performance & Roles' },
    { id: 3, label: 'Declaration' }
  ];

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
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
          <div className="success-icon" style={{ margin: '0 auto 24px', width: '64px', height: '64px', border: '2px solid #1a4aaa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a4aaa' }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Report Received</h2>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            The supervisor's performance report (Form F) has been submitted and linked to the student's file.
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
      title="Form F \u2014 Summer Student / Practicum Award"
      subtitle={currentStep === 1 
        ? "This form must be completed by the employer or supervisor to verify your placement." 
        : currentStep === 2
          ? "Detail the student's responsibilities and overall work performance."
          : "Finalize the supervisor's report."
      }
      steps={steps}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      isLastStep={currentStep === 3}
      onSubmit={handleSubmit}
    >
      {currentStep === 1 && (
        <div className="fade-in">
          <div className="policy-note info" style={{ marginBottom: 24, background: '#f0f4ff', borderLeftColor: '#1a4aaa', color: '#1a4aaa' }}>
            <strong>Supervisor Notice:</strong> This report is required to release the student's practicum or summer incentive award. Please provide honest feedback.
          </div>

          <div className="section-divider">Employer Information</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="60%">
                  <label className="field-label">Organization / Employer Name *</label>
                  <input className="field-input" type="text" placeholder="e.g. D\u00e9l\u012c\u0328\u029f\u0119 Got\u2019\u012c\u0328\u029f\u0119 Government" />
                </td>
                <td width="40%">
                  <label className="field-label">Supervisor Title *</label>
                  <input className="field-input" type="text" placeholder="e.g. Manager of Education" />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section-divider">Student (Employee) Information</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="50%">
                  <label className="field-label">Student Full Name *</label>
                  <input className="field-input" type="text" placeholder="Marie Beaulieu" defaultValue="Marie Beaulieu" />
                </td>
                <td width="50%">
                  <label className="field-label">Student SIN/ID *</label>
                  <input className="field-input" type="password" placeholder="\u2022\u2022\u2022-\u2022\u2022\u2022-\u2022\u2022\u2022" />
                </td>
              </tr>
              <tr>
                <td>
                  <label className="field-label">Placement Start Date *</label>
                  <input className="field-input" type="text" placeholder="YYYY/MM/DD" />
                </td>
                <td>
                  <label className="field-label">Placement End Date *</label>
                  <input className="field-input" type="text" placeholder="YYYY/MM/DD" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          <div className="section-divider">Roles and Responsibilities</div>
          <div className="policy-note info" style={{ marginBottom: 12 }}>
            List the key tasks the student was responsible for during their placement.
          </div>
          <textarea 
            className="field-input" 
            placeholder="e.g. Assisted with archival research, prepared community briefing notes..."
            style={{ width: '100%', height: '120px', padding: '12px', marginBottom: 24 }}
          />

          <div className="section-divider">Work Performance</div>
          <div className="policy-note info" style={{ marginBottom: 12 }}>
            Describe the student's performance, attendance, and contributions.
          </div>
          <textarea 
            className="field-input" 
            placeholder="e.g. Excellent attendance, proactive in learning new software..."
            style={{ width: '100%', height: '120px', padding: '12px' }}
          />
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
          <div className="section-divider">Employer Declaration</div>
          <div className="decl-panel" style={{ background: '#f8fafc' }}>
            The employer confirms that the information provided is accurate and complete. Award is contingent on regular attendance and satisfactory performance.
          </div>
          
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="70%">
                  <label className="field-label">Supervisor Digital Signature *</label>
                  <input className="field-input" type="text" placeholder="Type supervisor's full legal name" />
                </td>
                <td width="30%">
                  <label className="field-label">Date *</label>
                  <input className="field-input" type="text" defaultValue="2026/03/28" />
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 24, padding: 16, border: '1px dashed #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>If you are the student, please share this form with your supervisor.</div>
            <button className="btn-ghost" style={{ marginTop: 12, color: '#1a4aaa' }}>Copy Shareable Link \u29c9</button>
          </div>
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

export default FormF;
