"use client";

const TICKER_ITEMS = [
  { label: "Status", value: "Active" },
  { label: "Members", value: "60+" },
  { label: "Cellules", value: "6" },
  { label: "Events", value: "Monthly" },
  { label: "Location", value: "EST Safi" },
  { label: "Founded", value: "2019" },
];

export function EditorialTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ed-ticker">
      <div className="ed-ticker-track">
        {doubled.map((item, i) => (
          <span className="ed-ticker-item" key={i}>
            <span style={{ color: "rgba(243,234,216,0.6)" }}>{item.label}</span>
            <span style={{ color: "var(--ed-terracotta)", fontSize: 8 }}>●</span>
            <span style={{ fontWeight: 500 }}>{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
