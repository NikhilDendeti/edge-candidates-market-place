# Backend

This project uses **Supabase** as a Backend-as-a-Service (BaaS) solution.

## Important: Database Schema

**The database schema is NOT defined in this codebase.** You need to create it in Supabase.

See [`DATABASE_SETUP.md`](./DATABASE_SETUP.md) for complete setup instructions.

Quick setup:
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL in [`database-schema.sql`](./database-schema.sql)
3. Configure environment variables (see below)

## Backend Architecture

- **Database**: PostgreSQL (hosted on Supabase)
- **API**: Supabase REST API
- **Authentication**: Supabase Auth (if needed)
- **Storage**: Supabase Storage (if needed)

## Configuration

The backend connection is configured in the frontend application:
- `frontend/src/lib/supabase.ts`

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in: Supabase Dashboard → Settings → API

## Database Schema

The application expects a `candidates` table. See [`database-schema.sql`](./database-schema.sql) for the complete schema.

**You can modify the code to interact with the database however you want** - just update:
- The table name in queries
- The fields being queried
- Add new queries, filters, etc.

## No Local Backend Code

This repository does not contain any backend server code. All backend functionality is provided by Supabase.

## Modifying Database Interactions

Yes, you can modify the code to interact with your database however you want:

1. **Change table names**: Update `supabase.from('table_name')` in the code
2. **Add/remove fields**: Modify TypeScript types and queries
3. **Add filters/sorting**: Use Supabase query methods
4. **Create/Update/Delete**: Add mutation operations

The only requirement is having the correct Supabase URL and API key in your `.env` file.

