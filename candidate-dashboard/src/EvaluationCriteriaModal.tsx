import React, { useEffect, useRef } from 'react'

interface EvaluationCriteriaModalProps {
  isOpen: boolean
  onClose: () => void
}

const EvaluationCriteriaModal: React.FC<EvaluationCriteriaModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null)

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
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" aria-modal="true" role="dialog" aria-labelledby="modal-title">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <div className="modal-header__content">
            <h2 id="modal-title" className="modal-title">NxtWave Edge — Employability Assessment for Top Talent</h2>
            <p className="modal-subtitle">Comprehensive assessment to evaluate top talent freshers</p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="modal-body evaluation-criteria-body">
          <section className="evaluation-section">
            <div className="evaluation-section__header">
              <h3 className="evaluation-section__title">Objective of the Assessment</h3>
            </div>
            <p className="evaluation-section__description">
              Create a comprehensive assessment to evaluate top talent freshers on key domains that include 
              problem-solving (coding round), Core CS Fundamentals (OOPS, Computer Networks, Operating Systems, 
              DBMS, Programming), Aptitude (Quantitative Ability, Logical Reasoning, Verbal Ability).
            </p>
            <div className="evaluation-section__meta">
              <span className="meta-badge">
                <span className="meta-badge__icon">⏱️</span>
                <span className="meta-badge__text">Total Test Duration: 3 Hr 15 min</span>
              </span>
            </div>
          </section>

          <section className="evaluation-section">
            <div className="evaluation-section__header">
              <h3 className="evaluation-section__title">Section 1: Problem Solving (Coding)</h3>
              <span className="evaluation-section__duration">90 min</span>
            </div>
            <p className="evaluation-section__description">
              In this section, we assess candidates problem solving ability through coding round.
            </p>
            <div className="questions-grid">
              <div className="question-card">
                <div className="question-card__header">
                  <span className="question-card__number">Question 1</span>
                  <span className="question-card__difficulty question-card__difficulty--easy">Easy</span>
                </div>
                <p className="question-card__topic">Logic</p>
              </div>
              <div className="question-card">
                <div className="question-card__header">
                  <span className="question-card__number">Question 2</span>
                  <span className="question-card__difficulty question-card__difficulty--medium">Medium</span>
                </div>
                <p className="question-card__topic">
                  On Arrays, Greedy, Sliding Window and 2 pointers, Heaps, Binary Search, LinkedList, 
                  Binary Trees, Binary Search Trees
                </p>
              </div>
              <div className="question-card">
                <div className="question-card__header">
                  <span className="question-card__number">Question 3</span>
                  <span className="question-card__difficulty question-card__difficulty--medium-hard">Medium-Hard</span>
                </div>
                <p className="question-card__topic">Dynamic Programming</p>
              </div>
              <div className="question-card">
                <div className="question-card__header">
                  <span className="question-card__number">Question 4</span>
                  <span className="question-card__difficulty question-card__difficulty--medium-hard">Medium-Hard</span>
                </div>
                <p className="question-card__topic">Graphs</p>
              </div>
            </div>
          </section>

          <section className="evaluation-section">
            <div className="evaluation-section__header">
              <h3 className="evaluation-section__title">Section 2: Aptitude & Verbal Ability</h3>
              <span className="evaluation-section__duration">50 min</span>
            </div>
            <p className="evaluation-section__description">
              In this section, we assess the candidates on Quantitative Ability, Logical Reasoning, Verbal Ability.
            </p>
            <div className="evaluation-table">
              <table>
                <thead>
                  <tr>
                    <th>Area</th>
                    <th>#Questions</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Quantitative Aptitude</td>
                    <td>15</td>
                    <td>20 min</td>
                  </tr>
                  <tr>
                    <td>Logical Reasoning</td>
                    <td>15</td>
                    <td>20 min</td>
                  </tr>
                  <tr>
                    <td>Verbal Ability</td>
                    <td>10</td>
                    <td>10 min</td>
                  </tr>
                  <tr className="table-total">
                    <td><strong>Total</strong></td>
                    <td><strong>40</strong></td>
                    <td><strong>50 min</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="evaluation-section">
            <div className="evaluation-section__header">
              <h3 className="evaluation-section__title">Section 3: Core CS Fundamentals</h3>
              <span className="evaluation-section__duration">40 min</span>
            </div>
            <p className="evaluation-section__description">
              In this section, we assess the candidates on OOPS, Computer Networks, Operating Systems, DBMS, 
              Programming through MCQs.
            </p>
            <div className="evaluation-table">
              <table>
                <thead>
                  <tr>
                    <th>Area</th>
                    <th>#Questions</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>OOPS</td>
                    <td>10</td>
                    <td>10 min</td>
                  </tr>
                  <tr>
                    <td>Computer Networks</td>
                    <td>10</td>
                    <td>10 min</td>
                  </tr>
                  <tr>
                    <td>Operating Systems</td>
                    <td>10</td>
                    <td>10 min</td>
                  </tr>
                  <tr>
                    <td>DBMS</td>
                    <td>10</td>
                    <td>10 min</td>
                  </tr>
                  <tr className="table-total">
                    <td><strong>Total</strong></td>
                    <td><strong>40</strong></td>
                    <td><strong>40 min</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="evaluation-section">
            <div className="evaluation-section__header">
              <h3 className="evaluation-section__title">Section 4: DSA Theory</h3>
              <span className="evaluation-section__duration">15 min</span>
            </div>
            <p className="evaluation-section__description">
              In this section, we assess the candidates on DSA Theory
            </p>
            <div className="evaluation-table">
              <table>
                <thead>
                  <tr>
                    <th>Area</th>
                    <th>#Questions</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>DSA Theory</td>
                    <td>10</td>
                    <td>15 min</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default EvaluationCriteriaModal

