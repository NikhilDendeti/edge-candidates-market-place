/**
 * Statistics controller
 */

import { Request, Response, NextFunction } from 'express'
import { getStatsSummary, getBranchDistribution } from '../services/statsService.js'

export async function getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await getStatsSummary()
    
    // Explicitly set 200 status code
    res.status(200).json(summary)
    return
  } catch (error) {
    next(error)
  }
}

export async function getBranchDistributionHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const distribution = await getBranchDistribution()
    
    // Explicitly set 200 status code
    res.status(200).json(distribution)
    return
  } catch (error) {
    next(error)
  }
}

