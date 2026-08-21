import { useState } from 'react';
import { NewUnitScreen } from './components/NewUnitScreen';
import { ScanOutScreen } from './components/ScanOutScreen';
import { StockListScreen } from './components/StockListScreen';
import { BuyerViewScreen } from './components/BuyerViewScreen';
import './App.css';

type Tab = 'new' | 'sell' | 'stock';

function StaffApp() {
  const [tab, setTab] = useState<Tab>('new');

  return (
    <div className="app">
      <nav className="tabs">
        <button
          type="button"
          className={tab === 'new' ? 'tab tab-active' : 'tab'}
          onClick={() => setTab('new')}
        >
          New unit
        </button>
        <button
          type="button"
          className={tab === 'sell' ? 'tab tab-active' : 'tab'}
          onClick={() => setTab('sell')}
        >
          Scan out
        </button>
        <button
          type="button"
          className={tab === 'stock' ? 'tab tab-active' : 'tab'}
          onClick={() => setTab('stock')}
        >
          Stock list
        </button>
      </nav>
      {tab === 'new' && <NewUnitScreen />}
      {tab === 'sell' && <ScanOutScreen />}
      {tab === 'stock' && <StockListScreen />}
    </div>
  );
}

function App() {
  // A buyer scanning a printed tag lands here via a plain URL, not client
  // routing — no navigation happens after load, so branching before any
  // hooks run (rather than inside StaffApp) is safe and keeps this simple
  // without pulling in a router for one static path.
  const buyerMatch = window.location.pathname.match(/^\/u\/([A-Za-z0-9-]+)\/?$/);
  if (buyerMatch) {
    return <BuyerViewScreen unitId={buyerMatch[1].toUpperCase()} />;
  }

  return <StaffApp />;
}

export default App;
