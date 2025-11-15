# API Specification - Edge Candidates Marketplace

**Base URL**: `http://localhost:3001`  
**API Version**: `1.0.0`  
**Content-Type**: `application/json`

---

## Table of Contents

1. [Health Check](#health-check)
2. [Statistics Endpoints](#statistics-endpoints)
3. [Candidates Endpoints](#candidates-endpoints)
4. [Students Endpoints](#students-endpoints)
5. [Error Responses](#error-responses)

---

## Health Check

### GET `/health`

Check if the API server is running.

**Request**:
```http
GET /health
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-11-15T12:00:00.000Z"
}
```

**Example**:
```bash
curl http://localhost:3001/health
```

---

## Statistics Endpoints

### GET `/api/stats/summary`

Get complete dashboard summary statistics including total candidates, branch distribution, and verdict summary.

**Request**:
```http
GET /api/stats/summary
```

**Response** (200 OK):
```json
{
  "totalCandidates": 3,
  "branchDistribution": [
    {
      "label": "CSE",
      "percent": 50,
      "count": 2,
      "tone": "primary-900"
    },
    {
      "label": "IT",
      "percent": 33,
      "count": 1,
      "tone": "primary-400"
    },
    {
      "label": "Other",
      "percent": 17,
      "count": 1,
      "tone": "neutral-100"
    }
  ],
  "verdictSummary": [
    {
      "label": "Strong",
      "count": 2
    },
    {
      "label": "Medium",
      "count": 1
    },
    {
      "label": "Low",
      "count": 0
    }
  ]
}
```

**Response Fields**:
- `totalCandidates` (number): Total number of students in the database
- `branchDistribution` (array): Array of branch distribution objects
  - `label` (string): Normalized branch name (CSE, IT, ECE, etc.)
  - `percent` (number): Percentage of candidates in this branch
  - `count` (number): Number of candidates in this branch
  - `tone` (string): CSS tone class for UI styling
- `verdictSummary` (array): Array of verdict counts
  - `label` (string): Verdict label ("Strong", "Medium", "Low")
  - `count` (number): Number of candidates with this verdict

**Example**:
```bash
curl http://localhost:3001/api/stats/summary
```

---

### GET `/api/stats/branch-distribution`

Get branch distribution data for visualization.

**Request**:
```http
GET /api/stats/branch-distribution
```

**Response** (200 OK):
```json
[
  {
    "label": "CSE",
    "percent": 50,
    "count": 2,
    "tone": "primary-900"
  },
  {
    "label": "IT",
    "percent": 33,
    "count": 1,
    "tone": "primary-400"
  },
  {
    "label": "ECE",
    "percent": 17,
    "count": 1,
    "tone": "primary-200"
  },
  {
    "label": "Other",
    "percent": 0,
    "count": 0,
    "tone": "neutral-100"
  }
]
```

**Response Fields**:
- Array of branch distribution objects (same structure as in `/api/stats/summary`)

**Notes**:
- Returns top 3 branches by count, with remaining branches grouped as "Other"
- Branches are normalized (e.g., "Computer Science" → "CSE", "Information Technology" → "IT")

**Example**:
```bash
curl http://localhost:3001/api/stats/branch-distribution
```

---

## Candidates Endpoints

### GET `/api/candidates`

Get paginated list of candidates with filtering, sorting, and search capabilities.

**Request**:
```http
GET /api/candidates?page=1&limit=20&search=john&verdict=Strong&sort=assessment_avg&order=desc
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | `1` | Page number (must be positive integer) |
| `limit` | number | No | `20` | Items per page (max: 100, must be positive) |
| `search` | string | No | - | Search by name, college, or branch (case-insensitive partial match) |
| `verdict` | enum | No | `All` | Filter by verdict: `Strong`, `Medium`, `Low`, or `All` |
| `sort` | enum | No | `latest` | Sort field: `assessment_avg`, `interview_avg`, `cgpa`, or `latest` |
| `order` | enum | No | `desc` | Sort order: `asc` or `desc` |

**Sort Options**:
- `assessment_avg`: Sort by assessment score (highest first)
- `interview_avg`: Sort by interview rating (highest first)
- `cgpa`: Sort by CGPA
- `latest`: Sort by creation date (newest first)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "3c6e6834-cffb-4a17-845d-905d94f05f50",
      "name": "John Doe",
      "college": "IIIT Hyderabad",
      "branch": "Computer Science",
      "cgpa": "9.41",
      "assessmentScore": "188 / 210",
      "assessmentMeta": "Last taken: 12 Oct",
      "interviewScore": "9.6 / 10",
      "interviewMeta": "Recorded",
      "skills": [
        "Strong Problem Solving",
        "Strong DSA",
        "Strong Theory"
      ],
      "recommendation": "Strong Hire",
      "resumeUrl": "https://example.com/resume.pdf"
    },
    {
      "id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
      "name": "Jane Smith",
      "college": "IIIT Bangalore",
      "branch": "Information Technology",
      "cgpa": "9.18",
      "assessmentScore": "178 / 210",
      "assessmentMeta": "Last taken: 10 Oct",
      "interviewScore": "8.7 / 10",
      "interviewMeta": "Recorded",
      "skills": [
        "Strong Problem Solving",
        "Strong DSA",
        "Strong Communication"
      ],
      "recommendation": "Medium Fit",
      "resumeUrl": null
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

**Response Fields**:
- `data` (array): Array of candidate objects
  - `id` (string, UUID): Student's nxtwave_user_id
  - `name` (string): Full name of the candidate
  - `college` (string): College name
  - `branch` (string): Branch/Department name
  - `cgpa` (string): CGPA formatted as "X.XX"
  - `assessmentScore` (string): Latest assessment score formatted as "XXX / XXX"
  - `assessmentMeta` (string): Assessment metadata (e.g., "Last taken: 12 Oct")
  - `interviewScore` (string): Latest interview rating formatted as "X.X / 10"
  - `interviewMeta` (string): Interview metadata (e.g., "Recorded" or date)
  - `skills` (array): Array of skill strings derived from assessment scores
  - `recommendation` (enum): Verdict: `"Strong Hire"`, `"Medium Fit"`, or `"Consider"`
  - `resumeUrl` (string | null): URL to resume if available
- `pagination` (object): Pagination metadata
  - `page` (number): Current page number
  - `limit` (number): Items per page
  - `total` (number): Total number of candidates after filtering
  - `totalPages` (number): Total number of pages

**Example Requests**:

```bash
# Get first page with default settings
curl http://localhost:3001/api/candidates

# Search for candidates
curl "http://localhost:3001/api/candidates?search=john"

# Filter by verdict and sort by CGPA
curl "http://localhost:3001/api/candidates?verdict=Strong&sort=cgpa&order=desc"

# Get page 2 with 10 items per page
curl "http://localhost:3001/api/candidates?page=2&limit=10"

# Combined filters
curl "http://localhost:3001/api/candidates?search=hyderabad&verdict=Strong&sort=assessment_avg&order=desc&page=1&limit=20"
```

**Notes**:
- Search is case-insensitive and matches against name, college name, or branch
- Verdict filter maps: `Strong` → `"Strong Hire"`, `Medium` → `"Medium Fit"`, `Low` → `"Consider"`
- Skills are automatically derived from assessment scores (threshold: 70%)
- Assessment and interview scores are from the latest assessment/interview for each student

---

## Students Endpoints

### GET `/api/students/:id`

Get complete detailed profile of a specific student including all assessments and interviews.

**Request**:
```http
GET /api/students/{id}
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Student's nxtwave_user_id |

**Response** (200 OK):
```json
{
  "id": "3c6e6834-cffb-4a17-845d-905d94f05f50",
  "name": "John Doe",
  "initials": "JD",
  "meta": "IIIT Hyderabad (NIRF: 1) • Computer Science • Class of 2026",
  "cgpa": "9.41 / 10.0",
  "skills": [
    "Strong Problem Solving",
    "Strong DSA",
    "Strong Theory",
    "Strong Communication"
  ],
  "phone": "+91 9876543210",
  "email": "john.doe@example.com",
  "resumeUrl": "https://example.com/resume.pdf",
  "college": {
    "name": "IIIT Hyderabad",
    "branch": "Computer Science",
    "nirfRanking": 1,
    "city": "Hyderabad",
    "state": "Telangana"
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
    "assessmentId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "takenAt": "2024-10-12T10:30:00.000Z",
    "reportUrl": "https://example.com/assessment-report.pdf",
    "totalStudentScore": 189,
    "totalAssessmentScore": 210,
    "percent": 90,
    "scores": [
      {
        "type": "coding",
        "label": "Coding",
        "score": 84.57,
        "maxScore": 120,
        "percentage": 70,
        "rating": "Good"
      },
      {
        "type": "dsa",
        "label": "DSA Theory",
        "score": 7,
        "maxScore": 10,
        "percentage": 70,
        "rating": "Good"
      },
      {
        "type": "cs_fund",
        "label": "CS Fundamentals",
        "score": 35,
        "maxScore": 40,
        "percentage": 88,
        "rating": "Excellent"
      },
      {
        "type": "quant",
        "label": "Quantitative Aptitude",
        "score": 32,
        "maxScore": 40,
        "percentage": 80,
        "rating": "Excellent"
      }
    ]
  },
  "latestInterview": {
    "interviewId": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    "interviewDate": "2024-10-12T14:00:00.000Z",
    "recordingUrl": "https://example.com/interview-recording.mp4",
    "scores": [
      {
        "criteria": "Self Introduction",
        "score": 5,
        "max": 5,
        "rating": "Excellent"
      },
      {
        "criteria": "Problem Solving & Coding",
        "score": 35,
        "max": 35,
        "rating": "Excellent"
      },
      {
        "criteria": "Communication Skills",
        "score": 9,
        "max": 9,
        "rating": "Excellent"
      },
      {
        "criteria": "Conceptual & Theoretical",
        "score": 6,
        "max": 6,
        "rating": "Excellent"
      }
    ],
    "overallRating": 9.6,
    "overallLabel": "Strong Hire",
    "notes": "Excellent candidate with strong problem-solving skills."
  },
  "allAssessments": [
    {
      "assessmentId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "takenAt": "2024-10-12T10:30:00.000Z",
      "percent": 90,
      "reportUrl": "https://example.com/assessment-report.pdf"
    },
    {
      "assessmentId": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
      "takenAt": "2024-09-15T10:30:00.000Z",
      "percent": 85,
      "reportUrl": null
    }
  ],
  "allInterviews": [
    {
      "interviewId": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      "interviewDate": "2024-10-12T14:00:00.000Z",
      "overallLabel": "Strong Hire",
      "recordingUrl": "https://example.com/interview-recording.mp4"
    }
  ]
}
```

**Response Fields**:

**Student Information**:
- `id` (string, UUID): Student's nxtwave_user_id
- `name` (string): Full name
- `initials` (string): Initials (first 2 letters)
- `meta` (string): Formatted metadata string
- `cgpa` (string): CGPA formatted as "X.XX / 10.0"
- `skills` (array): Array of skill strings
- `phone` (string | null): Phone number
- `email` (string | null): Email address
- `resumeUrl` (string | null): Resume URL

**College Information**:
- `college` (object):
  - `name` (string): College name
  - `branch` (string): Branch name
  - `nirfRanking` (number | null): NIRF ranking
  - `city` (string | null): City
  - `state` (string | null): State

**Overall Scores**:
- `assessmentOverall` (object):
  - `percentage` (number): Percentage score
  - `raw` (string): Raw score formatted as "XXX / XXX"
- `interviewOverall` (object):
  - `percentage` (number): Percentage score (rating × 10)
  - `raw` (string): Raw rating formatted as "X.X / 10"

**Latest Assessment** (object | null):
- `assessmentId` (string, UUID): Assessment ID
- `takenAt` (string, ISO 8601): Assessment date
- `reportUrl` (string | null): Report URL
- `totalStudentScore` (number): Student's total score
- `totalAssessmentScore` (number): Maximum possible score
- `percent` (number): Percentage score
- `scores` (array): Array of score breakdowns
  - `type` (string): Score type key (coding, dsa, cs_fund, quant, verbal, logical)
  - `label` (string): Display name
  - `score` (number): Actual score
  - `maxScore` (number): Maximum score
  - `percentage` (number): Percentage
  - `rating` (string): Rating ("Excellent", "Good", "Fair", "Poor")

**Latest Interview** (object | null):
- `interviewId` (string, UUID): Interview ID
- `interviewDate` (string, ISO 8601): Interview date
- `recordingUrl` (string | null): Recording URL
- `scores` (array): Array of interview scores
  - `criteria` (string): Criteria name
  - `score` (number): Actual score
  - `max` (number): Maximum score
  - `rating` (string): Rating
- `overallRating` (number): Overall interview rating (0-10)
- `overallLabel` (enum): Verdict ("Strong Hire", "Medium Fit", "Consider")
- `notes` (string | null): Interview notes

**All Assessments** (array):
- Array of assessment summaries (same structure as in `latestAssessment` but without `scores`)

**All Interviews** (array):
- Array of interview summaries (same structure as in `latestInterview` but without `scores`)

**Example Requests**:

```bash
# Get student profile by ID
curl http://localhost:3001/api/students/3c6e6834-cffb-4a17-845d-905d94f05f50
```

**Error Responses**:

- **404 Not Found**: Student with given ID does not exist
- **400 Bad Request**: Invalid UUID format

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

Invalid request parameters or validation errors.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters: page must be a positive integer",
    "timestamp": "2024-11-15T12:00:00.000Z",
    "details": {
      "field": "page",
      "issue": "must be a positive integer"
    }
  }
}
```

### 404 Not Found

Resource not found.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Student not found",
    "timestamp": "2024-11-15T12:00:00.000Z"
  }
}
```

### 500 Internal Server Error

Server or database errors.

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch candidates",
    "timestamp": "2024-11-15T12:00:00.000Z",
    "details": "Connection timeout",
    "stack": "Error: Connection timeout\n    at ..."
  }
}
```

**Error Response Fields**:
- `error` (object):
  - `code` (string): Error code (e.g., "VALIDATION_ERROR", "NOT_FOUND", "DATABASE_ERROR")
  - `message` (string): Human-readable error message
  - `timestamp` (string): ISO 8601 timestamp when error occurred
  - `details` (object | string, optional): Additional error details (only in development mode for 500 errors)
  - `stack` (string, optional): Stack trace (only in development mode)

**Error Codes**:
- `VALIDATION_ERROR`: Invalid request parameters (400)
- `BAD_REQUEST`: General bad request (400)
- `NOT_FOUND`: Resource not found (404)
- `DATABASE_ERROR`: Database query error (500)
- `INTERNAL_ERROR`: Unexpected server error (500)

**Additional Status Codes Available** (not currently used but implemented):
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Access forbidden
- `CONFLICT` (409): Resource conflict
- `UNPROCESSABLE_ENTITY` (422): Semantic validation failed
- `TOO_MANY_REQUESTS` (429): Rate limiting
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider implementing rate limiting for production use.

---

## CORS

CORS is enabled for the frontend URL specified in `FRONTEND_URL` environment variable (default: `http://localhost:5173`).

---

## Data Formats

### Dates

All dates are returned in ISO 8601 format:
```
2024-10-12T10:30:00.000Z
```

### UUIDs

All IDs are UUIDs (v4) formatted as:
```
3c6e6834-cffb-4a17-845d-905d94f05f50
```

### Percentages

Percentages are integers (0-100) representing the percentage value.

### Ratings

Ratings are calculated based on score percentages:
- **Excellent**: ≥ 80%
- **Good**: ≥ 60% and < 80%
- **Fair**: ≥ 40% and < 60%
- **Poor**: < 40%

---

## Notes

1. **Skills Derivation**: Skills are automatically derived from assessment scores. A skill is added if the score percentage is ≥ 70%:
   - Coding score ≥ 70% → "Strong Problem Solving"
   - DSA score ≥ 70% → "Strong DSA"
   - CS Fundamentals score ≥ 70% → "Strong Theory"
   - Communication rating ≥ 8 → "Strong Communication"

2. **Branch Normalization**: Branch names are normalized for consistency:
   - "Computer Science", "CSE", "CS" → "CSE"
   - "Information Technology", "IT" → "IT"
   - "Electronics & Communication", "ECE", "E&C" → "ECE"
   - etc.

3. **Latest Records**: The "latest" assessment and interview are determined by:
   - Assessment: Most recent `taken_at` date
   - Interview: Most recent `interview_date`

4. **Pagination**: Pagination is applied after filtering and sorting. The `total` field reflects the count after all filters are applied.

5. **Empty Results**: If no candidates match the filters, an empty array is returned with `total: 0`.

---

## Example Integration

### JavaScript/TypeScript (Fetch API)

```typescript
// Get candidates list
const response = await fetch('http://localhost:3001/api/candidates?page=1&limit=20&verdict=Strong')
const data = await response.json()
console.log(data.data) // Array of candidates
console.log(data.pagination) // Pagination info

// Get student profile
const studentId = '3c6e6834-cffb-4a17-845d-905d94f05f50'
const studentResponse = await fetch(`http://localhost:3001/api/students/${studentId}`)
const student = await studentResponse.json()
console.log(student)
```

### cURL Examples

```bash
# Health check
curl http://localhost:3001/health

# Get statistics
curl http://localhost:3001/api/stats/summary
curl http://localhost:3001/api/stats/branch-distribution

# Get candidates with filters
curl "http://localhost:3001/api/candidates?search=hyderabad&verdict=Strong&sort=cgpa&order=desc"

# Get student profile
curl http://localhost:3001/api/students/3c6e6834-cffb-4a17-845d-905d94f05f50
```

---

## Version History

- **v1.0.0** (2024-11-15): Initial API specification

---

## Support

For issues or questions, please refer to the project README or contact the development team.

