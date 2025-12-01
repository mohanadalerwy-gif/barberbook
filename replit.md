# BarberBook - Barber Booking Platform

## Overview

BarberBook is a minimalistic barber booking application that connects customers with nearby barbers. The platform enables users to discover barbers within a configurable radius (up to 10km) using GPS location, browse services and pricing, schedule appointments, and manage their bookings. The application also provides a dedicated dashboard for barbers to manage their schedules, approve bookings, and set their availability.

The application follows a clean, fast, and simple design philosophy with minimal screens and straightforward user flows. It supports both light and dark themes, automatic language detection (English/Arabic with RTL support), and generates unique booking confirmation numbers in the format BARB-YYYY-XXXXXX.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Component Library**: Radix UI primitives with shadcn/ui components styled using Tailwind CSS (New York variant with neutral base color)

**Routing**: Wouter for lightweight client-side routing

**State Management**: 
- TanStack Query (React Query) for server state and API data fetching
- Local React state for UI-specific state management
- No global state management library (keeps architecture simple)

**Internationalization**: i18next with automatic device language detection supporting English (LTR) and Arabic (RTL) layouts

**Design System**:
- Typography: Inter font for body/UI, with display fonts for headers
- Spacing units: Tailwind's 2, 4, 6, 8, 12, 16, 20 scale
- Component padding follows p-4, p-6, p-8 pattern
- Responsive grid patterns for barber cards (1/2/3 columns), services (1/2 columns), and dashboard stats

**Key UI Patterns**:
- Bottom navigation bar with 4 main tabs (Home, Book, Nearby, Profile)
- Card-based layouts for barber listings and service selections
- Calendar-centric booking flow with date/time slot selection
- Mobile-first responsive design with safe-area handling

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**Architecture Pattern**: REST API with PostgreSQL database using DatabaseStorage class

**Session Management**: express-session with connect-pg-simple for PostgreSQL session persistence

**API Structure**:
- Routes defined in `server/routes.ts` with `/api` prefix
- Storage interface (IStorage) abstracts data operations
- Middleware for JSON body parsing, URL encoding, request logging, and authentication

**Authentication**: Replit Auth integration supporting:
- Apple Sign-In
- Google Sign-In  
- GitHub Sign-In
- Email authentication
Via OIDC (OpenID Connect) protocol with automatic session management.

### Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL

**Database Schema** (from `shared/schema.ts`):
- `users` - User accounts with auth provider info (id, email, firstName, lastName, phone, role, authProvider, authProviderId)
- `barbers` - Barber profiles linked to users (id, userId, bio, address, lat, lng, priceRange, isApproved, rating, reviewCount)
- `services` - Services offered by barbers (id, barberId, name, price, duration)
- `bookings` - Customer appointments (id, bookingId, customerId, barberId, serviceId, date, time, status)
- `working_hours` - Barber weekly schedule (barberId, dayOfWeek, startTime, endTime, isWorking)
- `sessions` - Authentication sessions

**Database Implementation**: DatabaseStorage class with full CRUD operations and location-based queries using Haversine formula for distance calculation.

### Key Features and Business Logic

**Location-Based Discovery**:
- GPS-based barber discovery within configurable radius (1-10km)
- Distance calculation using Haversine formula in PostgreSQL
- Sorting by proximity to user location

**Booking System**:
- Multi-step booking flow: Service Selection → Date/Time Selection → Confirmation → Success
- Unique booking ID generation in format `BARB-YYYY-XXXXXX`
- Booking statuses: pending, confirmed, completed, cancelled, declined
- Working hours management for barbers (7-day schedule with open/close times)
- Real-time availability checking (booked slots disabled)

**Barber Dashboard**:
- Separate view for barber role with booking management
- Accept/decline pending bookings
- View today's schedule and upcoming appointments
- Toggle availability and set working hours

**User Roles**:
- Customer: Browse, book, and manage appointments
- Barber: Manage schedule, services, and bookings

**Maps Integration**:
- "Open Location" button on barber profiles and booking confirmations
- Platform-specific deep linking (Apple Maps for iOS, Google Maps fallback)
- Uses `geo:` URI scheme for mobile, HTTPS for web

**Theme Support**:
- Light/dark mode with CSS custom properties
- Theme persistence in localStorage
- Background images switch based on color scheme preference

**Bilingual Support**:
- Automatic language detection from device settings
- English (LTR) and Arabic (RTL) layouts
- All UI strings translated

## API Endpoints

### Public Endpoints
- `GET /api/barbers/nearby?lat={lat}&lng={lng}&radius={km}` - Get nearby barbers
- `GET /api/barbers/:id` - Get barber details with services and working hours

### Protected Endpoints (require authentication)
- `GET /api/auth/user` - Get current authenticated user
- `POST /api/barbers/register` - Register as a barber
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get user's bookings
- `GET /api/barber/bookings` - Get barber's received bookings
- `PATCH /api/bookings/:id/status` - Update booking status

### Authentication Endpoints
- `GET /api/login` - Initiate Replit Auth login
- `GET /api/login/callback` - Handle OAuth callback
- `GET /api/logout` - Log out user

## External Dependencies

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Unstyled, accessible component primitives
- **shadcn/ui**: Pre-built component library based on Radix UI
- **class-variance-authority**: Component variant styling
- **Lucide React**: Icon library
- **React Icons**: Additional icons (Apple, Google logos)

### Forms and Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation library
- **@hookform/resolvers**: React Hook Form integration with Zod
- **Drizzle Zod**: Zod schema generation from Drizzle ORM schemas

### Data Fetching and State
- **TanStack Query (React Query)**: Server state management and caching

### Date and Time
- **date-fns**: Date manipulation and formatting library

### Database and ORM
- **Drizzle ORM**: TypeScript ORM for PostgreSQL
- **@neondatabase/serverless**: PostgreSQL driver for Neon

### Internationalization
- **i18next**: Internationalization framework
- **react-i18next**: React bindings for i18next

### Session Management
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store

### Authentication
- **openid-client**: OIDC client for Replit Auth

### Build and Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the application
- **ESBuild**: JavaScript bundler for production builds
- **Wouter**: Lightweight routing library

## Recent Changes

- **December 2024**: Full database integration with PostgreSQL
- **December 2024**: Implemented Replit Auth for Apple/Google/GitHub/email login
- **December 2024**: Fixed nearby barbers SQL query (subquery pattern for distance filtering)
- **December 2024**: Connected all frontend pages to real API endpoints
- **December 2024**: Added complete booking flow with unique ID generation
- **December 2024**: Implemented bilingual support with auto-detection
