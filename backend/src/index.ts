/**
 * Express server entry point
 */

import express from 'express'
import cors from 'cors'

import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import candidateRoutes from './routes/candidates.js'
import studentRoutes from './routes/students.js'
import statsRoutes from './routes/stats.js'

const app = express()

// Middleware
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}))

app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/stats', statsRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/students', studentRoutes)

// Error handling
app.use(errorHandler)

// Start server
const PORT = env.port

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 Environment: ${env.nodeEnv}`)
  console.log(`🔗 Frontend URL: ${env.frontendUrl}`)
  console.log(`✅ Health check: http://localhost:${PORT}/health`)
})

