function formatNumber(value, digits = 2, decimalSeparator = ",") {
  const formatted = value.toLocaleString("pl-PL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return decimalSeparator === "," ? formatted : formatted.replace(",", decimalSeparator);
}

export default function RateCard({
  title,
  subtitle,
  rate,
  unit,
  changePct,
  loading,
  error,
  decimalSeparator,
  colorBySign,
}) {
  const signClass = colorBySign ? (rate < 0 ? "down" : rate > 0 ? "up" : "") : "";
  const isUp = changePct > 0;
  const isDown = changePct < 0;
  const trendClass = isUp ? "up" : isDown ? "down" : "flat";
  const arrow = isUp ? "▲" : isDown ? "▼" : "▬";

  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {subtitle && <span className="subtitle">{subtitle}</span>}
      </div>

      {loading && <p className="status">Ładowanie…</p>}
      {error && <p className="status error">Nie udało się pobrać danych</p>}

      {!loading && !error && (
        <>
          <p className={`rate ${signClass}`}>
            {formatNumber(rate, 2, decimalSeparator)} {unit && <span className="unit">{unit}</span>}
          </p>
          {changePct != null && (
            <p className={`change ${trendClass}`}>
              {arrow} {changePct >= 0 ? "+" : ""}
              {formatNumber(changePct)}% dzisiaj
            </p>
          )}
        </>
      )}
    </div>
  );
}
