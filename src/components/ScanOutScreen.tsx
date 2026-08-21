import { useState, type FormEvent } from 'react';
import { Scanner } from './Scanner';
import { sellUnit, parseUnitId, type SellResult } from '../lib/units';

type ViewState = { mode: 'scanning' } | { mode: 'result'; result: SellResult };

export function ScanOutScreen() {
  const [view, setView] = useState<ViewState>({ mode: 'scanning' });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  function handleScan(text: string) {
    resolveCode(text);
  }

  function resolveCode(text: string) {
    const id = parseUnitId(text);
    const result: SellResult = id ? sellUnit(id) : { outcome: 'not-found' };
    setView({ mode: 'result', result });
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) {
      setManualError('Enter a unit code.');
      return;
    }
    setManualError(null);
    resolveCode(manualCode);
    setManualCode('');
  }

  function handleScanNext() {
    setCameraError(null);
    setView({ mode: 'scanning' });
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <span className="eyebrow">Scan out</span>
        <h1>Sell a cube</h1>
        <p className="dek">Point the camera at the tag to mark it sold.</p>
      </header>

      {view.mode === 'scanning' ? (
        <>
          <Scanner active onScan={handleScan} onError={setCameraError} />
          {cameraError && <p className="form-error">{cameraError}</p>}
          <form className="manual-entry" onSubmit={handleManualSubmit}>
            <label className="field">
              <span>Or enter the code manually</span>
              <input
                type="text"
                placeholder="e.g. K7M-3XQ"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
            </label>
            {manualError && <p className="form-error">{manualError}</p>}
            <button type="submit" className="btn-secondary">
              Look up
            </button>
          </form>
        </>
      ) : (
        <ScanResult result={view.result} onScanNext={handleScanNext} />
      )}
    </div>
  );
}

function ScanResult({ result, onScanNext }: { result: SellResult; onScanNext: () => void }) {
  if (result.outcome === 'not-found') {
    return (
      <div className="scan-result scan-result-error">
        <p className="scan-result-title">Unrecognized code</p>
        <p className="scan-result-sub">This isn't a cube logged in the system.</p>
        <button type="button" className="btn-primary" onClick={onScanNext}>
          Scan next
        </button>
      </div>
    );
  }

  const { unit } = result;
  const isAlreadySold = result.outcome === 'already-sold';

  return (
    <div className={`scan-result ${isAlreadySold ? 'scan-result-warn' : 'scan-result-good'}`}>
      <p className="scan-result-title">{isAlreadySold ? 'Already sold' : 'Marked sold'}</p>
      <div className="scan-result-card">
        <span className="scan-result-code">{unit.id}</span>
        <span className="scan-result-weight">{unit.weightKg.toFixed(2)} kg</span>
        {unit.metalType && <span className="scan-result-metal">{unit.metalType}</span>}
      </div>
      {isAlreadySold && unit.soldAt && (
        <p className="scan-result-sub">Sold on {new Date(unit.soldAt).toLocaleString()}</p>
      )}
      <button type="button" className="btn-primary" onClick={onScanNext}>
        Scan next
      </button>
    </div>
  );
}
