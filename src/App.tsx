import { lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DataBadge } from './components/DataBadge'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineIndicator } from './components/OfflineIndicator'
import type { DestinationFact } from './services/nasa/nasaService'
import {
  applyDecisionBonus,
  canLaunchMission,
  calculateMission,
  createMissionEvent,
  createWhatIfSelection,
  isMissionSuccessful,
  JUDGE_DEMO_SEED,
  MISSION_ITEMS,
  MISSION_LIMITS,
  toggleMissionItem,
  type DecisionId,
  type DestinationId,
  type MissionEvent,
  type MissionTotals,
  type SimulatedItem,
} from './simulation/mission'
import './App.css'

const NASADataPanel = lazy(() => import('./components/NASADataPanel'))
const FACTS_URL = `${import.meta.env.BASE_URL}fallback/destination-facts.json`
type Screen = 'home' | 'briefing' | 'design' | 'simulation' | 'report'
type DemoStep = { id: string; title: string; caption: string; screen: Screen }

const DESTINATIONS: Array<{ id: DestinationId; label: string; descriptor: string; index: string }> = [
  { id: 'earth', label: 'Earth orbit', descriptor: 'Observe a living planet', index: '01' },
  { id: 'moon', label: 'The Moon', descriptor: 'Survey a near-world', index: '02' },
  { id: 'mars', label: 'Mars', descriptor: 'Search a red frontier', index: '03' },
]
const DEMO_STEPS: DemoStep[] = [
  { id: 'select', title: 'Mission select', caption: 'Choose a destination. This guided run uses Mars to make the engineering trade-offs visible.', screen: 'home' },
  { id: 'briefing', title: 'Mars briefing', caption: 'Review NASA-sourced Mars facts, separate from the game’s mission limits.', screen: 'briefing' },
  { id: 'build', title: 'Build spacecraft', caption: 'Start with a spacecraft bus and add power and communications hardware.', screen: 'design' },
  { id: 'instruments', title: 'Add instruments', caption: 'The camera and spectrometer increase science return and power demand.', screen: 'design' },
  { id: 'tradeoffs', title: 'Show trade-offs', caption: 'Compare budget, mass, and power before the simulated launch.', screen: 'design' },
  { id: 'launch', title: 'Launch', caption: 'Lock the build and begin the seeded mission simulation.', screen: 'simulation' },
  { id: 'crisis', title: 'Crisis event', caption: 'A modeled dust event threatens the power margin.', screen: 'simulation' },
  { id: 'decision', title: 'Decision', caption: 'Choose between preserving science return and protecting reserve.', screen: 'simulation' },
  { id: 'result', title: 'Mission result', caption: 'See the outcome and the modeled constraints behind it.', screen: 'report' },
  { id: 'what-if', title: 'What-if comparison', caption: 'Compare the flown build with an alternate instrument configuration.', screen: 'report' },
  { id: 'nasa-data', title: 'NASA data', caption: 'Finish with the NASA image, citation, and data distinction.', screen: 'report' },
]

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [destination, setDestination] = useState<DestinationId>('mars')
  const [facts, setFacts] = useState<DestinationFact[]>([])
  const [factsReady, setFactsReady] = useState(false)
  const [selected, setSelected] = useState<string[]>(['bus'])
  const [decision, setDecision] = useState<DecisionId | null>(null)
  const [showAbout, setShowAbout] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [usingFallback, setUsingFallback] = useState(false)
  const [demoIndex, setDemoIndex] = useState<number | null>(null)
  const [demoPaused, setDemoPaused] = useState(false)
  const [simulationSeconds, setSimulationSeconds] = useState(0)
  const [whatIfOpen, setWhatIfOpen] = useState(false)
  const [seed, setSeed] = useState(JUDGE_DEMO_SEED)
  const decisionSubmitted = useRef(false)
  const totals = useMemo(() => calculateMission(selected), [selected])
  const isDemo = demoIndex !== null
  const demoStep = demoIndex === null ? null : DEMO_STEPS[Math.min(demoIndex, DEMO_STEPS.length - 1)]
  const activeScreen = demoStep?.screen ?? (isDemo ? 'report' : screen)
  const fact = facts.find((item) => item.id === destination) ?? null
  const event = useMemo(() => createMissionEvent(seed), [seed])
  const score = applyDecisionBonus(totals.score, decision)
  const succeeded = isMissionSuccessful(score, totals.violations)

  const onSourceChange = useCallback((source: 'live' | 'cache' | 'fallback' | null) => {
    setUsingFallback(source === 'fallback')
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void fetch(FACTS_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Fact archive unavailable')
        return response.json() as Promise<unknown>
      })
      .then((value: unknown) => {
        if (!Array.isArray(value)) throw new Error('Invalid fact archive')
        const valid = value.filter((item): item is DestinationFact => {
          if (typeof item !== 'object' || item === null) return false
          const record = item as Record<string, unknown>
          return ['earth', 'moon', 'mars'].includes(String(record.id)) && typeof record.name === 'string'
            && typeof record.distance === 'string' && typeof record.gravity === 'string'
            && typeof record.dayLength === 'string' && typeof record.factSheetUrl === 'string'
        })
        if (valid.length !== 3) throw new Error('Incomplete fact archive')
        setFacts(valid)
        setFactsReady(true)
      })
      .catch(() => { if (!controller.signal.aborted) setFactsReady(true) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (demoIndex === null || demoPaused) return
    const timer = window.setTimeout(() => setDemoIndex((value) => value === null ? null : value + 1), 8_000)
    return () => window.clearTimeout(timer)
  }, [demoIndex, demoPaused])

  useEffect(() => {
    if (demoIndex === null || demoIndex < DEMO_STEPS.length) return
    startTransition(() => {
      setDemoIndex(null)
      setDemoPaused(false)
      setScreen('report')
    })
  }, [demoIndex])

  useEffect(() => {
    if (activeScreen !== 'simulation' || isDemo) return
    const timer = window.setInterval(() => setSimulationSeconds((value) => value + 1), 1_000)
    return () => window.clearInterval(timer)
  }, [activeScreen, isDemo])

  useEffect(() => {
    if (!showAbout) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowAbout(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showAbout])

  const startDemo = () => {
    setDestination('mars')
    setSelected(['bus', 'solar', 'antenna', 'camera', 'spectrometer'])
    setDecision('science')
    decisionSubmitted.current = false
    setWhatIfOpen(false)
    setSeed(JUDGE_DEMO_SEED)
    setSimulationSeconds(0)
    setDemoPaused(false)
    setDemoIndex(0)
  }
  const exitDemo = () => {
    setDemoIndex(null); setDemoPaused(false); setScreen('home'); setDestination('mars')
    decisionSubmitted.current = false
    setSelected(['bus']); setDecision(null); setSimulationSeconds(0); setSeed((value) => value + 1)
  }
  const resetMission = () => {
    decisionSubmitted.current = false
    setDemoIndex(null); setScreen('home'); setSelected(['bus']); setDecision(null)
    setWhatIfOpen(false); setSimulationSeconds(0); setSeed((value) => value + 1)
  }
  const toggleItem = (id: string) => setSelected((items) => toggleMissionItem(items, id))
  const beginMission = () => { decisionSubmitted.current = false; setSelected(['bus']); setDecision(null); setScreen('design') }
  const launchMission = () => {
    if (screen !== 'design' || !canLaunchMission(selected, totals)) return
    decisionSubmitted.current = false
    setDecision(null); setSimulationSeconds(0); setScreen('simulation')
  }
  const submitDecision = (choice: DecisionId) => {
    if (screen !== 'simulation' || decisionSubmitted.current || isDemo) return
    decisionSubmitted.current = true
    setDecision(choice)
    setScreen('report')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="wordmark" type="button" onClick={isDemo ? exitDemo : () => setScreen('home')} aria-label="Orbital Command home">
          <span className="wordmark__glyph" aria-hidden="true">OC</span><span className="wordmark__text">ORBITAL <b>COMMAND</b></span>
        </button>
        <div className="topbar__right"><span className="topbar__edition">MISSION DESIGN / 2026</span><OfflineIndicator online={online} usingFallback={usingFallback} />
          <button className="icon-button" type="button" onClick={() => setShowAbout(true)} aria-label="About the data" title="About the data">i</button>
        </div>
      </header>
      <main id="main-content" className="main-content">
        {activeScreen === 'home' && <HomeScreen destination={destination} onDestination={setDestination} onBriefing={() => setScreen('briefing')} onStartDemo={startDemo} onAbout={() => setShowAbout(true)} />}
        {activeScreen === 'briefing' && (fact ? <BriefingScreen destination={destination} fact={fact} onBack={() => setScreen('home')} onBegin={beginMission} onSourceChange={onSourceChange} /> : <LoadingMessage ready={factsReady} />)}
        {activeScreen === 'design' && <DesignScreen selected={selected} totals={totals} onToggle={toggleItem} onBack={() => setScreen('briefing')} onLaunch={launchMission} onReset={resetMission} />}
        {activeScreen === 'simulation' && <SimulationScreen event={event} elapsed={simulationSeconds} totals={totals} readOnly={isDemo} demoStep={demoStep?.id ?? null} onBack={() => setScreen('design')} onOpenEvent={() => setSimulationSeconds(2)} onDecision={submitDecision} />}
        {activeScreen === 'report' && fact && <ReportScreen destination={destination} fact={fact} totals={totals} selected={selected} score={score} succeeded={succeeded} decision={decision} whatIfOpen={whatIfOpen || demoStep?.id === 'what-if'} onToggleWhatIf={() => setWhatIfOpen((value) => !value)} onSourceChange={onSourceChange} onReset={resetMission} />}
        {activeScreen === 'briefing' && factsReady && !fact && <p className="screen-error" role="alert">The local NASA fact archive could not be loaded. Please reload the app.</p>}
      </main>
      <footer className="app-footer"><span>DESIGNED FOR LEARNING · NOT A FLIGHT DESIGN TOOL</span><span>NASA facts cited · game parameters simulated</span></footer>

      {isDemo && demoStep && <aside className="demo-guide" aria-label="Judge demo guide" aria-live="polite">
        <div className="demo-guide__topline"><span className="live-mark"><span /> JUDGE DEMO</span><span>{String(demoIndex + 1).padStart(2, '0')} / {DEMO_STEPS.length}</span></div>
        <div className="demo-progress" role="progressbar" aria-valuemin={0} aria-valuemax={DEMO_STEPS.length} aria-valuenow={demoIndex + 1}><span style={{ transform: `scaleX(${(demoIndex + 1) / DEMO_STEPS.length})` }} /></div>
        <h2>{demoStep.title}</h2><p>{demoStep.caption}</p>
        <div className="demo-guide__controls">
          <button className="button button--quiet" type="button" onClick={() => setDemoPaused((value) => !value)}>{demoPaused ? 'Resume' : 'Pause'}</button>
          <button className="button button--quiet" type="button" onClick={() => setDemoIndex((value) => value === null ? null : value + 1)}>Next step</button>
          <button className="text-button" type="button" onClick={() => { setDemoIndex(null); setScreen('report') }}>Skip to result</button>
          <button className="text-button" type="button" onClick={exitDemo}>Exit demo</button>
        </div>
      </aside>}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  )
}

function HomeScreen({ destination, onDestination, onBriefing, onStartDemo, onAbout }: {
  destination: DestinationId; onDestination: (value: DestinationId) => void; onBriefing: () => void; onStartDemo: () => void; onAbout: () => void
}) {
  return <section className="home-screen page-enter">
    <div className="hero-copy"><div className="hero-copy__eyebrow"><span className="eyebrow-line" /> FLIGHT SYSTEM / 01</div>
      <h1>Every mission<br /><em>is a trade.</em></h1>
      <p>Design a spacecraft, balance limited resources, and discover what your decisions make possible.</p>
      <div className="hero-copy__actions"><button className="button button--primary" type="button" onClick={onBriefing}>Start a mission <span aria-hidden="true">↗</span></button>
        <button className="button button--outline" type="button" onClick={onStartDemo}><span className="play-icon" aria-hidden="true">▶</span> Judge Demo <span className="button-meta">90 SEC</span></button></div>
      <button className="text-button about-link" type="button" onClick={onAbout}>How to read the data <span aria-hidden="true">↗</span></button>
    </div>
    <div className="mission-selector"><div className="section-topline"><div><p className="eyebrow">Choose your destination</p><h2>Where to?</h2></div><span className="section-count">3 / 03</span></div>
      <div className="destination-list">{DESTINATIONS.map((item) => <button className={`destination-option${destination === item.id ? ' is-selected' : ''}`} key={item.id} type="button" aria-pressed={destination === item.id} onClick={() => onDestination(item.id)}>
        <span className={`planet-mark planet-mark--${item.id}`} aria-hidden="true" /><span className="destination-option__copy"><strong>{item.label}</strong><small>{item.descriptor}</small></span><span className="destination-option__index">{item.index}</span><span className="destination-option__arrow" aria-hidden="true">↗</span>
      </button>)}</div>
      <div className="selector-footnote"><span className="footnote-mark">i</span><span>Facts are sourced. Mission costs and hardware are game models.</span></div>
    </div><div className="home-screen__coordinates" aria-hidden="true">MISSION CONTROL <span>34° 12′ N / 118° 10′ W</span></div>
  </section>
}

function BriefingScreen({ destination, fact, onBack, onBegin, onSourceChange }: {
  destination: DestinationId; fact: DestinationFact; onBack: () => void; onBegin: () => void; onSourceChange: (source: 'live' | 'cache' | 'fallback' | null) => void
}) {
  return <section className="workflow-screen page-enter"><WorkflowHeader eyebrow="01 / MISSION BRIEFING" title={`${fact.name}, in context`} onBack={onBack} />
    <div className="briefing-grid"><div className="briefing-main"><ErrorBoundary label="NASA data panel"><Suspense fallback={<div className="nasa-skeleton"><span /></div>}><NASADataPanel destination={destination} fallbackImageUrl={fact.imageUrl} onSourceChange={onSourceChange} /></Suspense></ErrorBoundary>
      <div className="fact-sheet"><div className="section-topline"><div><p className="eyebrow">Destination profile</p><h2>Known conditions</h2></div><DataBadge type="real" /></div>
        <div className="fact-grid"><FactItem label={fact.distanceLabel} value={fact.distance} /><FactItem label="Surface gravity" value={fact.gravity} /><FactItem label="Day length" value={fact.dayLength} /><FactItem label="Environment" value={fact.environment} wide /></div>
        <div className="mission-reference"><span>Past mission</span><a href={fact.notableMissionUrl} target="_blank" rel="noopener noreferrer">{fact.notableMission} <span aria-hidden="true">↗</span></a></div>
        <a className="source-link" href={fact.factSheetUrl} target="_blank" rel="noopener noreferrer">NASA / NSSDC planetary fact sheet <span aria-hidden="true">↗</span></a>
      </div></div>
      <aside className="briefing-side"><div className="briefing-objective"><p className="eyebrow">Mission objective</p><h2>{destination === 'earth' ? 'Read the planet.' : destination === 'moon' ? 'Map the near side.' : 'Find the mineral story.'}</h2><p>{destination === 'earth' ? 'Build an orbital observer to study changing clouds and land.' : destination === 'moon' ? 'Design a compact survey craft for repeatable surface observations.' : 'Send a robotic explorer to identify mineral clues in an ancient landscape.'}</p></div>
        <div className="simulated-brief"><div className="section-topline"><p className="eyebrow">Mission constraints</p><DataBadge type="simulated" compact /></div><p>Gameplay limits, not real NASA mission specifications.</p>
          <BriefMetric label="Program budget" value={String(MISSION_LIMITS.budget)} unit="credits" /><BriefMetric label="Mass envelope" value={String(MISSION_LIMITS.mass)} unit="kg model" /><BriefMetric label="Power threshold" value="70" unit="W model" /></div>
        <button className="button button--primary button--full" type="button" onClick={onBegin}>Begin mission design <span aria-hidden="true">→</span></button><p className="fine-print">NASA facts remain separate from the mission simulation.</p>
      </aside></div>
  </section>
}

function WorkflowHeader({ eyebrow, title, onBack, action }: { eyebrow: string; title: string; onBack: () => void; action?: ReactNode }) {
  return <div className="workflow-header"><div><button className="back-button" type="button" onClick={onBack}>← <span>Back</span></button><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{action}</div>
}
function FactItem({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`fact-item${wide ? ' fact-item--wide' : ''}`}><span>{label}</span><strong>{value}</strong></div>
}
function BriefMetric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return <div className="brief-metric"><span>{label}</span><strong>{value} <small>{unit}</small></strong></div>
}
function LoadingMessage({ ready }: { ready: boolean }) {
  return <div className="loading-panel" role="status">{ready ? 'NASA destination archive unavailable.' : 'Loading destination briefing'}</div>
}

function DesignScreen({ selected, totals, onToggle, onBack, onLaunch, onReset }: {
  selected: string[]; totals: MissionTotals; onToggle: (id: string) => void; onBack: () => void; onLaunch: () => void; onReset: () => void
}) {
  const groups: Array<{ kind: SimulatedItem['kind']; label: string }> = [{ kind: 'bus', label: 'Spacecraft bus' }, { kind: 'component', label: 'Subsystems' }, { kind: 'instrument', label: 'Science instruments' }]
  return <section className="workflow-screen page-enter"><WorkflowHeader eyebrow="02 / SPACECRAFT CONFIGURATION" title="Build with intent." onBack={onBack} action={<button className="text-button" type="button" onClick={onReset}>Reset mission</button>} />
    <div className="design-layout"><div className="component-catalog">{groups.map((group) => <section className="catalog-group" key={group.kind}><div className="catalog-group__heading"><h2>{group.label}</h2><DataBadge type="simulated" compact /></div>
      <div className="component-list">{MISSION_ITEMS.filter((item) => item.kind === group.kind).map((item) => { const active = selected.includes(item.id); return <button className={`component-row${active ? ' is-active' : ''}`} key={item.id} type="button" aria-pressed={active} disabled={item.kind === 'bus'} onClick={() => onToggle(item.id)}>
        <span className={`component-check${active ? ' is-checked' : ''}`} aria-hidden="true">{active ? '✓' : '+'}</span><span className="component-row__body"><strong>{item.name}</strong><small>{item.description}</small></span><span className="component-row__stats"><b>{item.cost} cr</b><small>{item.mass} kg · {item.powerUse ? `+${item.powerUse} W` : item.powerSupply ? `−${item.powerSupply} W` : 'base load'}</small></span>
      </button> })}</div></section>)}<p className="catalog-note"><span aria-hidden="true">i</span> All equipment values are simplified game parameters.</p></div>
      <aside className="mission-ledger" aria-label="Simulated mission resource summary"><div className="ledger-head"><div><p className="eyebrow">Live configuration</p><h2>Mission ledger</h2></div><DataBadge type="simulated" compact /></div>
        <ResourceBar label="Budget" value={`${totals.cost} / ${MISSION_LIMITS.budget} cr`} percent={Math.min(100, totals.cost / MISSION_LIMITS.budget * 100)} over={totals.cost > MISSION_LIMITS.budget} />
        <ResourceBar label="Mass" value={`${totals.mass} / ${MISSION_LIMITS.mass} kg`} percent={Math.min(100, totals.mass / MISSION_LIMITS.mass * 100)} over={totals.mass > MISSION_LIMITS.mass} />
        <ResourceBar label="Power load / supply" value={`${totals.powerUse} / ${totals.powerSupply} W`} percent={Math.min(100, totals.powerUse / Math.max(1, totals.powerSupply) * 100)} over={totals.powerUse > totals.powerSupply} />
        <div className="ledger-data"><div><span>Science return</span><strong>{totals.science}<small> pts</small></strong></div><div><span>Link margin</span><strong>{totals.communications}<small> pts</small></strong></div><div><span>Est. score</span><strong>{totals.score}<small>/100</small></strong></div></div>
        {totals.violations ? <p className="limit-warning" role="alert">Resolve {totals.violations} limit {totals.violations === 1 ? 'violation' : 'violations'} before launch.</p> : <p className="limit-success" role="status">Configuration is within the modeled limits.</p>}
        <button className="button button--primary button--full" type="button" disabled={totals.violations > 0} onClick={onLaunch}>Launch mission <span aria-hidden="true">↗</span></button><p className="fine-print">Estimates do not represent flight hardware.</p>
      </aside></div>
  </section>
}

function ResourceBar({ label, value, percent, over }: { label: string; value: string; percent: number; over: boolean }) {
  return <div className={`resource-row${over ? ' resource-row--over' : ''}`}><div className="resource-row__labels"><span>{label}</span><strong>{value}</strong></div><div className="resource-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}><span style={{ transform: `scaleX(${percent / 100})` }} /></div></div>
}

function SimulationScreen({ event, elapsed, totals, readOnly, demoStep, onBack, onOpenEvent, onDecision }: {
  event: MissionEvent; elapsed: number; totals: MissionTotals; readOnly: boolean; demoStep: string | null; onBack: () => void; onOpenEvent: () => void; onDecision: (choice: DecisionId) => void
}) {
  const crisis = readOnly ? demoStep === 'crisis' || demoStep === 'decision' : elapsed >= 2
  const choosing = readOnly ? demoStep === 'decision' : crisis
  return <section className="workflow-screen page-enter"><WorkflowHeader eyebrow="03 / MISSION OPERATIONS" title="Cruise is never quiet." onBack={onBack} />
    <div className="simulation-grid"><div className="mission-telemetry"><div className="telemetry-map" aria-label="Illustrative simulated mission trajectory"><span className="telemetry-map__orbit telemetry-map__orbit--one" /><span className="telemetry-map__orbit telemetry-map__orbit--two" /><span className="telemetry-map__planet" /><span className="telemetry-map__craft" /><span className="telemetry-map__grid-label telemetry-map__grid-label--one">SOL 018</span><span className="telemetry-map__grid-label telemetry-map__grid-label--two">MARS TRANSFER · SIMULATED</span></div>
      <div className="telemetry-status"><div><span className="live-mark"><span /> {crisis ? 'EVENT WINDOW' : 'CRUISE PHASE'}</span><p>{crisis ? 'Segment 04 / Science operations' : 'Segment 03 / Transfer cruise'}</p></div><span className="telemetry-clock">T+ {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</span></div>
      <div className="telemetry-readouts"><Readout label="Power margin" value={`${totals.margin} W`} /><Readout label="Data collected" value={`${Math.min(100, totals.science * 2)}%`} /><Readout label="Link quality" value={`${Math.min(99, 42 + totals.communications)}%`} /></div></div>
      <aside className="event-console"><p className="eyebrow">Operations log / 02</p><h2>{crisis ? event.title : 'Mission systems nominal.'}</h2><p>{crisis ? `A modeled event could cause ${event.impact}. Choose how to protect the mission.` : 'Telemetry is stable. A mission event is queued for the next operations window.'}</p>
        {crisis && <div className="event-risk"><span>Event probability</span><strong>{event.likelihood}%</strong><DataBadge type="simulated" compact /></div>}
        {!choosing ? <button className="button button--primary button--full" type="button" onClick={onOpenEvent}>Open operations window <span aria-hidden="true">→</span></button> : <div className="decision-options">
          <DecisionButton letter="A" title="Keep science priority" description="Accept more modeled power risk; gain data." gain="+8 score" disabled={readOnly} onClick={() => onDecision('science')} />
          <DecisionButton letter="B" title="Protect power reserve" description="Reduce ambition; improve resilience." gain="+4 score" disabled={readOnly} onClick={() => onDecision('conserve')} />
          {readOnly && <p className="inline-note">The guided demo records decision A to keep its outcome reproducible.</p>}
        </div>}
        <p className="fine-print"><DataBadge type="simulated" compact /> Event model and consequences are game-simulated.</p>
      </aside></div></section>
}
function Readout({ label, value }: { label: string; value: string }) {
  return <div className="readout"><span>{label}</span><strong>{value}</strong><DataBadge type="simulated" compact /></div>
}
function DecisionButton({ letter, title, description, gain, disabled, onClick }: { letter: string; title: string; description: string; gain: string; disabled: boolean; onClick: () => void }) {
  return <button className="decision-option" type="button" disabled={disabled} onClick={onClick}><span className="decision-option__key">{letter}</span><span><strong>{title}</strong><small>{description}</small></span><span className="decision-option__gain">{gain}</span></button>
}

function ReportScreen({ destination, fact, totals, selected, score, succeeded, decision, whatIfOpen, onToggleWhatIf, onSourceChange, onReset }: {
  destination: DestinationId; fact: DestinationFact; totals: MissionTotals; selected: string[]; score: number; succeeded: boolean; decision: DecisionId | null; whatIfOpen: boolean; onToggleWhatIf: () => void; onSourceChange: (source: 'live' | 'cache' | 'fallback' | null) => void; onReset: () => void
}) {
  const alternate = calculateMission(createWhatIfSelection(selected))
  const alternateScore = applyDecisionBonus(alternate.score, decision)
  return <section className="workflow-screen page-enter"><WorkflowHeader eyebrow="04 / MISSION DEBRIEF" title="The mission, measured." onBack={onReset} action={<button className="button button--outline" type="button" onClick={onReset}>New mission</button>} />
    <div className="report-grid"><div className={`outcome-panel${succeeded ? '' : ' outcome-panel--caution'}`}><div className="outcome-panel__top"><span className="eyebrow">MISSION STATUS / SIMULATED</span><span className="outcome-stamp">{succeeded ? 'OBJECTIVES MET' : 'PARTIAL RETURN'}</span></div>
      <div className="score-line"><strong>{score}</strong><span>/ 100<br />MISSION SCORE</span></div><div className="score-track"><span style={{ transform: `scaleX(${score / 100})` }} /></div>
      <p>{succeeded ? 'Your configuration supported a strong science return within the modeled resource limits.' : 'Your mission returned useful data, but a resource constraint reduced its modeled success.'}</p>
      <div className="outcome-metrics"><div><span>Science points</span><strong>{totals.science}</strong></div><div><span>Modeled mass</span><strong>{totals.mass} kg</strong></div><div><span>Decision</span><strong>{decision === 'science' ? 'Science priority' : decision === 'conserve' ? 'Power reserve' : 'No decision'}</strong></div></div><DataBadge type="simulated" />
    </div><aside className="debrief-side"><p className="eyebrow">What shaped the result</p><h2>Trade-offs made visible.</h2><p>Instrument choices raised science value and power demand. The operations decision then shifted the final modeled score.</p>
      <div className="debrief-bar-list"><ResourceBar label="Budget used" value={`${totals.cost} / ${MISSION_LIMITS.budget} cr`} percent={Math.min(100, totals.cost / MISSION_LIMITS.budget * 100)} over={totals.cost > MISSION_LIMITS.budget} /><ResourceBar label="Power load / supply" value={`${totals.powerUse} / ${totals.powerSupply} W`} percent={Math.min(100, totals.powerUse / Math.max(1, totals.powerSupply) * 100)} over={totals.powerUse > totals.powerSupply} /></div>
      <button className="button button--outline button--full" type="button" onClick={onToggleWhatIf} aria-expanded={whatIfOpen}>{whatIfOpen ? 'Hide what-if' : 'Compare a what-if'} <span aria-hidden="true">↗</span></button></aside></div>
    {whatIfOpen && <section className="what-if-panel" aria-labelledby="what-if-title"><div className="what-if-panel__heading"><div><p className="eyebrow">Alternate build / simulated</p><h2 id="what-if-title">What if we swapped the spectrometer for a drill?</h2></div><DataBadge type="simulated" compact /></div><p>A changed instrument mix shifts the modeled science return, mass, power load, and score.</p><div className="comparison-grid"><ComparisonColumn label="Flown configuration" totals={totals} score={score} /><ComparisonColumn label="Alternate configuration" totals={alternate} score={alternateScore} /></div></section>}
    <div className="report-data-row"><div className="report-data-copy"><p className="eyebrow">Source context</p><h2>Real destination. Simulated mission.</h2><p>{fact.name} conditions are NASA-sourced. Hardware, risk, score, and mission outcome are game models.</p><a className="source-link" href={fact.factSheetUrl} target="_blank" rel="noopener noreferrer">Open the NASA fact sheet <span aria-hidden="true">↗</span></a></div>
      <div className="report-nasa-panel"><ErrorBoundary label="NASA data panel"><Suspense fallback={<div className="nasa-skeleton"><span /></div>}><NASADataPanel destination={destination} fallbackImageUrl={fact.imageUrl} onSourceChange={onSourceChange} /></Suspense></ErrorBoundary></div></div>
  </section>
}
function ComparisonColumn({ label, totals, score }: { label: string; totals: MissionTotals; score: number }) {
  return <div className="comparison-column"><span>{label}</span><strong>{score}<small> score</small></strong><div><span>Science</span><b>{totals.science} pts</b></div><div><span>Mass</span><b>{totals.mass} kg</b></div><div><span>Power load</span><b>{totals.powerUse} W</b></div></div>
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
    <button className="icon-button about-modal__close" type="button" onClick={onClose} aria-label="Close about data">×</button><p className="eyebrow">DATA INTEGRITY / 01</p><h2 id="about-title">Two kinds of truth.</h2>
    <div className="about-modal__item"><DataBadge type="real" /><p>Destination facts and NASA imagery link to their sources. Saved samples keep this experience available when the network is not.</p></div>
    <div className="about-modal__item"><DataBadge type="simulated" /><p>Costs, mass, power, probabilities, reliability, scores, and outcomes are simplified game parameters, not spacecraft specifications.</p></div>
    <button className="button button--primary button--full" type="button" onClick={onClose}>Understood</button>
  </section></div>
}

export default App