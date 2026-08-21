import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Unit } from '../lib/units';

interface Props {
  unit: Unit;
}

export function PrintableLabel({ unit }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(unit.qrValue, { margin: 1, width: 240 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [unit.qrValue]);

  const producedDate = new Date(unit.producedAt);

  return (
    <div className="label">
      <div className="label-qr">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR code for unit ${unit.id}`} width={120} height={120} />
        ) : (
          <div className="label-qr-loading">Generating…</div>
        )}
      </div>
      <div className="label-code">{unit.id}</div>
      <div className="label-weight">{unit.weightKg.toFixed(2)} kg</div>
      {unit.metalType && <div className="label-metal">{unit.metalType}</div>}
      <div className="label-date">{producedDate.toLocaleDateString()}</div>
    </div>
  );
}
