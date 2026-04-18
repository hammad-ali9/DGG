import React, { useState, useEffect } from 'react';
import API from '../../api/client';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface FormGTBProps {
  profile?: any;
  onBack: () => void;
  onComplete: () => void;
}

// Eligible credentials for GTB (2+ year programs)
const ELIGIBLE_CREDENTIALS = [
  'Diploma',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Doctorate (PhD)',
  'Juris Doctor / Bachelor of Laws',
  'MD or DDS'
];

const GTB_CAP = 5000;

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
    institution: '',
    programOfStudy: '',
    graduationDate: '',
    credential: '',
    familyMembersAttending: 0,
    airfareCosts: '',
    hotelCostsPerNight: '',
    hotelNights: 1,
    totalClaimedAmount: '',
    declarationConfirmed: false,
    signature: ''
  });

  const [selectedProof, setSelectedProof] = useState<FileList | null>(null);

  // Auto-fill from profile
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || profile.first_name || '',
        lastName: prev.lastName || profile.last_name || '',
        dob: prev.dob || profile.date_of_birth || '',
        treatyNumber: prev.treatyNumber || profile.treaty_number || ''
      }));
    }
  }, [profile]);

  // Calculate total claimed amount
  useEffect(() => {
    const airfare = parseFloat(formData.airfareCosts) || 0;
    const hotelPerNight = parseFloat(formData.hotelCostsPerNight) || 0;
    const nights = Math.min(parseInt(formData.hotelNights) || 1, 3); // Max 3 nights
    const hotelTotal = hotelPerNight * nights;
    
    let total = airfare + hotelTotal;
    
    // Cap at $5,000
    if (total > GTB_CAP) {
      total = GTB_CAP;
    }
    
    setFormData(prev => ({
      ...prev,
      totalClaimedAmount: total.toFixed(2)
    }));
  }, [formData.airfareCosts, formData.hotelCostsPerNight, formData.hotelNights]);

  // Validate graduation date is in the past
  const validateGraduationDate = (dateStr: string): { valid: boolean; message?: string } => {
    if (!dateStr) {
      return { valid: false, message: 'Graduation date is required' };
    }

    const graduationDate = new Date(dateStr);
    const today = new Date();

    if (graduationDate > today) {
      return { valid: false, message: 'Graduation date must be in the past (travel must have already occurred)' };
    }

    return { valid: true };
  };

  // Validate hotel costs (max $350/night)
  const validateHotelCost = (costStr: string): { valid: boolean; message?: string } => {
    if (!costStr) {
      return { valid: true }; // Optional field
    }

    const cost = parseFloat(costStr);
    if (isNaN(cost)) {
      return { valid: false, message: 'Hotel cost must be a valid number' };
    }

    if (cost > 350) {
      return { valid: false, message: 'Hotel cost cannot exceed $350 per night' };
    }

    return { valid: true };
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const steps = [
    { id: 1, label: 'Student Information' },
    { id: 2, label: 'Graduation & Travel Details' },
    { id: 3, label: 'Cost Breakdown' },
    { id: 4, label: 'Declaration & Signature' }
  ];

  const canGoNext = () => {
    if (currentStep === 1) {
      return formData.firstName && formData.lastName && formData.dob && formData.treatyNumber;
    }
    if (currentStep === 2) {
      const dateValidation = validateGraduationDate(formData.graduationDate);
      return formData.institution && formData.programOfStudy && dateValidation.valid && 
             ELIGIBLE_CREDENTIALS.includes(formData.credential) && selectedProof && selectedProof.length > 0;
    }
    if (currentStep === 3) {
      const hotelValidation = validateHotelCost(formData.hotelCostsPerNight);
      return formData.airfareCosts && hotelValidation.valid && formData.familyMembersAttending > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      if (currentStep === 1) {
        setError('Please fill in all required student information marked with *');
      } else if (currentStep === 2) {
        const dateValidation = validateGraduationDate(formData.graduationDate);
        if (!dateValidation.valid) {
          setError(dateValidation.message || 'Please provide valid graduation details');
        } else if (!ELIGIBLE_CREDENTIALS.includes(formData.credential)) {
          setError('Please select an eligible credential type (2+ year programs only)');
        } else {
          setError('Please fill in all required graduation details and upload proof of graduation.');
        }
      } else if (currentStep === 3) {
        const hotelValidation = validateHotelCost(formData.hotelCostsPerNight);
        if (!hotelValidation.valid) {
          setError(hotelValidation.message || 'Please provide valid cost information');
        } else {
          setError('Please fill in all required cost information');
        }
      }
      return;
    }
    setError(null);
    if (currentStep < 4) setCurrentStep(currentStep + 1);
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
        { field_label: 'Institution', answer_text: formData.institution },
        { field_label: 'Program of Study', answer_text: formData.programOfStudy },
        { field_label: 'Graduation Date', answer_text: formData.graduationDate },
        { field_label: 'Credential', answer_text: formData.credential },
        { field_label: 'Family Members Attending', answer_text: formData.familyMembersAttending.toString() },
        { field_label: 'Airfare Costs', answer_text: formData.airfareCosts },
        { field_label: 'Hotel Cost Per Night', answer_text: formData.hotelCostsPerNight },
        { field_label: 'Hotel Nights', answer_text: formData.hotelNights.toString() },
        { field_label: 'Total Claimed Amount', answer_text: formData.totalClaimedAmount },
        { field_label: 'Signature', answer_text: formData.signature }
      ];

      // Indexed answers
      answers.forEach((ans, i) => {
        submissionData.append(`answers[${i}]field_label`, ans.field_label);
        submissionData.append(`answers[${i}]answer_text`, ans.answer_text);
      });

      // Add proof of graduation
      if (selectedProof) {
        for (let i = 0; i < selectedProof.length; i++) {
          submissionData.append(`answers[${answers.length + i}]field_label`, `Proof of Graduation`);
          submissionData.append(`answers[${answers.length + i}]answer_file`, selectedProof[i]);
        }
      }

      await API.submitApplication({
        form_type: 'FormGTB',
        form_data: submissionData
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit graduation travel bursary application. Please try again.');
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
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Application Received</h2>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            Congratulations on your graduation! Your Graduation Travel Bursary application is being processed. You will receive an email confirmation with next steps.
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
      title=" — Graduation Travel Bursary"
      subtitle={currentStep === 1 
        ? "Verify your identity and contact information." 
        : currentStep === 2
          ? "Tell us about your graduation and upload your proof of graduation."
          : currentStep === 3
            ? "Provide your travel and accommodation costs (max $5,000 total)."
            : "Review and sign your application."
      }
      steps={steps}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      isLastStep={currentStep === 4}
      nextDisabled={isLoading}
      onSubmit={handleSubmit}
    >
      {error && (
        <div className="alert-box error fade-in" style={{ background: '#fff2f2', border: '1px solid #ffcccc', color: '#cc0000', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ background: '#f7f7f7', border: '1px solid #e0e0e0', borderLeft: '3px solid #333', borderRadius: '3px', padding: '10px 12px', fontSize: '10px', color: '#444', lineHeight: '1.6', marginBottom: '12px', marginTop: '20px' }}>
        Use this form to apply for the Graduation Travel Bursary. This program supports graduates of 2+ year programs to attend their graduation ceremony. Maximum award: $5,000.
      </div>

      {currentStep === 1 && (
        <div className="fade-in">
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
            <div className="section-divider">Student Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="field-label">Full Legal Name *</label>
                  <input className="field-input" value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Date of Birth *</label>
                  <input className="field-input" type="date" value={formData.dob} onChange={e => handleInputChange('dob', e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Treaty / SCN # *</label>
                  <input className="field-input" value={formData.treatyNumber} onChange={e => handleInputChange('treatyNumber', e.target.value)} />
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Last Name *</label>
                  <input className="field-input" value={formData.lastName} onChange={e => handleInputChange('lastName', e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Phone *</label>
                  <input className="field-input" type="tel" placeholder="(XXX) XXX-XXXX" />
                </div>
                <div>
                  <label className="field-label">Email *</label>
                  <input className="field-input" type="email" placeholder="your@email.com" />
                </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
            <div className="section-divider">Graduation & Travel Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="field-label">Institution *</label>
                  <input className="field-input" value={formData.institution} onChange={e => handleInputChange('institution', e.target.value)} placeholder="e.g., University of Alberta" />
                </div>
                <div>
                  <label className="field-label">Program of Study *</label>
                  <input className="field-input" value={formData.programOfStudy} onChange={e => handleInputChange('programOfStudy', e.target.value)} placeholder="e.g., Bachelor of Science" />
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="field-label">Graduation Date *</label>
                  <input 
                    className="field-input" 
                    type="date" 
                    value={formData.graduationDate} 
                    onChange={e => handleInputChange('graduationDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {formData.graduationDate && !validateGraduationDate(formData.graduationDate).valid && (
                    <div style={{ fontSize: '12px', color: '#cc0000', marginTop: '4px' }}>
                      {validateGraduationDate(formData.graduationDate).message}
                    </div>
                  )}
                </div>
                <div>
                  <label className="field-label">Credential Earned *</label>
                  <select 
                    className="field-input" 
                    value={formData.credential} 
                    onChange={e => handleInputChange('credential', e.target.value)}
                  >
                    <option value="">Select credential type...</option>
                    {ELIGIBLE_CREDENTIALS.map(cred => (
                      <option key={cred} value={cred}>
                        {cred}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    Only 2+ year programs are eligible
                  </div>
                </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '20px' }}>
              <label className="field-label">Proof of Graduation / Diploma *</label>
              <input 
                type="file" 
                onChange={e => setSelectedProof(e.target.files)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Accepted formats: PDF, JPG, PNG, DOC, DOCX
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
            <div className="section-divider">Travel & Accommodation Costs</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="field-label">Family Members Attending *</label>
                  <input 
                    className="field-input" 
                    type="number" 
                    min="1" 
                    max="2"
                    value={formData.familyMembersAttending} 
                    onChange={e => handleInputChange('familyMembersAttending', parseInt(e.target.value) || 0)}
                  />
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    Maximum 2 family members
                  </div>
                </div>
                <div>
                  <label className="field-label">Airfare Costs (Total) *</label>
                  <input 
                    className="field-input" 
                    type="number" 
                    step="0.01"
                    value={formData.airfareCosts} 
                    onChange={e => handleInputChange('airfareCosts', e.target.value)}
                    placeholder="e.g., 1200.00"
                  />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="field-label">Hotel Cost Per Night (Max $350) *</label>
                  <input 
                    className="field-input" 
                    type="number" 
                    step="0.01"
                    max="350"
                    value={formData.hotelCostsPerNight} 
                    onChange={e => handleInputChange('hotelCostsPerNight', e.target.value)}
                    placeholder="e.g., 150.00"
                  />
                  {formData.hotelCostsPerNight && !validateHotelCost(formData.hotelCostsPerNight).valid && (
                    <div style={{ fontSize: '12px', color: '#cc0000', marginTop: '4px' }}>
                      {validateHotelCost(formData.hotelCostsPerNight).message}
                    </div>
                  )}
                </div>
                <div>
                  <label className="field-label">Number of Hotel Nights (Max 3)</label>
                  <input 
                    className="field-input" 
                    type="number" 
                    min="1" 
                    max="3"
                    value={formData.hotelNights} 
                    onChange={e => handleInputChange('hotelNights', Math.min(parseInt(e.target.value) || 1, 3))}
                  />
                </div>
            </div>

            <div style={{ background: '#f0f8ff', border: '1px solid #b3d9ff', borderRadius: '4px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#333', marginBottom: '8px' }}>
                <strong>Cost Summary:</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>Airfare: ${parseFloat(formData.airfareCosts) || 0}.00</div>
                <div>Hotel: ${((parseFloat(formData.hotelCostsPerNight) || 0) * Math.min(parseInt(formData.hotelNights) || 1, 3)).toFixed(2)}</div>
              </div>
              <div style={{ borderTop: '1px solid #b3d9ff', marginTop: '8px', paddingTop: '8px', fontSize: '14px', fontWeight: '600' }}>
                Total Claimed: ${formData.totalClaimedAmount} (Max: ${GTB_CAP})
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="fade-in">
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '20px' }}>
            <div className="decl-panel" style={{ marginBottom: '20px' }}>
              I declare that the information provided is true and complete. I understand that any false information will result in the suspension of my graduation travel bursary and may affect my eligibility for future funding.
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div>
                  <label className="field-label">Student Digital Signature *</label>
                  <input className="field-input" value={formData.signature} onChange={e => handleInputChange('signature', e.target.value)} placeholder="Type name to sign" />
                </div>
                <div>
                  <label className="field-label">Date</label>
                  <input className="field-input" disabled value={new Date().toLocaleDateString()} />
                </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.declarationConfirmed}
                  onChange={e => handleInputChange('declarationConfirmed', e.target.checked)}
                />
                <span>I confirm that I have read and agree to the declaration above</span>
              </label>
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
