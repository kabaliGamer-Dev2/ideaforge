export default function FitGauge({ band }: { band: string }) {
  const total = 12;
  const filled = band === "excellent" ? 12 : band === "strong" ? 9 : band === "moderate" ? 6 : 3;
  return (
    <div className="fit-row">
      <div className="gauge" role="img" aria-label={`fit: ${band}`}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`seg${i < filled ? " on" : ""}`} />
        ))}
      </div>
      <span className="fit-band">{band}</span>
    </div>
  );
}