// mBank - realny kurs kupna/sprzedaży dolara w tym banku (publiczny endpoint
// używany przez ich własną stronę, CORS: access-control-allow-origin: *).
// Najpierw pobieramy "wykres" z historią odczytów, żeby znać ostatnią datę,
// w której bank faktycznie publikował kurs (w weekendy/święta nie publikuje),
// a dopiero potem pobieramy pełne dane (kupno/sprzedaż) dla tej konkretnej daty.
async function fetchMbankDay(date) {
  const res = await fetch(
    `https://www.mbank.pl/api/exchange-rates/exchange_rates_date_${date}.json?_=${Date.now()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Błąd mBank API");
  const data = await res.json();
  return data.items.find((i) => i.currency === "USD");
}

export async function fetchUsdPln() {
  const chartRes = await fetch(
    `https://www.mbank.pl/api/exchange-rates/exchange_rates_chart.json?_=${Date.now()}`,
    { cache: "no-store" }
  );
  if (!chartRes.ok) throw new Error("Błąd mBank API");
  const chart = await chartRes.json();
  const usdSeries = chart.find((c) => c.currency === "USD")?.items ?? [];
  if (usdSeries.length === 0) throw new Error("Brak danych USD z mBank");

  const latestDate = usdSeries[0].date;
  const prevDate = usdSeries.find((i) => i.date !== latestDate)?.date;

  const [today, prevDay] = await Promise.all([
    fetchMbankDay(latestDate),
    prevDate ? fetchMbankDay(prevDate) : Promise.resolve(null),
  ]);

  const rate = today.purchaseRate;
  const prevRate = prevDay ? prevDay.purchaseRate : rate;

  return {
    rate,
    sellRate: today.sellingRate,
    prevRate,
    change: rate - prevRate,
    changePct: prevRate ? ((rate - prevRate) / prevRate) * 100 : 0,
    date: latestDate,
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
