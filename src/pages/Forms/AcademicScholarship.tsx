import React, { useState } from 'react';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface AcademicScholarshipProps {
  onBack: () => void;
  onComplete: () => void;
}

const AcademicScholarship: React.FC<AcademicScholarshipProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const steps = [
    { id: 1, label: 'Program Info' },
    { id: 2, label: 'Achievements' },
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
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Scholarship Application Submitted</h2>
          <div style={{ background: '#f0f4ff', border: '1px solid #c0ccf0', padding: '8px 16px', borderRadius: '4px', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#1a4aaa', marginBottom: '24px' }}>
            GPA VERIFIED: PENDING
          </div>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            Your achievement scholarship application has been received. Our team will verify your transcripts against the DGG Education Policy.
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
      title="Academic Achievement Scholarship"
      subtitle={currentStep === 1 
        ? "Confirm the qualifying semester and your educational institution." 
        : currentStep === 2
          ? "Report your academic achievements and provide supporting documentation."
          : "Finalize your scholarship application."
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
          <div className="policy-note info" style={{ marginBottom: 24 }}>
            <strong>Award Criteria:</strong> GPA &ge; 80% = $1,000 | GPA 70\u201379.99% = $500. Submit within 6 months of the qualifying semester's end.
          </div>

          <div className="section-divider">Academic Context</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="50%">
                  <label className="field-label">Student Name *</label>
                  <input className="field-input" type="text" placeholder="Marie Beaulieu" defaultValue="Marie Beaulieu" />
                </td>
                <td width="50%">
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
              <tr>
                <td>
                  <label className="field-label">Qualifying Semester *</label>
                  <select className="field-input" style={{ width: '100%', height: '36px' }}>
                    <option>Fall</option>
                    <option>Winter</option>
                    <option>Spring/Summer</option>
                  </select>
                </td>
                <td>
                  <label className="field-label">Academic Year *</label>
                  <input className="field-input" type="text" placeholder="e.g. 2025" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          <div className="section-divider">Academic Achievement</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="50%">
                  <label className="field-label">GPA Achieved / Final Grade % *</label>
                  <input className="field-input" type="text" placeholder="e.g. 85% or 3.8/4.0" />
                </td>
                <td width="50%">
                  <label className="field-label">Grades Submitted to DGG? *</label>
                  <select className="field-input" style={{ width: '100%', height: '36px' }}>
                    <option>Yes \u2014 Grades submitted earlier</option>
                    <option>No \u2014 Submitting with this form</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section-divider" style={{ marginTop: 24 }}>Required Documentation</div>
          <div className="doc-item">
            <div className="doc-name">Official Transcript / Final Grades Letter *</div>
            <div className="doc-meta">Must show your full name, institution name, and final grades for the semester.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <button className="btn-ghost" style={{ fontSize: 10 }}>Upload Transcript</button>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>No file chosen</span>
            </div>
          </div>
          
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" />
              <span style={{ fontSize: '11px', color: '#64748b' }}>I have also submitted my Form B for the upcoming semester.</span>
            </label>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
          <div className="section-divider">Student Declaration</div>
          <div className="decl-panel">
            I confirm that the information provided is accurate and complete. I understand that eligibility for the Academic Achievement Scholarship is subject to verification of my transcripts and meeting the DGG Education Policy requirements.
          </div>
          
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="70%">
                  <label className="field-label">Digital Signature *</label>
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

export default AcademicScholarship;
