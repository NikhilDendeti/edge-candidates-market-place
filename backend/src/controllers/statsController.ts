/**
 * Statistics controller
 */

import { Request, Response, NextFunction } from 'express'
import { getStatsSummary, getBranchDistribution } from '../services/statsService.js'

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await getStatsSummary()
    
    // Explicitly set 200 status code
    return res.status(200).json(summary)
  } catch (error) {
    next(error)
  }
}

export async function getBranchDistributionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const distribution = await getBranchDistribution()
    
    // Explicitly set 200 status code
    return res.status(200).json(distribution)
  } catch (error) {
    next(error)
  }
}

