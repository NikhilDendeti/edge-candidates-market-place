/**
 * Candidates controller
 */

import { Request, Response, NextFunction } from 'express'
import { getCandidates } from '../services/candidateService.js'
import { validateCandidateFilters } from '../utils/validators.js'

export async function listCandidates(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = validateCandidateFilters(req.query)
    const result = await getCandidates(filters)
    
    // Explicitly set 200 status code
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

