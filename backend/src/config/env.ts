/**
 * Environment variables configuration
 */

import dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { existsSync } from 'fs'

// Load .env from root directory (if it exists)
// In production (e.g., Render), environment variables are set directly, so .env file may not exist
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try multiple path resolution strategies
let rootEnvPath = resolve(__dirname, '../../../.env') // From dist/config/env.js -> dist -> backend -> root

// If we're in backend/, go up one level
if (process.cwd().endsWith('backend')) {
  rootEnvPath = resolve(process.cwd(), '../.env')
} else {
  // If we're in root, use .env directly
  rootEnvPath = resolve(process.cwd(), '.env')
}

// Only load .env file if it exists (for local development)
// In production, environment variables are set directly by the platform
if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath })
} else {
  // Silently continue - environment variables will come from process.env
  dotenv.config() // This will look for .env in current directory, but won't error if missing
}

// Parse frontend URLs - support comma-separated list for multiple origins
const parseFrontendUrls = (): string[] => {
  const frontendUrlEnv = process.env.FRONTEND_URL || 'http://localhost:5173'
  // Support comma-separated list of URLs
  return frontendUrlEnv.split(',').map(url => url.trim()).filter(Boolean)
}

export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  frontendUrls: parseFrontendUrls(),
  // Keep single URL for backward compatibility
  frontendUrl: parseFrontendUrls()[0] || 'http://localhost:5173',
}

// Validate required environment variables
const missingVars: string[] = []
if (!env.supabaseUrl) {
  missingVars.push('SUPABASE_URL')
}
if (!env.supabaseServiceKey) {
  missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
}

if (missingVars.length > 0) {
  const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}\n` +
    `Please set these in your Render dashboard under Environment Variables.`
  console.error('❌ Configuration Error:', errorMessage)
  throw new Error(errorMessage)
}

