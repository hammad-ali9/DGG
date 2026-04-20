import React, { useState, useEffect } from 'react';
import API from '../../api/client';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface FormGTBProps {
  profile?: any;
  onBack: () => void;
  onComplete: () => void;
}

const FormGTB: React.FC<FormGTBProps> = ({ profile, onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    treatyNumber: '',
    travelFrom: '',
    travelTo: 'Délı̨nę, NT',
    travelDate: '',
    returnTravelDate: '',
    claimedAmount: '0',
    declarationConfirmed: false,
    signature: ''
  });

  const [selectedProof, setSelectedProof] = useState<File | null>(null);

  // Auto-fill sync from profile
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || profile.full_name?.split(' ')[0] || '',
        lastName: prev.lastName || profile.full_name?.split(' ').slice(1).join(' ') || '',
        dob: prev.dob || profile.dob || '',
        treatyNumber: prev.treatyNumber || profile.treaty_number || '',
        travelFrom: prev.travelFrom || profile.town_city || ''
      }));
    }
  }, [profile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const steps = [
    { id: 1, label: 'Student & Travel' },
    { id: 2, label: 'Bursary Details' },
    { id: 3, label: 'Declaration' }
  ];

  const canGoNext = () => {
    if (currentStep === 1) {
      return !!(formData.firstName && formData.lastName && formData.travelFrom && formData.travelDate && formData.returnTravelDate);
    }
    if (currentStep === 2) {
      return !!(selectedProof && parseFloat(formData.claimedAmount) > 0);
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
       if (currentStep === 1) setError('Please fill in all required travel information.');
       else if (currentStep === 2) setError('Please upload Proof of Graduation and enter Claimed Amount.');
       return;
    }
    setError(null);
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else onBack();
  };

  const handleSubmit = async () => {
    if (!formData.declarationConfirmed || !formData.signature) {
      setError('Please sign and confirm the declaration.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const submissionData = new FormData();
      
      const answers = [
        { field_label: 'First Name', answer_text: formData.firstName },
        { field_label: 'Last Name', answer_text: formData.lastName },
        { field_label: 'DOB', answer_text: formData.dob },
        { field_label: 'Treaty Number', answer_text: formData.treatyNumber },
        { field_label: 'Traveling From', answer_text: formData.travelFrom },
        { field_label: 'Traveling To', answer_text: formData.travelTo },
        { field_label: 'Travel Date', answer_text: formData.travelDate },
        { field_label: 'Return Date', answer_text: formData.returnTravelDate },
        { field_label: 'Claimed Amount', answer_text: formData.claimedAmount },
        { field_label: 'Signature', answer_text: formData.signature }
      ];

      answers.forEach((ans, i) => {
        submissionData.append(`answers[${i}]field_label`, ans.field_label);
        submissionData.append(`answers[${i}]answer_text`, ans.answer_text);
      });

      if (selectedProof) {
        submissionData.append(`answers[${answers.length}]field_label`, 'Proof of Graduation');
        submissionData.append(`answers[${answers.length}]answer_file`, selectedProof);
      }

      await API.submitApplication({
        form_type: 'FormGTB',
        form_data: submissionData
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit Graduation Travel Bursary.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="wizard-root fade-in">
        <div className="wizard-shell" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div className="success-icon" style={{ margin: '0 auto 24px', width: '64px', height: '64px', border: '2px solid #38a169', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38a169' }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Bursary Application Received</h2>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            Safe travels! Your Graduation Travel Bursary application is being processed. 
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
      title="Graduation Travel Bursary (Form GTB)"
      subtitle={currentStep === 1 
        ? "Apply for travel support specifically for attending your graduation ceremony." 
        : currentStep === 2
          ? "Upload your Proof of Graduation and enter your estimated travel costs."
          : "Review and sign your application."
      }
      steps={steps}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      isLastStep={currentStep === 3}
      nextDisabled={!canGoNext() || isLoading}
      onSubmit={handleSubmit}
    >
      {error && (
        <div className="alert-box error fade-in" style={{ background: '#fff2f2', border: '1px solid #ffcccc', color: '#cc0000', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {currentStep === 1 && (
        <div className="fade-in">
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', padding: '16px' }}>
             <div style={{ fontSize: '12px', fontWeight: '700', color: '#111', marginBottom: '12px', textTransform: 'uppercase' }}>A. Student Information</div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                    <label className="field-label">First Name *</label>
                    <input className="field-input" value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} />
                </div>
                <div>
                    <label className="field-label">Last Name *</label>
                    <input className="field-input" value={formData.lastName} onChange={e => handleInputChange('lastName', e.target.value)} />
                </div>
                <div>
                    <label className="field-label">DOB *</label>
                    <input className="field-input" type="date" value={formData.dob} onChange={e => handleInputChange('dob', e.target.value)} />
                </div>
                <div>
                    <label className="field-label">Treaty # *</label>
                    <input className="field-input" value={formData.treatyNumber} onChange={e => handleInputChange('treatyNumber', e.target.value)} />
                </div>
             </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', padding: '16px' }}>
             <div style={{ fontSize: '12px', fontWeight: '700', color: '#111', marginBottom: '12px', textTransform: 'uppercase' }}>B. Travel Dates</div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                    <label className="field-label">Traveling From *</label>
                    <input className="field-input" value={formData.travelFrom} onChange={e => handleInputChange('travelFrom', e.target.value)} placeholder="City, Prov" />
                </div>
                <div>
                    <label className="field-label">Traveling To</label>
                    <input className="field-input" value={formData.travelTo} disabled />
                </div>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <label className="field-label">Arrival Date *</label>
                    <input className="field-input" type="date" value={formData.travelDate} onChange={e => handleInputChange('travelDate', e.target.value)} />
                </div>
                <div>
                    <label className="field-label">Return Date *</label>
                    <input className="field-input" type="date" value={formData.returnTravelDate} onChange={e => handleInputChange('returnTravelDate', e.target.value)} />
                </div>
             </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
           <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '20px', marginBottom: '16px' }}>
                <label className="field-label">Proof of Graduation (Invitation, Program, or Certificate) *</label>
                <input type="file" onChange={e => setSelectedProof(e.target.files?.[0] || null)} />
           </div>

           <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '20px' }}>
                <label className="field-label">Estimated Travel Costs (Total) *</label>
                <input className="field-input" type="number" value={formData.claimedAmount} onChange={e => handleInputChange('claimedAmount', e.target.value)} placeholder="0.00" />
                <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>
                    Note: Maximum bursary amount is subject to DGG policy caps for graduation travel.
                </div>
           </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
           <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
                <div className="decl-panel" style={{ marginBottom: '16px', fontSize: '11px' }}>
                    I declare that this travel support is requested to attend my graduation ceremony. I will provide final boarding passes if requested.
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#333', cursor: 'pointer', marginBottom: '16px' }}>
                   <input type="checkbox" checked={formData.declarationConfirmed} onChange={e => handleInputChange('declarationConfirmed', e.target.checked)} /> 
                   <span>I confirm the declaration <span style={{ color: '#cc0000' }}>*</span></span>
                </label>
                <div>
                   <label className="field-label">Student Signature *</label>
                   <input className="field-input" value={formData.signature} onChange={e => handleInputChange('signature', e.target.value)} placeholder="Type name to sign" />
                </div>
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

export default FormGTB;
