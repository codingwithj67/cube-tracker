import { useMemo, useState } from 'react';
import { listUnits, type Unit, type UnitStatus } from '../lib/units';
import { buildSoldUnitsCsv, downloadCsv } from '../lib/csv';

type StatusFilter = 'ALL' | UnitStatus;

export function StockListScreen() {
  const [units] = useState<Unit[]>(() => listUnits());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  const inStockCount = useMemo(() => units.filter((u) => u.status === 'IN_STOCK').length, [units]);
  const soldUnits = useMemo(() => units.filter((u) => u.status === 'SOLD'), [units]);
  const totalWeightSold = useMemo(
    () => soldUnits.reduce((sum, u) => sum + u.weightKg, 0),
    [soldUnits],
  );

  const visibleUnits = useMemo(
    () => (statusFilter === 'ALL' ? units : units.filter((u) => u.status === statusFilter)),
    [units, statusFilter],
  );

  function handleExport() {
    const filtered = soldUnits.filter((u) => {
      const soldDate = u.soldAt?.slice(0, 10) ?? '';
      if (exportFrom && soldDate < exportFrom) return false;
      if (exportTo && soldDate > exportTo) return false;
      return true;
    });
    const csv = buildSoldUnitsCsv(filtered);
    const suffix = exportFrom || exportTo ? `_${exportFrom || 'start'}_to_${exportTo || 'now'}` : '';
    downloadCsv(`cube-tracker-sold${suffix}.csv`, csv);
  }

  return (
    <div className="screen screen-wide">
      <header className="screen-header">
        <span className="eyebrow">Stock list</span>
        <h1>All cubes</h1>
        <p className="dek">Every unit logged, filterable and exportable.</p>
      </header>

      <div className="stats-row">
        <div className="stat-tile">
          <span className="stat-value">{inStockCount}</span>
          <span className="stat-label">In stock</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{soldUnits.length}</span>
          <span className="stat-label">Sold</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{totalWeightSold.toFixed(2)} kg</span>
          <span className="stat-label">Total weight sold</span>
        </div>
      </div>

      <div className="filter-row">
        {(['ALL', 'IN_STOCK', 'SOLD'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={statusFilter === option ? 'filter-chip filter-chip-active' : 'filter-chip'}
            onClick={() => setStatusFilter(option)}
          >
            {option === 'ALL' ? 'All' : option === 'IN_STOCK' ? 'In stock' : 'Sold'}
          </button>
        ))}
      </div>

      {visibleUnits.length === 0 ? (
        <p className="empty-state">No units yet — log a cube on the New Unit screen.</p>
      ) : (
        <div className="table-wrap">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Weight</th>
                <th>Metal</th>
                <th>Produced</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {visibleUnits.map((u) => (
                <tr key={u.id}>
                  <td className="mono">{u.id}</td>
                  <td>
                    <span className={u.status === 'IN_STOCK' ? 'status-pill status-instock' : 'status-pill status-sold'}>
                      {u.status === 'IN_STOCK' ? 'In stock' : 'Sold'}
                    </span>
                  </td>
                  <td className="mono">{u.weightKg.toFixed(2)} kg</td>
                  <td>{u.metalType ?? '—'}</td>
                  <td className="mono">{u.producedAt.slice(0, 10)}</td>
                  <td className="mono">{u.soldAt ? u.soldAt.slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="export-panel">
        <h2>Export sold units</h2>
        <p className="dek">Leave the dates blank to export everything sold to date.</p>
        <div className="export-fields">
          <label className="field">
            <span>From</span>
            <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
          </label>
          <label className="field">
            <span>To</span>
            <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
          </label>
        </div>
        <button type="button" className="btn-primary" onClick={handleExport} disabled={soldUnits.length === 0}>
          Export CSV
        </button>
      </section>
    </div>
  );
}
