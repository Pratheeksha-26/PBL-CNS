
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Loader, Alert } from '../components/UI';
import { CryptoStepsList } from '../components/CryptoInfo';

import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const RESULT_STYLES = {
  VALID: {
    icon: '✅',
    title: 'VERIFIED CERTIFICATE',
    box: 'bg-emerald-50 border-emerald-300',
    heading: 'text-emerald-800',
    text: 'text-emerald-700',
  },
  TAMPERED: {
    icon: '⚠️',
    title: 'TAMPERED — DATA ALTERED',
    box: 'bg-red-50 border-red-300',
    heading: 'text-red-800',
    text: 'text-red-700',
  },
  INVALID: {
    icon: '❌',
    title: 'INVALID SIGNATURE',
    box: 'bg-red-50 border-red-300',
    heading: 'text-red-800',
    text: 'text-red-700',
  },
  REVOKED: {
    icon: '⛔',
    title: 'REVOKED',
    box: 'bg-amber-50 border-amber-300',
    heading: 'text-amber-800',
    text: 'text-amber-700',
  },
  NOT_FOUND: {
    icon: '❓',
    title: 'CERTIFICATE NOT FOUND',
    box: 'bg-slate-50 border-slate-300',
    heading: 'text-slate-800',
    text: 'text-slate-700',
  },
};

export default function VerifyPage() {
  const { certificateId: paramId } = useParams();
  const navigate = useNavigate();

  const [certificateId, setCertificateId] = useState(paramId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const [scanning, setScanning] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileMessage, setFileMessage] = useState('');

  const scannerRef = useRef(null);
  const lastVerifiedId = useRef('');

  // Extract certificate ID from plain text or verification URL
  const extractCertificateId = (value) => {
    const text = String(value || '').trim();

    if (!text) return '';

    try {
      const url = new URL(text);

      const pathMatch = url.pathname.match(
        /\/verify\/([^/?#]+)/
      );

      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }

      const queryId =
        url.searchParams.get('certificateId') ||
        url.searchParams.get('id');

      if (queryId) return queryId;
    } catch {
      // QR may contain only the certificate ID.
    }

    return text;
  };

  // Verify certificate using existing backend API
  const runVerification = async (id) => {
    const cleanId = extractCertificateId(id);

    if (!cleanId) {
      setError('Please provide a valid Certificate ID.');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);
    setCertificateId(cleanId);
    lastVerifiedId.current = cleanId;

    try {
      const res = await api.get(
        `/verify/${encodeURIComponent(cleanId)}`
      );

      setData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Verification request failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Automatically verify when a certificate ID is present in the URL
  useEffect(() => {
    const id = extractCertificateId(paramId);

    setCertificateId(id);

    if (id && id !== lastVerifiedId.current) {
      runVerification(id);
    }

    if (!id) {
      lastVerifiedId.current = '';
      setData(null);
      setError('');
    }
  }, [paramId]);

  // Manual ID submission
  const submit = (e) => {
    e.preventDefault();

    const id = extractCertificateId(certificateId);

    if (!id) return;

    if (id !== paramId) {
      lastVerifiedId.current = '';
      navigate(`/verify/${encodeURIComponent(id)}`);
    } else {
      runVerification(id);
    }
  };

  // Camera QR scanner
  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;
    let scanner = null;
    let qrHandled = false;
    let started = false;
    let stopPromise = null;
    let cleared = false;

    const clearScanner = () => {
      if (cleared || !scanner) return;

      cleared = true;

      try {
        scanner.clear();
      } catch {
        // Already cleared.
      }

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    };

    const stopScanner = () => {
      if (!started || !scanner) return Promise.resolve();
      if (stopPromise) return stopPromise;

      stopPromise = (async () => {
        try {
          await scanner.stop();
        } catch {
          // Scanner may already be stopped.
        } finally {
          clearScanner();
        }
      })();

      return stopPromise;
    };

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode('verify-qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },

          async (decodedText) => {
            if (cancelled || qrHandled) return;

            qrHandled = true;

            const id = extractCertificateId(decodedText);

            // Stop camera after detecting QR
            setScanning(false);
            await stopScanner();

            if (id) {
              setCertificateId(id);

              // IMPORTANT:
              // Verify directly without navigating to a new page.
              await runVerification(id);
            } else {
              setError('No valid Certificate ID found in QR code.');
            }
          },

          () => {
            // Ignore normal frames without a QR code.
          }
        );

        started = true;

        if (cancelled) {
          await stopScanner();
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            'Unable to access camera. Allow camera permission or upload a QR image instead.'
          );

          setScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanning, navigate]);

  // Decode uploaded QR image
  const decodeImageQR = async (file) => {
    const bitmap = await createImageBitmap(file);

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);

    bitmap.close();

    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const result = jsQR(
      imageData.data,
      imageData.width,
      imageData.height
    );

    if (!result) {
      throw new Error('No QR code found in this image.');
    }

    return result.data;
  };

  // Extract Certificate ID or QR from PDF
  const decodePDF = async (file) => {
    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
    }).promise;

    let extractedText = '';

    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();

      extractedText += content.items
        .map((item) => item.str)
        .join(' ') + ' ';
    }

    // First look for a certificate ID in PDF text
    const idMatch = extractedText.match(
      /\bCERT-[A-Z0-9-]+\b/i
    );

    if (idMatch) {
      return idMatch[0];
    }

    // Otherwise scan PDF pages for QR codes
    const maxPages = Math.min(pdf.numPages, 10);

    for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement('canvas');

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d');

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const qr = jsQR(
        imageData.data,
        imageData.width,
        imageData.height
      );

      if (qr) {
        return qr.data;
      }
    }

    throw new Error(
      'Could not find a Certificate ID or QR code in this PDF.'
    );
  };

  // Handle QR image and PDF uploads
  const handleFile = async (event, type) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError('');
    setData(null);
    setFileMessage('');
    setFileLoading(true);

    try {
      let extracted;

      if (type === 'image') {
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select an image file.');
        }

        extracted = await decodeImageQR(file);
      } else {
        if (
          file.type !== 'application/pdf' &&
          !file.name.toLowerCase().endsWith('.pdf')
        ) {
          throw new Error('Please select a PDF certificate.');
        }

        extracted = await decodePDF(file);
      }

      const id = extractCertificateId(extracted);

      if (!id) {
        throw new Error('Could not extract a Certificate ID.');
      }

      setFileMessage(`Certificate ID detected: ${id}`);

      lastVerifiedId.current = '';
      navigate(`/verify/${encodeURIComponent(id)}`);
    } catch (err) {
      setError(
        err.message || 'Unable to process the uploaded file.'
      );
    } finally {
      setFileLoading(false);
      event.target.value = '';
    }
  };

  const style = data
    ? RESULT_STYLES[data.result] || RESULT_STYLES.NOT_FOUND
    : null;

  return (
    <div className="max-w-2xl mx-auto">

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Certificate Verification
        </h1>

        <p className="text-slate-500 text-sm mt-1">
          Verify a sports certificate using its ID, QR code, or PDF.
          Only public certificate details are shown.
        </p>
      </div>

      {/* Method 1: Manual Certificate ID */}
      <div className="card mb-5">
        <h2 className="font-semibold text-slate-900 mb-3">
          1. Verify using Certificate ID
        </h2>

        <form onSubmit={submit} className="flex gap-2">
          <input
            className="input min-w-0"
            placeholder="e.g. CERT-2026-DEMO001"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            required
          />

          <button
            className="btn-primary whitespace-nowrap"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>

      {/* Method 2: Camera QR scanner */}
      <div className="card mb-5">
        <h2 className="font-semibold text-slate-900 mb-2">
          2. Scan QR Code using Camera
        </h2>

        <p className="text-sm text-slate-500 mb-4">
          Display the certificate QR code on your mobile phone
          and scan it using your laptop camera.
        </p>

        {!scanning ? (
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              setError('');
              setScanning(true);
            }}
            disabled={loading}
          >
            📷 Start Camera Scanner
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary w-full mb-3"
            onClick={() => setScanning(false)}
          >
            Stop Camera
          </button>
        )}

        {scanning && (
          <div
            id="verify-qr-reader"
            className="w-full overflow-hidden rounded-lg"
          />
        )}
      </div>

      {/* Method 3: QR image upload */}
      <div className="card mb-5">
        <h2 className="font-semibold text-slate-900 mb-2">
          3. Upload QR Code Image
        </h2>

        <p className="text-sm text-slate-500 mb-3">
          Upload a screenshot or image containing the certificate QR code.
        </p>

        <input
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) => handleFile(e, 'image')}
          disabled={fileLoading || loading}
        />
      </div>

      {/* Method 4: PDF upload */}
      <div className="card mb-5">
        <h2 className="font-semibold text-slate-900 mb-2">
          4. Upload Certificate PDF
        </h2>

        <p className="text-sm text-slate-500 mb-3">
          Upload a certificate PDF. The system will look for
          its Certificate ID or QR code and verify the official record.
        </p>

        <input
          type="file"
          accept=".pdf,application/pdf"
          className="input"
          onChange={(e) => handleFile(e, 'pdf')}
          disabled={fileLoading || loading}
        />
      </div>

      {fileLoading && (
        <Loader label="Reading uploaded certificate..." />
      )}

      {fileMessage && (
        <div className="mb-4">
          <Alert type="success">{fileMessage}</Alert>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {loading && (
        <Loader label="Retrieving certificate and verifying cryptographic signature..." />
      )}

      {/* Verification result */}
      {data && style && (
        <div className="space-y-5">

          <div className={`rounded-xl border-2 p-5 text-center ${style.box}`}>
            <div className="text-4xl">{style.icon}</div>

            <div className={`mt-2 text-xl font-extrabold tracking-wide ${style.heading}`}>
              {style.title}
            </div>

            <p className={`mt-1 text-sm ${style.text}`}>
              {data.message}
            </p>
          </div>

          {data.certificate && (
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-3">
                Verified Certificate Details
              </h3>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">

                <dt className="text-slate-500">Certificate ID</dt>
                <dd className="font-mono text-slate-900 break-all">
                  {data.certificate.certificateId}
                </dd>

                <dt className="text-slate-500">Athlete Name</dt>
                <dd className="text-slate-900 font-semibold">
                  {data.certificate.athleteName}
                </dd>

                <dt className="text-slate-500">Event</dt>
                <dd className="text-slate-900">
                  {data.certificate.eventName}
                </dd>

                <dt className="text-slate-500">Sport</dt>
                <dd className="text-slate-900">
                  {data.certificate.sportName}
                </dd>

                <dt className="text-slate-500">Position</dt>
                <dd className="text-slate-900 font-semibold">
                  {data.certificate.position || 'Not specified'}
                </dd>

                <dt className="text-slate-500">Achievement</dt>
                <dd className="text-slate-900">
                  {data.certificate.achievement}
                </dd>

                <dt className="text-slate-500">Event Date</dt>
                <dd className="text-slate-900">
                  {data.certificate.eventDate}
                </dd>

                <dt className="text-slate-500">Issuing Authority</dt>
                <dd className="text-slate-900">
                  {data.certificate.issuingAuthority}
                </dd>

                <dt className="text-slate-500">Organizer</dt>
                <dd className="text-slate-900">
                  {data.certificate.organizerName || 'Unknown organizer'}
                </dd>

                <dt className="text-slate-500">Status</dt>
                <dd className="text-slate-900">
                  {data.certificate.status}
                </dd>

              </dl>
            </div>
          )}

          {data.verification && (
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-3">
                🔐 Cryptographic Verification Trace
              </h3>

              <CryptoStepsList
                steps={[
                  'Retrieved stored certificate record by Certificate ID',
                  'Reconstructed canonical certificate data from stored fields',
                  `Recomputed SHA-256 hash: ${data.verification.recomputedHash}`,
                  `Stored SHA-256 hash: ${data.verification.storedHash}`,
                  `Hash match: ${data.verification.hashMatches ? 'YES — data integrity intact' : 'NO — data has been altered'}`,
                  `RSA-SHA256 signature verified with public key (fingerprint ${data.verification.publicKeyFingerprint}): ${
                    data.verification.signatureValid ? 'VALID' : 'INVALID'
                  }`,
                  `Final verdict: ${data.result}`,
                ]}
              />
            </div>
          )}

        </div>
      )}
    </div>
  );
}