'use client';

import React, { useState, useRef, useEffect } from 'react';
import IdCard from '@/components/IdCard';
import { toPng } from 'html-to-image';
import { Download, Image as ImageIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

function toProxyUrl(url) {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

async function toDataUrlFromRemote(url) {
  const response = await fetch(toProxyUrl(url), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch remote image via proxy');
  }
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
    reader.readAsDataURL(blob);
  });
}

export default function GeneratePage() {
  const idCardRef = useRef(null);
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [initialDraft] = useState(() => {
    if (typeof window === 'undefined') return null;
    const editData = sessionStorage.getItem('editJournalist');
    if (!editData) return null;
    try {
      return JSON.parse(editData);
    } catch {
      return null;
    }
  });
  const [adminPassword, setAdminPassword] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('editJournalistAdminPassword') || '';
  });
  const [requestId] = useState(() => initialDraft?._requestId || '');

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };
  
  // Form State
  const [formData, setFormData] = useState(() => ({
    _id: initialDraft?._id || '',
    name: initialDraft?.name || '',
    designation: initialDraft?.designation || '',
    pressId: initialDraft?.pressId || '',
    verifyUrl: initialDraft?.verifyUrl || '',
    mobile: initialDraft?.mobile || '',
    area: initialDraft?.area || '',
    bloodGroup: initialDraft?.bloodGroup || '',
    validUntil: initialDraft?.validUntil || ''
  }));

  // Image State
  const [images, setImages] = useState(() => ({
    profile: initialDraft?.profileImage || null,
    signature: initialDraft?.signatureImage || null
  }));
  const [layout, setLayout] = useState(() => initialDraft?.layout || {});

  // Handle Edit from Dashboard
  useEffect(() => {
    const fetchNextPressId = async () => {
      try {
        const res = await fetch('/api/journalists?nextPressId=true');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.pressId) {
          setFormData(prev => ({ ...prev, pressId: data.pressId }));
        }
        if (data?.lastSavedLayout && Object.keys(data.lastSavedLayout).length > 0) {
          setLayout(data.lastSavedLayout);
        }
      } catch (error) {
        console.error('Failed to fetch next Press ID:', error);
      }
    };

    if (initialDraft) {
      sessionStorage.removeItem('editJournalist');
    } else {
      fetchNextPressId();
    }
  }, [initialDraft]);

  useEffect(() => {
    let cancelled = false;

    const hydrateEditImages = async () => {
      const remoteProfile = initialDraft?.profileImage;
      const remoteSignature = initialDraft?.signatureImage;

      const tasks = [];
      if (remoteProfile && /^https?:\/\//i.test(remoteProfile)) {
        tasks.push(
          toDataUrlFromRemote(remoteProfile)
            .then((dataUrl) => ({ key: 'profile', value: dataUrl }))
            .catch(() => ({ key: 'profile', value: remoteProfile }))
        );
      }

      if (remoteSignature && /^https?:\/\//i.test(remoteSignature)) {
        tasks.push(
          toDataUrlFromRemote(remoteSignature)
            .then((dataUrl) => ({ key: 'signature', value: dataUrl }))
            .catch(() => ({ key: 'signature', value: remoteSignature }))
        );
      }

      if (tasks.length === 0) return;
      const results = await Promise.all(tasks);
      if (cancelled) return;

      setImages((prev) => {
        const next = { ...prev };
        for (const item of results) {
          next[item.key] = item.value;
        }
        return next;
      });
    };

    hydrateEditImages();
    return () => {
      cancelled = true;
    };
  }, [initialDraft]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => ({
          ...prev,
          [type]: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLayoutChange = (elementKey, transform) => {
    setLayout((prev) => {
      const current = prev[elementKey];
      if (
        current &&
        current.x === transform.x &&
        current.y === transform.y &&
        current.width === transform.width &&
        current.height === transform.height
      ) {
        return prev;
      }

      return {
        ...prev,
        [elementKey]: transform
      };
    });
  };

  const exportAsImage = async () => {
    if (!idCardRef.current) return;
    
    try {
      setIsExporting(true);
      
      // Wait a moment for any fonts or images to fully render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(idCardRef.current, { 
        quality: 1.0,
        pixelRatio: 2 // Higher resolution for print
      });
      
      const link = document.createElement('a');
      link.download = `ID_Card_${formData.name || 'RK_Vision'}.png`;
      link.href = dataUrl;
      link.click();

      // Auto-save to Database
      try {
        const response = await fetch('/api/journalists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            adminPassword,
            profileImage: images.profile,
            signatureImage: images.signature,
            layout
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result?.data?._id || result?.data?.pressId) {
            setFormData(prev => ({
              ...prev,
              _id: result.data._id || prev._id,
              pressId: result.data.pressId || prev.pressId,
              verifyUrl: result.data.verifyUrl || prev.verifyUrl
            }));
          }
          if (result?.data?.layout) {
            setLayout(result.data.layout);
          }
          if (formData._id) {
            setAdminPassword('');
            sessionStorage.removeItem('editJournalistAdminPassword');
          }
          if (requestId) {
            await fetch(`/api/id-card-requests/${requestId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'approved',
                approvedJournalistId: result?.data?._id || ''
              })
            });
          }
          console.log('Journalist details saved to DB successfully');
          alert('ID Card Downloaded and Details Saved Successfully!');
          router.push('/dashboard');
        } else {
          const errorData = await response.json();
          console.error('Failed to save to DB:', errorData.error, 'Details:', errorData.details);
          alert('Failed to save to Database: ' + (errorData.details || 'Unknown Error'));
        }
      } catch (saveError) {
        console.error('Failed to auto-save:', saveError);
      }

    } catch (err) {
      console.error('Error exporting image:', err);
      alert('Failed to export ID Card. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h1>RK Vision ID Generator</h1>
            <p>Fill the details to dynamically generate your press ID card</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => router.push('/dashboard')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                background: '#2563eb', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button 
              onClick={handleLogout}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                background: '#ef4444', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Form Section */}
        <div className="form-section">

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              className="form-control" 
              placeholder="e.g. VENKAT RAO"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="designation">Designation</label>
            <input 
              type="text" 
              id="designation" 
              name="designation" 
              className="form-control" 
              placeholder="e.g. REPORTER"
              value={formData.designation}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pressId">Press ID</label>
            <input 
              type="text" 
              id="pressId" 
              name="pressId" 
              className="form-control" 
              placeholder="Auto generated"
              value={formData.pressId}
              readOnly
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="mobile">Mobile Number</label>
              <input 
                type="text" 
                id="mobile" 
                name="mobile" 
                className="form-control" 
                placeholder="e.g. 9876543210"
                value={formData.mobile}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="area">Area</label>
              <input 
                type="text" 
                id="area" 
                name="area" 
                className="form-control" 
                placeholder="e.g. Hyderabad"
                value={formData.area}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="validUntil">Valid Up To</label>
            <input 
              type="date" 
              id="validUntil" 
              name="validUntil" 
              className="form-control" 
              value={formData.validUntil}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bloodGroup">Blood Group</label>
            <select
              id="bloodGroup"
              name="bloodGroup"
              className="form-control"
              value={formData.bloodGroup}
              onChange={handleInputChange}
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Profile Picture</label>
              <div className="file-input-wrapper">
                <label className="file-label">
                  <ImageIcon size={18} /> Select Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="file-input" 
                    onChange={(e) => handleImageUpload(e, 'profile')}
                  />
                </label>
                {images.profile && <span className="upload-success">✓ Photo Loaded</span>}
              </div>
            </div>

            <div className="form-group flex-1">
              <label>CEO Signature</label>
              <div className="file-input-wrapper">
                <label className="file-label">
                  <ImageIcon size={18} /> Select Signature
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="file-input" 
                    onChange={(e) => handleImageUpload(e, 'signature')}
                  />
                </label>
                {images.signature && <span className="upload-success">✓ Signature Loaded</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="preview-section">
          <IdCard 
            ref={idCardRef}
            name={formData.name}
            designation={formData.designation}
            pressId={formData.pressId}
            qrValue={formData.verifyUrl}
            mobile={formData.mobile}
            area={formData.area}
            bloodGroup={formData.bloodGroup}
            validUntil={formData.validUntil}
            templateImage="/template.png"
            profileImage={images.profile}
            signatureImage={images.signature}
            layout={layout}
            onLayoutChange={handleLayoutChange}
          />

          <button 
            className="btn btn-primary" 
            onClick={exportAsImage}
            disabled={isExporting}
            style={{ 
              opacity: isExporting ? 0.7 : 1, 
              cursor: isExporting ? 'not-allowed' : 'pointer'
            }}
          >
            <Download size={20} />
            {isExporting ? 'Generating...' : 'Download ID Card'}
          </button>
        </div>
      </div>
    </div>
  );
}
