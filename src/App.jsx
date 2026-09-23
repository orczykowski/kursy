import { useEffect, useState, useCallback } from "react";
import { fetchUsdPln, fetchBtcRates } from "./api";
import RateCard from "./RateCard";
import "./App.css";

function App() {
  const [usdPln, setUsdPln] = useState({ loading: true, error: false });
  const [btc, setBtc] = useState({ loading: true, error: false });
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadData = useCallback(async () => {
    setUsdPln((s) => ({ ...s, loading: true, error: false }));
    setBtc((s) => ({ ...s, loading: true, error: false }));

    try {
      const data = await fetchUsdPln();
      setUsdPln({ ...data, loading: false, error: false });
    } catch {
      setUsdPln({ loading: false, error: true });
    }

    try {
      const data = await fetchBtcRates();
      setBtc({ ...data, loading: false, error: false });
    } catch {
      setBtc({ loading: false, error: true });
    }

    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kursy walut</h1>
        <p className="tagline">USD/PLN z NBP, BTC z CoinGecko — dane poglądowe</p>
      </header>

      <main className="cards">
        <RateCard
          title="USD → PLN"
          subtitle="NBP, tabela A"
          unit="PLN"
          rate={usdPln.rate}
          changePct={usdPln.changePct}
          loading={usdPln.loading}
          error={usdPln.error}
        />
        <RateCard
          title="BTC → PLN"
          subtitle="CoinGecko"
          unit="PLN"
          rate={btc.pln?.rate}
          changePct={btc.pln?.changePct}
          loading={btc.loading}
          error={btc.error}
        />
        <RateCard
          title="BTC → USD"
          subtitle="CoinGecko"
          unit="USD"
          rate={btc.usd?.rate}
          changePct={btc.usd?.changePct}
          loading={btc.loading}
          error={btc.error}
        />
      </main>

      <footer className="app-footer">
        <button type="button" className="refresh-btn" onClick={loadData}>
          Odśwież
        </button>
        {lastUpdate && (
          <p className="updated-at">
            Ostatnia aktualizacja: {lastUpdate.toLocaleTimeString("pl-PL")}
          </p>
        )}
        <p className="disclaimer">
          Dane wyłącznie poglądowe, nie stanowią porady inwestycyjnej.
        </p>
      </footer>
    </div>
  );
}

export default App;
