/**
 * Environment variables configuration
 */

import dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Load .env from root directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try multiple path resolution strategies
let rootEnvPath = resolve(__dirname, '../../../.env') // From backend/src/config/env.ts -> backend -> root

// If we're in backend/, go up one level
if (process.cwd().endsWith('backend')) {
  rootEnvPath = resolve(process.cwd(), '../.env')
} else {
  // If we're in root, use .env directly
  rootEnvPath = resolve(process.cwd(), '.env')
}

dotenv.config({ path: rootEnvPath })

export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}

// Validate required environment variables
if (!env.supabaseUrl || !env.supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
}

