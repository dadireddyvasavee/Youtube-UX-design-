import { useState, type KeyboardEvent } from 'react'
import MobileRedesign from './p1/MobileRedesign'
import Dashboard from './p2/Dashboard'
import InclusiveDiscovery from './p3/InclusiveDiscovery'

const PROJECTS = [
  { id: 'p1', label: '1 · Mobile redesign', node: <MobileRedesign /> },
  { id: 'p2', label: '2 · Creator analytics', node: <Dashboard /> },
  { id: 'p3', label: '3 · Inclusive discovery', node: <InclusiveDiscovery /> },
] as const

export default function App() {
  const [active, setActive] = useState(() => { const i = PROJECTS.findIndex(p => `#${p.id}` === window.location.hash); return i < 0 ? 0 : i })
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight') setActive((active + 1) % PROJECTS.length)
    if (e.key === 'ArrowLeft') setActive((active + PROJECTS.length - 1) % PROJECTS.length)
  }
  return (
    <div className="app">
      <a className="skip" href="#main">Skip to prototype</a>
      <div className="banner" role="note">
        <b>Concept prototype.</b> Personal portfolio work, not affiliated with or endorsed by Google or YouTube. All videos,
        channels, counts and analytics are fictional sample data. No user research or usability testing has been conducted.
      </div>
      <div role="tablist" aria-label="Concept projects" className="tabs">
        {PROJECTS.map((p, i) => (
          <button key={p.id} role="tab" id={`tab-${p.id}`} aria-selected={active === i} aria-controls={`panel-${p.id}`}
            tabIndex={active === i ? 0 : -1} className="tab" onClick={() => setActive(i)} onKeyDown={onKey}>
            {p.label}
          </button>
        ))}
      </div>
      <main id="main">
        {PROJECTS.map((p, i) => (
          <div key={p.id} role="tabpanel" id={`panel-${p.id}`} aria-labelledby={`tab-${p.id}`} hidden={active !== i}>
            {active === i && p.node}
          </div>
        ))}
      </main>
    </div>
  )
}
