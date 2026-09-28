import { describe, expect, it } from 'vitest'
import {
  applyDecisionBonus,
  calculateMission,
  canLaunchMission,
  createMissionEvent,
  createWhatIfSelection,
  isMissionSuccessful,
  JUDGE_DEMO_SEED,
  MISSION_LIMITS,
  toggleMissionItem,
} from './mission'

describe('mission selection and resource calculations', () => {
  it('toggles selectable equipment without duplicating rapid repeated selections', () => {
    let selected = ['bus']
    selected = toggleMissionItem(selected, 'solar')
    selected = toggleMissionItem(selected, 'solar')
    selected = toggleMissionItem(selected, 'solar')
    expect(selected).toEqual(['bus', 'solar'])
    expect(toggleMissionItem(selected, 'unknown')).toEqual(selected)
    expect(toggleMissionItem([], 'bus')).toEqual([])
  })

  it('calculates zero selection without negative or NaN values but does not permit launch', () => {
    const totals = calculateMission([])
    expect(totals).toMatchObject({ cost: 0, mass: 0, powerUse: 0, powerSupply: 0, science: 0, communications: 0, violations: 0 })
    expect(Object.values(totals).every(Number.isFinite)).toBe(true)
    expect(canLaunchMission([], totals)).toBe(false)
  })

  it('accepts exact budget, mass, and power limits', () => {
    const budgetExact = calculateMission(['bus', 'rtg', 'antenna', 'camera', 'drill'])
    expect(budgetExact.cost).toBe(MISSION_LIMITS.budget)

    const massExact = calculateMission(['bus', 'solar', 'rtg', 'antenna', 'camera', 'spectrometer'])
    expect(massExact.mass).toBe(MISSION_LIMITS.mass)

    const powerExactSelection = ['bus', 'solar', 'antenna', 'camera', 'spectrometer']
    const powerExact = calculateMission(powerExactSelection)
    expect(powerExact.powerUse).toBe(powerExact.powerSupply)
    expect(powerExact.violations).toBe(0)
    expect(canLaunchMission(powerExactSelection, powerExact)).toBe(true)
  })

  it('blocks cost, mass, and power overflow independently and reports the overages', () => {
    const budgetOver = calculateMission(['bus', 'solar', 'antenna', 'camera', 'spectrometer', 'drill'])
    expect(budgetOver.cost).toBeGreaterThan(MISSION_LIMITS.budget)
    expect(canLaunchMission(['bus', 'solar', 'antenna', 'camera', 'spectrometer', 'drill'], budgetOver)).toBe(false)

    const massOverSelection = ['bus', 'solar', 'rtg', 'antenna', 'camera', 'spectrometer', 'drill']
    const massOver = calculateMission(massOverSelection)
    expect(massOver.mass).toBeGreaterThan(MISSION_LIMITS.mass)
    expect(massOver.violations).toBeGreaterThanOrEqual(2)
    expect(canLaunchMission(massOverSelection, massOver)).toBe(false)

    const powerOverSelection = ['bus', 'solar', 'antenna', 'camera', 'spectrometer', 'drill']
    const powerOver = calculateMission(powerOverSelection)
    expect(powerOver.powerUse).toBeGreaterThan(powerOver.powerSupply)
    expect(powerOver.violations).toBeGreaterThanOrEqual(2)
    expect(canLaunchMission(powerOverSelection, powerOver)).toBe(false)
  })

  it('keeps comms, score, decision, and success rules deterministic at thresholds', () => {
    const totals = calculateMission(['bus', 'solar', 'antenna', 'camera', 'spectrometer'])
    expect(totals.communications).toBe(50)
    expect(applyDecisionBonus(62, 'science')).toBe(70)
    expect(applyDecisionBonus(62, 'conserve')).toBe(66)
    expect(applyDecisionBonus(99, 'science')).toBe(100)
    expect(isMissionSuccessful(65, 0)).toBe(true)
    expect(isMissionSuccessful(64, 0)).toBe(false)
    expect(isMissionSuccessful(100, 1)).toBe(false)
  })

  it('compares a what-if instrument swap without changing the baseline selection', () => {
    const baseline = ['bus', 'solar', 'antenna', 'camera', 'spectrometer']
    const alternate = createWhatIfSelection(baseline)
    expect(alternate).toEqual(['bus', 'solar', 'antenna', 'camera', 'drill'])
    expect(baseline).toContain('spectrometer')
    expect(calculateMission(alternate).science).not.toBe(calculateMission(baseline).science)
  })

  it('repeats events across the judge seed and five independent runs', () => {
    const runs = Array.from({ length: 5 }, () => createMissionEvent(JUDGE_DEMO_SEED))
    expect(new Set(runs.map((event) => event.title)).size).toBe(1)
    expect(runs[0]?.title).toBe('Regional dust front')
  })
})