import type { Unit } from './units';

// Best-effort push to the shared store so the public buyer page has
// something to read. Local storage stays the source of truth for the staff
// screens — a failed sync here just means the buyer page won't reflect this
// unit until the next successful write. Real offline queueing/retry is a
// later build phase, not needed for this to be useful today.
export function syncUnitToServer(unit: Unit): void {
  fetch(`/api/units/${unit.id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(unit),
  }).catch(() => {});
}

export type BuyerLookupResult =
  | { outcome: 'found'; unit: Unit }
  | { outcome: 'not-found' }
  | { outcome: 'offline' };

export async function fetchUnitForBuyer(id: string): Promise<BuyerLookupResult> {
  try {
    const res = await fetch(`/api/units/${id}`);
    if (res.status === 404) return { outcome: 'not-found' };
    if (!res.ok) return { outcome: 'offline' };
    const unit = (await res.json()) as Unit;
    return { outcome: 'found', unit };
  } catch {
    return { outcome: 'offline' };
  }
}
