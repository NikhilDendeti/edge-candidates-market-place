/**
 * Candidates routes
 */

import { Router } from 'express'
import { listCandidates } from '../controllers/candidatesController.js'
import { logView, getCandidateViewersHandler } from '../controllers/viewController.js'

const router = Router()

router.get('/', listCandidates)
router.post('/:id/view', logView)
router.get('/:id/viewers', getCandidateViewersHandler)

export default router

