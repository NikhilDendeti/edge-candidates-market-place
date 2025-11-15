# Database Setup Guide

## Overview

The database schema is **NOT** defined in this codebase. The database needs to be set up in your Supabase project.

## Quick Answer to Your Questions

### 1. Is the Supabase DB designed here?

**No**, the database schema is not designed in this codebase. The code only **references** the database structure. You need to create the schema in Supabase.

### 2. Can I just modify the code with env variables?

**Yes!** You can:
- Keep Supabase URLs in `.env` file
- Modify the code to interact with the database however you want
- Change table names, add fields, modify queries - everything is flexible

## Database Schema

The application expects a `candidates` table with the following structure:

### Expected Table: `candidates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | VARCHAR(255) | Candidate name |
| `college` | VARCHAR(255) | College name |
| `branch` | VARCHAR(255) | Branch/field of study |
| `cgpa` | VARCHAR(10) | CGPA score |
| `assessment_score` | VARCHAR(50) | Assessment score (e.g., "188 / 210") |
| `assessment_meta` | VARCHAR(255) | Assessment metadata |
| `interview_score` | VARCHAR(50) | Interview score (e.g., "9.6 / 10") |
| `interview_meta` | VARCHAR(255) | Interview metadata |
| `skills` | TEXT[] | Array of skills |
| `recommendation` | VARCHAR(50) | 'Strong Hire', 'Medium Fit', or 'Consider' |
| `resume_url` | TEXT | URL to resume (optional) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Setup Steps

### Option 1: Using SQL Editor in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-schema.sql`
4. Click **Run** to execute

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Manual Table Creation

1. Go to Supabase Dashboard → **Table Editor**
2. Create a new table named `candidates`
3. Add columns as specified above
4. Set up Row Level Security (RLS) policies as needed

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in:
- Supabase Dashboard → **Settings** → **API**

## Modifying the Database Schema

### To add new fields:

1. **Update Supabase table**: Add column in Supabase dashboard
2. **Update TypeScript types**: Modify `Candidate` type in `frontend/src/App.tsx`
3. **Update queries**: Modify Supabase queries to include new fields

### Example: Adding a new field

```typescript
// 1. Add to database (in Supabase SQL Editor)
ALTER TABLE candidates ADD COLUMN email VARCHAR(255);

// 2. Update TypeScript type
type Candidate = {
  // ... existing fields
  email?: string; // Add new field
}

// 3. Update query
const result = await supabase
  .from('candidates')
  .select('name, college, branch, email') // Include new field
```

## Current Code Usage

The code currently queries:
- Table: `candidates` (or `Candidates` - handles both)
- Fields used: `branch` (for distribution calculation)

You can modify `frontend/src/App.tsx` to:
- Query different tables
- Fetch different fields
- Add filters, sorting, pagination
- Create, update, delete records

## Security Notes

- The current schema includes Row Level Security (RLS)
- Adjust RLS policies based on your security requirements
- The sample policy allows public read access - **change this for production!**

## Next Steps

1. Set up your Supabase project
2. Run the SQL schema file (`database-schema.sql`)
3. Configure environment variables
4. Modify the code as needed for your use case

