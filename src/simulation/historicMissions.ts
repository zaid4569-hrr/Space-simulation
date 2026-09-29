import type { DestinationId } from './mission'

export interface HistoricMission {
  id: string
  destinationId: DestinationId
  name: string
  agency: string
  year: string
  status: string
  headline: string
  summary: string
  historicalSignificance: string
  recommendedBuild: string[]
  beginnerHint: string
  factSheetUrl: string
}

export const HISTORIC_MISSIONS: HistoricMission[] = [
  {
    id: 'apollo11_artemis',
    destinationId: 'moon',
    name: 'Apollo 11 & Artemis Program',
    agency: 'NASA',
    year: '1969 & 2022-Present',
    status: 'Historic & Active',
    headline: 'Humanity’s first step on another world & polar ice exploration.',
    summary: 'Apollo 11 landed Neil Armstrong and Buzz Aldrin in the Sea of Tranquillity in July 1969. Today, NASA’s Artemis program prepares for long-term lunar presence and south pole ice surveys.',
    historicalSignificance: 'Returned 21.5 kg of lunar rock samples, proving the Moon’s volcanic history. Artemis I demonstrated the Orion spacecraft’s deep-space orbit around the Moon in 2022.',
    recommendedBuild: ['bus', 'solar', 'antenna', 'camera'],
    beginnerHint: 'The Moon is relatively close to Earth! Solar panels provide high power yield, and a Context Camera captures high-resolution crater mapping.',
    factSheetUrl: 'https://www.nasa.gov/missions/apollo/apollo-11/',
  },
  {
    id: 'perseverance_curiosity',
    destinationId: 'mars',
    name: 'Perseverance & Curiosity Rovers',
    agency: 'NASA / JPL',
    year: '2012 & 2020-Present',
    status: 'Active Surface Mission',
    headline: 'Searching Jezero Crater for ancient microbial signatures.',
    summary: 'Perseverance landed in Jezero Crater in February 2021 equipped with a drill, spectrometers, and the Ingenuity helicopter to explore an ancient river delta.',
    historicalSignificance: 'Perseverance collects and seals rock core samples for future retrieval to Earth, while operating the first powered atmospheric flight on another planet.',
    recommendedBuild: ['bus', 'rtg', 'antenna', 'camera', 'spectrometer', 'drill'],
    beginnerHint: 'Mars dust storms can degrade solar panels over time. Equipping an RTG guarantees reliable power during operations!',
    factSheetUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
  },
  {
    id: 'landsat_iss',
    destinationId: 'earth',
    name: 'Landsat Program & ISS',
    agency: 'NASA / USGS',
    year: '1972-Present',
    status: 'Continuous Earth Observation',
    headline: 'Fifty years of continuous satellite tracking of Earth’s ecosystems.',
    summary: 'Landsat is the longest-running enterprise for acquisition of satellite imagery of Earth. Together with the ISS, it monitors deforestation, polar ice melt, and agricultural yields.',
    historicalSignificance: 'Provides open-access multispectral imagery that underpins modern climate science, disaster response, and planetary environmental monitoring.',
    recommendedBuild: ['bus', 'solar', 'antenna', 'camera', 'spectrometer'],
    beginnerHint: 'Earth orbit offers abundant solar energy. Pair a solar array with both Context Camera and Spectrometer for maximum science output!',
    factSheetUrl: 'https://www.nasa.gov/international-space-station/',
  },
  {
    id: 'europa_clipper_juno',
    destinationId: 'jupiter',
    name: 'Juno & Europa Clipper',
    agency: 'NASA / JPL',
    year: '2016 & 2024-Present',
    status: 'Active Outer System Mission',
    headline: 'Investigating Jupiter’s magnetosphere and Europa’s subsurface ocean.',
    summary: 'Juno orbits Jupiter to measure atmospheric water, magnetic fields, and auroras. Launched in October 2024, Europa Clipper will conduct dozens of close flybys of Europa to assess its habitability.',
    historicalSignificance: 'Europa Clipper carries advanced ice-penetrating radar and spectrometers to confirm whether Europa’s 100-km deep ocean contains conditions for life.',
    recommendedBuild: ['bus', 'rtg', 'antenna', 'spectrometer'],
    beginnerHint: 'Jupiter is 5 times further from the Sun than Earth! Solar intensity drops to 4%. An RTG power source is highly recommended.',
    factSheetUrl: 'https://www.nasa.gov/mission_pages/juno/main/index.html',
  },
  {
    id: 'cassini_huygens',
    destinationId: 'saturn',
    name: 'Cassini-Huygens Mission',
    agency: 'NASA / ESA / ASI',
    year: '1997-2017',
    status: 'Grand Finale Complete',
    headline: '13-year flagship survey of Saturn, its rings, Titan, and Enceladus.',
    summary: 'Cassini spent 13 years orbiting Saturn, dropping the Huygens probe onto organic-rich Titan and discovering liquid water geysers shooting from Enceladus’s ice crust.',
    historicalSignificance: 'Discovered that Enceladus has a global subsurface ocean with hydrothermal vents, making it a primary target in astrobiology.',
    recommendedBuild: ['bus', 'rtg', 'antenna', 'camera', 'spectrometer'],
    beginnerHint: 'Saturn requires a High-Gain Antenna for deep-space comms across 1.4 billion km, combined with RTG power.',
    factSheetUrl: 'https://science.nasa.gov/mission/cassini/',
  },
  {
    id: 'parker_solar_probe',
    destinationId: 'sun',
    name: 'Parker Solar Probe',
    agency: 'NASA',
    year: '2018-Present',
    status: 'Active Extreme Heliophysics',
    headline: 'The fastest human-made object in history, touching the Sun’s atmosphere.',
    summary: 'Parker Solar Probe travels through the Sun’s outer atmosphere (the corona), flying within 6.1 million kilometers of the solar surface at speeds up to 700,000 km/h.',
    historicalSignificance: 'Directly sampled magnetic reconnection events and coronal plasma, answering a 60-year mystery of why the corona is hotter than the solar surface.',
    recommendedBuild: ['bus', 'solar', 'antenna', 'spectrometer'],
    beginnerHint: 'Near the Sun, solar flux is extreme! A single compact solar array produces massive energy, leaving plenty of power for science sensors.',
    factSheetUrl: 'https://science.nasa.gov/mission/parker-solar-probe/',
  },
]
