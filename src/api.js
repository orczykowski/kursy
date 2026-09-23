// fxratesapi.com - żywy kurs rynkowy (mid-market, aktualizowany na bieżąco).
// mBank i inne banki nie udostępniają publicznie (bez logowania) swojego
// realnego kursu z kantoru wymiany walut w aplikacji - to wymaga
// zalogowanego konta. Ich publiczna "tabela informacyjna" ma sztucznie
// szeroki spread (kilka-kilkanaście %) i nie odzwierciedla realnej
// transakcji, więc nie jest użyteczna jako przybliżenie. Kurs rynkowy
// mid-market jest najbliższym darmowym i ogólnodostępnym przybliżeniem
// tego, co realnie dostaniesz w banku/kantorze.
function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export async function fetchUsdPln() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [currentRes, historicalRes] = await Promise.all([
    fetch(`https://api.fxratesapi.com/latest?base=USD&currencies=PLN&_=${Date.now()}`, {
      cache: "no-store",
    }),
    fetch(
      `https://api.fxratesapi.com/historical?date=${isoDate(yesterday)}&base=USD&currencies=PLN&_=${Date.now()}`,
      { cache: "no-store" }
    ),
  ]);
  if (!currentRes.ok || !historicalRes.ok) throw new Error("Błąd fxratesapi");

  const current = await currentRes.json();
  const historical = await historicalRes.json();
  const rate = current.rates.PLN;
  const prevRate = historical.rates.PLN;

  return {
    rate,
    prevRate,
    change: rate - prevRate,
    changePct: ((rate - prevRate) / prevRate) * 100,
    date: current.date,
  };
}

// CoinGecko API - kurs BTC do PLN i USD wraz ze zmianą 24h
export async function fetchBtcRates() {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=pln,usd&include_24hr_change=true&_=${Date.now()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Błąd CoinGecko API");
  const data = await res.json();
  const btc = data.bitcoin;
  return {
    pln: { rate: btc.pln, changePct: btc.pln_24h_change },
    usd: { rate: btc.usd, changePct: btc.usd_24h_change },
  };
}
