import React, { useState } from 'react';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface FormHProps {
  onBack: () => void;
  onComplete: () => void;
}

const FormH: React.FC<FormHProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const steps = [
    { id: 1, label: 'Appeal Context' },
    { id: 2, label: 'Detailed Reason' },
    { id: 3, label: 'Support & Submission' }
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
          <div className="success-icon" style={{ margin: '0 auto 24px', width: '64px', height: '64px', border: '2px solid #e65100', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e65100' }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Appeal Filed</h2>
          <div style={{ background: '#fff8f0', border: '1px solid #ffcc80', padding: '8px 16px', borderRadius: '4px', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#7a4a00', marginBottom: '24px' }}>
            REF: APL-2026-F55
          </div>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            Your appeal has been forwarded to the Education Director and Appeal Committee. Decisions are typically rendered within 30 days of receipt.
          </p>
          <button className="wizard-btn-next" style={{ margin: '0 auto', background: '#e65100' }} onClick={() => onComplete()}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormWizard
      title="Form H \u2014 Appeal Request"
      subtitle={currentStep === 1 
        ? "Clearly identify the decision you are appealing and the relevant academic context." 
        : currentStep === 2
          ? "Explain your situation and why you believe the original decision should be reconsidered."
          : "Attach evidence and submit your request for committee review."
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
          <div className="policy-note warn" style={{ marginBottom: 24 }}>
            <strong>Prerequisite:</strong> A prior denied or suspended decision must be on record to file an appeal.
          </div>

          <div className="section-divider">Student Information</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="60%">
                  <label className="field-label">Student Name *</label>
                  <input className="field-input" type="text" placeholder="Marie Beaulieu" defaultValue="Marie Beaulieu" />
                </td>
                <td width="40%">
                  <label className="field-label">Student ID *</label>
                  <input className="field-input" type="text" placeholder="DGG-00412" defaultValue="DGG-00412" />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label className="field-label">Educational Institution *</label>
                  <input className="field-input" type="text" placeholder="e.g. University of Calgary" />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section-divider">Affected Term</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="50%">
                  <label className="field-label">Semester *</label>
                  <select className="field-input" style={{ width: '100%', height: '36px' }}>
                    <option>Fall</option>
                    <option>Winter</option>
                    <option>Spring/Summer</option>
                  </select>
                </td>
                <td width="50%">
                  <label className="field-label">Academic Year *</label>
                  <input className="field-input" type="text" placeholder="e.g. 2025-2026" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          <div className="section-divider">Reason for Appeal</div>
          <div className="policy-note info" style={{ marginBottom: 12 }}>
            Clearly describe: (1) what decision is being appealed, (2) when it was made, (3) why you believe it was incorrect, and (4) your requested outcome.
          </div>
          <textarea 
            className="field-input" 
            placeholder="Type your explanation here..."
            style={{ width: '100%', height: '200px', padding: '12px' }}
          />

          <div className="section-divider" style={{ marginTop: 24 }}>Policy References (Optional)</div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
            Identify specific sections of the DGG Education Policy supporting your appeal.
          </div>
          <input className="field-input" type="text" placeholder="e.g. Section 4.2 - Eligibility Requirements" />
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
          <div className="section-divider">Supporting Evidence</div>
          <div className="doc-item">
            <div className="doc-name">Upload Documents (Optional)</div>
            <div className="doc-meta">Attach medical notes, letters, transcripts, or any other supporting materials.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <button className="btn-ghost" style={{ fontSize: 10 }}>Upload Files</button>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>No files chosen</span>
            </div>
          </div>

          <div className="section-divider" style={{ marginTop: 32 }}>Student Declaration</div>
          <div className="decl-panel">
            I confirm that the information provided is accurate and complete. I understand that appeal decisions are discretionary and subject to the DGG Education Policy and committee review.
          </div>
          
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="70%">
                  <label className="field-label">Electronic Signature *</label>
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

export default FormH;
