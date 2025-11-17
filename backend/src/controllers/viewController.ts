/**
 * View controller
 * Handles candidate view tracking requests
 */

import { Request, Response, NextFunction } from 'express'
import {
  logCandidateView,
  getUserViewHistory,
  getCandidateViewers,
  getUserViewStats,
} from '../services/viewService.js'
import {
  validateViewLogRequest,
  validateEmail,
  validateCandidateId,
  validateViewHistoryFilters,
} from '../utils/validators.js'

/**
 * Log a candidate view
 * POST /api/candidates/:id/view
 */
export async function logView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const candidateId = validateCandidateId(req.params.id)
    const userData = validateViewLogRequest(req.body)
    const result = await logCandidateView(candidateId, userData)

    res.status(201).json(result)
    return
  } catch (error) {
    next(error)
  }
}

/**
 * Get user view history
 * GET /api/users/:email/candidates
 */
export async function getUserViewHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = validateEmail(req.params.email)
    const filters = validateViewHistoryFilters(req.query)
    const result = await getUserViewHistory(email, filters)

    res.status(200).json(result)
    return
  } catch (error) {
    next(error)
  }
}

/**
 * Get candidate viewers
 * GET /api/candidates/:id/viewers
 */
export async function getCandidateViewersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const candidateId = validateCandidateId(req.params.id)
    const filters = validateViewHistoryFilters(req.query)
    const result = await getCandidateViewers(candidateId, filters)

    res.status(200).json(result)
    return
  } catch (error) {
    next(error)
  }
}

/**
 * Get user view statistics
 * GET /api/users/:email/stats
 */
export async function getUserViewStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = validateEmail(req.params.email)
    const result = await getUserViewStats(email)

    res.status(200).json(result)
    return
  } catch (error) {
    next(error)
  }
}

