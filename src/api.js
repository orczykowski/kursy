// NBP API - oficjalne kursy średnie NBP (tabela A), kurs z dziś + wczoraj do wyliczenia zmiany
export async function fetchUsdPln() {
  const res = await fetch(
    "https://api.nbp.pl/api/exchangerates/rates/a/usd/last/2/?format=json"
  );
  if (!res.ok) throw new Error("Błąd NBP API");
  const data = await res.json();
  const [prev, current] = data.rates;
  return {
    rate: current.mid,
    prevRate: prev.mid,
    change: current.mid - prev.mid,
    changePct: ((current.mid - prev.mid) / prev.mid) * 100,
    date: current.effectiveDate,
  };
}

// CoinGecko API - kurs BTC do PLN i USD wraz ze zmianą 24h
export async function fetchBtcRates() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=pln,usd&include_24hr_change=true"
  );
  if (!res.ok) throw new Error("Błąd CoinGecko API");
  const data = await res.json();
  const btc = data.bitcoin;
  return {
    pln: { rate: btc.pln, changePct: btc.pln_24h_change },
    usd: { rate: btc.usd, changePct: btc.usd_24h_change },
  };
}
