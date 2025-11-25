# API Specification - Edge Candidates Marketplace

**Base URL**: `http://localhost:3001` (Development) / `https://edge-candidates-market-place.onrender.com` (Production)  
**API Version**: `1.1.0`  
**Content-Type**: `application/json`

---

## Table of Contents

1. [Health Check](#health-check)
2. [Statistics Endpoints](#statistics-endpoints)
3. [Candidates Endpoints](#candidates-endpoints)
4. [Students Endpoints](#students-endpoints)
5. [View Tracking Endpoints](#view-tracking-endpoints)
6. [Diagnostics Endpoints](#diagnostics-endpoints)
7. [Error Responses](#error-responses)

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
| `search` | string | No | - | Search by name (case-insensitive partial match). Note: Currently only searches candidate names due to database limitations |
| `verdict` | enum | No | `All` | Filter by verdict: `Strong`, `Medium`, `Low`, or `All` |
| `sort` | enum | No | `latest` | Sort field: `assessment_avg`, `interview_avg`, `cgpa`, or `latest` |
| `order` | enum | No | `desc` | Sort order: `asc` or `desc` |
| `includeAllData` | boolean | No | `false` | If `true`, returns all raw database fields without anonymization (unredacted email, phone, resume URLs, etc.) |
| `complete` | boolean | No | `false` | Alias for `includeAllData` (same functionality) |

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
      "name": "NE Can-1",
      "college": "IIIT Hyderabad",
      "branch": "Computer Science",
      "cgpa": "9.41",
      "assessmentScore": "188 / 210",
      "assessmentMeta": "Last taken: 12 Oct",
      "interviewScore": "96 / 100",
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
      "name": "NE Can-2",
      "college": "IIIT Bangalore",
      "branch": "Information Technology",
      "cgpa": "9.18",
      "assessmentScore": "178 / 210",
      "assessmentMeta": "Last taken: 10 Oct",
      "interviewScore": "87 / 100",
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
  - `interviewScore` (string): Latest interview rating formatted as "XX / 100" (or "X.X / 10" for backward compatibility)
  - `interviewMeta` (string): Interview metadata (e.g., "Recorded" or date)
  - `skills` (array): Array of skill strings derived from assessment scores
  - `recommendation` (enum): Verdict: `"Strong Hire"`, `"Medium Fit"`, or `"Consider"`
  - `resumeUrl` (string | null | array): URL to resume if available. In default mode, returns empty array `[]` for privacy. In complete data mode (`includeAllData=true`), returns actual URL string or `null`.
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

**Response Modes**:

1. **Default Mode** (without `includeAllData=true`):
   - Returns anonymized/transformed data
   - Names are aliased (e.g., "NE Can-01")
   - Email and phone are masked
   - Resume URLs are redacted (empty array)
   - Optimized for frontend display

2. **Complete Data Mode** (with `includeAllData=true` or `complete=true`):
   - Returns all raw database fields
   - Full names, unmasked emails/phones
   - Complete resume URLs
   - All assessment and interview details with nested structures
   - Matches database schema exactly

**Notes**:
- Search is case-insensitive and currently matches against candidate name only (college/branch search has database limitations)
- Verdict filter maps: `Strong` → `"Strong Hire"`, `Medium` → `"Medium Fit"`, `Low` → `"Consider"`
- Skills are automatically derived from assessment scores (threshold: 70%)
- Assessment and interview scores are from the latest assessment/interview for each student
- When `includeAllData=true` or `complete=true`, response structure changes to match raw database schema

---

## Students Endpoints

### GET `/api/students/:id`

Get complete detailed profile of a specific student including all assessments and interviews.

**Request**:
```http
GET /api/students/{id}?includeAllData=true
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Student's nxtwave_user_id |

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `includeAllData` | boolean | No | `false` | If `true`, returns all raw database fields without anonymization (unredacted email, phone, resume URLs, etc.) |
| `complete` | boolean | No | `false` | Alias for `includeAllData` (same functionality) |

**Response Modes**:

1. **Default Mode** (without `includeAllData=true`):
   - Returns anonymized/transformed data
   - Names are aliased (e.g., "NE Can-01")
   - Email and phone are masked
   - Resume URLs are redacted (empty array)
   - Optimized for frontend display

2. **Complete Data Mode** (with `includeAllData=true` or `complete=true`):
   - Returns all raw database fields
   - Full names, unmasked emails/phones
   - Complete resume URLs
   - All assessment and interview details with nested structures
   - Matches database schema exactly

**Response** (200 OK):
```json
{
  "id": "3c6e6834-cffb-4a17-845d-905d94f05f50",
  "name": "NE Can-1",
  "initials": "NE",
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
    "raw": "96 / 100"
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
        "criteria": "Problem 1 Solving",
        "score": 4.5,
        "max": 5,
        "rating": "Excellent"
      },
      {
        "criteria": "Problem 2 Solving",
        "score": 4,
        "max": 5,
        "rating": "Excellent"
      },
      {
        "criteria": "Communication Skills",
        "score": 4.5,
        "max": 5,
        "rating": "Excellent"
      },
      {
        "criteria": "DSA Theory",
        "score": 4,
        "max": 5,
        "rating": "Excellent"
      },
      {
        "criteria": "Core CS Theory",
        "score": 4.5,
        "max": 5,
        "rating": "Excellent"
      }
    ],
    "overallRating": 96,
    "overallLabel": "Strong Hire",
    "notes": "Excellent candidate with strong problem-solving skills.",
    "problem1_solving_rating": 4.5,
    "problem1_solving_rating_code": "LEETCODE-123",
    "problem2_solving_rating": 4,
    "problem2_solving_rating_code": "LEETCODE-456",
    "DSA_Theory": 4,
    "Core_CS_Theory": 4.5,
    "overall_interview_score_out_of_100": 96
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
  - `percentage` (number): Percentage score (0-100)
  - `raw` (string): Raw score formatted as "XX / 100" (or "X.X / 10" for backward compatibility)

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
  - `criteria` (string): Criteria name (e.g., "Self Introduction", "Problem 1 Solving", "Problem 2 Solving", "Communication Skills", "DSA Theory", "Core CS Theory")
  - `score` (number): Actual score
  - `max` (number): Maximum score (all new fields are out of 5)
  - `rating` (string): Rating ("Excellent", "Good", "Fair", "Poor")
- `overallRating` (number): Overall interview rating (0-100 for new format, 0-10 for backward compatibility)
- `overallLabel` (enum): Verdict ("Strong Hire", "Medium Fit", "Consider")
- `notes` (string | null): Interview notes
- `problem1_solving_rating` (number, optional): Problem 1 solving rating (0-5 scale)
- `problem1_solving_rating_code` (string, optional): Problem 1 code/reference identifier
- `problem2_solving_rating` (number, optional): Problem 2 solving rating (0-5 scale)
- `problem2_solving_rating_code` (string, optional): Problem 2 code/reference identifier
- `DSA_Theory` (number, optional): DSA Theory rating (0-5 scale)
- `Core_CS_Theory` (number, optional): Core CS Theory rating (0-5 scale)
- `overall_interview_score_out_of_100` (number, optional): Overall interview score (0-100 scale)

**All Assessments** (array):
- Array of assessment summaries (same structure as in `latestAssessment` but without `scores`)

**All Interviews** (array):
- Array of interview summaries (same structure as in `latestInterview` but without `scores`)

**Example Requests**:

```bash
# Get student profile by ID (anonymized/transformed data)
curl http://localhost:3001/api/students/3c6e6834-cffb-4a17-845d-905d94f05f50

# Get complete raw data (all fields, unredacted)
curl "http://localhost:3001/api/students/3c6e6834-cffb-4a17-845d-905d94f05f50?includeAllData=true"

# Alternative syntax (same as above)
curl "http://localhost:3001/api/students/3c6e6834-cffb-4a17-845d-905d94f05f50?complete=true"
```

**Complete Data Response** (when `includeAllData=true`):

When `includeAllData=true` is used, the response structure changes to match the raw database schema:

```json
{
  "user_id": "3c6e6834-cffb-4a17-845d-905d94f05f50",
  "full_name": "John Doe",
  "phone": "9876543210",
  "email": "john.doe@example.com",
  "gender": "Male",
  "resume_url": "https://example.com/resume.pdf",
  "graduation_year": 2026,
  "cgpa": 9.41,
  "college_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "created_at": "2024-11-15T10:30:00.000Z",
  "updated_at": "2024-11-15T10:30:00.000Z",
  "college": {
    "college_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "name": "IIIT Hyderabad",
    "branch": "Computer Science",
    "degree": "B Tech (Bachelor of Technology)",
    "created_at": "2024-11-15T10:30:00.000Z",
    "updated_at": "2024-11-15T10:30:00.000Z"
  },
  "assessments": [
    {
      "assessment_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "student_id": "3c6e6834-cffb-4a17-845d-905d94f05f50",
      "taken_at": "Oct 12, 2024",
      "report_url": "https://example.com/assessment-report.pdf",
      "org_assess_id": "o1o2o3o4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "total_student_score": 189,
      "total_assessment_score": 210,
      "percent": 90,
      "attempt_end_reason": null,
      "proctor_details": null,
      "created_at": "2024-11-15T10:30:00.000Z",
      "updated_at": "2024-11-15T10:30:00.000Z",
      "assessment_scores": [
        {
          "assessment_score_id": "s1s2s3s4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "assessment_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "score_type_id": "t1t2t3t4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "score": 84.57,
          "max_score": 120,
          "time_spent": 85.5,
          "duration": 90,
          "created_at": "2024-11-15T10:30:00.000Z",
          "score_type": {
            "score_type_id": "t1t2t3t4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "key": "coding",
            "display_name": "Coding",
            "description": "Coding",
            "created_at": "2024-11-15T10:30:00.000Z"
          }
        }
      ]
    }
  ],
  "interviews": [
    {
      "interview_id": "i1i2i3i4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "student_id": "3c6e6834-cffb-4a17-845d-905d94f05f50",
      "interview_date": "Oct 12, 2024",
      "recording_url": "https://example.com/interview-recording.mp4",
      "communication_rating": 5,
      "core_cs_theory_rating": 5,
      "dsa_theory_rating": 4,
      "problem1_solving_rating": 4.5,
      "problem1_code_implementation_rating": 4,
      "problem1_solving_rating_code": "LEETCODE-123",
      "problem2_solving_rating": 4,
      "problem2_code_implementation_rating": 4,
      "problem2_solving_rating_code": "LEETCODE-456",
      "overall_interview_score_out_of_100": 96,
      "notes": "Excellent candidate with strong problem-solving skills.",
      "audit_final_status": "STRONG HIRE",
      "created_at": "2024-11-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses**:

- **404 Not Found**: Student with given ID does not exist
- **400 Bad Request**: Invalid UUID format

---

## View Tracking Endpoints

### POST `/api/candidates/:id/view`

Log a view when a user views a candidate profile.

**Request**:
```http
POST /api/candidates/{id}/view
Content-Type: application/json

{
  "email": "hr@company.com",
  "name": "John Smith",
  "company": "Tech Corp",
  "phone": "+91 9876543210"
}
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID/VARCHAR | Yes | Candidate's nxtwave_user_id |

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address (must be valid email format) |
| `name` | string | Yes | User's full name |
| `company` | string | No | Company/organization name |
| `phone` | string | No | Phone number |

**Response** (201 Created):
```json
{
  "message": "View logged successfully",
  "viewId": "v1v2v3v4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "userId": "u1u2u3u4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "candidateId": "3c6e6834-cffb-4a17-845d-905d94f05f50",
  "viewedAt": "2024-11-15T10:30:00.000Z"
}
```

**Response Fields**:
- `message` (string): Success message
- `viewId` (string, UUID): Unique identifier for the view record
- `userId` (string, UUID): User's unique identifier (created if new)
- `candidateId` (string): Candidate's nxtwave_user_id
- `viewedAt` (string, ISO 8601): Timestamp when view was logged (UTC format, can be converted to India timezone for display)

**Example**:
```bash
curl -X POST http://localhost:3001/api/candidates/3c6e6834-cffb-4a17-845d-905d94f05f50/view \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hr@company.com",
    "name": "John Smith",
    "company": "Tech Corp",
    "phone": "+91 9876543210"
  }'
```

**Notes**:
- If user with email doesn't exist, a new user record is automatically created
- If user exists, their information (name, company, phone) is updated if provided
- Multiple views by same user for same candidate are allowed (tracked with different timestamps)
- Candidate name is automatically fetched and stored in the view record
- The `viewedAt` timestamp is in ISO 8601 format, stored in UTC but can be converted to India timezone (IST) for display

**Error Responses**:
- **400 Bad Request**: Missing required fields (email, name) or invalid email format
- **404 Not Found**: Candidate with given ID does not exist
- **500 Internal Server Error**: Database error

**Implementation Notes**:
- The endpoint verifies the candidate exists before logging the view
- User information is automatically updated if the user already exists
- The `viewedAt` timestamp is stored in UTC format (ISO 8601)
- Candidate name is fetched from the database and stored in the view record for historical tracking

---

### GET `/api/users/:email/candidates`

Get all candidates viewed by a specific user.

**Request**:
```http
GET /api/users/{email}/candidates?page=1&limit=20&sort=viewed_at&order=desc
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email address |

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | `1` | Page number (must be positive integer) |
| `limit` | number | No | `20` | Items per page (max: 100, must be positive) |
| `sort` | enum | No | `viewed_at` | Sort field: `viewed_at` or `candidate_name` |
| `order` | enum | No | `desc` | Sort order: `asc` or `desc` |

**Response** (200 OK):
```json
{
  "user": {
    "userId": "u1u2u3u4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "email": "hr@company.com",
    "name": "John Smith",
    "company": "Tech Corp",
    "phone": "+91 9876543210"
  },
  "data": [
    {
      "viewId": "v1v2v3v4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "candidateId": "3c6e6834-cffb-4a17-845d-905d94f05f50",
      "candidateName": "NE Can-1",
      "viewedAt": "2024-11-15T10:30:00.000Z",
      "candidate": {
        "cgpa": "9.41",
        "college": "IIIT Hyderabad",
        "branch": "Computer Science"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Response Fields**:
- `user` (object): User information
  - `userId` (string, UUID): User's unique identifier
  - `email` (string): Email address
  - `name` (string): Full name
  - `company` (string, optional): Company name
  - `phone` (string, optional): Phone number
- `data` (array): Array of candidate view entries
  - `viewId` (string, UUID): View record ID
  - `candidateId` (string): Candidate's nxtwave_user_id
  - `candidateName` (string): Candidate's name
  - `viewedAt` (string, ISO 8601): When the view occurred
  - `candidate` (object, optional): Additional candidate details
    - `cgpa` (string): CGPA formatted as "X.XX"
    - `college` (string): College name
    - `branch` (string): Branch name
- `pagination` (object): Pagination metadata

**Example**:
```bash
# Get user's viewing history
curl "http://localhost:3001/api/users/hr@company.com/candidates"

# With pagination and sorting
curl "http://localhost:3001/api/users/hr@company.com/candidates?page=1&limit=10&sort=candidate_name&order=asc"
```

**Error Responses**:
- **400 Bad Request**: Invalid email format or invalid query parameters
- **404 Not Found**: User with given email does not exist
- **500 Internal Server Error**: Database error

**Implementation Notes**:
- User email and phone are masked in the response for privacy
- Candidate names are aliased (e.g., "NE Can-01") for privacy
- Candidate details (CGPA, college, branch) are fetched and included if available
- Sorting by `candidate_name` sorts by the aliased name, not the actual name

---

### GET `/api/candidates/:id/viewers`

Get all users who viewed a specific candidate.

**Request**:
```http
GET /api/candidates/{id}/viewers?page=1&limit=20&sort=viewed_at&order=desc
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID/VARCHAR | Yes | Candidate's nxtwave_user_id |

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | `1` | Page number (must be positive integer) |
| `limit` | number | No | `20` | Items per page (max: 100, must be positive) |
| `sort` | enum | No | `viewed_at` | Sort field: `viewed_at` or `user_name` |
| `order` | enum | No | `desc` | Sort order: `asc` or `desc` |

**Response** (200 OK):
```json
{
  "candidate": {
    "candidateId": "3c6e6834-cffb-4a17-845d-905d94f05f50",
    "candidateName": "NE Can-1",
    "totalViews": 5,
    "uniqueViewers": 3
  },
  "data": [
    {
      "viewId": "v1v2v3v4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "userId": "u1u2u3u4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "user": {
        "userId": "u1u2u3u4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "email": "hr@company.com",
        "name": "John Smith",
        "company": "Tech Corp",
        "phone": "+91 9876543210"
      },
      "viewedAt": "2024-11-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Response Fields**:
- `candidate` (object): Candidate information and statistics
  - `candidateId` (string): Candidate's nxtwave_user_id
  - `candidateName` (string): Candidate's name
  - `totalViews` (number): Total number of views (including repeat views)
  - `uniqueViewers` (number): Number of unique users who viewed this candidate
- `data` (array): Array of viewer entries
  - `viewId` (string, UUID): View record ID
  - `userId` (string, UUID): User's unique identifier
  - `user` (object): User information
  - `viewedAt` (string, ISO 8601): When the view occurred
- `pagination` (object): Pagination metadata

**Example**:
```bash
# Get all viewers for a candidate
curl "http://localhost:3001/api/candidates/3c6e6834-cffb-4a17-845d-905d94f05f50/viewers"

# Sort by user name
curl "http://localhost:3001/api/candidates/3c6e6834-cffb-4a17-845d-905d94f05f50/viewers?sort=user_name&order=asc"
```

**Error Responses**:
- **400 Bad Request**: Invalid candidate ID format or invalid query parameters
- **404 Not Found**: Candidate with given ID does not exist
- **500 Internal Server Error**: Database error

**Implementation Notes**:
- Candidate name is aliased (e.g., "NE Can-01") for privacy
- User emails and phones are masked in the response
- Sorting by `user_name` is done post-query after fetching user data
- `totalViews` includes all views (including repeat views by same user)
- `uniqueViewers` counts distinct users who viewed the candidate

---

### GET `/api/users/:email/stats`

Get viewing statistics for a user.

**Request**:
```http
GET /api/users/{email}/stats
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email address |

**Response** (200 OK):
```json
{
  "user": {
    "userId": "u1u2u3u4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "email": "hr@company.com",
    "name": "John Smith",
    "company": "Tech Corp",
    "phone": "+91 9876543210"
  },
  "stats": {
    "totalViews": 15,
    "uniqueCandidates": 10,
    "firstViewAt": "2024-11-10T09:00:00+05:30",
    "lastViewAt": "2024-11-15T10:30:00+05:30",
    "viewsByDate": [
      {
        "date": "2024-11-15",
        "count": 3
      },
      {
        "date": "2024-11-14",
        "count": 5
      },
      {
        "date": "2024-11-13",
        "count": 2
      }
    ]
  }
}
```

**Response Fields**:
- `user` (object): User information
- `stats` (object): Viewing statistics
  - `totalViews` (number): Total number of views by this user
  - `uniqueCandidates` (number): Number of unique candidates viewed
  - `firstViewAt` (string, ISO 8601, optional): Timestamp of first view
  - `lastViewAt` (string, ISO 8601, optional): Timestamp of most recent view
  - `viewsByDate` (array): Array of view counts grouped by date (last 30 days)
    - `date` (string): Date in YYYY-MM-DD format (India timezone)
    - `count` (number): Number of views on this date

**Example**:
```bash
curl "http://localhost:3001/api/users/hr@company.com/stats"
```

**Error Responses**:
- **400 Bad Request**: Invalid email format
- **404 Not Found**: User with given email does not exist
- **500 Internal Server Error**: Database aggregation error

**Notes**:
- Dates are in India timezone (Asia/Kolkata)
- `viewsByDate` is sorted by date descending (most recent first)
- Limited to last 30 days of data
- If user has no views, `firstViewAt` and `lastViewAt` will be `undefined`

**Implementation Notes**:
- User email and phone are masked in the response for privacy
- Date grouping converts UTC timestamps to India timezone (IST) for accurate daily counts
- Statistics are calculated from all view records, not just recent ones
- The `viewsByDate` array only includes dates with at least one view

---

## Diagnostics Endpoints

### GET `/api/diagnostics/test-db`

Test database connectivity and service role access. This endpoint performs multiple database queries to verify the connection and query capabilities.

**Request**:
```http
GET /api/diagnostics/test-db
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "All database tests passed",
  "results": {
    "simpleCount": { "count": 25 },
    "fetchOne": {
      "success": true,
      "hasData": true,
      "sample": {
        "user_id": "606567e1-3768-4fd7-b7e6-9481c0e64b57",
        "full_name": "John Doe"
      }
    },
    "nestedQuery": {
      "success": true,
      "hasData": true,
      "sample": {
        "user_id": "606567e1-3768-4fd7-b7e6-9481c0e64b57",
        "colleges": {
          "name": "IIIT Hyderabad",
          "branch": "Computer Science"
        }
      }
    },
    "complexNestedQuery": {
      "success": true,
      "hasData": true,
      "sample": {
        "id": "606567e1-3768-4fd7-b7e6-9481c0e64b57",
        "hasColleges": true,
        "hasAssessments": true,
        "hasInterviews": true
      }
    }
  }
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "test": "fetch_one_student",
  "error": {
    "code": "42703",
    "message": "column students.nxtwave_user_id does not exist",
    "details": null,
    "hint": null
  },
  "previousTests": {
    "simpleCount": { "success": true, "count": 25 },
    "fetchOne": { "success": true, "hasData": true },
    "nestedQuery": { "success": true, "hasData": true }
  }
}
```

**Response Fields**:
- `success` (boolean): Whether all tests passed
- `message` (string, optional): Success message if all tests passed
- `results` (object, optional): Test results if successful
  - `simpleCount` (object): Simple count query result
  - `fetchOne` (object): Single record fetch result
  - `nestedQuery` (object): Nested query result
  - `complexNestedQuery` (object): Complex nested query result
- `test` (string, optional): Name of the test that failed
- `error` (object, optional): Error details if a test failed
- `previousTests` (object, optional): Results of tests that passed before failure

**Example**:
```bash
curl http://localhost:3001/api/diagnostics/test-db
```

**Notes**:
- This endpoint is primarily for debugging and monitoring
- Tests multiple database query patterns to verify connectivity
- Returns detailed error information if any test fails
- Useful for verifying database schema and RLS policies

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
   - Communication rating ≥ 4 (out of 5) → "Strong Communication"

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

6. **Interview Fields Backward Compatibility**: 
   - New interview fields (`problem1_solving_rating`, `problem2_solving_rating`, `DSA_Theory`, `Core_CS_Theory`, `overall_interview_score_out_of_100`) are preferred
   - Old fields (`problem_solving_rating`, `conceptual_rating`, `overall_interview_rating`) are still supported for backward compatibility
   - If new fields are present, they will be used; otherwise, old fields will be used as fallback
   - `communication_rating` scale has been updated from 0-10 to 0-5

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

- **v1.2.0** (2025-11-25): 
  - Added `includeAllData` and `complete` query parameters to `/api/candidates` endpoint
  - Added Diagnostics endpoints section documenting `/api/diagnostics/test-db`
  - Updated search documentation to reflect current limitations (name-only search)
  - Clarified response modes for candidates endpoint (default vs complete data)
- **v1.1.0** (2025-11-25): 
  - Added `includeAllData` and `complete` query parameters to `/api/students/:id` endpoint
  - Updated documentation for complete data mode
  - Clarified response structure differences between anonymized and complete data modes
- **v1.0.0** (2024-11-15): Initial API specification

---

## Support

For issues or questions, please refer to the project README or contact the development team.

