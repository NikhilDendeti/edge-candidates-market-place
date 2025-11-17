/**
 * Students controller
 */

import { Request, Response, NextFunction } from 'express'
import { getStudentProfile } from '../services/studentService.js'
import { validateStudentId } from '../utils/validators.js'

export async function getStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = validateStudentId(req.params.id)
    const profile = await getStudentProfile(studentId)
    
    // Explicitly set 200 status code
    res.status(200).json(profile)
    return
  } catch (error) {
    next(error)
  }
}

