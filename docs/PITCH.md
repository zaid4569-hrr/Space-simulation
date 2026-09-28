# ORBITAL COMMAND Pitch

## Problem

Mission design is taught through separate concepts, so students rarely see how objective, spacecraft hardware, power, mass, budget, communications, and operations decisions constrain one another.

## Solution

ORBITAL COMMAND turns those interacting constraints into a short, playable mission. Players choose a destination, build a spacecraft, launch, respond to an event, and inspect the result.

## How It Works

The resource ledger recalculates as components change. A launch begins a seeded mission event; the player chooses a science-first or reserve-first response. A final score explains the trade-off, and a what-if view compares an alternate instrument choice.

## NASA Data Usage

NASA NSSDC fact sheets provide cited destination facts. NASA Image and Video Library images add visual context; optional adapters support EPIC Earth imagery, EONET event context, and the current APOD feed. The game remains playable offline. NASA facts/media are labeled separately from game-simulated hardware, costs, probabilities, and scores.

## Innovation

The learning value is in the connected decision loop: players see the resource consequence of a hardware choice, then see how operations decisions affect the mission outcome. A repeatable seeded judge demo makes the same trade-off visible every time.

## Educational Impact

Beginners can experiment without needing prior aerospace knowledge. The game makes constraints legible, uses real target facts as context, and encourages comparing a result against a different design.

## Future Scope

Add classroom challenges, expanded instruments and destinations after fact review, instructor debriefs, and a carefully scoped GIBS map layer if it improves an Earth-observation learning objective.

## 90-Second Demo Script

| Time | Screen/action | Speaker notes |
|---|---|---|
| 0–8 s | Home → Judge Demo | “This is ORBITAL COMMAND: a beginner-friendly way to experience mission design as a set of connected choices.” |
| 8–16 s | Mars briefing | “Mars facts and imagery come from NASA sources. The constraints on the next screen are explicitly game models.” |
| 16–32 s | Spacecraft design | “Each instrument adds science value, but also changes resource demand. Watch budget, mass, and power move together.” |
| 32–40 s | Launch | “The chosen design is within the modeled limits, so we can launch the scenario.” |
| 40–56 s | Crisis and decision | “A seeded, simulated dust event appears. The player decides whether to protect science return or preserve reserve.” |
| 56–66 s | Mission result | “The report shows the outcome and explains how the build and choice contributed.” |
| 66–77 s | What-if comparison | “Now swap an instrument and compare the mission score and resource profile.” |
| 77–90 s | NASA data panel | “We finish by showing the NASA image source and keeping real destination context distinct from simulated performance.” |

Speaker note: Automatic demo steps total approximately 88 seconds. If judging time is shorter, use **Next step** to move through the scripted run.

## Likely Judge Q&A

**Are these real spacecraft prices, masses, or power ratings?**  No. They are game-balance values and are labeled `GAME-SIMULATED`; the game does not claim to be flight design software.

**What happens when NASA APIs are unavailable?**  The game loop and briefing facts are locally bundled. NASA media uses saved, attributed sample images, and live responses use a cache with a fallback.

**Why use NASA data if the game can run offline?**  NASA imagery and cited target facts make the learning context authentic; offline content makes the experience reliable and keeps those sources inspectable.

**How is the mission result calculated?**  From transparent resource totals, science points, power margin, communications points, constraint penalties, and the selected decision bonus. The formula is documented in the README and architecture note.

**What would you build next?**  Add more mission scenarios only after verifying their source facts and educational value; add classroom challenges and targeted NASA data layers when they serve a clear player objective.