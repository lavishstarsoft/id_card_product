'use client';

import { useEffect, useState } from 'react';

const initialForm = {
  fullName: '',
  fatherName: '',
  dateOfBirth: '',
  gender: '',
  email: '',
  mobile: '',
  emergencyContact: '',
  workLocation: '',
  area: '',
  bloodGroup: '',
  experienceYears: '',
  aadhaarNumber: '',
  address: '',
  purpose: ''
};

export default function EmployeeApplyPage() {
  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState({ profileImage: '', signatureImage: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [highlightedField, setHighlightedField] = useState('');
  const [branding, setBranding] = useState({
    logoUrl: '',
    applyTitle: 'Employee ID Card Application'
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        setBranding({
          logoUrl: data?.logoUrl || '',
          applyTitle: data?.applyTitle || 'Employee ID Card Application'
        });
      } catch {
        // keep defaults
      }
    };
    fetchBranding();
  }, []);

  const onInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (highlightedField === name) {
      setHighlightedField('');
    }
  };

  const focusAndHighlightField = (fieldName) => {
    if (!fieldName) return;
    setHighlightedField(fieldName);
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.focus();
    }
    setTimeout(() => setHighlightedField((prev) => (prev === fieldName ? '' : prev)), 2200);
  };

  const inferFieldFromError = (message) => {
    const text = String(message || '').toLowerCase();
    if (text.includes('full name')) return 'fullName';
    if (text.includes('father name')) return 'fatherName';
    if (text.includes('date of birth')) return 'dateOfBirth';
    if (text.includes('gender')) return 'gender';
    if (text.includes('email')) return 'email';
    if (text.includes('mobile')) return 'mobile';
    if (text.includes('emergency')) return 'emergencyContact';
    if (text.includes('work location')) return 'workLocation';
    if (text.includes('area')) return 'area';
    if (text.includes('blood')) return 'bloodGroup';
    if (text.includes('experience')) return 'experienceYears';
    if (text.includes('aadhaar')) return 'aadhaarNumber';
    if (text.includes('address')) return 'address';
    if (text.includes('purpose')) return 'purpose';
    return '';
  };

  const validateFormBeforeSubmit = () => {
    const requiredChecks = [
      { key: 'fullName', label: 'Full Name' },
      { key: 'mobile', label: 'Mobile Number' }
    ];
    for (const item of requiredChecks) {
      if (!String(formData[item.key] || '').trim()) {
        const message = `${item.label} is required`;
        setSubmitError(message);
        focusAndHighlightField(item.key);
        return false;
      }
    }
    return true;
  };

  const onImageUpload = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImages((prev) => ({ ...prev, [key]: String(event.target?.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateFormBeforeSubmit()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/id-card-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          profileImage: images.profileImage,
          signatureImage: images.signatureImage
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = data.error || 'Application submit failed';
        setSubmitError(errorMessage);
        focusAndHighlightField(inferFieldFromError(errorMessage));
        return;
      }

      setFormData(initialForm);
      setImages({ profileImage: '', signatureImage: '' });
      setShowSuccessPopup(true);
    } catch {
      setSubmitError('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="employee-apply-page">
      <div className="employee-apply-card">
        <div className="employee-apply-logo-wrap">
          {branding.logoUrl ? <img src={branding.logoUrl} alt="Brand Logo" className="employee-apply-logo" /> : null}
        </div>
        <h1>{branding.applyTitle || 'Employee ID Card Application'}</h1>

        <form onSubmit={onSubmit} className="employee-apply-form">
          {submitError ? <div className="apply-error-banner">{submitError}</div> : null}
          <div className="grid-2">
            <label className={highlightedField === 'fullName' ? 'field-highlight' : ''}>Full Name*
              <input name="fullName" value={formData.fullName} onChange={onInput} required />
            </label>
            <label className={highlightedField === 'fatherName' ? 'field-highlight' : ''}>Father Name
              <input name="fatherName" value={formData.fatherName} onChange={onInput} />
            </label>
            <label className={highlightedField === 'dateOfBirth' ? 'field-highlight' : ''}>Date of Birth
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={onInput} />
            </label>
            <label className={highlightedField === 'gender' ? 'field-highlight' : ''}>Gender
              <select name="gender" value={formData.gender} onChange={onInput}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className={highlightedField === 'email' ? 'field-highlight' : ''}>Email
              <input type="email" name="email" value={formData.email} onChange={onInput} />
            </label>
            <label className={highlightedField === 'mobile' ? 'field-highlight' : ''}>Mobile Number*
              <input name="mobile" value={formData.mobile} onChange={onInput} required />
            </label>
            <label className={highlightedField === 'emergencyContact' ? 'field-highlight' : ''}>Emergency Contact
              <input name="emergencyContact" value={formData.emergencyContact} onChange={onInput} />
            </label>
            <label className={highlightedField === 'workLocation' ? 'field-highlight' : ''}>Work Location
              <input name="workLocation" value={formData.workLocation} onChange={onInput} />
            </label>
            <label className={highlightedField === 'area' ? 'field-highlight' : ''}>Reporting Area
              <input name="area" value={formData.area} onChange={onInput} />
            </label>
            <label className={highlightedField === 'bloodGroup' ? 'field-highlight' : ''}>Blood Group
              <select name="bloodGroup" value={formData.bloodGroup} onChange={onInput}>
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>
            <label className={highlightedField === 'experienceYears' ? 'field-highlight' : ''}>Experience (Years)
              <input name="experienceYears" value={formData.experienceYears} onChange={onInput} />
            </label>
            <label className={highlightedField === 'aadhaarNumber' ? 'field-highlight' : ''}>Aadhaar Number
              <input name="aadhaarNumber" value={formData.aadhaarNumber} onChange={onInput} />
            </label>
          </div>

          <label className={highlightedField === 'address' ? 'field-highlight' : ''}>Current Address
            <textarea name="address" value={formData.address} onChange={onInput} rows={3} />
          </label>

          <label className={highlightedField === 'purpose' ? 'field-highlight' : ''}>Purpose / Notes
            <textarea name="purpose" value={formData.purpose} onChange={onInput} rows={3} />
          </label>

          <div className="grid-2">
            <label>Profile Photo
              <input type="file" accept="image/*" onChange={(e) => onImageUpload(e, 'profileImage')} />
            </label>
            <label>Signature Image
              <input type="file" accept="image/*" onChange={(e) => onImageUpload(e, 'signatureImage')} />
            </label>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>

      {showSuccessPopup && (
        <div className="apply-success-overlay" onClick={() => setShowSuccessPopup(false)}>
          <div className="apply-success-popup" onClick={(e) => e.stopPropagation()}>
            <div className="apply-success-icon">✓</div>
            <h3>Application Submitted</h3>
            <p>Your request is sent to admin successfully.</p>
            <button type="button" onClick={() => setShowSuccessPopup(false)}>OK</button>
          </div>
        </div>
      )}
    </main>
  );
}
