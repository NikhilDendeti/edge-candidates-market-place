/**
 * Candidates routes
 */

import { Router } from 'express'
import { listCandidates } from '../controllers/candidatesController.js'

const router = Router()

router.get('/', listCandidates)

export default router

