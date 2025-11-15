# Backend API - Edge Candidates Marketplace

REST API backend for the Edge Candidates Marketplace application.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Validation**: Zod

## Project Structure

```
backend/
├── src/
│   ├── index.ts                    # Express server entry point
│   ├── config/                     # Configuration
│   │   ├── supabase.ts            # Supabase client
│   │   └── env.ts                 # Environment variables
│   ├── routes/                     # API routes
│   │   ├── candidates.ts          # Candidate endpoints
│   │   ├── students.ts            # Student profile endpoints
│   │   └── stats.ts               # Statistics endpoints
│   ├── controllers/               # Request handlers
│   │   ├── candidatesController.ts
│   │   ├── studentsController.ts
│   │   └── statsController.ts
│   ├── services/                  # Business logic
│   │   ├── candidateService.ts
│   │   ├── studentService.ts
│   │   └── statsService.ts
│   ├── utils/                     # Utilities
│   │   ├── transformers.ts        # Data transformation
│   │   ├── validators.ts          # Request validation
│   │   └── errors.ts              # Error classes
│   ├── types/                     # TypeScript types
│   │   ├── api.types.ts
│   │   ├── candidate.types.ts
│   │   └── student.types.ts
│   └── middleware/               # Express middleware
│       └── errorHandler.ts
├── load-csv-data.js              # CSV data loader script
├── verify-data.js                 # Data verification script
├── database-schema.sql            # Database schema
├── migrate-to-normalized-schema.sql  # Migration script
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
```

**Important**: Use the **SERVICE ROLE KEY** (not anon key) for backend access.

### 3. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Statistics

#### GET `/api/stats/summary`
Get dashboard summary statistics.

**Response**:
```json
{
  "totalCandidates": 3,
  "branchDistribution": [
    { "label": "CSE", "percent": 50, "count": 2, "tone": "primary-900" },
    { "label": "IT", "percent": 33, "count": 1, "tone": "primary-400" }
  ],
  "verdictSummary": [
    { "label": "Strong", "count": 2 },
    { "label": "Medium", "count": 1 },
    { "label": "Low", "count": 0 }
  ]
}
```

#### GET `/api/stats/branch-distribution`
Get branch distribution for visualization.

**Response**: Array of branch distribution objects

### Candidates

#### GET `/api/candidates`
Get paginated list of candidates with filtering and sorting.

**Query Parameters**:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `search` (string, optional) - Search by name, college, or branch
- `verdict` (enum: Strong | Medium | Low | All) - Filter by verdict
- `sort` (enum: assessment_avg | interview_avg | cgpa | latest) - Sort field
- `order` (enum: asc | desc, default: desc) - Sort order

**Example**:
```
GET /api/candidates?page=1&limit=20&search=john&verdict=Strong&sort=assessment_avg&order=desc
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "college": "IIIT Hyderabad",
      "branch": "Computer Science",
      "cgpa": "9.41",
      "assessmentScore": "188 / 210",
      "assessmentMeta": "Last taken: 12 Oct",
      "interviewScore": "9.6 / 10",
      "interviewMeta": "Recorded",
      "skills": ["Strong Problem Solving", "Strong DSA"],
      "recommendation": "Strong Hire",
      "resumeUrl": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

### Students

#### GET `/api/students/:id`
Get complete student profile with all details.

**Path Parameter**: `id` (UUID) - Student's nxtwave_user_id

**Response**:
```json
{
  "id": "uuid",
  "name": "John Doe",
  "initials": "JD",
  "meta": "IIIT Hyderabad (NIRF: 1) • Computer Science • Class of 2026",
  "cgpa": "9.41 / 10.0",
  "skills": ["Strong Problem Solving", "Strong DSA"],
  "college": {
    "name": "IIIT Hyderabad",
    "branch": "Computer Science",
    "nirfRanking": 1
  },
  "assessmentOverall": {
    "percentage": 90,
    "raw": "189 / 210"
  },
  "interviewOverall": {
    "percentage": 96,
    "raw": "9.6 / 10"
  },
  "latestAssessment": {
    "assessmentId": "uuid",
    "takenAt": "2024-10-12T...",
    "scores": [
      {
        "type": "coding",
        "label": "Coding",
        "score": 84.57,
        "maxScore": 120,
        "percentage": 70,
        "rating": "Good"
      }
    ]
  },
  "latestInterview": {
    "interviewId": "uuid",
    "interviewDate": "2024-10-12T...",
    "scores": [
      {
        "criteria": "Self Introduction",
        "score": 5,
        "max": 5,
        "rating": "Excellent"
      }
    ],
    "overallRating": 9.6,
    "overallLabel": "Strong Hire"
  },
  "allAssessments": [...],
  "allInterviews": [...]
}
```

## Health Check

#### GET `/health`
Check if the server is running.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-11-15T12:00:00.000Z"
}
```

## Scripts

### Data Loading

#### Load CSV Data
```bash
node load-csv-data.js
```

#### Verify Data
```bash
node verify-data.js
```

## Development

### Build
```bash
npm run build
```

### Type Check
```bash
npm run type-check
```

### Production Start
```bash
npm start
```

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  }
}
```

### Error Codes
- `NOT_FOUND` - Resource not found (404)
- `VALIDATION_ERROR` - Invalid request parameters (400)
- `DATABASE_ERROR` - Database query error (500)
- `INTERNAL_ERROR` - Unexpected server error (500)

## Notes

- The API uses Supabase's service role key for full database access
- All endpoints return JSON
- CORS is enabled for the frontend URL
- Request validation is handled by Zod schemas
- Data transformation happens in the service layer
