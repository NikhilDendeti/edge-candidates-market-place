import { useState } from 'react'
import StudentProfileModal from './StudentProfileModal'

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

const branchDistribution = [
  { label: 'CSE', percent: 42, tone: 'primary-900' },
  { label: 'IT', percent: 28, tone: 'primary-400' },
  { label: 'ECE', percent: 18, tone: 'primary-200' },
  { label: 'Other', percent: 12, tone: 'neutral-100' },
]

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

const buildBranchBarSegments = () => {
  return branchDistribution.map((branch) => ({
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

function App() {
  const totalCandidates = 9
  const branchSegments = buildBranchBarSegments()
  const [isModalOpen, setIsModalOpen] = useState(false)

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
            <p className="kpi-module__label">Branch mix (Top 3)</p>
            <div className="branch-bar">
              {branchSegments.map((segment) => (
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
          </article>

          <article className="kpi-module">
            <p className="kpi-module__label">Candidates evaluated on</p>
            <ul className="evaluation-list">
              {evaluationCriteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a
              className="kpi-module__link"
              href="https://nxtwave.tech"
              target="_blank"
              rel="noreferrer"
            >
              View Detailed Evaluation Criteria
            </a>
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
    </main>
  )
}

export default App
