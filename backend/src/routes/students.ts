/**
 * Students routes
 */

import { Router } from 'express'
import { getStudent } from '../controllers/studentsController.js'

const router = Router()

router.get('/:id', getStudent)

export default router

