# Territory Walker - Geospatial Tracking Application

## Project Overview
Territory Walker is a geospatial tracking application that enables users to log, visualize, and analyze their geographical interactions and claims. Users can walk around, track their paths, claim areas, and complete circles for achievements.

## Architecture
- **Frontend**: React with TypeScript using Vite
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Mapping**: Leaflet for interactive maps
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state

## Deployment (Vercel)

The application is optimized for Vercel Serverless Functions.

### Required Environment Variables

Set these in your Vercel Project Settings:

```env
# Supabase Configuration (Required for DB access)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Database Connection (Optional if using Supabase client exclusively, but good for Drizzle)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
```

### Serverless Architecture
- The API is migrated to use **lazy initialization** for database connections to prevent cold-start timeouts.
- The `getSupabaseClient()` factory pattern is used to ensure connections are created only within request handlers.
- `/api/free-polygons`: Currently serves static data for high availability and zero-latency response.

### Build Command
```bash
npm run build
```
Output directory: `dist`

### Local Development
```bash
npm run dev
```
Runs the Vite frontend and Express server concurrently on port 5000.


## Core Features

### User Authentication
- Username/email login or anonymous guest access
- User data persistence across sessions using localStorage

### Location Tracking
- Real-time GPS position tracking with accuracy monitoring
- Path recording with timestamp and accuracy data
- Visual feedback for GPS accuracy issues

### Path Management
- Active path tracking during user movement
- Previous path visualization on map reload
- Path saving with length and area calculations
- Historical path data retrieval by username

### Map Visualization
- Interactive Leaflet map with real-time position updates
- Different visual styles for active vs completed paths
- User path overlays showing travel history
- Claims and completed circles visualization

### Area Claiming
- 10-meter radius circular area claiming system
- Overlap detection to prevent duplicate claims
- User territory statistics and leaderboards

### Circle Completion
- Detection of completed 10-meter circles during walking
- Achievement tracking with completion time
- Circle visualization on map

## Recent Changes (2025-08-03)

### Migration to Replit Environment
- **Successfully migrated** from Replit Agent to Replit environment
- **Created PostgreSQL database** with proper SSL configuration
- **Set up all database tables** (users, claims, user_paths, completed_circles, map_view_preferences)
- **Fixed cross-env dependency** issues for proper Node.js environment handling
- **Enhanced internet connectivity error handling** with automatic recovery

### Internet Connectivity & Error Handling
- **Added useNetworkStatus hook** for real-time network status monitoring
- **Enhanced MapView component** with automatic retry when connection returns
- **Improved error messages** with visual distinction between connection and map errors
- **Connection status indicator** showing online/offline state
- **Automatic map reload** when internet connection is restored
- **Better tile loading fallbacks** with multiple map providers

### User Path History Feature
- **Added getUserPathsByUsername method** in DatabaseStorage class
- **Created API endpoint** `/api/user-paths/username/:username` for fetching historical paths
- **Enhanced MapView component** to fetch and display all user paths on login/reload
- **Visual distinction** between active paths (blue) and completed paths (gray)
- **Path information popups** showing length, area, points count, and creation date

### New Area Calculation Formula
- **Implemented claimed area formula**: `Area = (distance * 2 * r) + (π * r²)`
- **Updated calculateClaimedArea function** in geometry utilities
- **Modified location tracker** to use new formula for real-time area calculation
- **Enhanced total area tracking** with corridor and circular end cap calculations
- **Formula parameters**: r = 10 meters (path radius), distance = total path length

### Database Schema
- **userPaths table** stores path data with JSON point arrays
- **Foreign key relationships** link paths to users
- **isActive field** distinguishes between current and historical paths

### Frontend Improvements
- **Real-time path fetching** when map loads
- **Historical path rendering** with different visual styles
- **Path popup information** with detailed statistics
- **Error handling** for malformed path data
- **Network connectivity monitoring** with automatic recovery

## User Preferences
- Users want to see their previous traveled paths when logging in with the same username
- Paths should be visually distinct between active and completed states
- Path information should be accessible via map popups

## Technical Implementation Details

### Path Data Structure
```typescript
{
  lat: number,
  lng: number, 
  timestamp: number,
  accuracy?: number
}
```

### API Endpoints
- `GET /api/user-paths/user/:userId` - Get paths by user ID
- `GET /api/user-paths/username/:username` - Get paths by username
- `GET /api/user-paths/active/:userId` - Get active path for user
- `POST /api/user-paths` - Create new path
- `PUT /api/user-paths/:id` - Update existing path

### Database Initialization
- **Automatic table creation** on application startup for new environments
- **Database migration handling** with proper error handling and validation
- **Cross-platform compatibility** for both Replit and local development environments

### Known Issues Resolved
- ✅ **Fixed foreign key constraint violations** with automatic database initialization
- ✅ **Resolved cross-environment database setup** with dbInit.ts module
- ✅ **Enhanced error handling** for database connection and initialization failures

### Documentation & Setup
- **Created comprehensive setup guide** with database configuration examples
- **Added .env.example** template for easy environment variable setup
- **Included troubleshooting section** for common deployment issues
- **Cross-platform setup instructions** for Replit, local, and cloud environments

## User Preferences
- Users want clear setup instructions for different deployment environments
- Prefer automatic database initialization over manual table creation
- Need troubleshooting guidance for common connection and map loading issues

## Next Steps
- Implement proper user session management with authentication persistence
- Add path filtering and search capabilities for historical data
- Enhance mobile GPS accuracy handling with better algorithms
- Add real-time collaboration features for shared territory claiming
