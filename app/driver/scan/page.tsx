// app/driver/scan/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');
  
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passengerInfo, setPassengerInfo] = useState<any>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('driver_token');
    if (!token) {
      router.push('/driver/login');
      return;
    }

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (processing) return;
    
    setScanResult(decodedText);
    setProcessing(true);
    
    try {
      // Parse QR code data
      let qrData = null;
      let bookingRef = decodedText;
      let seatNumber = null;
      
      try {
        qrData = JSON.parse(decodedText);
        console.log('📱 QR Data:', qrData);
        bookingRef = qrData.ref || qrData.bookingReference || qrData.booking_ref || decodedText;
        seatNumber = qrData.seat || qrData.seatNumber;
      } catch (e) {
        // Not JSON, use as is
        console.log('📱 QR Code (plain text):', decodedText);
      }

      // Process boarding
      const token = localStorage.getItem('driver_token');
      const response = await fetch('/api/driver/boarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingRef,
          seatNumber, // This will be undefined if not in QR
          method: 'qr_scan'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPassengerInfo(data);
        
        // Create appropriate success message
        let successText = '';
        if (data.boardedCount === 1) {
          successText = `✅ ${data.passengers[0].name} boarded successfully!`;
        } else {
          successText = `✅ ${data.boardedCount} passengers boarded successfully!`;
        }
        
        setMessage({
          type: 'success',
          text: successText
        });
        
        // If there are more passengers in this booking, show a note
        if (data.totalInBooking > data.boardedCount) {
          setMessage({
            type: 'success',
            text: `${successText}\n${data.totalInBooking - data.boardedCount} more passenger(s) in this booking.`
          });
        }
        
        // Play success sound if available
          playSuccessSound();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to process boarding'
        });
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      setMessage({
        type: 'error',
        text: 'Error processing QR code'
      });
    } finally {
      setProcessing(false);
    }
  };

  const onScanError = (error: string) => {
    // Ignore most errors
    if (!error.includes('NotFound')) {
      console.warn('Scan error:', error);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setMessage(null);
    setPassengerInfo(null);
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Ignore audio errors
  }
};

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E6F7F6, white, #E8F3EC)' }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderBottom: '4px solid #2BB2A9',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link 
              href={routeId ? `/driver/trip/${routeId}` : '/driver/dashboard'}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#2BB2A9',
                textDecoration: 'none'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>←</span>
              <span>Back to Trip</span>
            </Link>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
              Scan Passenger Ticket
            </h1>
            <div style={{ width: '80px' }}></div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '2px solid #E6F7F6',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {/* Zambian flag indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#D1E8DA',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>🇿🇲</span>
            <span style={{ color: '#BD6200', fontWeight: '500', fontSize: '0.875rem' }}>QR Boarding</span>
          </div>

          {/* Scanner Container */}
          <div id="qr-reader" style={{ width: '100%', marginBottom: '1rem' }}></div>

          {/* Success Message with Passenger Details */}
         {/* Success Message with Passenger Details */}
{message && message.type === 'success' && passengerInfo && (
  <div style={{
    marginTop: '1rem',
    padding: '1.5rem',
    background: '#E6F7F6',
    borderRadius: '0.75rem',
    border: '2px solid #2BB2A9'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
      <div style={{
        width: '3rem',
        height: '3rem',
        background: '#2BB2A9',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        ✓
      </div>
      <div>
        <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2BB2A9' }}>{message.text}</p>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>Boarded at {formatTime()}</p>
      </div>
    </div>
    
    {/* Show passenger details if available */}
    {passengerInfo.passengers && passengerInfo.passengers.length > 0 && (
      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginTop: '0.5rem'
      }}>
        {passengerInfo.passengers.map((p: any, index: number) => (
          <div key={index} style={{ 
            marginBottom: index < passengerInfo.passengers.length - 1 ? '0.75rem' : 0,
            paddingBottom: index < passengerInfo.passengers.length - 1 ? '0.75rem' : 0,
            borderBottom: index < passengerInfo.passengers.length - 1 ? '1px solid #e5e7eb' : 'none'
          }}>
            <p style={{ fontWeight: '600', color: '#1f2937' }}>
              {p.name}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              Seat: <span style={{ fontWeight: '600', color: '#2BB2A9' }}>{p.seat || 'Not assigned'}</span>
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
)}

          {/* Error Message */}
          {message && message.type === 'error' && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#E6F5F4',
              borderRadius: '0.5rem',
              border: '1px solid #1A8A82',
              color: '#1A8A82',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>❌</span>
              <span>{message.text}</span>
            </div>
          )}

          {/* Processing Indicator */}
          {processing && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#E8F3EC',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <div style={{ 
                width: '1.25rem', 
                height: '1.25rem', 
                border: '2px solid #659E85',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{ color: '#659E85' }}>Processing...</span>
            </div>
          )}

          {/* Scanned Data Preview */}
          {scanResult && !message && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#E6F7F6',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              wordBreak: 'break-all'
            }}>
              <p style={{ fontWeight: '600', color: '#2BB2A9', marginBottom: '0.25rem' }}>Raw Scan Data:</p>
              <p style={{ color: '#666' }}>{scanResult}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={resetScanner}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#E6F7F6',
                color: '#2BB2A9',
                border: '2px solid #2BB2A9',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2BB2A9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#E6F7F6'}
            >
              Scan Another
            </button>
            {routeId && (
              <Link
                href={`/driver/trip/${routeId}`}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'white',
                  color: '#666',
                  border: '2px solid #666',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                Back to List
              </Link>
            )}
          </div>

          {/* Instructions */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#E6F7F6',
            borderRadius: '0.5rem',
            border: '1px dashed #2BB2A9'
          }}>
            <h3 style={{ fontWeight: '600', color: '#2BB2A9', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              📋 Instructions
            </h3>
            <ul style={{ fontSize: '0.75rem', color: '#666', listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.25rem' }}>• Hold QR code steady in front of camera</li>
              <li style={{ marginBottom: '0.25rem' }}>• Ensure good lighting for better scanning</li>
              <li style={{ marginBottom: '0.25rem' }}>• Passenger will receive confirmation notification</li>
              <li>• You can also board manually from passenger list</li>
            </ul>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}