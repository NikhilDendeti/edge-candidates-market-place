/**
 * Users routes
 */

import { Router } from 'express'
import {
  getUserViewHistoryHandler,
  getUserViewStatsHandler,
} from '../controllers/viewController.js'

const router = Router()

router.get('/:email/candidates', getUserViewHistoryHandler)
router.get('/:email/stats', getUserViewStatsHandler)

export default router

