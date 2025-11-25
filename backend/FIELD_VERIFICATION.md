# Field Verification - Complete Data Endpoints

## Database Schema Fields vs API Response Fields

### Students Table Fields
**Database Schema:**
- `user_id` (UUID, PRIMARY KEY)
- `full_name` (VARCHAR(255))
- `phone` (VARCHAR(20))
- `email` (VARCHAR(255))
- `gender` (VARCHAR(20))
- `resume_url` (TEXT)
- `graduation_year` (INTEGER)
- `cgpa` (NUMERIC(4,2))
- `college_id` (UUID, FK)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**API Response (with `includeAllData=true`):**
✅ All fields included

### Colleges Table Fields
**Database Schema:**
- `college_id` (UUID, PRIMARY KEY)
- `name` (VARCHAR(255))
- `degree` (VARCHAR(100))
- `branch` (VARCHAR(100))
- `nirf_ranking` (INTEGER, optional)
- `city` (VARCHAR, optional)
- `state` (VARCHAR, optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**API Response (with `includeAllData=true`):**
✅ All fields included in `college` object

### Assessments Table Fields
**Database Schema:**
- `assessment_id` (UUID, PRIMARY KEY)
- `student_id` (UUID, FK)
- `taken_at` (VARCHAR(50))
- `report_url` (TEXT)
- `org_assess_id` (UUID)
- `total_student_score` (NUMERIC(10,2))
- `total_assessment_score` (NUMERIC(10,2))
- `percent` (NUMERIC, calculated)
- `attempt_end_reason` (VARCHAR(255))
- `proctor_details` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**API Response (with `includeAllData=true`):**
✅ All fields included in `assessments` array

### Assessment Scores Table Fields
**Database Schema:**
- `assessment_score_id` (UUID, PRIMARY KEY)
- `assessment_id` (UUID, FK)
- `score_type_id` (UUID, FK)
- `score` (NUMERIC(10,2))
- `max_score` (NUMERIC(10,2))
- `time_spent` (NUMERIC(5,2))
- `duration` (NUMERIC(5,2))
- `created_at` (TIMESTAMP)

**API Response (with `includeAllData=true`):**
✅ All fields included in `assessment_scores` array within each assessment
✅ Score types relation included with all fields

### Interviews Table Fields
**Database Schema:**
- `interview_id` (UUID, PRIMARY KEY)
- `student_id` (UUID, FK)
- `interview_date` (VARCHAR(50))
- `recording_url` (TEXT)
- `communication_rating` (INTEGER)
- `core_cs_theory_rating` (INTEGER)
- `dsa_theory_rating` (INTEGER)
- `problem1_solving_rating` (INTEGER)
- `problem1_code_implementation_rating` (INTEGER)
- `problem1_solving_rating_code` (VARCHAR)
- `problem2_solving_rating` (INTEGER)
- `problem2_code_implementation_rating` (INTEGER)
- `problem2_solving_rating_code` (VARCHAR)
- `overall_interview_score_out_of_100` (NUMERIC(5,2))
- `notes` (TEXT)
- `audit_final_status` (VARCHAR(50))
- `created_at` (TIMESTAMP)

**API Response (with `includeAllData=true`):**
✅ All fields included in `interviews` array
✅ Deprecated fields also included for backward compatibility:
  - `self_intro_rating`
  - `problem_solving_rating`
  - `conceptual_rating`
  - `overall_interview_rating`
  - `DSA_Theory`
  - `Core_CS_Theory`

## Usage

### Student Endpoint
```bash
GET /api/students/{id}?includeAllData=true
# or
GET /api/students/{id}?complete=true
```

### Candidates Endpoint
```bash
GET /api/candidates?includeAllData=true&page=1&limit=20
# or
GET /api/candidates?complete=true&page=1&limit=20
```

## Verification Checklist

- [x] All student table fields included
- [x] All college table fields included
- [x] All assessment table fields included
- [x] All assessment_score table fields included
- [x] All interview table fields included
- [x] Score types relation included
- [x] No anonymization (real emails, phones, URLs)
- [x] No redaction (resume URLs, report URLs, recording URLs)
- [x] Timestamps included (created_at, updated_at)
- [x] Foreign keys included (college_id, student_id, etc.)

## Notes

- When `includeAllData=false` (default), responses use anonymized/transformed data
- When `includeAllData=true`, responses include ALL database fields without any modification
- All nested relations are included (assessments → assessment_scores → score_types)
- All timestamps and metadata fields are preserved

