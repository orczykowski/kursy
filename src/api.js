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

// Kurs BTC pobieramy z kilku giełd w kolejności (fallback), bo pojedyncze
// API potrafi zawieść z różnych powodów: CoinGecko rate-limituje anonimowe
// zapytania po kilku wywołaniach (429), Binance blokuje połączenia z części
// krajów już na poziomie sieci (np. USA). Jeśli jedno API padnie, próbujemy
// kolejne, żeby aplikacja nadal pokazywała kurs.
//
// Coinbase i Kraken nie udostępniają pary BTC/PLN, więc kurs PLN liczymy
// mnożąc BTC/USD przez już posiadany kurs USD/PLN (fxratesapi).

async function fetchFromCoinbase(usdPlnRate) {
  const [spotRes, statsRes] = await Promise.all([
    fetch(`https://api.coinbase.com/v2/prices/BTC-USD/spot?_=${Date.now()}`, {
      cache: "no-store",
    }),
    fetch(`https://api.exchange.coinbase.com/products/BTC-USD/stats?_=${Date.now()}`, {
      cache: "no-store",
    }),
  ]);
  if (!spotRes.ok || !statsRes.ok) throw new Error("Błąd Coinbase API");

  const spot = await spotRes.json();
  const stats = await statsRes.json();

  const usdRate = Number(spot.data.amount);
  const openPrice = Number(stats.open);
  const usdChangePct = ((usdRate - openPrice) / openPrice) * 100;

  return {
    usd: { rate: usdRate, changePct: usdChangePct },
    pln: { rate: usdRate * usdPlnRate, changePct: usdChangePct },
  };
}

async function fetchFromKraken(usdPlnRate) {
  const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=XBTUSD&_=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Błąd Kraken API");

  const data = await res.json();
  if (data.error?.length) throw new Error(data.error.join(", "));
  const ticker = data.result.XXBTZUSD;

  const usdRate = Number(ticker.c[0]);
  const openPrice = Number(ticker.o);
  const usdChangePct = ((usdRate - openPrice) / openPrice) * 100;

  return {
    usd: { rate: usdRate, changePct: usdChangePct },
    pln: { rate: usdRate * usdPlnRate, changePct: usdChangePct },
  };
}

async function fetchFromCoinGecko() {
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

const BTC_PROVIDERS = [fetchFromCoinbase, fetchFromKraken, fetchFromCoinGecko];

export async function fetchBtcRates(usdPlnRate) {
  let lastError;
  for (const provider of BTC_PROVIDERS) {
    try {
      return await provider(usdPlnRate);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
