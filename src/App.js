import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const DEFAULT = {
  dieselPrijs: 1.75,
  verbruikLper100: 6.5,
  elektraPrijs: 0.28,
  verbruikKwh: 17,
  kmPerJaar: 20000,
  aankoopDiesel: 25000,
  aankoopElektrisch: 40000,
};

function fmt(n, decimals = 2) {
  return n.toLocaleString("nl-BE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function SliderInput({ label, value, onChange, min, max, step, unit, color }) {
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
        <label style={{ fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", fontFamily: "'Barlow Condensed', sans-serif" }}>
          {label}
        </label>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.15rem", fontWeight: 600, color }}>
          {fmt(value, step < 1 ? 2 : 0)}{" "}
          <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: 400 }}>{unit}</span>
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%", height: "4px", appearance: "none",
          background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, #2a2a2a ${((value - min) / (max - min)) * 100}%, #2a2a2a 100%)`,
          borderRadius: "2px", outline: "none", cursor: "pointer",
        }}
      />
    </div>
  );
}

function PriceInput({ label, value, onChange, color }) {
  const [raw, setRaw] = useState(value.toString());

  useEffect(() => {
    setRaw(value.toString());
  }, [value]);

  const handleChange = (e) => {
    const str = e.target.value.replace(/[^0-9]/g, "");
    setRaw(str);
    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 0) onChange(num);
  };

  const handleBlur = () => {
    setRaw(value.toString());
  };

  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <label style={{ fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", fontFamily: "'Barlow Condensed', sans-serif", display: "block", marginBottom: "0.5rem" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#555", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem" }}>€</span>
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            width: "100%", background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderBottom: `2px solid ${color}`,
            borderRadius: "4px", padding: "0.6rem 0.75rem 0.6rem 1.6rem",
            color: color, fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "1.2rem", fontWeight: 600, outline: "none",
          }}
        />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#111", border: "1px solid #333", padding: "0.8rem 1.1rem", borderRadius: "6px", fontFamily: "'Barlow Condensed', sans-serif" }}>
        <p style={{ color: "#666", fontSize: "0.75rem", marginBottom: "0.4rem", letterSpacing: "0.06em" }}>JAAR {label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color, margin: "0.15rem 0", fontSize: "1rem" }}>
            {p.name}: <strong>€ {fmt(p.value)}</strong>
          </p>
        ))}
        {payload.length === 2 && (
          <p style={{ color: "#aaa", marginTop: "0.4rem", fontSize: "0.85rem", borderTop: "1px solid #333", paddingTop: "0.4rem" }}>
            Verschil:{" "}
            <strong style={{ color: payload[0].value < payload[1].value ? "#4ade80" : "#f87171" }}>
              € {fmt(Math.abs(payload[0].value - payload[1].value))}
            </strong>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [v, setV] = useState(DEFAULT);
  const [jaren, setJaren] = useState(10);

  const set = key => val => setV(prev => ({ ...prev, [key]: val }));

  const kostenPerKm = {
    diesel: (v.dieselPrijs * v.verbruikLper100) / 100,
    elektra: (v.elektraPrijs * v.verbruikKwh) / 100,
  };

  const data = Array.from({ length: jaren }, (_, i) => {
    const jaar = i + 1;
    const kmTotaal = v.kmPerJaar * jaar;
    return {
      jaar,
      Diesel: Math.round(v.aankoopDiesel + kmTotaal * kostenPerKm.diesel),
      Elektrisch: Math.round(v.aankoopElektrisch + kmTotaal * kostenPerKm.elektra),
    };
  });

  const totaalDiesel = data[data.length - 1]?.Diesel || 0;
  const totaalElektrisch = data[data.length - 1]?.Elektrisch || 0;
  const verschil = totaalDiesel - totaalElektrisch;
  const meerprijs = v.aankoopElektrisch - v.aankoopDiesel;
  const brandstofBesparing = Math.round(v.kmPerJaar * jaren * (kostenPerKm.diesel - kostenPerKm.elektra));
  const breakevenIdx = data.findIndex(d => d.Elektrisch < d.Diesel);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700&family=Barlow:wght@300;400&display=swap');
      input[type=range]::-webkit-slider-thumb {
        appearance: none; width: 14px; height: 14px; border-radius: 50%;
        background: white; cursor: pointer; box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0a0a0a; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: #111; }
      ::-webkit-scrollbar-thumb { background: #333; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0", fontFamily: "'Barlow', sans-serif", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ maxWidth: "1040px", margin: "0 auto 2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.3rem" }}>
          <div style={{ width: "3px", height: "2rem", background: "linear-gradient(to bottom, #f97316, #3b82f6)" }} />
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 700, letterSpacing: "0.04em", color: "#fff" }}>
            BRANDSTOF<span style={{ color: "#555" }}> VS </span>ELEKTRISCH
          </h1>
        </div>
        <p style={{ color: "#555", fontSize: "0.85rem", paddingLeft: "1.3rem", letterSpacing: "0.03em" }}>
          Totale eigendomskost (TCO) — aankoop + rijkosten op jaarbasis
        </p>
      </div>

      <div style={{ maxWidth: "1040px", margin: "0 auto", display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.5rem", alignItems: "start" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Diesel */}
          <div style={{ background: "#111", border: "1px solid #222", borderTop: "2px solid #f97316", borderRadius: "8px", padding: "1.3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.2rem" }}>
              <span style={{ fontSize: "1.1rem" }}>⛽</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em", color: "#f97316", fontWeight: 600 }}>DIESEL</span>
            </div>
            <PriceInput label="Aankoopprijs voertuig" value={v.aankoopDiesel} onChange={set("aankoopDiesel")} color="#f97316" />
            <SliderInput label="Prijs per liter" value={v.dieselPrijs} onChange={set("dieselPrijs")} min={1.2} max={2.5} step={0.01} unit="€/L" color="#f97316" />
            <SliderInput label="Verbruik" value={v.verbruikLper100} onChange={set("verbruikLper100")} min={3} max={15} step={0.1} unit="L/100km" color="#f97316" />
            <div style={{ background: "#1a1a1a", borderRadius: "4px", padding: "0.6rem 0.8rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#666", letterSpacing: "0.06em" }}>RIJKOST PER KM</span>
              <div style={{ color: "#f97316", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", fontWeight: 600 }}>
                € {fmt(kostenPerKm.diesel, 4)}
              </div>
            </div>
          </div>

          {/* Elektrisch */}
          <div style={{ background: "#111", border: "1px solid #222", borderTop: "2px solid #3b82f6", borderRadius: "8px", padding: "1.3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.2rem" }}>
              <span style={{ fontSize: "1.1rem" }}>⚡</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em", color: "#3b82f6", fontWeight: 600 }}>ELEKTRISCH</span>
            </div>
            <PriceInput label="Aankoopprijs voertuig" value={v.aankoopElektrisch} onChange={set("aankoopElektrisch")} color="#3b82f6" />
            <SliderInput label="Prijs per kWh" value={v.elektraPrijs} onChange={set("elektraPrijs")} min={0.10} max={0.60} step={0.01} unit="€/kWh" color="#3b82f6" />
            <SliderInput label="Verbruik" value={v.verbruikKwh} onChange={set("verbruikKwh")} min={10} max={30} step={0.1} unit="kWh/100km" color="#3b82f6" />
            <div style={{ background: "#1a1a1a", borderRadius: "4px", padding: "0.6rem 0.8rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#666", letterSpacing: "0.06em" }}>RIJKOST PER KM</span>
              <div style={{ color: "#3b82f6", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", fontWeight: 600 }}>
                € {fmt(kostenPerKm.elektra, 4)}
              </div>
            </div>
          </div>

          {/* Rijgedrag */}
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "1.3rem" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em", color: "#888", fontWeight: 600, marginBottom: "1.2rem" }}>
              RIJGEDRAG
            </div>
            <SliderInput label="Km per jaar" value={v.kmPerJaar} onChange={set("kmPerJaar")} min={5000} max={80000} step={500} unit="km" color="#a855f7" />
            <SliderInput label="Periode (jaren)" value={jaren} onChange={setJaren} min={1} max={20} step={1} unit="jaar" color="#a855f7" />
          </div>

          {/* Analyse */}
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "1.3rem" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em", color: "#888", fontWeight: 600, marginBottom: "1rem" }}>
              ANALYSE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {[
                { label: `Meerprijs elektrisch`, value: `${meerprijs >= 0 ? "+" : ""}€ ${fmt(meerprijs, 0)}`, color: meerprijs >= 0 ? "#f87171" : "#4ade80" },
                { label: `Brandstofbesparing (${jaren}j)`, value: `+ € ${fmt(brandstofBesparing, 0)}`, color: "#4ade80" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ color: "#555" }}>{r.label}</span>
                  <span style={{ color: r.color, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #222", paddingTop: "0.65rem", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#aaa", fontSize: "0.85rem" }}>Netto resultaat</span>
                <span style={{ color: verschil >= 0 ? "#4ade80" : "#f87171", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                  {verschil >= 0 ? "Diesel −" : "Elektr. −"} € {fmt(Math.abs(verschil), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.8rem" }}>
            {[
              { label: "TCO Diesel", value: `€ ${fmt(totaalDiesel, 0)}`, sub: "aankoop + rijkosten", color: "#f97316" },
              { label: "TCO Elektrisch", value: `€ ${fmt(totaalElektrisch, 0)}`, sub: "aankoop + rijkosten", color: "#3b82f6" },
              { label: verschil >= 0 ? "Diesel duurder" : "Elektrisch duurder", value: `€ ${fmt(Math.abs(verschil), 0)}`, sub: `na ${jaren} jaar`, color: verschil >= 0 ? "#4ade80" : "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "#555", letterSpacing: "0.07em", marginBottom: "0.4rem", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {s.label.toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.35rem", fontWeight: 700, color: s.color }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#444", marginTop: "0.25rem" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Breakeven banner */}
          {breakevenIdx >= 0 ? (
            <div style={{ background: "#0a1a0a", border: "1px solid #4ade8033", borderRadius: "8px", padding: "0.9rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <span style={{ fontSize: "1.4rem" }}>✓</span>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#4ade80", fontWeight: 600, fontSize: "0.95rem", letterSpacing: "0.04em" }}>
                  ELEKTRISCH GOEDKOPER VANAF JAAR {breakevenIdx + 1}
                </div>
                <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "0.1rem" }}>
                  Inclusief aankoopprijs — totale eigendomskost (TCO)
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "#1a0a0a", border: "1px solid #f8717133", borderRadius: "8px", padding: "0.9rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <span style={{ fontSize: "1.4rem" }}>✗</span>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#f87171", fontWeight: 600, fontSize: "0.95rem", letterSpacing: "0.04em" }}>
                  ELEKTRISCH RECUPEREERT MEERPRIJS NIET BINNEN {jaren} JAAR
                </div>
                <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "0.1rem" }}>
                  Pas de parameters aan of verleng de periode
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "1.5rem 1rem 1rem" }}>
            <div style={{ paddingLeft: "0.5rem", marginBottom: "1.2rem" }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.78rem", letterSpacing: "0.1em", color: "#555" }}>
                TOTALE EIGENDOMSKOST (TCO) — AANKOOP + CUMULATIEVE RIJKOSTEN
              </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorElektra" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis
                  dataKey="jaar"
                  tick={{ fill: "#555", fontSize: 11, fontFamily: "'Barlow Condensed'" }}
                  tickLine={false}
                  axisLine={{ stroke: "#222" }}
                  label={{ value: "Jaar", position: "insideBottomRight", offset: -5, fill: "#444", fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "#555", fontSize: 11, fontFamily: "'Barlow Condensed'" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `€${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.8rem", letterSpacing: "0.06em", paddingTop: "0.5rem" }} />
                <Area type="monotone" dataKey="Diesel" stroke="#f97316" strokeWidth={2.5} fill="url(#colorDiesel)" dot={false} activeDot={{ r: 4, fill: "#f97316" }} />
                <Area type="monotone" dataKey="Elektrisch" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorElektra)" dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tabel */}
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "0.8rem 1.2rem", borderBottom: "1px solid #1e1e1e" }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.78rem", letterSpacing: "0.1em", color: "#555" }}>
                JAARLIJKS OVERZICHT (TCO)
              </span>
            </div>
            <div style={{ overflowX: "auto", maxHeight: "220px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "#141414" }}>
                    {["Jaar", "Km totaal", "TCO Diesel", "TCO Elektrisch", "Verschil"].map(h => (
                      <th key={h} style={{ padding: "0.55rem 1rem", textAlign: "right", color: "#555", fontSize: "0.7rem", letterSpacing: "0.07em", fontWeight: 500, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => {
                    const diff = d.Diesel - d.Elektrisch;
                    return (
                      <tr key={d.jaar} style={{ borderTop: "1px solid #181818", background: i % 2 === 0 ? "transparent" : "#0d0d0d" }}>
                        <td style={{ padding: "0.45rem 1rem", textAlign: "right", color: "#666" }}>{d.jaar}</td>
                        <td style={{ padding: "0.45rem 1rem", textAlign: "right", color: "#555" }}>{(v.kmPerJaar * d.jaar).toLocaleString("nl-BE")}</td>
                        <td style={{ padding: "0.45rem 1rem", textAlign: "right", color: "#f97316" }}>€ {fmt(d.Diesel, 0)}</td>
                        <td style={{ padding: "0.45rem 1rem", textAlign: "right", color: "#3b82f6" }}>€ {fmt(d.Elektrisch, 0)}</td>
                        <td style={{ padding: "0.45rem 1rem", textAlign: "right", color: diff >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                          {diff >= 0 ? "+" : ""}€ {fmt(diff, 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
