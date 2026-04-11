import React, { useState } from 'react';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface HardshipBursaryProps {
  onBack: () => void;
  onComplete: () => void;
}

const HardshipBursary: React.FC<HardshipBursaryProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expenses, setExpenses] = useState([{ id: 1, purpose: '', amount: 0 }]);

  const steps = [
    { id: 1, label: 'Student Info' },
    { id: 2, label: 'Emergency Case' },
    { id: 3, label: 'Fund Breakdown' },
    { id: 4, label: 'Declaration' }
  ];

  const addExpense = () => {
    setExpenses([...expenses, { id: Date.now(), purpose: '', amount: 0 }]);
  };

  const removeExpense = (id: number) => {
    if (expenses.length > 1) setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = (id: number, field: string, value: string | number) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

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
          <div className="success-icon" style={{ margin: '0 auto 24px', width: '64px', height: '64px', border: '2px solid #e65100', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e65100' }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Emergency Request Logged</h2>
          <div style={{ background: '#fff8f0', border: '1px solid #ffcc80', padding: '8px 16px', borderRadius: '4px', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#7a4a00', marginBottom: '24px' }}>
            PRIORITY: HIGH
          </div>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            Your hardship application is marked for priority review. An education officer will contact you within 48 hours to discuss your situation.
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
      title="Emergency Hardship Bursary (Last Resort)"
      subtitle={currentStep === 1 
        ? "Verify your current academic status and identity." 
        : currentStep === 2
          ? "Describe the emergency and explain what other supports you have attempted."
          : currentStep === 3
            ? "Provide a breakdown of the immediate financial need ($500 limit)."
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
          <div className="policy-note warn" style={{ marginBottom: 24 }}>
            <strong>Last Resort Notice:</strong> Hardship support is for short-term emergencies only. You must have exhausted all other avenues before applying.
          </div>

          <div className="section-divider">Student & Academic Info</div>
          <table className="form-grid">
            <tbody>
              <tr>
                <td width="60%">
                  <label className="field-label">Student Full Name *</label>
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

          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: '13px', color: '#475569' }}>I am currently active in my program and compliant with reporting.</span>
            </label>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          <div className="section-divider">Nature of Hardship</div>
          <label className="field-label">Describe the emergency financial hardship *</label>
          <textarea 
            className="field-input" 
            placeholder="What happened, when, and immediate impact..."
            style={{ width: '100%', height: '120px', padding: '12px', marginBottom: 24 }}
          />

          <div className="section-divider" style={{ borderColor: '#e65100' }}>Other Supports Attempted</div>
          <div className="policy-note warn" style={{ background: '#fffbeb', color: '#92400e', borderColor: '#f59e0b', marginBottom: 12 }}>
            <strong>Required:</strong> You MUST indicate what other avenues you have pursued (e.g. food banks, family support, campus emergency funds).
          </div>
          <textarea 
            className="field-input" 
            placeholder="List other options you have tried to resolve this..."
            style={{ width: '100%', height: '100px', padding: '12px', borderColor: '#e65100' }}
          />
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
          <div className="section-divider">Fund Breakdown (Max $500)</div>
          
          <table className="expense-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', fontSize: '11px', textTransform: 'uppercase' }}>Expense / Purpose</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', fontSize: '11px', textTransform: 'uppercase', width: '120px' }}>Amount ($)</th>
                <th style={{ borderBottom: '2px solid #e2e8f0', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ padding: '8px' }}>
                    <input 
                      className="field-input" 
                      type="text" 
                      placeholder="e.g. Emergency Utilities" 
                      value={exp.purpose}
                      onChange={(e) => updateExpense(exp.id, 'purpose', e.target.value)}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input 
                      className="field-input" 
                      type="number" 
                      placeholder="0.00" 
                      value={exp.amount || ''}
                      onChange={(e) => updateExpense(exp.id, 'amount', e.target.value)}
                    />
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => removeExpense(exp.id)}>\u00d7</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={addExpense}>+ Add Row</button>

          <div style={{ marginTop: 24, padding: '16px', borderRadius: '8px', background: totalAmount > 500 ? '#fef2f2' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '700' }}>Total Requested:</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: totalAmount > 500 ? '#dc2626' : '#1e293b' }}>
              ${totalAmount.toFixed(2)}
            </span>
          </div>
          {totalAmount > 500 && (
            <div style={{ color: '#dc2626', fontSize: '11px', marginTop: 8, textAlign: 'right', fontWeight: '600' }}>
              Warning: Maximum bursary amount is $500.00
            </div>
          )}
        </div>
      )}

      {currentStep === 4 && (
        <div className="fade-in">
          <div className="section-divider">Student Declaration</div>
          <div className="decl-panel">
            I confirm that the information provided is accurate and complete. I understand that hardship support is discretionary and considered a last resort. I have exhausted all other available resources.
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

export default HardshipBursary;
