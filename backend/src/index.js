/**
 * Express server entry point
 */
import express from 'express';
import cors from 'cors';
import { env } from '../dist/config/env.js';
import { errorHandler } from '../dist/middleware/errorHandler.js';
import candidateRoutes from '../dist/routes/candidates.js';
import studentRoutes from '../dist/routes/students.js';
import statsRoutes from '../dist/routes/stats.js';
import userRoutes from '../dist/routes/users.js';
const app = express();
// Middleware
// CORS configuration - support multiple origins for frontend on different machines
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.) in development
        if (!origin && env.nodeEnv === 'development') {
            return callback(null, true);
        }
        // Check if origin is in allowed list
        if (origin && env.frontendUrls.includes(origin)) {
            return callback(null, true);
        }
        // In development, allow all origins (useful for testing on different machines)
        if (env.nodeEnv === 'development') {
            return callback(null, true);
        }
        // In production, reject unknown origins
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json());
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/stats', statsRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/users', userRoutes);
// Error handling
app.use(errorHandler);
// Start server
const PORT = env.port;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${env.nodeEnv}`);
    console.log(`🔗 Allowed Frontend URLs: ${env.frontendUrls.join(', ')}`);
    console.log(`🌐 Server accessible on: http://0.0.0.0:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    if (env.nodeEnv === 'development') {
        console.log(`⚠️  Development mode: CORS allows all origins`);
    }
});
//# sourceMappingURL=index.js.map