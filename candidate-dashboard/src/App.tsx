import { useState, useEffect } from 'react'
import StudentProfileModal from './StudentProfileModal'
import EvaluationCriteriaModal from './EvaluationCriteriaModal'
import { supabase } from './lib/supabase'

type CandidateRecommendation = 'Strong Hire' | 'Medium Fit' | 'Consider'

type Candidate = {
  name: string
  college: string
  branch: string
  cgpa: string
  assessmentScore: string
  assessmentMeta: string
  interviewScore: string
  interviewMeta: string
  skills: string[]
  recommendation: CandidateRecommendation
  resumeUrl?: string
}

const verdictSummary = [
  { label: 'Strong', count: 3, tone: 'strong' },
  { label: 'Medium', count: 5, tone: 'medium' },
  { label: 'Low', count: 1, tone: 'low' },
]

// Branch distribution will be calculated from database
type BranchDistribution = {
  label: string
  percent: number
  tone: string
}

const evaluationCriteria = ['Aptitude', 'DSA Theory', 'CS Fundamentals', 'Communication']

const evaluationPillars = [
  {
    title: 'Assessments',
    description: 'Aptitude / DSA / SQL — 0–100 (proctored)',
    icon: '📊',
  },
  {
    title: 'Structured Interview',
    description: 'Problem Solving / CS Fundas / Communication — 0–100 (recorded)',
    icon: '🎤',
  },
  {
    title: 'Final Verdict',
    description: 'Weighted blend → Strong / Medium / Low',
    icon: '⚖️',
  },
]

const candidates: Candidate[] = [
  {
    name: 'Aditya Sharma',
    college: 'IIIT Hyderabad',
    branch: 'Computer Science',
    cgpa: '9.41',
    assessmentScore: '188 / 210',
    assessmentMeta: 'Last taken: 12 Oct',
    interviewScore: '9.6 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong DSA', 'Strong Theory'],
    recommendation: 'Strong Hire',
    resumeUrl: '#',
  },
  {
    name: 'Bhavana Iyer',
    college: 'IIIT Bangalore',
    branch: 'Information Technology',
    cgpa: '9.18',
    assessmentScore: '178 / 210',
    assessmentMeta: 'Last taken: 10 Oct',
    interviewScore: '8.7 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong DSA', 'Strong Communication'],
    recommendation: 'Medium Fit',
    resumeUrl: '#',
  },
  {
    name: 'Charan Gupta',
    college: 'IIIT Delhi',
    branch: 'Electronics & Comm.',
    cgpa: '8.94',
    assessmentScore: '82 / 100',
    assessmentMeta: 'Last taken: 09 Oct',
    interviewScore: '7.8 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong DSA'],
    recommendation: 'Consider',
  },
  {
    name: 'Divya Patel',
    college: 'IIIT Hyderabad',
    branch: 'Computer Science',
    cgpa: '9.25',
    assessmentScore: '195 / 210',
    assessmentMeta: 'Last taken: 11 Oct',
    interviewScore: '9.4 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong DSA', 'Strong Theory', 'Strong Communication'],
    recommendation: 'Strong Hire',
    resumeUrl: '#',
  },
  {
    name: 'Eshaan Reddy',
    college: 'IIIT Bangalore',
    branch: 'Information Technology',
    cgpa: '9.05',
    assessmentScore: '172 / 210',
    assessmentMeta: 'Last taken: 08 Oct',
    interviewScore: '8.5 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong DSA', 'Strong Communication'],
    recommendation: 'Medium Fit',
    resumeUrl: '#',
  },
  {
    name: 'Fiza Khan',
    college: 'IIIT Delhi',
    branch: 'Computer Science',
    cgpa: '8.87',
    assessmentScore: '165 / 210',
    assessmentMeta: 'Last taken: 07 Oct',
    interviewScore: '8.2 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong DSA'],
    recommendation: 'Medium Fit',
    resumeUrl: '#',
  },
  {
    name: 'Gaurav Singh',
    college: 'IIIT Hyderabad',
    branch: 'Electronics & Comm.',
    cgpa: '9.12',
    assessmentScore: '180 / 210',
    assessmentMeta: 'Last taken: 13 Oct',
    interviewScore: '8.9 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong DSA', 'Strong Theory'],
    recommendation: 'Strong Hire',
    resumeUrl: '#',
  },
  {
    name: 'Harshita Nair',
    college: 'IIIT Bangalore',
    branch: 'Information Technology',
    cgpa: '8.76',
    assessmentScore: '158 / 210',
    assessmentMeta: 'Last taken: 06 Oct',
    interviewScore: '7.9 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong Communication'],
    recommendation: 'Consider',
  },
  {
    name: 'Ishaan Verma',
    college: 'IIIT Delhi',
    branch: 'Computer Science',
    cgpa: '9.33',
    assessmentScore: '190 / 210',
    assessmentMeta: 'Last taken: 14 Oct',
    interviewScore: '9.5 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong DSA', 'Strong Theory', 'Strong Communication'],
    recommendation: 'Strong Hire',
    resumeUrl: '#',
  },
  {
    name: 'Jaya Menon',
    college: 'IIIT Hyderabad',
    branch: 'Information Technology',
    cgpa: '8.98',
    assessmentScore: '175 / 210',
    assessmentMeta: 'Last taken: 09 Oct',
    interviewScore: '8.6 / 10',
    interviewMeta: 'Recorded',
    skills: ['Strong Problem Solving', 'Strong DSA', 'Strong Communication'],
    recommendation: 'Medium Fit',
    resumeUrl: '#',
  },
]

const formatInitials = (fullName: string) =>
  fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

const buildBranchBarSegments = (distribution: BranchDistribution[]) => {
  return distribution.map((branch) => ({
    ...branch,
    color:
      branch.tone === 'primary-900'
        ? '#051a3f'
        : branch.tone === 'primary-400'
          ? '#6194eb'
          : branch.tone === 'primary-200'
            ? '#9dc1ff'
            : '#e9e9e9',
  }))
}

// Helper function to normalize branch names
const normalizeBranchName = (branch: string): string => {
  const normalized = branch.trim().toLowerCase()
  
  // Map common branch variations to standard names
  if (normalized.includes('computer science') || normalized.includes('cse') || normalized.includes('cs')) {
    return 'CSE'
  }
  if (normalized.includes('information technology') || normalized.includes('it')) {
    return 'IT'
  }
  if (normalized.includes('electronics') || normalized.includes('ece') || normalized.includes('e&c')) {
    return 'ECE'
  }
  if (normalized.includes('electrical') || normalized.includes('eee')) {
    return 'EEE'
  }
  if (normalized.includes('mechanical') || normalized.includes('me')) {
    return 'ME'
  }
  
  // Return first 3 uppercase letters or full name if short
  return branch.length <= 5 ? branch.toUpperCase() : branch.substring(0, 10)
}

function App() {
  const [totalCandidates, setTotalCandidates] = useState<number>(0)
  const [branchDistribution, setBranchDistribution] = useState<BranchDistribution[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false)

  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        // Try lowercase first (most common in Supabase)
        let data, count
        
        const result = await supabase
          .from('candidates')
          .select('branch', { count: 'exact' })

        if (result.error) {
          console.error('Error fetching from candidates table:', result.error)
          // Try capitalized version
          const resultCap = await supabase
            .from('Candidates')
            .select('branch', { count: 'exact' })
          
          if (resultCap.error) {
            console.error('Error fetching from Candidates table:', resultCap.error)
            return
          } else {
            data = resultCap.data
            count = resultCap.count
          }
        } else {
          data = result.data
          count = result.count
        }

        if (data && count) {
          setTotalCandidates(count)

          // Calculate branch distribution
          const branchCounts: Record<string, number> = {}
          
          data.forEach((candidate: { branch: string }) => {
            if (candidate.branch) {
              const normalizedBranch = normalizeBranchName(candidate.branch)
              branchCounts[normalizedBranch] = (branchCounts[normalizedBranch] || 0) + 1
            }
          })

          // Convert to array and sort by count (descending)
          const branchEntries = Object.entries(branchCounts)
            .map(([label, count]) => ({
              label,
              count,
              percent: Math.round((count / data.length) * 100)
            }))
            .sort((a, b) => b.count - a.count)

          // Take top 3 branches and group the rest as "Other"
          const topBranches = branchEntries.slice(0, 3)
          const otherCount = branchEntries.slice(3).reduce((sum, branch) => sum + branch.count, 0)
          
          const distribution: BranchDistribution[] = topBranches.map((branch, index) => ({
            label: branch.label,
            percent: branch.percent,
            tone: index === 0 ? 'primary-900' : index === 1 ? 'primary-400' : 'primary-200'
          }))

          if (otherCount > 0) {
            distribution.push({
              label: 'Other',
              percent: Math.round((otherCount / data.length) * 100),
              tone: 'neutral-100'
            })
          }

          setBranchDistribution(distribution)
        }
      } catch (err) {
        console.error('Unexpected error fetching candidate data:', err)
      }
    }

    fetchCandidateData()
  }, [])

  return (
    <main className="app" aria-label="NxtWave Edge shortlisted candidates">
      <div className="layout">
        <header className="hero-capsule">
          <div className="hero-capsule__left">
            <span className="hero-capsule__logo" aria-hidden="true">
              NE
            </span>
            <div className="hero-capsule__text">
              <h1 className="hero-capsule__title">NxtWave Edge — Shortlisted Candidates</h1>
              <span className="hero-capsule__badge">Pre-assessed from top IIITs</span>
            </div>
          </div>
        </header>

        <section className="kpi-rail" aria-label="Key hiring metrics">
          <article className="kpi-module">
            <p className="kpi-module__label">Total Candidates</p>
            <p className="kpi-module__metric">{totalCandidates}</p>
            <p className="kpi-module__caption">
              Pre-screened <span aria-hidden="true">•</span> Last updated 07 Nov
            </p>
          </article>

          <article className="kpi-module">
            <p className="kpi-module__label">Hiring recommendations</p>
            <div className="verdict-chips" role="list" aria-label="Hiring recommendations">
              {verdictSummary.map((verdict) => (
                <button
                  key={verdict.label}
                  type="button"
                  className={`chip chip--${verdict.tone} chip--filterable`}
                  role="listitem"
                  aria-label={`Filter by ${verdict.label}`}
                >
                  <span className="chip__dot" aria-hidden="true" />
                  {verdict.label} <span className="chip__count">{verdict.count}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="kpi-module kpi-module--branch">
            <p className="kpi-module__label">Branch mix</p>
            {branchDistribution.length > 0 ? (
              <>
                <div className="branch-bar">
                  {buildBranchBarSegments(branchDistribution).map((segment) => (
                    <div
                      key={segment.label}
                      className="branch-bar__segment"
                      style={{
                        width: `${segment.percent}%`,
                        backgroundColor: segment.color,
                      }}
                      data-label={segment.label}
                      data-percent={segment.percent}
                      aria-label={`${segment.label}: ${segment.percent}%`}
                    />
                  ))}
                </div>
                <div className="branch-bar__labels">
                  {branchDistribution.map((branch) => (
                    <span key={branch.label} className="branch-bar__label">
                      {branch.label} {branch.percent}%
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="kpi-module__caption">Loading branch data...</p>
            )}
          </article>

          <article className="kpi-module">
            <p className="kpi-module__label">Candidates evaluated on</p>
            <ul className="evaluation-list">
              {evaluationCriteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              className="kpi-module__link"
              type="button"
              onClick={() => setIsEvaluationModalOpen(true)}
            >
              View Detailed Evaluation Criteria
            </button>
          </article>
        </section>

        <section className="filter-bar" aria-label="Search and filters">
          <div className="filter-bar__search">
            <label className="sr-only" htmlFor="candidate-search">
              Search candidates
            </label>
            <input
              id="candidate-search"
              type="search"
              placeholder="Search by name, college, or branch…"
            />
          </div>
          <div className="filter-bar__controls">
            <label className="filter-pill">
              <span className="filter-pill__label">Verdict</span>
              <select aria-label="Filter by verdict" defaultValue="All">
                <option>All</option>
                <option>Strong</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label className="filter-pill">
              <span className="filter-pill__label">Sort</span>
              <select aria-label="Sort candidates" defaultValue="Assessment Avg">
                <option>Assessment Avg</option>
                <option>Interview Avg</option>
                <option>CGPA</option>
                <option>Latest</option>
              </select>
            </label>
          </div>
          <button className="ghost-button" type="button">
            Clear filters
          </button>
        </section>

        <section className="candidate-list" aria-live="polite">
          {candidates.map((candidate) => (
            <article key={candidate.name} className="candidate-card">
              <span className={`recommendation recommendation--${candidate.recommendation.replace(' ', '-').toLowerCase()}`}>
                {candidate.recommendation}
              </span>
              <div className="candidate-card__identity">
                <div className="identity-cluster">
                  <span className="avatar" aria-hidden="true">
                    {formatInitials(candidate.name)}
                  </span>
                  <div className="identity-details">
                    <h3 className="candidate-name">{candidate.name}</h3>
                    <p className="candidate-meta">
                      {candidate.college} <span aria-hidden="true">•</span> {candidate.branch}{' '}
                      <span aria-hidden="true">•</span> CGPA {candidate.cgpa}
                    </p>
                    <div className="candidate-skills" role="list">
                      {candidate.skills.map((skill) => (
                        <span key={skill} className="skill-chip" role="listitem">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="candidate-card__scores" role="group" aria-label={`${candidate.name} scores`}>
                <div className="score-tile">
                  <p className="score-tile__label">Assessment</p>
                  <p className="score-tile__value">{candidate.assessmentScore}</p>
                  <p className="score-tile__meta">{candidate.assessmentMeta}</p>
                </div>
                <div className="score-tile">
                  <p className="score-tile__label">Interview</p>
                  <p className="score-tile__value">{candidate.interviewScore}</p>
                  <p className="score-tile__meta">{candidate.interviewMeta}</p>
                </div>
              </div>

              <div className="candidate-card__actions">
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                >
                  View Full Profile
                  <span className="button__icon" aria-hidden="true">
                    →
                  </span>
                </button>
                {candidate.resumeUrl && (
                  <a className="button-link" href={candidate.resumeUrl} target="_blank" rel="noreferrer">
                    Open Resume
                    <span className="button-link__icon" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
      <StudentProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EvaluationCriteriaModal isOpen={isEvaluationModalOpen} onClose={() => setIsEvaluationModalOpen(false)} />
    </main>
  )
}

export default App
