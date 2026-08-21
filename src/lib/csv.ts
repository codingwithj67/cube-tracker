import type { Unit } from './units';

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildSoldUnitsCsv(units: Unit[]): string {
  const header = ['Unit ID', 'Weight (kg)', 'Metal Type', 'Produced', 'Sold'];
  const rows = units.map((u) => [
    u.id,
    u.weightKg.toFixed(2),
    u.metalType ?? '',
    u.producedAt.slice(0, 10),
    u.soldAt ? u.soldAt.slice(0, 10) : '',
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
