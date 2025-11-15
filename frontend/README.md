# Frontend Application

This is the main frontend application for the Edge Candidates Marketplace.

## Structure

- `src/` - Main source code
  - `App.tsx` - Main application component
  - `StudentProfileModal.tsx` - Detailed student profile modal with radar charts
  - `EvaluationCriteriaModal.tsx` - Evaluation criteria information modal
  - `lib/supabase.ts` - Supabase client configuration
- `public/` - Static assets
- `index.html` - Entry HTML file

## Features

- Candidate dashboard with filtering and search
- Branch distribution visualization
- Detailed student profiles with interactive radar charts
- Assessment and interview score visualization
- Responsive design

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the frontend directory:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Build

```bash
npm run build
```

