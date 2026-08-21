import { useState, type FormEvent } from 'react';
import { createUnit, listUnits, type Unit } from '../lib/units';
import { PrintableLabel } from './PrintableLabel';

const METAL_TYPES = ['Steel', 'Aluminium', 'Copper', 'Brass', 'Stainless Steel'];

export function NewUnitScreen() {
  const [weight, setWeight] = useState('');
  const [metalType, setMetalType] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastUnit, setLastUnit] = useState<Unit | null>(null);
  const [recent, setRecent] = useState<Unit[]>(() => listUnits().slice(0, 8));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const weightKg = Number(weight);
    if (!weight || Number.isNaN(weightKg) || weightKg <= 0) {
      setError("Enter the cube's weight in kg.");
      return;
    }
    setError(null);
    const unit = createUnit({ weightKg, metalType, description });
    setLastUnit(unit);
    setRecent(listUnits().slice(0, 8));
    setWeight('');
    setMetalType('');
    setDescription('');
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <span className="eyebrow">New unit</span>
        <h1>Log a cube</h1>
        <p className="dek">Weigh it, log it, print the tag, stick it on.</p>
      </header>

      {!lastUnit ? (
        <form className="unit-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Weight (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            <span>
              Metal type <em>(optional)</em>
            </span>
            <input
              type="text"
              list="metal-types"
              placeholder="e.g. Steel, Aluminium, Copper"
              value={metalType}
              onChange={(e) => setMetalType(e.target.value)}
            />
            <datalist id="metal-types">
              {METAL_TYPES.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>
              Description <em>(optional)</em>
            </span>
            <textarea
              rows={3}
              placeholder="e.g. 95% clean, minimal insulation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary">
            Generate tag
          </button>
        </form>
      ) : (
        <div className="created">
          <PrintableLabel unit={lastUnit} />
          <div className="created-actions">
            <button type="button" className="btn-primary" onClick={() => window.print()}>
              Print label
            </button>
            <button type="button" className="btn-secondary" onClick={() => setLastUnit(null)}>
              Add another cube
            </button>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <section className="recent">
          <h2>Recently added</h2>
          <ul>
            {recent.map((u) => (
              <li key={u.id}>
                <span className="recent-code">{u.id}</span>
                <span className="recent-weight">{u.weightKg.toFixed(2)} kg</span>
                {u.metalType && <span className="recent-metal">{u.metalType}</span>}
                <span className="recent-time">
                  {new Date(u.producedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
