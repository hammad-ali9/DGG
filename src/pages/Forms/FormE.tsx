import React, { useState, useEffect } from 'react';
import FormWizard from '../../components/Forms/FormWizard';
import '../../styles/forms.css';

interface ExpenseRow {
  id: string;
  description: string;
  amount: string;
  receiptAttached: boolean;
}

interface FormEProps {
  onBack: () => void;
  onComplete: () => void;
}

const FormE: React.FC<FormEProps> = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { id: '1', description: '', amount: '', receiptAttached: false },
    { id: '2', description: '', amount: '', receiptAttached: false },
    { id: '3', description: '', amount: '', receiptAttached: false },
    { id: '4', description: '', amount: '', receiptAttached: false },
    { id: '5', description: '', amount: '', receiptAttached: false }
  ]);

  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const total = expenses.reduce((sum, row) => {
      const val = parseFloat(row.amount) || 0;
      return sum + val;
    }, 0);
    setTotalAmount(total);
  }, [expenses]);

  const steps = [
    { id: 1, label: 'Student & Travel' },
    { id: 2, label: 'Expenses & Receipts' },
    { id: 3, label: 'Declaration & Office' }
  ];

  const handleUpdateRow = (id: string, field: keyof ExpenseRow, value: any) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

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
          <div className="success-icon" style={{ margin: '0 auto 24px', width: '64px', height: '64px', border: '2px solid #38a169', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38a169' }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Claim Submitted</h2>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '4px', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '24px' }}>
            REF: TRV-2026-N009
          </div>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>
            Your Form E travel reimbursement claim has been received. Please allow 10-15 business days for processing after all receipts are verified.
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
      title="Form E \u2014 Travel Reimbursement"
      subtitle={currentStep === 1 
        ? "Apply for coverage of travel to and from your educational institution." 
        : currentStep === 2
          ? "List all individual travel expenses. Receipts must be attached for each."
          : "Finalize your claim with supporting documentation."
      }
      steps={steps}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      isLastStep={currentStep === 3}
      onSubmit={handleSubmit}
    >
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8', padding: '12px 20px 11px', margin: '-32px -40px 24px -40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#111', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Form E &mdash; Travel Reimbursement</div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '3px', lineHeight: '1.5' }}>Student Financial Support Program &middot; Submit within 30 days of travel &middot; Receipts mandatory &middot; Max $2,000 / $3,500</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9px', color: '#888', lineHeight: '1.7', whiteSpace: 'nowrap' }}>
            (867) 589-3515 ext. 1110<br />education.support@gov.deline.ca
          </div>
        </div>
      </div>

      <div style={{ background: '#f7f7f7', border: '1px solid #e0e0e0', borderLeft: '3px solid #333', borderRadius: '3px', padding: '10px 12px', fontSize: '10px', color: '#444', lineHeight: '1.6', marginBottom: '12px', marginTop: '20px' }}>
        Use this form to apply for coverage of travel expenses to and from your educational institution. <strong>Receipts are mandatory &mdash; no receipts = no reimbursement.</strong> Maximum: <strong>$2,000</strong> without dependents &middot; <strong>$3,500</strong> with dependents. Submit within <strong>30 days of travel</strong>. Air fare reimbursed at most economical fare. Land travel reimbursed at NJC NT km rates.
      </div>

      <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td colSpan={4} style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '9px 14px', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444' }}>
              Funding Stream &mdash; Check All That Apply</td>
          </tr>
          <tr>
            <td colSpan={4} style={{ padding: '14px 14px 2px' }}>
              <div style={{ marginBottom: '4px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '1.5px solid #1a1a1a', borderRadius: '3px', padding: '7px 13px', fontSize: '10.5px', fontWeight: '600', background: '#1a1a1a', color: '#ffffff', cursor: 'pointer', margin: '0 8px 8px 0' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: '#aaa' }} /> Canada's D&#233;l&#x12C;&#x328;&#x29F;&#x119; First Nation Student Bursary (C-DFN PSSSP)
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '1.5px solid #ccc', borderRadius: '3px', padding: '7px 13px', fontSize: '10.5px', fontWeight: '600', background: '#fff', color: '#555', cursor: 'pointer', margin: '0 8px 8px 0' }}>
                  <input type="checkbox" style={{ accentColor: '#aaa' }} /> University / College Entrance Prep Program (UCEPP)
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {currentStep === 1 && (
        <div className="fade-in">
          <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '9px 14px', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444' }}>
                  A &mdash; Student Information</td>
              </tr>
              <tr>
                <td colSpan={4} style={{ padding: '14px 14px 2px' }}>
                  <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            First Name <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="Legal first name" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Last Name <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="Legal last name" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Date of Birth <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="YYYY/MM/DD" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Treaty # <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="SCN 000000000" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '9px 14px', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444' }}>
                  B &mdash; Travel Information</td>
              </tr>
              <tr>
                <td colSpan={4} style={{ padding: '14px 14px 2px' }}>
                  <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td colSpan={2} style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Traveling From (City, Province) <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="e.g. D&#233;l&#x12C;&#x328;&#x29F;&#x119;, NT" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                        <td colSpan={2} style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Traveling To (City, Province) <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="e.g. Calgary, AB" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Date of Travel <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="M/D/YYYY" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Return Travel Date (if applicable)</div><input type="text" placeholder="M/D/YYYY" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>&nbsp;</div>
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>&nbsp;</div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ padding: '0 0 12px 0' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Mode of Travel &mdash; Check All That Apply <span style={{ color: '#cc0000' }}>*</span></div>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#333', marginRight: '20px', cursor: 'pointer' }}><input type="checkbox" /> Air (most economical fare)</label>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#333', cursor: 'pointer' }}><input type="checkbox" /> Land (NJC NT km rate &mdash; see njc-cnm.gc.ca)</label>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            If Land Travel &mdash; Total Kilometers Traveled</div><input type="text" placeholder="e.g. 420 km" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                          <div style={{ fontSize: '9px', color: '#aaa', marginTop: '3px', lineHeight: '1.4' }}>Reimbursed at NJC Northwest Territories km rate</div>
                        </td>
                        <td colSpan={2} style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            If Land Travel &mdash; Vehicle Used / Driver Name</div><input type="text" placeholder="e.g. Personal vehicle / Marie Beaulieu" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {currentStep === 2 && (
        <div className="fade-in">
          <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '9px 14px', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444' }}>
                  Expense Breakdown</td>
              </tr>
              <tr>
                <td colSpan={4} style={{ padding: '14px 14px 2px' }}>
                  <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ borderCollapse: 'collapse', marginBottom: '8px' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '7px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', textAlign: 'left', width: '60%' }}>
                          Expense / Description</th>
                        <th style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '7px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', textAlign: 'left', width: '20%' }}>
                          Amount ($)</th>
                        <th style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '7px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', textAlign: 'left', width: '20%' }}>
                          Receipt Attached</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((row) => (
                        <tr key={row.id}>
                          <td style={{ border: '1px solid #e8e8e8', padding: '0' }}>
                            <input type="text" placeholder="" value={row.description} onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: 'none', outline: 'none', fontSize: '11px', background: '#fff' }} />
                          </td>
                          <td style={{ border: '1px solid #e8e8e8', padding: '0' }}>
                            <input type="text" placeholder="" value={row.amount} onChange={(e) => handleUpdateRow(row.id, 'amount', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: 'none', outline: 'none', fontSize: '11px', textAlign: 'right', background: '#fff' }} />
                          </td>
                          <td style={{ border: '1px solid #e8e8e8', padding: '6px 10px' }}>
                            <label style={{ fontSize: '11px', color: '#333', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <input type="checkbox" checked={row.receiptAttached} onChange={(e) => handleUpdateRow(row.id, 'receiptAttached', e.target.checked)} /> Attached
                            </label>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '8px 10px', fontSize: '10px', fontWeight: '700', color: '#444' }}>
                          Total Amount Requested</td>
                        <td style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '0' }}>
                          <input type="text" placeholder="$0.00" value={`$${totalAmount.toFixed(2)}`} readOnly style={{ width: '100%', padding: '8px 10px', border: 'none', outline: 'none', fontSize: '11px', fontWeight: '700', textAlign: 'right', background: '#f5f5f5' }} />
                        </td>
                        <td style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '8px 10px', fontSize: '9px', color: '#888' }}>
                          Max $2,000 / $3,500</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ fontSize: '9.5px', color: '#888', marginTop: '4px', marginBottom: '12px' }}>Maximum $2,000 without dependents &middot; $3,500 with dependents &middot; All receipts must be attached</div>
                  
                  <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                    Upload All Receipts <span style={{ color: '#cc0000' }}>*</span></div>
                  <input type="file" accept="image/*,.pdf" multiple style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11px', color: '#555', background: '#fff' }} />
                  <div style={{ fontSize: '9px', color: '#b35900', marginTop: '3px', lineHeight: '1.4' }}>Upload all receipts for expenses listed above. PDF, JPG, PNG accepted. Receipts are mandatory &mdash; no receipts = no reimbursement.</div>
                  <div style={{ marginTop: '12px' }}></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {currentStep === 3 && (
        <div className="fade-in">
          <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '9px 14px', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444' }}>
                  C &mdash; Declaration</td>
              </tr>
              <tr>
                <td colSpan={4} style={{ padding: '14px 14px 2px' }}>
                  <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td colSpan={4} style={{ padding: '0 0 10px 0' }}>
                          <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '3px', padding: '12px 14px', fontSize: '10.5px', color: '#555', lineHeight: '1.7', marginBottom: '10px' }}>
                            I declare that the expenses incurred have been used for the purpose of traveling to and from my post-secondary institution. Any false information will result in the denial of reimbursement/paid travel expenses hence leaving the expenses up to the student's responsibility.</div>
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
                            Student Signature &mdash; Type Full Legal Name <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="Type your full legal name" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Date <span style={{ color: '#cc0000' }}>*</span></div><input type="text" placeholder="YYYY/MM/DD" style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#fff' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>&nbsp;</div><input type="text" disabled style={{ width: '100%', padding: '8px 9px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#f5f5f5' }} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ background: '#eeeeee', borderBottom: '1px solid #e0e0e0', padding: '9px 14px', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777' }}>
                  Office Use Only &mdash; DO NOT FILL</td>
              </tr>
              <tr>
                <td colSpan={4} style={{ padding: '14px 14px 2px' }}>
                  <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Date Received</div><input type="text" disabled style={{ width: '100%', padding: '8px 9px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#eeeeee' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Approved / Denied</div><select disabled style={{ width: '100%', padding: '8px 9px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#eeeeee' }}><option></option></select>
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>
                            Amount $</div><input type="text" disabled style={{ width: '100%', padding: '8px 9px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11.5px', color: '#333', background: '#eeeeee' }} />
                        </td>
                        <td style={{ padding: '0 8px 12px 0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#777', marginBottom: '4px' }}>&nbsp;</div>
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
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  )
};

export default FormE;
