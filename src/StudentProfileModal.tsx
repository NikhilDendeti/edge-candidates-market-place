import React, { useEffect, useRef, useState } from 'react'

interface StudentProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTop = 0
    }
  }, [isOpen])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element && bodyRef.current) {
      const offset = 80
      const elementPosition = element.offsetTop - offset
      bodyRef.current.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    })
  }

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null)

  const handleVertexHover = (index: number | null) => {
    if (pinnedIndex === null) {
      setHoveredIndex(index)
    }
  }

  const handleVertexClick = (index: number) => {
    if (pinnedIndex === index) {
      setPinnedIndex(null)
      setHoveredIndex(null)
    } else {
      setPinnedIndex(index)
      setHoveredIndex(index)
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinnedIndex(null)
        setHoveredIndex(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  if (!isOpen) return null

  // Sample data
  const studentData = {
    name: 'Shreyansh Goel',
    initials: 'SG',
    meta: 'IIIT Ranchi (NIRF: 101) • Artificial Intelligence & Machine Learning • Class of 2026',
    cgpa: '9.41 / 10.0',
    skills: ['Problem Solving', 'DSA Theory', 'CS Fundamentals'],
    assessmentOverall: { percentage: 59, raw: '123.48 / 210' },
    interviewOverall: { percentage: 100, raw: '10.0/10' },
    interviewScores: [
      { criteria: 'Self Introduction', score: 5, max: 5, rating: 'Excellent' },
      { criteria: 'Problem Solving & Coding', score: 35, max: 35, rating: 'Excellent' },
      { criteria: 'Communication Skills', score: 9, max: 9, rating: 'Excellent' },
      { criteria: 'Conceptual & Theoretical', score: 6, max: 6, rating: 'Excellent' },
    ],
    technicalScores: [
      { label: 'Coding', score: 70.48, max: 120, rating: 'Strong' },
      { label: 'DSA Theory', score: 7, max: 10, rating: 'Strong' },
      { label: 'CS Fundamentals', score: 23, max: 40, rating: 'Strong' },
      { label: 'Aptitude', score: 23, max: 40, rating: 'Strong' },
    ],
    phone: '9800141844',
    otp: '561811',
    lastUpdated: '12 Oct',
    recordingDate: '12 Oct',
  }

  const getSkillColor = (index: number) => {
    const colors = [
      { bg: '#F1F0FF', border: '#E1DFFE' },
      { bg: '#ECF8EF', border: '#CEEFD4' },
      { bg: '#FEF4E2', border: '#FFE8BA' },
    ]
    return colors[index % 3]
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <header className="modal-header">
          <h2 className="modal-header__title">Student Profile</h2>
          <div className="modal-header__nav">
            <button
              type="button"
              className="modal-header__nav-link"
              onClick={() => scrollToSection('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className="modal-header__nav-link"
              onClick={() => scrollToSection('interview')}
            >
              Interview
            </button>
            <button
              type="button"
              className="modal-header__nav-link"
              onClick={() => scrollToSection('assessment')}
            >
              Assessment
            </button>
            <button
              type="button"
              className="modal-header__nav-link"
              onClick={() => scrollToSection('recording')}
            >
              Recording
            </button>
            <button
              type="button"
              className="modal-header__nav-link"
              onClick={() => scrollToSection('report')}
            >
              Report
            </button>
          </div>
          <button
            type="button"
            className="modal-header__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="modal-body" ref={bodyRef}>
          {/* Student Identity Header */}
          <section id="overview" className="modal-section">
            <div className="student-identity">
              <div className="student-identity__left">
                <div className="student-identity__avatar">
                  <span className="avatar-chip">{studentData.initials}</span>
                </div>
                <div className="student-identity__info">
                  <h1 className="student-identity__name">{studentData.name}</h1>
                  <p className="student-identity__meta">{studentData.meta}</p>
                  <div className="student-identity__badges">
                    <span className="cgpa-badge">{studentData.cgpa}</span>
                    <div className="skill-capsules">
                      {studentData.skills.slice(0, 3).map((skill, index) => {
                        const color = getSkillColor(index)
                        return (
                          <span
                            key={skill}
                            className="skill-capsule"
                            style={{ background: color.bg, borderColor: color.border }}
                          >
                            {skill}
                          </span>
                        )
                      })}
                      {studentData.skills.length > 3 && (
                        <span className="skill-capsule skill-capsule--more">
                          +{studentData.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="student-identity__right">
                <div className="overall-scores-card">
                  <div className="overall-scores-card__header">
                    <h2 className="overall-scores-card__title">Overall Scores</h2>
                  </div>
                  <div className="overall-scores-card__body">
                    <div className="overall-scores-block">
                      <div className="overall-scores-block__label">Assessment</div>
                      <div className="overall-scores-ring">
                        <div
                          className="overall-scores-ring__circle"
                          style={{
                            background: `conic-gradient(#6194EB 0deg ${studentData.assessmentOverall.percentage * 3.6}deg, #D4E4FF ${studentData.assessmentOverall.percentage * 3.6}deg 360deg)`,
                          }}
                        >
                          <div className="overall-scores-ring__content">
                            <span className="overall-scores-ring__percentage">
                              {studentData.assessmentOverall.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="overall-scores-block__raw">{studentData.assessmentOverall.raw}</div>
                    </div>
                    <div className="overall-scores-card__divider"></div>
                    <div className="overall-scores-block">
                      <div className="overall-scores-block__label">Interview</div>
                      <div className="overall-scores-ring">
                        <div
                          className="overall-scores-ring__circle"
                          style={{
                            background: `conic-gradient(#6194EB 0deg ${studentData.interviewOverall.percentage * 3.6}deg, #D4E4FF ${studentData.interviewOverall.percentage * 3.6}deg 360deg)`,
                          }}
                        >
                          <div className="overall-scores-ring__content">
                            <span className="overall-scores-ring__percentage">
                              {studentData.interviewOverall.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="overall-scores-block__raw">{studentData.interviewOverall.raw}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interview Section */}
          <section id="interview" className="modal-section">
            <div className="interview-performance-card">
              <div className="interview-performance-header">
                <h2 className="interview-performance-title">Interview Performance</h2>
                <span className="interview-performance-note">Scored out of 100</span>
              </div>
              <div className="interview-performance-body">
                <div className="interview-radar-container">
                  <RadarChart
                    data={studentData.interviewScores}
                    hoveredIndex={hoveredIndex}
                    pinnedIndex={pinnedIndex}
                    onVertexHover={handleVertexHover}
                    onVertexClick={handleVertexClick}
                    onVertexFocus={(index) => setHoveredIndex(index)}
                    onVertexBlur={() => {
                      if (pinnedIndex === null) {
                        setHoveredIndex(null)
                      }
                    }}
                  />
                  {(hoveredIndex !== null || pinnedIndex !== null) && (
                    <RadarTooltip
                      data={studentData.interviewScores[hoveredIndex !== null ? hoveredIndex : pinnedIndex!]}
                      vertexPoint={(() => {
                        const index = hoveredIndex !== null ? hoveredIndex : pinnedIndex!
                        const isMobile = window.innerWidth <= 768
                        const size = isMobile ? 180 : 260
                        const center = size / 2
                        const radius = isMobile ? 65 : 90
                        const getAngle = (i: number) => (i * 360) / 4 - 90
                        const toRadians = (deg: number) => (deg * Math.PI) / 180
                        const percentage = (studentData.interviewScores[index].score / studentData.interviewScores[index].max) * 100
                        const angle = getAngle(index)
                        const distance = (radius * percentage) / 100
                        const rad = toRadians(angle)
                        return {
                          x: center + Math.cos(rad) * distance,
                          y: center + Math.sin(rad) * distance,
                        }
                      })()}
                      isPinned={pinnedIndex !== null}
                      onClose={() => {
                        setPinnedIndex(null)
                        setHoveredIndex(null)
                      }}
                    />
                  )}
                </div>
                <div className="interview-legend">
                  {studentData.interviewScores.map((item, index) => {
                    const percentage = (item.score / item.max) * 100
                    return (
                      <div
                        key={item.criteria}
                        className="interview-legend-row"
                        onMouseEnter={() => handleVertexHover(index)}
                        onMouseLeave={() => handleVertexHover(null)}
                        onFocus={() => {
                          setHoveredIndex(index)
                        }}
                        onBlur={() => {
                          if (pinnedIndex === null) {
                            setHoveredIndex(null)
                          }
                        }}
                        tabIndex={0}
                      >
                        <div className="interview-legend-dot" />
                        <span className="interview-legend-label">{item.criteria}</span>
                        <span className="interview-legend-score">
                          {item.score}/{item.max}
                        </span>
                        <span className="interview-legend-chip">
                          {item.rating}
                        </span>
                      </div>
                    )
                  })}
                  <div className="interview-legend-row interview-legend-row--overall">
                    <div className="interview-legend-dot" />
                    <span className="interview-legend-label">Overall</span>
                    <span className="interview-legend-score interview-legend-score--overall">
                      {studentData.interviewOverall.raw}
                    </span>
                    <span className="interview-legend-chip">
                      Outstanding
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recording Section */}
          <section id="recording" className="modal-section">
            <h2 className="section-title">Interview Recording</h2>
            <div className="recording-player">
              <div className="recording-player__placeholder">
                <span className="recording-player__icon">▶</span>
              </div>
            </div>
            <p className="recording-caption">Recorded on {studentData.recordingDate}</p>
          </section>

          {/* Technical Assessment Section */}
          <section id="assessment" className="modal-section">
            <h2 className="section-title">Technical Assessment Breakdown</h2>
            <div className="assessment-card">
              <div className="assessment-card__content">
                <div className="assessment-radar-container">
                  <AssessmentRadarChart
                    data={studentData.technicalScores}
                    hoveredIndex={hoveredIndex}
                    pinnedIndex={pinnedIndex}
                    onVertexHover={handleVertexHover}
                    onVertexClick={handleVertexClick}
                    onVertexFocus={(index) => setHoveredIndex(index)}
                    onVertexBlur={() => {
                      if (pinnedIndex === null) {
                        setHoveredIndex(null)
                      }
                    }}
                  />
                  {(hoveredIndex !== null || pinnedIndex !== null) && (
                    <AssessmentRadarTooltip
                      data={studentData.technicalScores[hoveredIndex !== null ? hoveredIndex : pinnedIndex!]}
                      vertexPoint={(() => {
                        const index = hoveredIndex !== null ? hoveredIndex : pinnedIndex!
                        const isMobile = window.innerWidth <= 768
                        const size = isMobile ? 170 : 210
                        const center = size / 2
                        const radius = isMobile ? 80 : 100
                        const getAngle = (i: number) => (i * 360) / 4 - 90
                        const toRadians = (deg: number) => (deg * Math.PI) / 180
                        const percentage = (studentData.technicalScores[index].score / studentData.technicalScores[index].max) * 100
                        const angle = getAngle(index)
                        const distance = (radius * percentage) / 100
                        const rad = toRadians(angle)
                        return {
                          x: center + Math.cos(rad) * distance,
                          y: center + Math.sin(rad) * distance,
                        }
                      })()}
                      isPinned={pinnedIndex !== null}
                      onClose={() => {
                        setPinnedIndex(null)
                        setHoveredIndex(null)
                      }}
                    />
                  )}
                </div>
                <div className="assessment-legend">
                  {studentData.technicalScores.map((item, index) => {
                    const percentage = (item.score / item.max) * 100
                    return (
                      <div
                        key={item.label}
                        className="assessment-legend-row"
                        onMouseEnter={() => handleVertexHover(index)}
                        onMouseLeave={() => handleVertexHover(null)}
                        onFocus={() => {
                          setHoveredIndex(index)
                        }}
                        onBlur={() => {
                          if (pinnedIndex === null) {
                            setHoveredIndex(null)
                          }
                        }}
                        tabIndex={0}
                      >
                        <div className="assessment-legend-dot" />
                        <span className="assessment-legend-label">{item.label}</span>
                        <span className="assessment-legend-score">
                          {item.score.toFixed(item.score % 1 !== 0 ? 2 : 0)} / {item.max}
                        </span>
                        <span className="assessment-legend-percentage">{percentage.toFixed(0)}%</span>
                        {item.rating && (
                          <span className="assessment-legend-chip">{item.rating}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="assessment-card__divider"></div>
              <div className="assessment-callout">
                <p className="assessment-callout__text">
                  See Question-by-Question analysis, solutions & session recording.
                </p>
                <button type="button" className="assessment-callout__button">
                  View Complete Report
                </button>
              </div>
            </div>
          </section>

          {/* Access Gate */}
          <section id="report" className="modal-section">
            <div className="access-gate">
              <div className="access-gate__lock">
                <span className="access-gate__icon">🔒</span>
                <span className="access-gate__text">Login required</span>
              </div>
              <div className="access-gate__credentials">
                <button
                  type="button"
                  className="credential-chip credential-chip--phone"
                  onClick={() => copyToClipboard(studentData.phone)}
                  title="Click to copy"
                >
                  <span className="credential-chip__label">Phone:</span>
                  <span className="credential-chip__value">{studentData.phone}</span>
                </button>
                <button
                  type="button"
                  className="credential-chip credential-chip--otp"
                  onClick={() => copyToClipboard(studentData.otp)}
                  title="Click to copy"
                >
                  <span className="credential-chip__label">OTP:</span>
                  <span className="credential-chip__value">{studentData.otp}</span>
                </button>
              </div>
              <a href="#" className="access-gate__link">
                How to sign in
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="modal-footer">
          <p className="modal-footer__text">Data last updated • {studentData.lastUpdated}</p>
          <div className="modal-footer__actions">
            <button type="button" className="modal-footer__button modal-footer__button--ghost" onClick={onClose}>
              Close
            </button>
            <button type="button" className="modal-footer__button modal-footer__button--primary">
              Download PDF
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

// Radar Chart Component
interface RadarChartProps {
  data: Array<{ criteria: string; score: number; max: number; rating: string }>
  hoveredIndex: number | null
  pinnedIndex: number | null
  onVertexHover: (index: number | null) => void
  onVertexClick: (index: number) => void
  onVertexFocus: (index: number | null) => void
  onVertexBlur: () => void
}

const RadarChart: React.FC<RadarChartProps> = ({
  data,
  hoveredIndex,
  pinnedIndex,
  onVertexHover,
  onVertexClick,
  onVertexFocus,
  onVertexBlur,
}) => {
  const isMobile = window.innerWidth <= 768
  const size = isMobile ? 180 : 260
  const center = size / 2
  const radius = isMobile ? 65 : 90
  const numAxes = 4
  const gridLevels = [0, 25, 50, 75, 100]
  const labelOffset = 40
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Map criteria to display names with line breaks
  const criteriaMap: { [key: string]: string[] } = {
    'Self Introduction': ['Self Introduction'],
    'Problem Solving & Coding': ['Problem Solving &', 'Coding'],
    'Communication Skills': ['Communication', 'Skills'],
    'Conceptual & Theoretical': ['Conceptual &', 'Theoretical'],
  }

  // Calculate angles for each axis
  const getAngle = (index: number) => {
    return (index * 360) / numAxes - 90 // Start from top
  }

  // Convert angle to radians
  const toRadians = (degrees: number) => {
    return (degrees * Math.PI) / 180
  }

  // Get point on circle
  const getPoint = (angle: number, distance: number) => {
    const rad = toRadians(angle)
    const x = center + Math.cos(rad) * distance
    const y = center + Math.sin(rad) * distance
    return { x, y }
  }

  // Calculate data points
  const dataPoints = data.map((item, index) => {
    const percentage = (item.score / item.max) * 100
    const angle = getAngle(index)
    const distance = (radius * percentage) / 100
    return getPoint(angle, distance)
  })

  // Create path string for the filled area
  const createPath = () => {
    if (dataPoints.length === 0) return ''
    const path = dataPoints.map((point, index) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    })
    return `${path.join(' ')} Z`
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="radar-chart-panel">
      <div className="radar-chart-wrapper">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radar-chart" preserveAspectRatio="xMidYMid meet">
          {/* Grid circles */}
          {gridLevels.map((level) => {
            const r = (radius * level) / 100
            return (
              <circle
                key={level}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="#E9E9E9"
                strokeWidth="1"
                opacity="0.8"
              />
            )
          })}

          {/* Grid lines (axes/spokes) */}
          {data.map((_, index) => {
            const angle = getAngle(index)
            const endPoint = getPoint(angle, radius)
            return (
              <line
                key={`axis-${index}`}
                x1={center}
                y1={center}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="#9DC1FF"
                strokeWidth="1"
                opacity="0.45"
              />
            )
          })}

          {/* Axis labels outside */}
          {data.map((item, index) => {
            const angle = getAngle(index)
            // Calculate the actual data point position (where the vertex is)
            const percentage = (item.score / item.max) * 100
            const vertexDistance = (radius * percentage) / 100
            const vertexPoint = getPoint(angle, vertexDistance)
            
            // Position labels at vertex center with specific offsets
            const labelLines = criteriaMap[item.criteria] || [item.criteria]
            const lineHeight = 15.6 // 13px * 1.2 line-height
            
            // Determine position and anchor based on angle
            // Top: 0° (index 0), Right: 90° (index 1), Bottom: 180° (index 2), Left: 270° (index 3)
            let textAnchor: 'start' | 'middle' | 'end' = 'middle'
            let dominantBaseline: 'middle' = 'middle'
            let dx = 0
            let dy = 0
            
            if (index === 0) {
              // Top (Self Introduction)
              textAnchor = 'middle'
              dy = -14
            } else if (index === 1) {
              // Right (Problem Solving & Coding)
              textAnchor = 'start'
              dx = 14
            } else if (index === 2) {
              // Bottom (Communication Skills)
              textAnchor = 'middle'
              dy = 14
            } else if (index === 3) {
              // Left (Conceptual & Theoretical)
              textAnchor = 'end'
              dx = -14
            }

            return (
              <text
                key={`label-${index}`}
                x={vertexPoint.x}
                y={vertexPoint.y}
                dx={dx}
                dy={dy}
                textAnchor={textAnchor}
                dominantBaseline={dominantBaseline}
                className="radar-axis-label"
              >
                {labelLines.map((line, lineIndex) => (
                  <tspan
                    key={lineIndex}
                    x={vertexPoint.x}
                    dy={lineIndex === 0 ? 0 : lineHeight}
                    textAnchor={textAnchor}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            )
          })}

          {/* Filled area (spider) */}
          <path
            d={createPath()}
            fill="rgba(97, 148, 235, 0.18)"
            stroke="rgba(97, 148, 235, 0.58)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="radar-fill"
            style={{
              animation: prefersReducedMotion ? 'none' : 'radarSweep 200ms ease-out',
            }}
          />

          {/* Data points with borders - interactive */}
          {dataPoints.map((point, index) => {
            const isActive = hoveredIndex === index || pinnedIndex === index
            return (
              <g key={`point-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="#9DC1FF"
                  stroke="#9DC1FF"
                  strokeWidth="1"
                  className="radar-vertex"
                  tabIndex={0}
                  onMouseEnter={() => onVertexHover(index)}
                  onMouseLeave={() => onVertexHover(null)}
                  onClick={() => onVertexClick(index)}
                  onFocus={() => onVertexFocus(index)}
                  onBlur={onVertexBlur}
                  style={{ cursor: 'pointer' }}
                  aria-label={`${data[index].criteria}: ${data[index].score}/${data[index].max}`}
                />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// Radar Tooltip Component
interface RadarTooltipProps {
  data: { criteria: string; score: number; max: number; rating: string }
  vertexPoint: { x: number; y: number }
  isPinned: boolean
  onClose: () => void
}

const RadarTooltip: React.FC<RadarTooltipProps> = ({ data, vertexPoint, isPinned, onClose }) => {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' as 'top' | 'right' | 'bottom' | 'left' })

  useEffect(() => {
    if (!tooltipRef.current) return

    const updatePosition = () => {
      const tooltip = tooltipRef.current
      if (!tooltip) return

      const isMobile = window.innerWidth <= 768
      const size = isMobile ? 180 : 260
      const panelPadding = isMobile ? 24 : 24
      
      // SVG coordinates are relative to the SVG viewBox (0,0 to size,size)
      // The SVG is centered in the panel, so we need to account for panel padding
      const svgX = vertexPoint.x
      const svgY = vertexPoint.y
      
      // Get the container's position
      const container = tooltip.offsetParent as HTMLElement
      if (!container) return
      
      const containerRect = container.getBoundingClientRect()
      const panelRect = container.querySelector('.radar-chart-panel')?.getBoundingClientRect()
      if (!panelRect) return
      
      // Calculate position relative to the panel
      const panelX = panelRect.left - containerRect.left + panelPadding + svgX
      const panelY = panelRect.top - containerRect.top + panelPadding + svgY
      
      const tooltipRect = tooltip.getBoundingClientRect()
      const tooltipWidth = 240
      const tooltipHeight = tooltipRect.height || 100
      
      const offset = 12
      let placement: 'top' | 'right' | 'bottom' | 'left' = 'top'
      let left = panelX
      let top = panelY

      // Determine placement based on vertex position in SVG
      if (svgY < size / 3) {
        // Top quadrant - show below
        placement = 'bottom'
        top = panelY + offset
      } else if (svgY > (size * 2) / 3) {
        // Bottom quadrant - show above
        placement = 'top'
        top = panelY - offset
      } else if (svgX < size / 2) {
        // Left quadrant - show right
        placement = 'right'
        left = panelX + offset
      } else {
        // Right quadrant - show left
        placement = 'left'
        left = panelX - offset
      }

      // Adjust to keep in bounds
      if (left + tooltipWidth > containerRect.width) {
        left = containerRect.width - tooltipWidth - 16
        if (placement === 'right') placement = 'left'
      }
      if (left < 0) {
        left = 16
        if (placement === 'left') placement = 'right'
      }
      if (top + tooltipHeight > containerRect.height) {
        top = containerRect.height - tooltipHeight - 16
        if (placement === 'bottom') placement = 'top'
      }
      if (top < 0) {
        top = 16
        if (placement === 'top') placement = 'bottom'
      }

      setPosition({ top, left, placement })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [vertexPoint])

  const percentage = Math.round((data.score / data.max) * 100)

  return (
    <div
      ref={tooltipRef}
      className={`radar-tooltip radar-tooltip--${position.placement} ${isPinned ? 'radar-tooltip--pinned' : ''}`}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
      onMouseLeave={!isPinned ? onClose : undefined}
    >
      {isPinned && (
        <button
          className="radar-tooltip__close"
          onClick={onClose}
          aria-label="Close tooltip"
        >
          ×
        </button>
      )}
      <div className="radar-tooltip__content">
        {data.criteria} • Score {data.score}/{data.max} ({percentage}%) • <span className="radar-tooltip__chip">{data.rating}</span>
      </div>
      <div className="radar-tooltip__arrow" />
    </div>
  )
}

// Assessment Radar Chart Component
interface AssessmentRadarChartProps {
  data: Array<{ label: string; score: number; max: number; rating?: string }>
  hoveredIndex: number | null
  pinnedIndex: number | null
  onVertexHover: (index: number | null) => void
  onVertexClick: (index: number) => void
  onVertexFocus: (index: number | null) => void
  onVertexBlur: () => void
}

const AssessmentRadarChart: React.FC<AssessmentRadarChartProps> = ({
  data,
  hoveredIndex,
  pinnedIndex,
  onVertexHover,
  onVertexClick,
  onVertexFocus,
  onVertexBlur,
}) => {
  const isMobile = window.innerWidth <= 768
  const size = isMobile ? 170 : 210
  const center = size / 2
  const radius = isMobile ? 80 : 100
  const numAxes = 4
  const gridLevels = [0, 25, 50, 75, 100]

  // Map labels to display names with line breaks
  const labelMap: { [key: string]: string[] } = {
    'Coding': ['Coding'],
    'DSA Theory': ['DSA Theory'],
    'CS Fundamentals': ['CS', 'Fundamentals'],
    'Aptitude': ['Aptitude'],
  }

  // Calculate angles for each axis
  const getAngle = (index: number) => {
    return (index * 360) / numAxes - 90 // Start from top
  }

  // Convert angle to radians
  const toRadians = (degrees: number) => {
    return (degrees * Math.PI) / 180
  }

  // Get point on circle
  const getPoint = (angle: number, distance: number) => {
    const rad = toRadians(angle)
    const x = center + Math.cos(rad) * distance
    const y = center + Math.sin(rad) * distance
    return { x, y }
  }

  // Calculate data points
  const dataPoints = data.map((item, index) => {
    const percentage = (item.score / item.max) * 100
    const angle = getAngle(index)
    const distance = (radius * percentage) / 100
    return getPoint(angle, distance)
  })

  // Create path string for the filled area
  const createPath = () => {
    if (dataPoints.length === 0) return ''
    const path = dataPoints.map((point, index) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    })
    return `${path.join(' ')} Z`
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="assessment-radar-panel">
      <div className="assessment-radar-wrapper">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="assessment-radar-chart" preserveAspectRatio="xMidYMid meet">
          {/* Grid circles */}
          {gridLevels.map((level) => {
            const r = (radius * level) / 100
            return (
              <circle
                key={level}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="#E9E9E9"
                strokeWidth="1"
                opacity="0.8"
              />
            )
          })}

          {/* Grid lines (axes/spokes) */}
          {data.map((_, index) => {
            const angle = getAngle(index)
            const endPoint = getPoint(angle, radius)
            return (
              <line
                key={`axis-${index}`}
                x1={center}
                y1={center}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="#9DC1FF"
                strokeWidth="1"
                opacity="0.45"
              />
            )
          })}

          {/* Axis labels outside */}
          {data.map((item, index) => {
            const angle = getAngle(index)
            // Position labels at the outer radius (end of axis), not at vertex
            const axisEndPoint = getPoint(angle, radius)
            
            const labelLines = labelMap[item.label] || [item.label]
            const lineHeight = 15.6 // 13px * 1.2 line-height
            
            let textAnchor: 'start' | 'middle' | 'end' = 'middle'
            let dominantBaseline: 'middle' = 'middle'
            let dx = 0
            let dy = 0
            
            if (index === 0) {
              // Top (Coding)
              textAnchor = 'middle'
              dominantBaseline = 'middle'
              dy = -14
            } else if (index === 1) {
              // Right (DSA Theory)
              textAnchor = 'start'
              dominantBaseline = 'middle'
              dx = 14
            } else if (index === 2) {
              // Bottom (CS Fundamentals)
              textAnchor = 'middle'
              dominantBaseline = 'middle'
              dy = 14
            } else if (index === 3) {
              // Left (Aptitude)
              textAnchor = 'end'
              dominantBaseline = 'middle'
              dx = -14
            }

            return (
              <text
                key={`label-${index}`}
                x={axisEndPoint.x}
                y={axisEndPoint.y}
                dx={dx}
                dy={dy}
                textAnchor={textAnchor}
                dominantBaseline={dominantBaseline}
                className="assessment-radar-axis-label"
              >
                {labelLines.map((line, lineIndex) => (
                  <tspan
                    key={lineIndex}
                    x={axisEndPoint.x}
                    dy={lineIndex === 0 ? 0 : lineHeight}
                    textAnchor={textAnchor}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            )
          })}

          {/* Filled area (spider) */}
          <path
            d={createPath()}
            fill="rgba(97, 148, 235, 0.18)"
            stroke="rgba(97, 148, 235, 0.58)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="assessment-radar-fill"
            style={{
              animation: prefersReducedMotion ? 'none' : 'radarSweep 200ms ease-out',
            }}
          />

          {/* Data points - interactive */}
          {dataPoints.map((point, index) => {
            return (
              <g key={`point-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="#9DC1FF"
                  stroke="#9DC1FF"
                  strokeWidth="1"
                  className="assessment-radar-vertex"
                  tabIndex={0}
                  onMouseEnter={() => onVertexHover(index)}
                  onMouseLeave={() => onVertexHover(null)}
                  onClick={() => onVertexClick(index)}
                  onFocus={() => onVertexFocus(index)}
                  onBlur={onVertexBlur}
                  style={{ cursor: 'pointer' }}
                  aria-label={`${data[index].label}: ${data[index].score}/${data[index].max}`}
                />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// Assessment Radar Tooltip Component
interface AssessmentRadarTooltipProps {
  data: { label: string; score: number; max: number; rating?: string }
  vertexPoint: { x: number; y: number }
  isPinned: boolean
  onClose: () => void
}

const AssessmentRadarTooltip: React.FC<AssessmentRadarTooltipProps> = ({ data, vertexPoint, isPinned, onClose }) => {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' as 'top' | 'right' | 'bottom' | 'left' })

  useEffect(() => {
    if (!tooltipRef.current) return

    const updatePosition = () => {
      const tooltip = tooltipRef.current
      if (!tooltip) return

      const isMobile = window.innerWidth <= 768
      const size = isMobile ? 170 : 210
      const panelPadding = 24
      
      const svgX = vertexPoint.x
      const svgY = vertexPoint.y
      
      const container = tooltip.offsetParent as HTMLElement
      if (!container) return
      
      const containerRect = container.getBoundingClientRect()
      const panelRect = container.querySelector('.assessment-radar-panel')?.getBoundingClientRect()
      if (!panelRect) return
      
      const panelX = panelRect.left - containerRect.left + panelPadding + svgX
      const panelY = panelRect.top - containerRect.top + panelPadding + svgY
      
      const tooltipRect = tooltip.getBoundingClientRect()
      const tooltipWidth = 240
      const tooltipHeight = tooltipRect.height || 100
      
      const offset = 12
      let placement: 'top' | 'right' | 'bottom' | 'left' = 'top'
      let left = panelX
      let top = panelY

      if (svgY < size / 3) {
        placement = 'bottom'
        top = panelY + offset
      } else if (svgY > (size * 2) / 3) {
        placement = 'top'
        top = panelY - offset
      } else if (svgX < size / 2) {
        placement = 'right'
        left = panelX + offset
      } else {
        placement = 'left'
        left = panelX - offset
      }

      if (left + tooltipWidth > containerRect.width) {
        left = containerRect.width - tooltipWidth - 16
        if (placement === 'right') placement = 'left'
      }
      if (left < 0) {
        left = 16
        if (placement === 'left') placement = 'right'
      }
      if (top + tooltipHeight > containerRect.height) {
        top = containerRect.height - tooltipHeight - 16
        if (placement === 'bottom') placement = 'top'
      }
      if (top < 0) {
        top = 16
        if (placement === 'top') placement = 'bottom'
      }

      setPosition({ top, left, placement })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [vertexPoint])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPinned) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isPinned, onClose])

  const percentage = Math.round((data.score / data.max) * 100)

  return (
    <div
      ref={tooltipRef}
      className={`assessment-radar-tooltip assessment-radar-tooltip--${position.placement} ${isPinned ? 'assessment-radar-tooltip--pinned' : ''}`}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
      onMouseLeave={!isPinned ? onClose : undefined}
      tabIndex={0}
    >
      {isPinned && (
        <button
          className="assessment-radar-tooltip__close"
          onClick={onClose}
          aria-label="Close tooltip"
        >
          ×
        </button>
      )}
      <div className="assessment-radar-tooltip__content">
        {data.label} · Score {data.score.toFixed(data.score % 1 !== 0 ? 2 : 0)}/{data.max} ({percentage}%)
      </div>
      <div className="assessment-radar-tooltip__arrow" />
    </div>
  )
}

export default StudentProfileModal

