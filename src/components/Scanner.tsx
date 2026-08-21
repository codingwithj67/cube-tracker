import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  active: boolean;
  onScan: (text: string) => void;
  onError?: (message: string) => void;
}

const ELEMENT_ID = 'qr-scanner-viewport';

export function Scanner({ active, onScan, onError }: Props) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!active) return;

    const scanner = new Html5Qrcode(ELEMENT_ID);
    let cancelled = false;
    let started = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (!cancelled) onScanRef.current(decodedText);
        },
        () => {
          // Per-frame "no QR found this frame" — expected while aiming, not an error.
        },
      )
      .then(() => {
        started = true;
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current?.('Camera unavailable — use the code field below instead.');
      });

    return () => {
      cancelled = true;
      if (started) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, [active]);

  return <div id={ELEMENT_ID} className="scanner-viewport" />;
}
