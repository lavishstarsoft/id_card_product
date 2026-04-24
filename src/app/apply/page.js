'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState({ profileImage: '', signatureImage: '' });
  const [submitting, setSubmitting] = useState(false);
  const [branding, setBranding] = useState({
    logoUrl: '/logo.jpg',
    applyTitle: 'Employee ID Card Application'
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        setBranding({
          logoUrl: data?.logoUrl || '/logo.jpg',
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
        alert(data.error || 'Application submit failed');
        return;
      }

      alert('Application submitted successfully. Admin will review and generate your ID card.');
      setFormData(initialForm);
      setImages({ profileImage: '', signatureImage: '' });
      router.push('/login');
    } catch {
      alert('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="employee-apply-page">
      <div className="employee-apply-card">
        <div className="employee-apply-logo-wrap">
          <img src={branding.logoUrl || '/logo.jpg'} alt="Brand Logo" className="employee-apply-logo" />
        </div>
        <h1>{branding.applyTitle || 'Employee ID Card Application'}</h1>

        <form onSubmit={onSubmit} className="employee-apply-form">
          <div className="grid-2">
            <label>Full Name*
              <input name="fullName" value={formData.fullName} onChange={onInput} required />
            </label>
            <label>Father Name
              <input name="fatherName" value={formData.fatherName} onChange={onInput} />
            </label>
            <label>Date of Birth
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={onInput} />
            </label>
            <label>Gender
              <select name="gender" value={formData.gender} onChange={onInput}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Email
              <input type="email" name="email" value={formData.email} onChange={onInput} />
            </label>
            <label>Mobile Number*
              <input name="mobile" value={formData.mobile} onChange={onInput} required />
            </label>
            <label>Emergency Contact
              <input name="emergencyContact" value={formData.emergencyContact} onChange={onInput} />
            </label>
            <label>Work Location
              <input name="workLocation" value={formData.workLocation} onChange={onInput} />
            </label>
            <label>Reporting Area
              <input name="area" value={formData.area} onChange={onInput} />
            </label>
            <label>Blood Group
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
            <label>Experience (Years)
              <input name="experienceYears" value={formData.experienceYears} onChange={onInput} />
            </label>
            <label>Aadhaar Number
              <input name="aadhaarNumber" value={formData.aadhaarNumber} onChange={onInput} />
            </label>
          </div>

          <label>Current Address
            <textarea name="address" value={formData.address} onChange={onInput} rows={3} />
          </label>

          <label>Purpose / Notes
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
    </main>
  );
}
