import { useId, useMemo, useState, type KeyboardEvent } from 'react'

type MetricId = 'views' | 'watch' | 'avgdur' | 'ctr' | 'subs'
type Metric = { id: MetricId; label: string; fmt: (n: number) => string; agg: 'sum' | 'mean'; higherIsBetter: boolean }
const METRICS: Metric[] = [
  { id: 'views', label: 'Views', fmt: n => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${Math.round(n)}`), agg: 'sum', higherIsBetter: true },
  { id: 'watch', label: 'Watch time (hrs)', fmt: n => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${Math.round(n)}`), agg: 'sum', higherIsBetter: true },
  { id: 'avgdur', label: 'Avg view duration', fmt: n => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`, agg: 'mean', higherIsBetter: true },
  { id: 'ctr', label: 'Impressions CTR', fmt: n => `${n.toFixed(1)}%`, agg: 'mean', higherIsBetter: true },
  { id: 'subs', label: 'Net subscribers', fmt: n => `${n >= 0 ? '+' : ''}${Math.round(n).toLocaleString()}`, agg: 'sum', higherIsBetter: true },
]
const DAYS = 180 // illustrative sample series; today = last index
const UPLOADS = [{ d: 123, t: 'Big-O without the math', a: 5200 }, { d: 150, t: 'Hash maps in 12 min', a: 9800 }, { d: 165, t: 'Trees in plain English', a: 6100 }]
const series = (() => {
  const views = Array.from({ length: DAYS }, (_, d) => Math.round(5000 + 650 * Math.sin(d * 0.9) + d * 6 + UPLOADS.reduce((a, u) => a + (d >= u.d ? u.a * Math.exp(-(d - u.d) / 2.6) : 0), 0)))
  const avgdur = views.map((_, d) => 200 - Math.min(25, (d - 120 > 0 ? (d - 120) * 0.6 : 0)) + 10 * Math.sin(d * 0.4))
  const watch = views.map((v, i) => (v * avgdur[i]) / 3600)
  const ctr = views.map((_, d) => 5 + (d > 150 ? 0.6 : 0) + 0.4 * Math.sin(d * 0.7))
  const subs = views.map((v, d) => Math.round(v * 0.006 + 6 * Math.sin(d * 0.5)))
  return { views, watch, avgdur, ctr, subs } as Record<MetricId, number[]>
})()
const agg = (a: number[], m: Metric) => (m.agg === 'sum' ? a.reduce((x, y) => x + y, 0) : a.reduce((x, y) => x + y, 0) / a.length)

function LineChart({ cur, prev, compare, fmt, label, uploads }: { cur: number[]; prev: number[]; compare: boolean; fmt: (n: number) => string; label: string; uploads: { i: number; t: string }[] }) {
  const [idx, setIdx] = useState(cur.length - 1)
  const W = 720, H = 280, pl = 52, pr = 12, pt = 24, pb = 28
  const all = compare ? [...cur, ...prev] : cur
  const max = Math.max(...all) * 1.08, min = Math.min(0, ...all)
  const X = (i: number) => pl + (i * (W - pl - pr)) / (cur.length - 1)
  const Y = (v: number) => pt + (1 - (v - min) / (max - min)) * (H - pt - pb)
  const pathOf = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight') setIdx(Math.min(cur.length - 1, idx + 1))
    else if (e.key === 'ArrowLeft') setIdx(Math.max(0, idx - 1))
    else if (e.key === 'Home') setIdx(0)
    else if (e.key === 'End') setIdx(cur.length - 1)
    else return
    e.preventDefault()
  }
  const ticks = [0, 1, 2, 3, 4].map(k => min + ((max - min) * k) / 4)
  const desc = `Day ${idx + 1}: ${fmt(cur[idx])}${compare ? `, previous period ${fmt(prev[idx])}` : ''}`
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="group" aria-roledescription="interactive line chart" aria-label={`${label} over time. Use left and right arrow keys to inspect each day.`} tabIndex={0} onKeyDown={onKey}
        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * W; setIdx(Math.max(0, Math.min(cur.length - 1, Math.round(((x - pl) / (W - pl - pr)) * (cur.length - 1))))) }}>
        {ticks.map(t => (<g key={t}><line x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} stroke="var(--c-border)" /><text x={pl - 8} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="var(--c-text-secondary)">{fmt(t)}</text></g>))}
        {compare && <path d={pathOf(prev)} fill="none" stroke="var(--viz-comparison)" strokeWidth="2" strokeDasharray="5 4" />}
        <path d={pathOf(cur)} fill="none" stroke="var(--viz-1)" strokeWidth="2.6" strokeLinejoin="round" />
        {uploads.map(u => (<g key={u.t}><line x1={X(u.i)} x2={X(u.i)} y1={pt - 4} y2={H - pb} stroke="var(--c-control-border)" strokeDasharray="3 3" /><path d={`M${X(u.i)} ${pt - 12} l6 6 l-6 6 l-6 -6 Z`} fill="var(--viz-1)" /><text x={X(u.i) + 9} y={pt - 3} fontSize="10.5" fontWeight="600" fill="var(--c-text-primary)">{u.t}</text></g>))}
        <line x1={X(idx)} x2={X(idx)} y1={pt} y2={H - pb} stroke="var(--c-text-primary)" strokeWidth="1" />
        <circle cx={X(idx)} cy={Y(cur[idx])} r="5" fill="var(--c-bg)" stroke="var(--viz-1)" strokeWidth="2.5" />
        <text x={pl} y={H - 8} fontSize="11" fill="var(--c-text-secondary)">Day 1</text>
        <text x={W - pr} y={H - 8} textAnchor="end" fontSize="11" fill="var(--c-text-secondary)">Day {cur.length}</text>
      </svg>
      <p aria-live="polite" style={{ margin: '4px 0', fontWeight: 600 }}>{desc}</p>
      <details><summary style={{ minHeight: 48, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>View as data table</summary>
        <div tabIndex={0} role="region" aria-label={`${label} data table, scrollable`} style={{ maxHeight: 180, overflow: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%' }}><caption className="sr-only">{label} by day</caption><thead><tr><th scope="col" align="left">Day</th><th scope="col" align="right">This period</th>{compare && <th scope="col" align="right">Previous</th>}</tr></thead>
          <tbody>{cur.map((v, i) => <tr key={i}><th scope="row" align="left">{i + 1}</th><td align="right">{fmt(v)}</td>{compare && <td align="right">{fmt(prev[i])}</td>}</tr>)}</tbody></table></div></details>
    </div>
  )
}

type Vid = { id: string; t: string; ctr: number; apv: number; drop: number }
const VIDS: Vid[] = [
  { id: 'a', t: 'Big-O', ctr: 6.9, apv: 52, drop: 14 }, { id: 'b', t: 'Hash maps', ctr: 8.1, apv: 61, drop: 19 }, { id: 'c', t: 'Trees', ctr: 5.2, apv: 58, drop: 12 },
  { id: 'd', t: 'Sorting', ctr: 3.1, apv: 64, drop: 9 }, { id: 'e', t: 'Graphs 101', ctr: 7.6, apv: 33, drop: 31 }, { id: 'f', t: 'DP basics', ctr: 2.8, apv: 29, drop: 28 },
  { id: 'g', t: 'Recursion', ctr: 4.4, apv: 41, drop: 22 }, { id: 'h', t: 'Heaps', ctr: 3.6, apv: 47, drop: 15 },
]
const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]
const diagnose = (v: Vid, mc: number, ma: number) => {
  const hiC = v.ctr >= mc, hiA = v.apv >= ma
  if (hiC && hiA) return { k: 'Winner', s: 'Packaging and content both work. Reuse the format.' }
  if (!hiC && hiA) return { k: 'Weak packaging', s: 'Viewers who click stay. Test a clearer title or thumbnail.' }
  if (hiC && !hiA) return { k: 'Weak retention', s: 'The promise attracts clicks but viewers leave. Check the first minute and trim the intro.' }
  return { k: 'Rethink topic or format', s: 'Neither click-through nor retention is strong. Compare with a winner.' }
}

export default function Dashboard() {
  const [metric, setMetric] = useState<MetricId>('views')
  const [range, setRange] = useState(28)
  const [compare, setCompare] = useState(true)
  const [sel, setSel] = useState('b')
  const cid = useId()
  const m = METRICS.find(x => x.id === metric)!
  const slice = (id: MetricId, off: number) => series[id].slice(DAYS - range * (off + 1), DAYS - range * off)
  const cur = slice(metric, 0), prev = slice(metric, 1)
  const uploads = UPLOADS.filter(u => u.d >= DAYS - range).map(u => ({ i: u.d - (DAYS - range), t: u.t }))
  const mc = med(VIDS.map(v => v.ctr)), ma = med(VIDS.map(v => v.apv))
  const chosen = VIDS.find(v => v.id === sel)!
  const dx = diagnose(chosen, mc, ma)
  const retention = useMemo(() => Array.from({ length: 25 }, (_, i) => (i === 0 ? 100 : i <= 2 ? 100 - (chosen.drop * i) : 100 - chosen.drop * 2 - (i - 2) * ((100 - chosen.apv - chosen.drop * 2 + 12) / 22 * 0.9))), [chosen])
  const topUpload = uploads.length ? uploads.reduce((a, b) => (a.i > b.i ? a : b)) : null
  const pc = (cv: number, pv: number) => ((cv / pv - 1) * 100)

  return (
    <section aria-labelledby="p2h">
      <div className="panel" style={{ marginBottom: 12 }}>
        <h1 id="p2h" style={{ fontSize: 22, margin: 0 }}>Project 2 · Creator Studio analytics (concept)</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>Illustrative sample data. Pick a KPI, change the range, toggle compare, and use ← → on the chart. Click a video in the quadrant chart for a diagnosis.</p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <label htmlFor={`${cid}r`} style={{ fontWeight: 600 }}>Date range</label>
        <select id={`${cid}r`} value={range} onChange={e => setRange(Number(e.target.value))} style={{ minHeight: 48, padding: '0 12px', border: '2px solid var(--c-control-border)', borderRadius: 8, background: 'var(--c-bg)' }}>
          {[7, 28, 90].map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 48, fontWeight: 600 }}><input type="checkbox" role="switch" checked={compare} onChange={e => setCompare(e.target.checked)} style={{ width: 24, height: 24 }} />Compare to previous period</label>
      </div>
      <div role="group" aria-label="Key metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 12 }}>
        {METRICS.map(k => {
          const c = agg(slice(k.id, 0), k), p = agg(slice(k.id, 1), k), up = c >= p
          return (
            <button key={k.id} aria-pressed={metric === k.id} onClick={() => setMetric(k.id)} className="panel" style={{ textAlign: 'left', borderColor: metric === k.id ? 'var(--c-text-primary)' : undefined, borderWidth: metric === k.id ? 3 : 1.5, minHeight: 96 }}>
              <div className="muted" style={{ fontWeight: 600 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{k.fmt(c)}</div>
              <div style={{ fontWeight: 700, color: up === k.higherIsBetter ? 'var(--c-success)' : 'var(--c-error)' }}>{up ? '▲' : '▼'} {Math.abs(pc(c, p)).toFixed(1)}% <span className="muted" style={{ fontWeight: 400 }}>vs previous</span></div>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        <div className="panel" style={{ gridColumn: 'span 2', minWidth: 0 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>{m.label} over time</h2>
          <LineChart key={`${metric}-${range}`} cur={cur} prev={prev} compare={compare} fmt={m.fmt} label={m.label} uploads={uploads} />
        </div>
        <aside className="panel" aria-label="What changed">
          <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>What changed</h2>
          <p><b>{m.label}</b> is {pc(agg(cur, m), agg(prev, m)) >= 0 ? 'up' : 'down'} {Math.abs(pc(agg(cur, m), agg(prev, m))).toFixed(1)}% compared with the previous {range} days.</p>
          {topUpload && <p>Latest upload in this range: <b>{topUpload.t}</b> (day {topUpload.i + 1}).</p>}
          <p className="muted">Sample insight text is generated from the same data you see on the chart.</p>
        </aside>
        <div className="panel" style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>Packaging vs content</h2>
          <p className="muted" style={{ margin: '0 0 4px', fontSize: 12 }}>Click-through rate (→) vs average % viewed (↑). Dashed lines are medians.</p>
          <svg viewBox="0 0 420 300" width="100%" role="group" aria-label="Scatter plot of videos by click-through rate and average percent viewed">
            <rect x="40" y="10" width="370" height="250" fill="var(--c-surface)" />
            <line x1={40 + ((mc - 2) / 7) * 370} x2={40 + ((mc - 2) / 7) * 370} y1="10" y2="260" stroke="var(--c-control-border)" strokeDasharray="4 4" />
            <line x1="40" x2="410" y1={260 - ((ma - 20) / 50) * 250} y2={260 - ((ma - 20) / 50) * 250} stroke="var(--c-control-border)" strokeDasharray="4 4" />
            {VIDS.map(v => {
              const d = diagnose(v, mc, ma), cx = 40 + ((v.ctr - 2) / 7) * 370, cy = 260 - ((v.apv - 20) / 50) * 250, on = v.id === sel
              const shape = d.k === 'Winner' ? <circle r="8" fill="var(--viz-1)" /> : d.k === 'Weak retention' ? <rect x="-7" y="-7" width="14" height="14" fill="var(--viz-2)" /> : d.k === 'Weak packaging' ? <path d="M0 -9 L8 6 L-8 6 Z" fill="var(--viz-5)" /> : <path d="M0 -9 L9 0 L0 9 L-9 0 Z" fill="var(--viz-4)" />
              return (
                <g key={v.id} transform={`translate(${cx} ${cy})`} role="button" tabIndex={0} aria-pressed={on} aria-label={`${v.t}: click-through ${v.ctr}%, average viewed ${v.apv}%. ${d.k}`}
                  onClick={() => setSel(v.id)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(v.id))} style={{ cursor: 'pointer' }}>
                  {on && <circle r="15" fill="none" stroke="var(--c-text-primary)" strokeWidth="2.5" />}{shape}
                  <text x="12" y="4" fontSize="11" fontWeight="600" fill="var(--c-text-primary)">{v.t}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="panel" style={{ minWidth: 0 }} aria-live="polite">
          <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>Audience retention · {chosen.t}</h2>
          <svg viewBox="0 0 420 220" width="100%" role="img" aria-label={`Retention curve for ${chosen.t}: ${Math.round(retention[2])} percent still watching at one minute`}>
            {[0, 50, 100].map(v => <g key={v}><line x1="40" x2="410" y1={200 - v * 1.8} y2={200 - v * 1.8} stroke="var(--c-border)" /><text x="34" y={204 - v * 1.8} textAnchor="end" fontSize="11" fill="var(--c-text-secondary)">{v}%</text></g>)}
            <rect x="40" y="20" width="31" height="180" fill="var(--viz-4)" opacity=".12" />
            <path d={retention.map((v, i) => `${i ? 'L' : 'M'}${40 + i * 15.4} ${200 - Math.max(0, v) * 1.8}`).join(' ')} fill="none" stroke="var(--viz-1)" strokeWidth="2.8" />
            <text x="80" y={200 - retention[2] * 1.8 + 28} fontSize="12" fontWeight="700" fill="var(--c-text-primary)">{Math.round(retention[2])}% at 1:00</text>
          </svg>
          <p style={{ margin: '8px 0 0' }}><b>{dx.k}.</b> {dx.s}</p>
          <p className="muted" style={{ fontSize: 12 }}>Illustrative sample curve, not real analytics.</p>
        </div>
      </div>
    </section>
  )
}
