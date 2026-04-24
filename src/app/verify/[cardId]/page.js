import dbConnect from '@/lib/mongodb';
import Journalist from '@/lib/Journalist';
import { signCardPayload, safeSignatureMatch } from '@/lib/cardSecurity';
import { getDisplayImageUrl } from '@/lib/r2Upload';
import Image from 'next/image';

function getStatusMessage(record, signatureValid) {
  if (!record) return { kind: 'invalid', title: 'Invalid Card', note: 'Card record not found in official database.' };
  if (!signatureValid) return { kind: 'invalid', title: 'Invalid Card', note: 'Security signature mismatch. Possible tampering detected.' };
  if (record.status === 'revoked') return { kind: 'revoked', title: 'Revoked Card', note: 'This card is revoked and no longer valid.' };

  const isExpired = record.validUntil && new Date(record.validUntil) < new Date();
  if (isExpired) return { kind: 'expired', title: 'Expired Card', note: 'Card validity period has ended.' };

  return { kind: 'valid', title: 'Valid Card', note: 'This card is active and verified by RK Vision.' };
}

function formatDate(value) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not specified';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function VerifyCardPage({ params, searchParams }) {
  await dbConnect();
  const { cardId } = await params;
  const { sig } = await searchParams;

  const record = await Journalist.findOne({ cardId }).lean();
  const profileImage = await getDisplayImageUrl(record?.profileImage);
  const signatureImage = await getDisplayImageUrl(record?.signatureImage);
  const expectedSignature = record?.pressId ? signCardPayload(cardId, record.pressId) : '';
  const signatureValid = record?.qrSignature
    ? safeSignatureMatch(sig, record.qrSignature) && safeSignatureMatch(record.qrSignature, expectedSignature)
    : false;
  const status = getStatusMessage(record, signatureValid);

  return (
    <main className="verify-page">
      <div className="verify-phone-shell">
        <div className={`verify-card verify-${status.kind}`}>
          <div className="verify-appbar">
            <span className="verify-appbar-title">Card Verification</span>
            <span className={`verify-badge badge-${status.kind}`}>
              {status.kind.toUpperCase()}
            </span>
          </div>

          <div className="verify-header-card">
            <div className="verify-header-top">
              <div className="verify-logo-wrap">
                <Image
                  src="/logo.jpg"
                  alt="RK Vision Logo"
                  width={170}
                  height={70}
                  className="verify-logo"
                  priority
                />
              </div>
              <div className={`verify-status-icon ${status.kind === 'valid' ? 'status-good' : 'status-bad'}`}>
                <span>{status.kind === 'valid' ? '✓' : '✕'}</span>
              </div>
            </div>
            <div>
              <h1>{status.title}</h1>
              <p>{status.note}</p>
            </div>
          </div>

          {record && status.kind === 'valid' && (
            <>
              <div className="verify-meta-grid">
                <div className="verify-meta-item">
                  <span>Card ID</span>
                  <strong>{record.cardId?.slice(0, 12) || 'N/A'}</strong>
                </div>
                <div className="verify-meta-item">
                  <span>Checked On</span>
                  <strong>{formatDate(new Date())}</strong>
                </div>
              </div>

              <div className="verify-card-layout">
                <div className="verify-photo-wrap">
                  {profileImage ? (
                    <img src={profileImage} alt={record.name} className="verify-photo" />
                  ) : (
                    <div className="verify-photo-fallback">No Photo</div>
                  )}
                </div>

                <div className="verify-details">
                  <div className="verify-row"><span>Name</span><strong>{record.name}</strong></div>
                  <div className="verify-row"><span>Designation</span><strong>{record.designation}</strong></div>
                  <div className="verify-row"><span>Press ID</span><strong>{record.pressId}</strong></div>
                  <div className="verify-row"><span>Blood Group</span><strong>{record.bloodGroup || 'Not specified'}</strong></div>
                  <div className="verify-row"><span>Area</span><strong>{record.area || 'Not specified'}</strong></div>
                  <div className="verify-row"><span>Status</span><strong>{record.status}</strong></div>
                  <div className="verify-row"><span>Valid Up To</span><strong>{formatDate(record.validUntil)}</strong></div>
                </div>
              </div>

              {signatureImage && (
                <div className="verify-footer-note">
                  <strong>Authorized Signature</strong>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                    <img
                      src={signatureImage}
                      alt="Authorized Signature"
                      style={{ maxHeight: 40, width: 140, objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

              <div className="verify-footer-note">
                This is a digitally verified card. Only this page status should be treated as final proof.
              </div>
            </>
          )}

          {status.kind !== 'valid' && (
            <div className="verify-footer-note">
              User details are hidden for invalid, revoked, expired, or tampered cards.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
