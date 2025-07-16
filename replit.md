# JobAI - AI-Powered Job Search Assistant

## Overview

JobAI is a comprehensive job search application that leverages AI to streamline the job application process. The system automates resume generation, cover letter creation, and job application tracking, helping users find and apply to relevant positions efficiently.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and building

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **AI Integration**: OpenAI API for resume/cover letter generation

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared TypeScript types and schemas
├── migrations/      # Database migration files
└── dist/           # Built application files
```

## Key Components

### Database Schema
The application uses three main entities:
- **Users**: Store user profiles, skills, experience, and education
- **Jobs**: Store job listings with details like title, company, location, requirements
- **Applications**: Track user applications with status, AI-generated documents, and notes

### AI Services
- **Resume Generation**: Creates tailored resumes based on job descriptions and user profiles
- **Cover Letter Generation**: Produces personalized cover letters for specific positions
- **Job Analysis**: Analyzes job requirements to optimize application materials

### Frontend Components
- **Dashboard**: Main job search interface with filtering and statistics
- **Job Cards**: Display job listings with quick apply functionality
- **Quick Apply Modal**: AI-powered application flow with real-time status updates
- **Applications Tracker**: Manage and monitor application status

### Backend API
- **Job Search**: Search jobs by query, location, and radius
- **Application Management**: Create, track, and update job applications
- **AI Integration**: Generate resumes and cover letters using OpenAI

## Data Flow

1. **Job Search**: Users search for jobs using filters (location, keywords, radius)
2. **Quick Apply**: Users select jobs and trigger AI-powered application process
3. **AI Processing**: System analyzes job requirements and generates tailored documents
4. **Application Tracking**: Users monitor application status and manage follow-ups
5. **Analytics**: System provides insights on application success rates and trends

## External Dependencies

### Core Technologies
- **Database**: Neon Database (serverless PostgreSQL)
- **AI Services**: OpenAI API (GPT-4o model)
- **UI Components**: Radix UI primitives via shadcn/ui
- **Authentication**: Express sessions with connect-pg-simple

### Development Tools
- **Package Manager**: npm
- **Build System**: Vite for frontend, esbuild for backend
- **TypeScript**: Full type safety across the stack
- **Database Management**: Drizzle Kit for migrations and schema management

## Deployment Strategy

### Development Setup
- Frontend runs on Vite dev server with HMR
- Backend runs on Express with tsx for TypeScript execution
- Database schema managed through Drizzle migrations
- Environment variables for API keys and database connection

### Production Build
- Frontend builds to static files in `dist/public`
- Backend bundles to `dist/index.js` with esbuild
- Single deployment artifact serving both frontend and API
- Environment-specific configuration through process.env

### Key Configuration
- Database connection via `DATABASE_URL` environment variable
- OpenAI API key configuration for AI services
- Tailwind CSS with custom design system
- Path aliases for clean imports across the application

The application is designed as a monorepo with shared TypeScript types, enabling type-safe communication between frontend and backend while maintaining a clean separation of concerns.