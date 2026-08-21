import { useEffect, useState } from 'react';
import { fetchUnitForBuyer } from '../lib/api';
import type { Unit } from '../lib/units';

const CACHE_PREFIX = 'cubetracker:buyer-cache:';

interface CachedEntry {
  unit: Unit;
  cachedAt: string;
}

type ViewState =
  | { mode: 'loading' }
  | { mode: 'live'; unit: Unit }
  | { mode: 'cached'; unit: Unit; cachedAt: string }
  | { mode: 'not-found' }
  | { mode: 'unavailable' };

interface Props {
  unitId: string;
}

export function BuyerViewScreen({ unitId }: Props) {
  const [state, setState] = useState<ViewState>({ mode: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetchUnitForBuyer(unitId).then((result) => {
      if (cancelled) return;

      if (result.outcome === 'found') {
        const entry: CachedEntry = { unit: result.unit, cachedAt: new Date().toISOString() };
        localStorage.setItem(CACHE_PREFIX + unitId, JSON.stringify(entry));
        setState({ mode: 'live', unit: result.unit });
        return;
      }

      if (result.outcome === 'not-found') {
        setState({ mode: 'not-found' });
        return;
      }

      // Server unreachable — fall back to whatever this device last saw.
      const raw = localStorage.getItem(CACHE_PREFIX + unitId);
      if (raw) {
        const cached = JSON.parse(raw) as CachedEntry;
        setState({ mode: 'cached', unit: cached.unit, cachedAt: cached.cachedAt });
      } else {
        setState({ mode: 'unavailable' });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [unitId]);

  if (state.mode === 'loading') {
    return (
      <div className="buyer-view">
        <p className="buyer-sub">Loading…</p>
      </div>
    );
  }

  if (state.mode === 'not-found') {
    return (
      <div className="buyer-view">
        <p className="buyer-title">Not found</p>
        <p className="buyer-sub">This code doesn't match a logged unit.</p>
      </div>
    );
  }

  if (state.mode === 'unavailable') {
    return (
      <div className="buyer-view">
        <p className="buyer-title">Unavailable</p>
        <p className="buyer-sub">Couldn't reach the server, and there's no cached copy on this device yet.</p>
      </div>
    );
  }

  const { unit } = state;
  const isCached = state.mode === 'cached';

  return (
    <div className="buyer-view">
      <span className="buyer-code">{unit.id}</span>
      <p className="buyer-weight">{unit.weightKg.toFixed(2)} kg</p>
      {unit.metalType && <p className="buyer-metal">{unit.metalType}</p>}
      <span className={unit.status === 'IN_STOCK' ? 'status-pill status-instock' : 'status-pill status-sold'}>
        {unit.status === 'IN_STOCK' ? 'In stock' : 'Sold'}
      </span>
      {isCached && (
        <p className="buyer-cache-note">Confirmed as of {new Date(state.cachedAt).toLocaleString()}</p>
      )}
    </div>
  );
}
