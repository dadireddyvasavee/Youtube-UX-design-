import { useMemo, useState } from 'react'

type Video = { id: string; title: string; channel: string; min: number; chapters: number; topic: string; hue: number; progress?: number }
const VIDEOS: Video[] = [
  { id: 'v1', title: 'Understanding hash maps in 12 minutes', channel: 'CodeLoom', min: 12, chapters: 4, topic: 'Coding', hue: 165 },
  { id: 'v2', title: 'Binary search, visually', channel: 'Algo Atlas', min: 7, chapters: 3, topic: 'Coding', hue: 215 },
  { id: 'v3', title: 'Big-O without the math', channel: 'CodeLoom', min: 8, chapters: 3, topic: 'Coding', hue: 25 },
  { id: 'v4', title: 'Trees in plain English', channel: 'Algo Atlas', min: 11, chapters: 5, topic: 'Coding', hue: 270 },
  { id: 'v5', title: 'Dynamic programming, slowly', channel: 'Deep Dive', min: 21, chapters: 6, topic: 'Coding', hue: 45 },
  { id: 'v6', title: 'Sourdough starter, day by day', channel: 'Crumb Lab', min: 18, chapters: 4, topic: 'Cooking', hue: 30 },
  { id: 'v7', title: 'How lenses bend light', channel: 'Prism', min: 34, chapters: 7, topic: 'Science', hue: 195 },
  { id: 'v8', title: 'Lo-fi study mix', channel: 'Quiet Hours', min: 52, chapters: 0, topic: 'Music', hue: 300 },
]
const CONTINUE: Video[] = [
  { ...VIDEOS[1], id: 'c1', title: 'Intro to graph algorithms', min: 14, progress: 0.62 },
  { ...VIDEOS[5], id: 'c2', title: 'Sourdough starter, day 3', min: 9, progress: 0.25 },
]
type Intent = 'any' | 'short' | 'mid' | 'long'
const INTENTS: { id: Intent; label: string; test: (m: number) => boolean }[] = [
  { id: 'short', label: '5–10 min', test: m => m <= 10 },
  { id: 'mid', label: '15–30 min', test: m => m >= 11 && m <= 30 },
  { id: 'long', label: '30+ min', test: m => m > 30 },
]
const thumbStyle = (h: number) => ({ background: `linear-gradient(135deg, hsl(${h} 35% 45%), hsl(${h} 45% 18%))` })
const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`)

export default function MobileRedesign() {
  const [screen, setScreen] = useState<'home' | 'watch' | 'queue'>('home')
  const [intent, setIntent] = useState<Intent>('any')
  const [queue, setQueue] = useState<string[]>(['v2', 'v3', 'v4', 'v5'])
  const [fit, setFit] = useState(true)
  const [limit, setLimit] = useState(30)
  const [sheetFor, setSheetFor] = useState<Video | null>(null)
  const [hidden, setHidden] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const [cc, setCc] = useState(true)
  const [speedIdx, setSpeedIdx] = useState(1)
  const [chapter, setChapter] = useState(0)
  const speeds = [1, 1.25, 1.5, 2]

  const feed = useMemo(() => {
    const t = INTENTS.find(i => i.id === intent)
    return VIDEOS.filter(v => !hidden.includes(v.id) && (!t || t.test(v.min)))
  }, [intent, hidden])

  const queued = queue.map(id => VIDEOS.find(v => v.id === id)!).filter(Boolean)
  const plan = useMemo(() => {
    let total = 0
    return queued.map(v => {
      const fits = !fit || total + v.min <= limit
      if (fits) total += v.min
      return { v, fits }
    })
  }, [queued, fit, limit])
  const playMin = plan.filter(p => p.fits).reduce((a, p) => a + p.v.min, 0)

  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2600) }
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= queue.length) return
    const q = [...queue]; [q[i], q[j]] = [q[j], q[i]]; setQueue(q)
  }

  return (
    <section aria-labelledby="p1h" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 24, alignItems: 'start' }}>
      <div className="panel">
        <h1 id="p1h" style={{ fontSize: 22, margin: '0 0 8px' }}>Project 1 · YouTube mobile experience: time-aware discovery</h1>
        <p>Try the phone: choose how much time you have, resume a video, open a video, reorder the queue and use <b>Fit queue to my time</b>, or open a video’s ⋮ menu for the “Why this video?” sheet.</p>
        <ul>
          <li><b>Time intent bar</b> re-ranks the feed to what fits.</li>
          <li><b>Reachable control row</b> puts captions, speed, chapters and quality within thumb reach.</li>
          <li><b>Queue</b> shows total time and moves what will not fit to the next session.</li>
        </ul>
        <p className="muted">Keyboard: Tab through every control. Reorder queue items with the Up/Down buttons. All targets are at least 48 px.</p>
      </div>

      <div aria-label="Phone prototype" style={{ width: 380 }}>
        <div style={{ position: 'relative', width: 360, height: 720, margin: '0 auto', border: '2px solid var(--c-border)', borderRadius: 28, overflow: 'hidden', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {screen === 'home' && (
              <div>
                <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
                  <span aria-hidden style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--c-brand)', display: 'inline-block' }} />
                  <strong style={{ fontSize: 18 }}>YouTube</strong>
                </header>
                <div role="group" aria-label="I have" style={{ display: 'flex', gap: 8, padding: '0 16px', alignItems: 'center', overflowX: 'auto' }}>
                  <span className="muted" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>I have</span>
                  {INTENTS.map(i => (
                    <button key={i.id} className="chip" aria-pressed={intent === i.id} onClick={() => { setIntent(intent === i.id ? 'any' : i.id); say(intent === i.id ? 'Showing all videos' : `Showing videos that fit ${i.label}`) }}>{i.label}</button>
                  ))}
                </div>
                <h2 style={{ fontSize: 16, margin: '16px 16px 8px' }}>Continue watching</h2>
                <ul style={{ display: 'flex', gap: 10, listStyle: 'none', padding: '0 16px', margin: 0, overflowX: 'auto' }}>
                  {CONTINUE.map(c => (
                    <li key={c.id} style={{ flex: '0 0 150px' }}>
                      <button onClick={() => setScreen('watch')} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: 150 }}>
                        <div style={{ ...thumbStyle(c.hue), height: 84, borderRadius: 8, position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${(c.progress ?? 0) * 100}%`, background: 'var(--c-brand)' }} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}><span className="sr-only">Resume </span>{c.title}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{Math.round(c.min * (1 - (c.progress ?? 0)))} min left</div>
                      </button>
                    </li>
                  ))}
                </ul>
                <p aria-live="polite" className="muted" style={{ margin: '16px 16px 4px', fontSize: 12 }}>{feed.length} videos {intent !== 'any' ? 'fit your time' : ''}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {feed.map(v => (
                    <li key={v.id} style={{ marginBottom: 16 }}>
                      <button onClick={() => setScreen('watch')} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
                        <span className="sr-only">{v.title}, {v.min} minutes</span>
                        <div style={{ ...thumbStyle(v.hue), height: 190, position: 'relative' }}>
                          {v.chapters > 0 && <span style={{ position: 'absolute', left: 12, bottom: 10, background: 'rgba(0,0,0,.8)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{v.chapters} chapters</span>}
                          <span style={{ position: 'absolute', right: 12, bottom: 10, background: 'rgba(0,0,0,.8)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{v.min}:00</span>
                        </div>
                      </button>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 8px 0 16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{v.title}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{v.channel} · {v.min} min</div>
                          <button className="chip" style={{ minHeight: 48, marginTop: 4, fontSize: 12 }} onClick={() => { if (!queue.includes(v.id)) { setQueue([...queue, v.id]); say(`Added to queue (${fmt(queued.reduce((a, q) => a + q.min, v.min))} total)`) } else say('Already in your queue') }}>+ Queue</button>
                        </div>
                        <button aria-label={`More options for ${v.title}`} onClick={() => setSheetFor(v)} style={{ minWidth: 48, minHeight: 48, border: 0, background: 'transparent', fontSize: 20 }}>⋮</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {screen === 'watch' && (
              <div>
                <div style={{ ...thumbStyle(165), height: 203, position: 'relative', display: 'grid', placeItems: 'center' }}>
                  <span aria-hidden style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(0,0,0,.55)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 22 }}>▶</span>
                  {cc && <span style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(0,0,0,.82)', color: '#fff', padding: '4px 10px', borderRadius: 4, fontSize: 13 }}>Hash maps store key–value pairs…</span>}
                </div>
                <div style={{ padding: 16 }}>
                  <h2 style={{ fontSize: 16, margin: 0 }}>Understanding hash maps in 12 minutes</h2>
                  <p className="muted" style={{ margin: '4px 0 12px', fontSize: 12 }}>CodeLoom · 1.2M views (sample)</p>
                  <div role="toolbar" aria-label="Player controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, background: 'var(--c-surface)', borderRadius: 12, padding: 4 }}>
                    <button className="chip" aria-pressed={cc} onClick={() => setCc(!cc)} style={{ minHeight: 56 }}>CC<br /><small>{cc ? 'On' : 'Off'}</small></button>
                    <button className="chip" onClick={() => setSpeedIdx((speedIdx + 1) % speeds.length)} style={{ minHeight: 56 }} >{speeds[speedIdx]}×<br /><small>Speed</small></button>
                    <button className="chip" onClick={() => document.getElementById('chapters')?.scrollIntoView({ block: 'nearest' })} style={{ minHeight: 56 }}>Chapters<br /><small>▾</small></button>
                    <button className="chip" style={{ minHeight: 56 }}>HD<br /><small>Auto</small></button>
                  </div>
                  <h3 id="chapters" style={{ fontSize: 14, margin: '16px 0 8px' }}>Chapters</h3>
                  <ul style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, margin: 0, overflowX: 'auto' }}>
                    {['Why hashing', 'Collisions', 'Resizing', 'Wrap-up'].map((c, i) => (
                      <li key={c} style={{ flex: '0 0 104px' }}>
                        <button aria-current={chapter === i} onClick={() => setChapter(i)} className="chip" style={{ width: 104, minHeight: 64, textAlign: 'left', background: chapter === i ? 'var(--c-surface-strong)' : 'var(--c-surface)', color: 'var(--c-text-primary)', borderColor: chapter === i ? 'var(--c-brand)' : 'transparent' }}>
                          <small style={{ color: 'var(--c-text-primary)', fontWeight: 700 }}>{['0:00', '2:15', '5:40', '9:10'][i]}</small><br />{c}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button className="btn" style={{ marginTop: 16, width: '100%' }} onClick={() => setScreen('queue')}>Up next in your queue · {queued.length} videos</button>
                </div>
              </div>
            )}

            {screen === 'queue' && (
              <div style={{ padding: 16 }}>
                <h2 style={{ fontSize: 20, margin: '0 0 4px' }}>Queue</h2>
                <p className="muted" style={{ margin: 0 }}>{queued.length} videos · {fmt(queued.reduce((a, v) => a + v.min, 0))} total</p>
                <div style={{ background: 'var(--c-surface)', borderRadius: 12, padding: 12, margin: '12px 0' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, fontWeight: 700 }}>
                    Fit queue to my time
                    <input type="checkbox" role="switch" checked={fit} onChange={e => setFit(e.target.checked)} style={{ width: 28, height: 28 }} />
                  </label>
                  {fit && (
                    <div role="group" aria-label="Time limit" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[20, 30, 45].map(m => <button key={m} className="chip" aria-pressed={limit === m} onClick={() => setLimit(m)}>{m} min</button>)}
                    </div>
                  )}
                </div>
                <p aria-live="polite" style={{ fontWeight: 700, color: 'var(--c-success)' }}>{fit ? `Fits in ${limit} min · ${playMin} min` : 'Fit to my time is off'}</p>
                <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {plan.map(({ v, fits }, i) => (
                    <li key={v.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', borderTop: !fits && plan[i - 1]?.fits ? '2px dashed var(--c-control-border)' : undefined }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <button aria-label={`Move ${v.title} up`} onClick={() => move(i, -1)} style={{ minWidth: 48, minHeight: 24, border: 0, background: 'none' }}>▲</button>
                        <button aria-label={`Move ${v.title} down`} onClick={() => move(i, 1)} style={{ minWidth: 48, minHeight: 24, border: 0, background: 'none' }}>▼</button>
                      </div>
                      <div style={{ ...thumbStyle(v.hue), width: 96, height: 54, borderRadius: 6, flex: 'none' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{v.title}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{v.min} min</div>
                        {!fits && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-warning)' }}>Saved for next session</div>}
                      </div>
                    </li>
                  ))}
                </ol>
                <button className="btn primary" style={{ width: '100%', marginTop: 12 }} onClick={() => say(`Playing ${playMin} min of your queue`)}>Play queue · {playMin} min</button>
              </div>
            )}
          </div>

          {toast && <div role="status" style={{ position: 'absolute', left: 16, right: 16, bottom: 76, background: '#303030', color: '#fff', padding: '12px 16px', borderRadius: 8 }}>{toast}</div>}

          <nav aria-label="Primary" style={{ display: 'flex', borderTop: '1px solid var(--c-border)', background: 'var(--c-bg)' }}>
            {([['home', 'Home'], ['watch', 'Watch'], ['queue', 'Queue']] as const).map(([id, l]) => (
              <button key={id} aria-current={screen === id ? 'page' : undefined} onClick={() => setScreen(id)} style={{ flex: 1, minHeight: 56, border: 0, background: 'none', fontWeight: screen === id ? 700 : 400 }}>{l}</button>
            ))}
          </nav>

          {sheetFor && (
            <div role="dialog" aria-modal="true" aria-label="Why you’re seeing this" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end' }} onKeyDown={e => e.key === 'Escape' && setSheetFor(null)}>
              <div style={{ background: 'var(--c-bg)', width: '100%', borderRadius: '20px 20px 0 0', padding: 20 }}>
                <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Why you’re seeing this</h2>
                <p style={{ background: 'var(--c-surface)', borderRadius: 10, padding: 12, margin: '0 0 12px', fontSize: 13 }}>Sample reason: you watched 2 videos about {sheetFor.topic.toLowerCase()} this week. “{sheetFor.title}”</p>
                {['Show me fewer videos like this', 'Not interested', 'Too long for now', 'Don’t recommend this channel'].map((o, i) => (
                  <button key={o} className="chip" autoFocus={i === 0} style={{ width: '100%', textAlign: 'left', marginBottom: 6 }}
                    onClick={() => { setHidden([...hidden, sheetFor.id]); setSheetFor(null); say(`${o}. Undo`) }}>{o}</button>
                ))}
                <button className="btn" style={{ width: '100%', marginTop: 4 }} onClick={() => setSheetFor(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        {hidden.length > 0 && <button className="btn" style={{ marginTop: 8 }} onClick={() => { setHidden([]); say('Feedback undone') }}>Undo hidden videos ({hidden.length})</button>}
      </div>
    </section>
  )
}
