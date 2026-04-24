'use client';

import React, { forwardRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import DraggableElement from './DraggableElement';

const IdCard = forwardRef(({ 
  name, 
  designation, 
  pressId, 
  qrValue,
  mobile, 
  area,
  bloodGroup,
  profileImage, 
  signatureImage,
  templateImage,
  validUntil,
  layout = {},
  onLayoutChange,
}, ref) => {
  const handleTransformChange = useCallback((key, transform) => {
    if (!onLayoutChange) return;
    onLayoutChange(key, transform);
  }, [onLayoutChange]);

  return (
    <div className="id-card-wrapper">
      <div className="id-card-content" ref={ref}>
        {/* Template Background */}
        {templateImage ? (
          <img src={templateImage} alt="ID Card Template" className="template-image" />
        ) : (
          <div className="template-image" style={{ backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
              Template not found
            </p>
          </div>
        )}

        {/* Profile Picture - Photoshop style resize */}
        {profileImage && (
          <DraggableElement
            key="profilePicture"
            className="overlay-element profile-picture"
            resizable={true}
            initialWidth={layout?.profilePicture?.width ?? 126}
            initialHeight={layout?.profilePicture?.height ?? 153}
            initialPosition={layout?.profilePicture || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('profilePicture', transform)}
          >
            <img 
              src={profileImage} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
              draggable="false"
            />
          </DraggableElement>
        )}

        {/* Text Fields - draggable only */}
        {name && (
          <DraggableElement
            key="name"
            className="overlay-element text-field field-name"
            initialPosition={layout?.name || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('name', transform)}
          >
            {name}
          </DraggableElement>
        )}
        {designation && (
          <DraggableElement
            key="designation"
            className="overlay-element text-field field-designation"
            initialPosition={layout?.designation || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('designation', transform)}
          >
            {designation}
          </DraggableElement>
        )}
        {pressId && (
          <DraggableElement
            key="pressId"
            className="overlay-element text-field field-pressid"
            initialPosition={layout?.pressId || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('pressId', transform)}
          >
            {pressId}
          </DraggableElement>
        )}
        {mobile && (
          <DraggableElement
            key="mobile"
            className="overlay-element text-field field-mobile"
            initialPosition={layout?.mobile || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('mobile', transform)}
          >
            {mobile}
          </DraggableElement>
        )}
        {area && (
          <DraggableElement
            key="area"
            className="overlay-element text-field field-area"
            initialPosition={layout?.area || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('area', transform)}
          >
            {area}
          </DraggableElement>
        )}
        {bloodGroup && (
          <DraggableElement
            key="bloodGroup"
            className="overlay-element text-field field-bloodgroup"
            initialPosition={layout?.bloodGroup || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('bloodGroup', transform)}
          >
            {bloodGroup}
          </DraggableElement>
        )}
        {validUntil && (
          <DraggableElement
            key="validUntil"
            className="overlay-element text-field field-valid"
            initialPosition={layout?.validUntil || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('validUntil', transform)}
          >
            Valid: {new Date(validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </DraggableElement>
        )}

        {/* QR Code - Photoshop style resize */}
        {pressId && (
          <DraggableElement
            key="qrCode"
            className="overlay-element qr-code-wrapper"
            resizable={true}
            initialWidth={layout?.qrCode?.width ?? 105}
            initialHeight={layout?.qrCode?.height ?? 105}
            initialPosition={layout?.qrCode || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('qrCode', transform)}
          >
            <QRCodeSVG value={qrValue || pressId} size={95} level="H" style={{ width: '100%', height: '100%' }} />
          </DraggableElement>
        )}

        {/* Signature - Photoshop style resize */}
        {signatureImage && (
          <DraggableElement
            key="signatureImage"
            className="overlay-element signature-image"
            resizable={true}
            initialWidth={layout?.signatureImage?.width ?? 120}
            initialHeight={layout?.signatureImage?.height ?? 35}
            initialPosition={layout?.signatureImage || { x: 0, y: 0 }}
            onTransformChange={(transform) => handleTransformChange('signatureImage', transform)}
          >
            <img 
              src={signatureImage} 
              alt="CEO Signature" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              draggable="false"
            />
          </DraggableElement>
        )}
      </div>
    </div>
  );
});

IdCard.displayName = 'IdCard';

export default IdCard;
