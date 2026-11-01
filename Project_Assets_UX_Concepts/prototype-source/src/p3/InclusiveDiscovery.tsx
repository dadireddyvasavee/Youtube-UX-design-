import { useMemo, useRef, useState, type KeyboardEvent } from 'react'

type Access = 'captions' | 'humanCaptions' | 'transcript' | 'audioDesc' | 'sign' | 'lowMotion' | 'speechForward'
const FILTERS: { id: Access; label: string; hint: string }[] = [
  { id: 'captions', label: 'Captions', hint: 'Creator-uploaded or human-reviewed' },
  { id: 'humanCaptions', label: 'Human-reviewed captions only', hint: '' },
  { id: 'transcript', label: 'Transcript', hint: 'Searchable, with timestamps' },
  { id: 'audioDesc', label: 'Audio description', hint: 'Narrated visuals' },
  { id: 'sign', label: 'Sign language', hint: '' },
  { id: 'lowMotion', label: 'Low flashing & motion', hint: 'Creator-declared; not guaranteed' },
  { id: 'speechForward', label: 'Speech-forward audio', hint: 'Minimal background music' },
]
type Line = { t: string; s: string }
type Vid = { id: string; title: string; channel: string; dur: string; hue: number; has: Partial<Record<Access, boolean>>; langs: string[]; autoOnly: boolean; lines: Line[] }
const BFS: Line[] = [
  { t: '3:58', s: 'So we start from any node and look at' }, { t: '4:05', s: 'its neighbours before going deeper.' },
  { t: '4:12', s: 'Each new node is added to the queue of unvisited nodes.' }, { t: '4:20', s: 'We then repeat until the queue is empty.' },
  { t: '4:28', s: 'That is the whole idea behind breadth-first search.' }, { t: '11:40', s: 'Pop the next node off the queue and visit it.' },
]
const VIDS: Vid[] = [
  { id: '1', title: 'Graph theory in 15 minutes', channel: 'Algo Atlas', dur: '15:02', hue: 215, has: { captions: true, humanCaptions: true, transcript: true, audioDesc: true, speechForward: true }, langs: ['English', 'हिन्दी', 'తెలుగు'], autoOnly: false, lines: BFS },
  { id: '2', title: 'What is a graph? (beginner)', channel: 'CodeLoom', dur: '9:48', hue: 165, has: { captions: true, humanCaptions: true, transcript: true, lowMotion: true }, langs: ['English'], autoOnly: false, lines: BFS.slice(0, 4) },
  { id: '3', title: 'Graphs & trees explained', channel: 'Deep Dive', dur: '27:30', hue: 25, has: { captions: true, transcript: true }, langs: ['English'], autoOnly: true, lines: BFS.slice(1, 5) },
  { id: '4', title: 'Graph intuition with sign language', channel: 'Signal Study', dur: '12:10', hue: 280, has: { captions: true, humanCaptions: true, sign: true, lowMotion: true }, langs: ['English'], autoOnly: false, lines: [] },
  { id: '5', title: 'Graph algorithms speedrun', channel: 'Hyper Code', dur: '6:31', hue: 45, has: {}, langs: [], autoOnly: false, lines: [] },
]
const BADGE: { id: Access; label: (v: Vid) => string }[] = [
  { id: 'captions', label: v => (v.autoOnly ? 'Auto captions only' : v.has.humanCaptions ? `Human captions · ${v.langs.length} language${v.langs.length > 1 ? 's' : ''}` : 'Captions') },
  { id: 'transcript', label: () => 'Transcript' }, { id: 'audioDesc', label: () => 'Audio description' }, { id: 'sign', label: () => 'Sign language' }, { id: 'lowMotion', label: () => 'Low motion' },
]

export default function InclusiveDiscovery() {
  const [on, setOn] = useState<Set<Access>>(new Set(['captions', 'transcript']))
  const [saveDefaults, setSaveDefaults] = useState(true)
  const [selId, setSelId] = useState('1')
  const [q, setQ] = useState('queue')
  const [msg, setMsg] = useState('')
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => VIDS.filter(v => [...on].every(f => v.has[f])), [on])
  const sel = VIDS.find(v => v.id === selId) ?? results[0]
  const matches = sel ? sel.lines.filter(l => q.trim() && l.s.toLowerCase().includes(q.trim().toLowerCase())) : []
  const toggle = (f: Access) => { const n = new Set(on); n.has(f) ? n.delete(f) : n.add(f); setOn(n) }
  const hi = (s: string) => { if (!q.trim()) return s; const i = s.toLowerCase().indexOf(q.trim().toLowerCase()); return i < 0 ? s : <>{s.slice(0, i)}<mark style={{ background: 'var(--c-focus-ring)', color: 'var(--c-bg)', padding: '0 2px', borderRadius: 3 }}>{s.slice(i, i + q.trim().length)}</mark>{s.slice(i + q.trim().length)}</> }
  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-result]') ?? [])
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); items[Math.min(items.length - 1, i + 1)]?.focus() }
    if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); items[Math.max(0, i - 1)]?.focus() }
  }

  return (
    <section aria-labelledby="p3h">
      <a className="skip" href="#results" style={{ position: 'static', display: 'inline-block', marginBottom: 8, top: 0 }}>Skip to results</a>
      <div className="panel" style={{ marginBottom: 12 }}>
        <h1 id="p3h" style={{ fontSize: 22, margin: 0 }}>Project 3 · Inclusive video discovery (concept)</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>Search results for “intro to graph theory” (fictional data). Toggle Access filters, move through results with ↑/↓ (or J/K), search the transcript and open at a timestamp. Everything works by keyboard.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr) minmax(280px, 360px)', gap: 16, alignItems: 'start' }}>
        <aside aria-label="Access filters" className="panel">
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Access filters</legend>
            <p className="muted" style={{ margin: '0 0 8px', fontSize: 12 }}>Show only videos that offer…</p>
            {FILTERS.map(f => (
              <label key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 48, padding: '6px 0' }}>
                <input type="checkbox" checked={on.has(f.id)} onChange={() => toggle(f.id)} style={{ width: 24, height: 24, marginTop: 2 }} />
                <span><b>{f.label}</b>{f.hint && <><br /><span className="muted" style={{ fontSize: 12 }}>{f.hint}</span></>}</span>
              </label>
            ))}
          </fieldset>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, fontWeight: 700, borderTop: '1px solid var(--c-border)', marginTop: 8 }}>
            Save as my defaults
            <input type="checkbox" role="switch" checked={saveDefaults} onChange={e => { setSaveDefaults(e.target.checked); setMsg(e.target.checked ? 'Defaults saved for search, Home and Subscriptions' : 'Defaults off') }} style={{ width: 28, height: 28 }} />
          </label>
          <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={() => { setOn(new Set()); setMsg('All filters cleared') }}>Clear all filters</button>
        </aside>

        <div id="results" tabIndex={-1}>
          <h2 style={{ fontSize: 16, margin: '0 0 8px' }} aria-live="polite">{results.length} result{results.length === 1 ? '' : 's'} <span className="muted" style={{ fontWeight: 400 }}>{[...on].length ? `with ${FILTERS.filter(f => on.has(f.id)).map(f => f.label).join(' + ')}` : ''}</span></h2>
          {results.length === 0 && <p className="panel">No videos match every selected filter. Try removing “{FILTERS.find(f => on.has(f.id))?.label}”.</p>}
          <ul ref={listRef} onKeyDown={onListKey} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {results.map(v => (
              <li key={v.id}>
                <button data-result aria-pressed={selId === v.id} onClick={() => setSelId(v.id)} className="panel" style={{ display: 'flex', gap: 12, width: '100%', textAlign: 'left', background: selId === v.id ? 'var(--c-surface)' : 'var(--c-bg)', borderColor: selId === v.id ? 'var(--c-focus-ring)' : undefined, borderWidth: selId === v.id ? 2.5 : 1.5 }}>
                  <div aria-hidden style={{ width: 150, height: 84, borderRadius: 8, flex: 'none', background: `linear-gradient(135deg, hsl(${v.hue} 35% 45%), hsl(${v.hue} 45% 18%))` }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{v.title}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{v.channel} · {v.dur}</div>
                    <ul aria-label="Accessibility features" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
                      {BADGE.filter(b => v.has[b.id]).map(b => (
                        <li key={b.id} style={{ border: `1px solid ${v.autoOnly && b.id === 'captions' ? 'var(--c-warning)' : 'var(--c-control-border)'}`, color: v.autoOnly && b.id === 'captions' ? 'var(--c-warning)' : undefined, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{b.label(v)}</li>
                      ))}
                      {!Object.values(v.has).some(Boolean) && <li className="muted" style={{ fontSize: 12 }}>No accessibility features declared</li>}
                    </ul>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="panel" aria-label="Transcript preview">
          <h2 style={{ fontSize: 16, margin: 0 }}>Transcript preview</h2>
          {sel && sel.has.transcript ? (
            <>
              <p className="muted" style={{ margin: '2px 0 8px', fontSize: 12 }}>{sel.title}</p>
              <label htmlFor="tsearch" style={{ fontWeight: 600 }}>Search within transcript</label>
              <input id="tsearch" value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%', minHeight: 48, padding: '0 12px', border: '2px solid var(--c-control-border)', borderRadius: 8, background: 'var(--c-bg)', margin: '4px 0 8px' }} />
              <p aria-live="polite" style={{ fontWeight: 600, fontSize: 12 }} className="muted">{matches.length} match{matches.length === 1 ? '' : 'es'}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {matches.map(l => (
                  <li key={l.t}><button className="panel" style={{ width: '100%', textAlign: 'left', minHeight: 48 }} onClick={() => setMsg(`Opening “${sel.title}” at ${l.t} with captions on`)}>
                    <b style={{ color: 'var(--c-link)' }}>{l.t}</b><br />{hi(l.s)}</button></li>
                ))}
              </ul>
              <p role="status" style={{ fontWeight: 700, minHeight: 24 }}>{msg}</p>
              <p className="muted" style={{ fontSize: 12 }}>Captions: {sel.langs.join(', ') || 'none'}. {sel.autoOnly ? 'Auto-generated only, so accuracy is not guaranteed.' : 'Creator-provided.'}</p>
            </>
          ) : <p className="muted">Select a result that offers a transcript to preview and search it.</p>}
        </aside>
      </div>
    </section>
  )
}
