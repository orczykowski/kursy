import { useEffect, useState, useCallback } from "react";
import { fetchUsdPln, fetchBtcRates } from "./api";
import { readCache, writeCache } from "./cache";
import RateCard from "./RateCard";
import "./App.css";

function App() {
  const [usdPln, setUsdPln] = useState({ loading: true, error: false });
  const [btc, setBtc] = useState({ loading: true, error: false });
  const [lastUpdate, setLastUpdate] = useState(null);

  // force=true (np. przycisk "Odśwież") zawsze pomija cache i pobiera świeże dane;
  // w przeciwnym razie dane starsze niż 5 minut są uznawane za nieaktualne.
  const loadData = useCallback(async (force = false) => {
    setUsdPln((s) => ({ ...s, loading: true, error: false }));
    setBtc((s) => ({ ...s, loading: true, error: false }));

    try {
      let data = !force && readCache("usdPln");
      if (!data) {
        data = await fetchUsdPln();
        writeCache("usdPln", data);
      }
      setUsdPln({ ...data, loading: false, error: false });
    } catch {
      setUsdPln({ loading: false, error: true });
    }

    try {
      let data = !force && readCache("btc");
      if (!data) {
        data = await fetchBtcRates();
        writeCache("btc", data);
      }
      setBtc({ ...data, loading: false, error: false });
    } catch {
      setBtc({ loading: false, error: true });
    }

    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kursy walut</h1>
        <p className="tagline">Kursy rynkowe (fxratesapi, CoinGecko) — dane poglądowe</p>
      </header>

      <main className="cards">
        <RateCard
          title="USD → PLN"
          subtitle="kurs rynkowy"
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
        <button type="button" className="refresh-btn" onClick={() => loadData(true)}>
          Odśwież
        </button>
        {lastUpdate && (
          <p className="updated-at">
            Ostatnia aktualizacja: {lastUpdate.toLocaleTimeString("pl-PL")}
          </p>
        )}
        <p className="disclaimer">
          Kurs rynkowy (mid-market), poglądowy. Realny kurs kupna/sprzedaży w
          banku lub kantorze będzie się nieco różnić (spread) — nie stanowi
          porady inwestycyjnej.
        </p>
      </footer>
    </div>
  );
}

export default App;
