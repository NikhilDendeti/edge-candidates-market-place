# Database Models Explanation

## 📊 Overview

The database uses a **normalized 8-table schema** to store candidate/student information, their assessments, interviews, and user view tracking data. This design eliminates data redundancy and ensures data integrity.

## 🗂️ Database Schema Diagram

```
┌─────────────────────────────────┐
│         colleges                │
│  ────────────────────────────   │
│  college_id (PK)               │
│  name                          │
│  degree                        │
│  branch                        │
│  city, state, country         │
│  nirf_ranking                 │
│  created_at, updated_at       │
└────────────┬──────────────────┘
             │
             │ (1:N)
             │ college_id (FK)
             │
┌────────────▼──────────────────┐
│         students               │
│  ──────────────────────────── │
│  nxtwave_user_id (PK)        │ ← Primary Key
│  full_name                    │
│  phone, email, gender        │
│  resume_url                  │
│  graduation_year             │
│  cgpa (0-10)                 │
│  college_id (FK)             │
│  created_at, updated_at      │
└────┬──────────────────┬──────┘
     │                  │
     │ (1:N)            │ (1:N)
     │ student_id (FK)  │ student_id (FK)
     │                  │
┌────▼──────────┐  ┌────▼──────────────┐
│  assessments  │  │    interviews      │
│  ──────────── │  │  ──────────────── │
│  assessment_id│  │  interview_id     │
│  student_id   │  │  student_id       │
│  taken_at     │  │  interview_date   │
│  report_url   │  │  recording_url    │
│  total_student│  │  self_intro_rating│
│  _score       │  │  problem_solving_ │
│  total_assess │  │  _rating          │
│  ment_score   │  │  communication_   │
│  percent      │  │  _rating          │
│  created_at   │  │  conceptual_rating│
└────┬──────────┘  │  overall_interview│
     │             │  _rating          │
     │ (1:N)       │  overall_label    │
     │             │  notes            │
     │             │  created_at       │
┌────▼──────────┐  └───────────────────┘
│assessment_    │
│scores         │
│  ──────────── │
│  assessment_  │
│  score_id     │
│  assessment_id│
│  score_type_id│
│  score        │
│  max_score    │
│  created_at   │
└────┬──────────┘
     │
     │ (N:1)
     │ score_type_id (FK)
     │
┌────▼──────────┐
│  score_types  │
│  ──────────── │
│  score_type_id│
│  key          │
│  display_name │
│  description  │
│  created_at   │
└───────────────┘

┌─────────────────┐
│     users        │
│  ────────────── │
│  user_id (PK)   │
│  email (UNIQUE) │
│  name           │
│  company        │
│  phone          │
│  created_at     │
│  updated_at     │
└────────┬────────┘
         │
         │ (1:N)
         │ user_id (FK)
         │
┌────────▼──────────────────┐
│   candidate_views          │
│  ──────────────────────── │
│  view_id (PK)             │
│  user_id (FK)             │
│  candidate_id (FK)       │──→ students.nxtwave_user_id
│  candidate_name          │
│  viewed_at               │
│  created_at              │
└──────────────────────────┘
```

## 📋 Table Details

### 1. `colleges` Table

**Purpose**: Stores information about educational institutions.

**Fields**:
- `college_id` (UUID, PK) - Unique identifier for each college
- `name` (VARCHAR) - College name (e.g., "IIIT Hyderabad")
- `degree` (VARCHAR) - Degree type (e.g., "B.Tech", "M.Tech")
- `branch` (VARCHAR) - Branch/Department (e.g., "Computer Science", "IT")
- `city` (VARCHAR) - City location
- `state` (VARCHAR) - State location
- `country` (VARCHAR) - Country (default: "India")
- `nirf_ranking` (INTEGER) - NIRF ranking (nullable if not ranked)
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

**Constraints**:
- Unique constraint on `(name, degree, branch)` - prevents duplicate colleges

**Example Data**:
```
college_id: "a1b2c3d4-..."
name: "IIIT Hyderabad"
degree: "B.Tech"
branch: "Computer Science"
city: "Hyderabad"
state: "Telangana"
nirf_ranking: 1
```

**Relationships**:
- One college can have many students (1:N)

---

### 2. `students` Table

**Purpose**: Stores individual candidate/student information.

**Fields**:
- `nxtwave_user_id` (UUID, PK) - **Primary Key** - Unique identifier from NxtWave system
- `full_name` (VARCHAR) - Student's full name
- `phone` (VARCHAR) - Phone number (optional)
- `email` (VARCHAR) - Email address (optional)
- `gender` (VARCHAR) - Gender (optional)
- `resume_url` (TEXT) - URL to resume PDF (optional)
- `graduation_year` (INTEGER) - Expected graduation year (optional)
- `cgpa` (NUMERIC) - Cumulative Grade Point Average (0-10 scale)
- `college_id` (UUID, FK) - Reference to `colleges.college_id`
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

**Constraints**:
- `cgpa` must be between 0 and 10
- Foreign key to `colleges(college_id)` with `ON DELETE SET NULL`

**Example Data**:
```
nxtwave_user_id: "3c6e6834-cffb-4a17-845d-905d94f05f50"
full_name: "John Doe"
phone: "+91 9876543210"
email: "john.doe@example.com"
cgpa: 9.41
college_id: "a1b2c3d4-..." (references IIIT Hyderabad)
graduation_year: 2026
```

**Relationships**:
- Belongs to one college (N:1 via `college_id`)
- Can have many assessments (1:N)
- Can have many interviews (1:N)

**Key Point**: `nxtwave_user_id` is the primary key, not a separate `student_id`. This ensures uniqueness across the NxtWave system.

---

### 3. `score_types` Table

**Purpose**: Normalizes different types of assessment scores/metrics.

**Fields**:
- `score_type_id` (UUID, PK) - Unique identifier
- `key` (VARCHAR, UNIQUE) - Short identifier (e.g., "coding", "dsa", "cs_fund")
- `display_name` (VARCHAR) - Human-readable name (e.g., "Coding", "DSA Theory")
- `description` (TEXT) - Optional description
- `created_at` (TIMESTAMP) - Record creation time

**Example Data**:
```
score_type_id: "s1s2s3s4-..."
key: "coding"
display_name: "Coding"
description: "Programming and coding skills assessment"
```

**Predefined Score Types**:
1. `coding` - Coding skills
2. `dsa` - Data Structures & Algorithms
3. `cs_fund` - CS Fundamentals
4. `quant` - Quantitative Aptitude
5. `verbal` - Verbal Communication
6. `logical` - Logical Reasoning

**Relationships**:
- One score type can be used in many assessment scores (1:N)

---

### 4. `assessments` Table

**Purpose**: Represents assessment events/tests taken by students.

**Fields**:
- `assessment_id` (UUID, PK) - Unique identifier for each assessment
- `student_id` (UUID, FK) - Reference to `students.nxtwave_user_id`
- `taken_at` (TIMESTAMP) - When the assessment was taken
- `report_url` (TEXT) - URL to assessment report PDF (optional)
- `total_student_score` (NUMERIC) - Student's total score
- `total_assessment_score` (NUMERIC) - Maximum possible score
- `percent` (NUMERIC) - Percentage score (0-100)
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

**Constraints**:
- `percent` must be between 0 and 100
- Foreign key to `students(nxtwave_user_id)` with `ON DELETE CASCADE`

**Example Data**:
```
assessment_id: "a1b2c3d4-..."
student_id: "3c6e6834-..." (references John Doe)
taken_at: "2024-10-12 10:30:00"
total_student_score: 189
total_assessment_score: 210
percent: 90.00
report_url: "https://example.com/report.pdf"
```

**Relationships**:
- Belongs to one student (N:1 via `student_id`)
- Can have many assessment scores (1:N)

**Key Point**: A student can take multiple assessments over time. The "latest" assessment is determined by `taken_at` date.

---

### 5. `assessment_scores` Table

**Purpose**: Stores detailed score breakdown by type for each assessment.

**Fields**:
- `assessment_score_id` (UUID, PK) - Unique identifier
- `assessment_id` (UUID, FK) - Reference to `assessments.assessment_id`
- `score_type_id` (UUID, FK) - Reference to `score_types.score_type_id`
- `score` (NUMERIC) - Actual score achieved
- `max_score` (NUMERIC) - Maximum possible score for this type
- `created_at` (TIMESTAMP) - Record creation time

**Constraints**:
- Unique constraint on `(assessment_id, score_type_id)` - One score per type per assessment
- Foreign key to `assessments(assessment_id)` with `ON DELETE CASCADE`
- Foreign key to `score_types(score_type_id)`

**Example Data**:
```
assessment_score_id: "as1as2as3-..."
assessment_id: "a1b2c3d4-..." (references assessment above)
score_type_id: "s1s2s3s4-..." (references "coding")
score: 84.57
max_score: 120
```

**Relationships**:
- Belongs to one assessment (N:1 via `assessment_id`)
- Belongs to one score type (N:1 via `score_type_id`)

**Key Point**: This table breaks down each assessment into multiple score types. For example, one assessment might have:
- Coding: 84.57 / 120
- DSA: 7 / 10
- CS Fundamentals: 35 / 40
- Quantitative: 32 / 40

---

### 6. `interviews` Table

**Purpose**: Represents interview events conducted with students.

**Fields**:
- `interview_id` (UUID, PK) - Unique identifier
- `student_id` (UUID, FK) - Reference to `students.nxtwave_user_id`
- `interview_date` (TIMESTAMP) - When the interview was conducted
- `recording_url` (TEXT) - URL to interview recording (optional)
- `self_intro_rating` (NUMERIC) - Self introduction rating (0-10)
- `problem_solving_rating` (NUMERIC) - Problem solving rating (0-10)
- `communication_rating` (NUMERIC) - Communication skills rating (0-10)
- `conceptual_rating` (NUMERIC) - Conceptual understanding rating (0-10)
- `overall_interview_rating` (NUMERIC) - Overall interview rating (0-10)
- `overall_label` (VARCHAR) - Verdict: "Strong Hire", "Medium Fit", or "Consider"
- `notes` (TEXT) - Interview notes/comments (optional)
- `created_at` (TIMESTAMP) - Record creation time

**Constraints**:
- All rating fields must be between 0 and 10
- `overall_label` must be one of: "Strong Hire", "Medium Fit", "Consider"
- Foreign key to `students(nxtwave_user_id)` with `ON DELETE CASCADE`

**Example Data**:
```
interview_id: "i1i2i3i4-..."
student_id: "3c6e6834-..." (references John Doe)
interview_date: "2024-10-12 14:00:00"
self_intro_rating: 5
problem_solving_rating: 35
communication_rating: 9
conceptual_rating: 6
overall_interview_rating: 9.6
overall_label: "Strong Hire"
recording_url: "https://example.com/interview.mp4"
notes: "Excellent candidate with strong problem-solving skills."
```

**Relationships**:
- Belongs to one student (N:1 via `student_id`)

**Key Point**: Unlike assessments which have normalized scores, interviews store ratings directly in the table. A student can have multiple interviews over time.

---

### 7. `users` Table

**Purpose**: Stores information about users who view candidate profiles.

**Fields**:
- `user_id` (UUID, PK) - Unique identifier for each user
- `email` (VARCHAR, UNIQUE) - User's email address (unique identifier)
- `name` (VARCHAR) - User's full name
- `company` (VARCHAR) - Company/organization name (optional)
- `phone` (VARCHAR) - Phone number (optional)
- `created_at` (TIMESTAMP WITH TIME ZONE) - First time user viewed any candidate (India timezone)
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update time (India timezone)

**Constraints**:
- Unique constraint on `email` - prevents duplicate user records
- Index on `email` for fast lookups

**Example Data**:
```
user_id: "u1u2u3u4-..."
email: "hr@company.com"
name: "John Smith"
company: "Tech Corp"
phone: "+91 9876543210"
created_at: "2024-11-15 10:00:00+05:30" (IST)
updated_at: "2024-11-15 10:00:00+05:30"
```

**Relationships**:
- Can have many candidate views (1:N)

**Key Point**: User information is stored once to avoid duplication. When the same user views multiple candidates, only one user record exists with multiple view records.

---

### 8. `candidate_views` Table

**Purpose**: Tracks which users viewed which candidate profiles.

**Fields**:
- `view_id` (UUID, PK) - Unique identifier for each view event
- `user_id` (UUID, FK) - Reference to `users.user_id`
- `candidate_id` (UUID, FK) - Reference to `students.nxtwave_user_id`
- `candidate_name` (VARCHAR) - Denormalized candidate name for easy lookup
- `viewed_at` (TIMESTAMP WITH TIME ZONE) - When the view occurred (India timezone)
- `created_at` (TIMESTAMP WITH TIME ZONE) - Record creation time (India timezone)

**Constraints**:
- Foreign key to `users(user_id)` with `ON DELETE CASCADE`
- Foreign key to `students(nxtwave_user_id)` with `ON DELETE CASCADE`
- Indexes on `user_id`, `candidate_id`, `viewed_at`, and composite `(user_id, candidate_id)`

**Example Data**:
```
view_id: "v1v2v3v4-..."
user_id: "u1u2u3u4-..." (references John Smith)
candidate_id: "3c6e6834-..." (references student)
candidate_name: "John Doe"
viewed_at: "2024-11-15 10:30:00+05:30" (IST)
created_at: "2024-11-15 10:30:00+05:30"
```

**Relationships**:
- Belongs to one user (N:1 via `user_id`)
- Belongs to one student/candidate (N:1 via `candidate_id`)

**Key Point**: 
- `candidate_name` is denormalized (stored directly) for easy lookup without joins
- Multiple view records allowed for same user-candidate pair (different timestamps) to track repeat views over time
- All timestamps stored in India timezone (Asia/Kolkata)

---

## 🔗 Relationships Summary

| Table | Relationship | Related Table | Foreign Key | Type |
|-------|-------------|---------------|-------------|------|
| `students` | Belongs to | `colleges` | `college_id` | N:1 |
| `assessments` | Belongs to | `students` | `student_id` | N:1 |
| `assessment_scores` | Belongs to | `assessments` | `assessment_id` | N:1 |
| `assessment_scores` | Belongs to | `score_types` | `score_type_id` | N:1 |
| `interviews` | Belongs to | `students` | `student_id` | N:1 |
| `candidate_views` | Belongs to | `users` | `user_id` | N:1 |
| `candidate_views` | Belongs to | `students` | `candidate_id` | N:1 |

## 📊 Data Flow Example

### Complete Student Profile Query

When fetching a student profile, the query joins:

```
students (John Doe)
  ├── colleges (IIIT Hyderabad)
  │     └── nirf_ranking: 1
  │
  ├── assessments (Latest: Oct 12, 2024)
  │     ├── total_student_score: 189
  │     ├── total_assessment_score: 210
  │     └── assessment_scores
  │           ├── coding: 84.57 / 120
  │           ├── dsa: 7 / 10
  │           ├── cs_fund: 35 / 40
  │           └── quant: 32 / 40
  │
  └── interviews (Latest: Oct 12, 2024)
        ├── overall_interview_rating: 9.6
        ├── overall_label: "Strong Hire"
        └── individual ratings:
              ├── self_intro: 5 / 5
              ├── problem_solving: 35 / 35
              ├── communication: 9 / 9
              └── conceptual: 6 / 6
```

## 🎯 Key Design Decisions

### 1. Normalized Schema
- **Why**: Eliminates data redundancy
- **Example**: College information stored once, referenced by many students

### 2. UUID Primary Keys
- **Why**: Globally unique identifiers, no conflicts across systems
- **Example**: `nxtwave_user_id` ensures uniqueness in NxtWave ecosystem

### 3. Separate Assessment Scores Table
- **Why**: Flexible - can add new score types without schema changes
- **Example**: Adding "AI/ML" score type only requires inserting into `score_types`

### 4. Direct Interview Ratings
- **Why**: Interview criteria are fixed (4 categories + overall)
- **Example**: No need for normalization like assessments

### 5. ON DELETE CASCADE
- **Why**: Maintains referential integrity
- **Example**: Deleting a student automatically deletes their assessments/interviews

### 6. ON DELETE SET NULL
- **Why**: Preserves student records if college is deleted
- **Example**: Student remains, but `college_id` becomes NULL

## 🔍 Indexes

Indexes are created on frequently queried fields:

- **colleges**: `name`, `city`, `state`, `nirf_ranking`
- **students**: `college_id`, `email`, `graduation_year`
- **assessments**: `student_id`, `taken_at`
- **assessment_scores**: `assessment_id`, `score_type_id`
- **interviews**: `student_id`, `interview_date`, `overall_label`
- **users**: `email`
- **candidate_views**: `user_id`, `candidate_id`, `viewed_at`, composite `(user_id, candidate_id)`

These indexes speed up queries like:
- Finding students by college
- Getting latest assessment/interview
- Filtering by verdict (overall_label)
- Finding all candidates viewed by a user
- Finding all users who viewed a candidate
- Checking if user already viewed a candidate

## 🛡️ Security (RLS)

Row Level Security (RLS) is enabled on all tables with public read access policies. This means:
- Anyone can read (SELECT) data
- Only service role key can write (INSERT/UPDATE/DELETE)

For production, you may want to restrict read access based on user roles.

## 📝 Notes

1. **Latest Assessment/Interview**: Determined by `taken_at` and `interview_date` timestamps (most recent first)

2. **Skills Derivation**: Skills are derived from assessment scores in the application layer:
   - Coding ≥ 70% → "Strong Problem Solving"
   - DSA ≥ 70% → "Strong DSA"
   - CS Fundamentals ≥ 70% → "Strong Theory"
   - Communication ≥ 8 → "Strong Communication"

3. **Branch Normalization**: Branch names are normalized in the application layer (e.g., "Computer Science" → "CSE")

4. **CGPA Scale**: CGPA is stored on a 0-10 scale (Indian system)

5. **Timestamps**: All timestamps use `TIMESTAMP WITH TIME ZONE` for accurate timezone handling

6. **User View Tracking**: Users and their candidate views are tracked separately to avoid duplication. When a user views multiple candidates, only one user record exists with multiple view records.

7. **Denormalization in Views**: `candidate_name` is stored directly in `candidate_views` table for easy lookup without joins, even though it can be retrieved from `students` table.

## 📊 Example Queries

### Get all candidates viewed by a user
```sql
SELECT 
  cv.view_id,
  cv.candidate_id,
  cv.candidate_name,
  cv.viewed_at,
  s.cgpa,
  s.resume_url
FROM candidate_views cv
JOIN students s ON cv.candidate_id = s.nxtwave_user_id
WHERE cv.user_id = (
  SELECT user_id FROM users WHERE email = 'hr@company.com'
)
ORDER BY cv.viewed_at DESC;
```

### Get all users who viewed a specific candidate
```sql
SELECT 
  u.user_id,
  u.email,
  u.name,
  u.company,
  cv.viewed_at
FROM candidate_views cv
JOIN users u ON cv.user_id = u.user_id
WHERE cv.candidate_id = '3c6e6834-cffb-4a17-845d-905d94f05f50'
ORDER BY cv.viewed_at DESC;
```

### Check if user already viewed a candidate
```sql
SELECT EXISTS(
  SELECT 1 
  FROM candidate_views cv
  JOIN users u ON cv.user_id = u.user_id
  WHERE u.email = 'hr@company.com'
    AND cv.candidate_id = '3c6e6834-cffb-4a17-845d-905d94f05f50'
);
```

### Get view statistics for a candidate
```sql
SELECT 
  COUNT(*) as total_views,
  COUNT(DISTINCT user_id) as unique_viewers,
  MIN(viewed_at) as first_viewed,
  MAX(viewed_at) as last_viewed
FROM candidate_views
WHERE candidate_id = '3c6e6834-cffb-4a17-845d-905d94f05f50';
```

