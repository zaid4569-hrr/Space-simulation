import { useState } from 'react'
import { HISTORIC_MISSIONS } from '../simulation/historicMissions'
import type { DestinationId } from '../simulation/mission'
import { SolarSystem3D } from './3d/SolarSystem3D'
import { DataBadge } from './DataBadge'

interface NASAMissionAcademyProps {
  onSelectMissionBuild: (destinationId: DestinationId, buildIds: string[]) => void
  onClose: () => void
}

export function NASAMissionAcademy({ onSelectMissionBuild, onClose }: NASAMissionAcademyProps) {
  const [selectedId, setSelectedId] = useState<string>(HISTORIC_MISSIONS[0]!.id)
  const currentMission = HISTORIC_MISSIONS.find((m) => m.id === selectedId) ?? HISTORIC_MISSIONS[0]!

  return (
    <section className="workflow-screen page-enter academy-screen" style={{ paddingBottom: '40px' }}>
      <div className="workflow-header">
        <div>
          <button className="back-button" type="button" onClick={onClose}>
            ← <span>Return to Command</span>
          </button>
          <p className="eyebrow">NASA HISTORICAL FIELD GUIDE</p>
          <h1>NASA Mission Academy</h1>
        </div>
        <DataBadge type="real" />
      </div>

      <p style={{ color: '#a0aec0', maxWidth: '800px', marginBottom: '24px', fontSize: '0.95rem' }}>
        Learn from history! Explore real NASA exploration milestones across our Solar System. Review past spacecraft engineering choices, discoveries, and launch historic hardware configurations directly into your mission design.
      </p>

      <div className="academy-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Mission Sidebar List */}
        <aside className="academy-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#a9e874', letterSpacing: '0.05em' }}>
            Historical Missions ({HISTORIC_MISSIONS.length})
          </h2>
          {HISTORIC_MISSIONS.map((m) => {
            const active = m.id === currentMission.id
            return (
              <button
                key={m.id}
                type="button"
                className={`academy-item-button ${active ? 'is-active' : ''}`}
                onClick={() => setSelectedId(m.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: active ? '1px solid #a9e874' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(169,232,116,0.12)' : 'rgba(15,23,42,0.6)',
                  color: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a9e874', fontWeight: 'bold' }}>{m.agency}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.year}</span>
                </div>
                <strong style={{ fontSize: '0.95rem', marginBottom: '2px' }}>{m.name}</strong>
                <small style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{m.headline}</small>
              </button>
            )
          })}
        </aside>

        {/* Mission Detail View */}
        <div className="academy-detail-panel" style={{ background: 'rgba(10,14,23,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="eyebrow" style={{ color: '#a9e874' }}>
                {currentMission.agency} · {currentMission.year} · {currentMission.status}
              </span>
              <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: '4px 0 8px 0' }}>{currentMission.name}</h2>
              <p style={{ color: '#cbd5e1', fontSize: '1.05rem', fontStyle: 'italic' }}>"{currentMission.headline}"</p>
            </div>
            <a href={currentMission.factSheetUrl} target="_blank" rel="noopener noreferrer" className="source-link" style={{ fontSize: '0.85rem' }}>
              NASA Mission Portal ↗
            </a>
          </div>

          {/* 3D Planet Preview & Mission Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'center' }}>
            <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(169,232,116,0.3)', background: '#05080f' }}>
              <SolarSystem3D destination={currentMission.destinationId} interactive={false} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>Overview</h3>
                <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>{currentMission.summary}</p>
              </div>

              <div>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>Key Discovery & Impact</h3>
                <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>{currentMission.historicalSignificance}</p>
              </div>
            </div>
          </div>

          {/* Beginner Engineering Hints & Recommendation */}
          <div style={{ background: 'rgba(169,232,116,0.08)', border: '1px solid rgba(169,232,116,0.3)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.1rem' }}>💡</span>
              <strong style={{ color: '#a9e874', fontSize: '0.95rem' }}>Cadet Design Hint for this Mission</strong>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#f1f5f9', margin: 0, lineHeight: 1.4 }}>
              {currentMission.beginnerHint}
            </p>
          </div>

          {/* Load Hardware CTA Button */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>HISTORIC HARDWARE LOADOUT:</span>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                {currentMission.recommendedBuild.map((id) => (
                  <span key={id} style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {id}
                  </span>
                ))}
              </div>
            </div>

            <button
              className="button button--primary"
              type="button"
              onClick={() => onSelectMissionBuild(currentMission.destinationId, currentMission.recommendedBuild)}
              style={{ cursor: 'pointer' }}
            >
              Load Historic NASA Build & Play ↗
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
