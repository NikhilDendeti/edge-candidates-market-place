# Edge Candidates Marketplace

A candidate marketplace platform for displaying and evaluating pre-assessed candidates from top IIITs.

## Project Structure

```
edge-candidates-market-place/
├── frontend/          # Frontend React application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Dependencies
├── backend/          # Backend documentation (uses Supabase)
└── README.md        # This file
```

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Backend-as-a-Service)
- **Database**: PostgreSQL (hosted on Supabase)

## Getting Started

### Installation

You can install dependencies from the root directory:

```bash
npm install
```

Or install directly in the frontend folder:

```bash
cd frontend
npm install
```

### Running the Application

From the root directory:

```bash
npm run dev
```

Or from the frontend directory:

```bash
cd frontend
npm run dev
```

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features

- Candidate dashboard with filtering and search
- Branch distribution visualization
- Detailed student profiles with interactive radar charts
- Assessment and interview score visualization
- Responsive design

## Tech Stack

- React 19.2.0
- TypeScript
- Vite 7.1.7
- Supabase (for backend services)
- Custom CSS

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

