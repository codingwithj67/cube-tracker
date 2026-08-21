import { generateUnitId } from './id';
import { buildQrUrl } from './config';
import { syncUnitToServer, fetchUnitForBuyer } from './api';

export type UnitStatus = 'IN_STOCK' | 'SOLD';

export interface Unit {
  id: string;
  qrValue: string;
  status: UnitStatus;
  weightKg: number;
  metalType?: string;
  description?: string;
  producedAt: string;
  soldAt?: string;
}

const STORAGE_KEY = 'cubetracker:units';

function readAll(): Unit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Unit[]) : [];
  } catch {
    return [];
  }
}

function writeAll(units: Unit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
}

export function listUnits(): Unit[] {
  return readAll().sort((a, b) => b.producedAt.localeCompare(a.producedAt));
}

export function createUnit(input: { weightKg: number; metalType?: string; description?: string }): Unit {
  const id = generateUnitId();
  const unit: Unit = {
    id,
    qrValue: buildQrUrl(id),
    status: 'IN_STOCK',
    weightKg: input.weightKg,
    metalType: input.metalType?.trim() || undefined,
    description: input.description?.trim() || undefined,
    producedAt: new Date().toISOString(),
  };
  const units = readAll();
  units.push(unit);
  writeAll(units);
  syncUnitToServer(unit);
  return unit;
}

export function findUnit(id: string): Unit | undefined {
  return readAll().find((u) => u.id === id);
}

export type SellResult =
  | { outcome: 'sold'; unit: Unit }
  | { outcome: 'already-sold'; unit: Unit }
  | { outcome: 'not-found' };

export async function sellUnit(id: string): Promise<SellResult> {
  const units = readAll();
  let unit = units.find((u) => u.id === id);

  if (!unit) {
    // Not logged on this device — it may have been created on a different
    // one. Check the shared store before calling it unrecognized.
    const remote = await fetchUnitForBuyer(id);
    if (remote.outcome !== 'found') return { outcome: 'not-found' };
    unit = remote.unit;
    units.push(unit);
  }

  if (unit.status === 'SOLD') return { outcome: 'already-sold', unit };
  unit.status = 'SOLD';
  unit.soldAt = new Date().toISOString();
  writeAll(units);
  syncUnitToServer(unit);
  return { outcome: 'sold', unit };
}

// Accepts either a bare unit code (e.g. "K7M-3XQ") or the full QR URL it's
// embedded in, since the camera scanner reads back whatever the QR encodes.
export function parseUnitId(scanned: string): string | null {
  const trimmed = scanned.trim();
  const candidate = (trimmed.includes('/') ? trimmed.split('/').pop() ?? '' : trimmed).toUpperCase();
  return /^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(candidate) ? candidate : null;
}
