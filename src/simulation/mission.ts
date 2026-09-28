export type DestinationId = 'earth' | 'moon' | 'mars'
export type DecisionId = 'science' | 'conserve'

export interface SimulatedItem {
  id: string
  name: string
  kind: 'bus' | 'component' | 'instrument'
  cost: number
  mass: number
  powerUse: number
  powerSupply: number
  science: number
  communications: number
  description: string
}

export interface MissionTotals {
  cost: number
  mass: number
  powerUse: number
  powerSupply: number
  science: number
  communications: number
  violations: number
  margin: number
  score: number
}

export const MISSION_LIMITS = { budget: 780, mass: 301 } as const
export const JUDGE_DEMO_SEED = 26_092_028

export const MISSION_ITEMS: SimulatedItem[] = [
  { id: 'bus', name: 'Core spacecraft bus', kind: 'bus', cost: 200, mass: 90, powerUse: 12, powerSupply: 0, science: 0, communications: 0, description: 'Structure, command, and baseline systems.' },
  { id: 'solar', name: 'Deployable solar array', kind: 'component', cost: 120, mass: 60, powerUse: 0, powerSupply: 70, science: 0, communications: 0, description: 'Strong modeled output near the Sun; vulnerable to dust and shadow.' },
  { id: 'rtg', name: 'Radioisotope power unit', kind: 'component', cost: 250, mass: 90, powerUse: 0, powerSupply: 45, science: 0, communications: 0, description: 'Steady modeled output with higher game budget and mass.' },
  { id: 'antenna', name: 'High-gain antenna', kind: 'component', cost: 90, mass: 15, powerUse: 8, powerSupply: 0, science: 0, communications: 50, description: 'Improves the game’s communications margin.' },
  { id: 'camera', name: 'Context camera', kind: 'instrument', cost: 100, mass: 18, powerUse: 18, powerSupply: 0, science: 20, communications: 0, description: 'Captures wide-area surface and terrain observations.' },
  { id: 'spectrometer', name: 'Mineral spectrometer', kind: 'instrument', cost: 170, mass: 28, powerUse: 32, powerSupply: 0, science: 35, communications: 0, description: 'Adds mineral-composition science value.' },
  { id: 'drill', name: 'Sample drill', kind: 'instrument', cost: 140, mass: 38, powerUse: 20, powerSupply: 0, science: 28, communications: 0, description: 'Adds subsurface sampling value and more load.' },
]

export function calculateMission(selectedIds: readonly string[]): MissionTotals {
  const chosen = MISSION_ITEMS.filter((item) => selectedIds.includes(item.id))
  const sum = chosen.reduce((total, item) => ({
    cost: total.cost + item.cost,
    mass: total.mass + item.mass,
    powerUse: total.powerUse + item.powerUse,
    powerSupply: total.powerSupply + item.powerSupply,
    science: total.science + item.science,
    communications: total.communications + item.communications,
  }), { cost: 0, mass: 0, powerUse: 0, powerSupply: 0, science: 0, communications: 0 })
  const violations = Number(sum.cost > MISSION_LIMITS.budget)
    + Number(sum.mass > MISSION_LIMITS.mass)
    + Number(sum.powerUse > sum.powerSupply)
  const margin = Math.max(0, sum.powerSupply - sum.powerUse)
  const score = Math.max(0, Math.min(100, Math.round(
    25 + sum.science * 0.8 + Math.min(12, margin * 0.5)
      + Math.min(12, sum.communications * 0.24) - violations * 28,
  )))
  return { ...sum, violations, margin, score }
}

export function toggleMissionItem(selectedIds: readonly string[], id: string): string[] {
  if (!MISSION_ITEMS.some((item) => item.id === id) || id === 'bus') return [...selectedIds]
  return selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id]
}

export function applyDecisionBonus(score: number, decision: DecisionId | null): number {
  const bonus = decision === 'science' ? 8 : decision === 'conserve' ? 4 : 0
  return Math.max(0, Math.min(100, score + bonus))
}

export function isMissionSuccessful(score: number, violations: number): boolean {
  return score >= 65 && violations === 0
}

export function createWhatIfSelection(selectedIds: readonly string[]): string[] {
  if (selectedIds.includes('spectrometer')) {
    return [...new Set(selectedIds.map((id) => id === 'spectrometer' ? 'drill' : id))]
  }
  if (selectedIds.includes('drill')) {
    return [...new Set(selectedIds.map((id) => id === 'drill' ? 'spectrometer' : id))]
  }
  return [...selectedIds, 'drill']
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let mixed = value
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
  }
}

export interface MissionEvent {
  title: string
  likelihood: number
  impact: string
}

export function createMissionEvent(seed: number): MissionEvent {
  return seededRandom(seed)() > 0.5
    ? { title: 'Regional dust front', likelihood: 34, impact: 'solar output reduced for one mission segment' }
    : { title: 'Deep-space link interruption', likelihood: 27, impact: 'one science packet may be delayed' }
}

export function canLaunchMission(selectedIds: readonly string[], totals = calculateMission(selectedIds)): boolean {
  return selectedIds.includes('bus')
    && selectedIds.every((id) => MISSION_ITEMS.some((item) => item.id === id))
    && totals.violations === 0
}