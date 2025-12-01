# BarberBook - Barber Booking Platform

## Overview

BarberBook is a minimalistic barber booking application that connects customers with nearby barbers. The platform enables users to discover barbers within a 5km radius using GPS location, browse services and pricing, schedule appointments, and manage their bookings. The application also provides a dedicated dashboard for barbers to manage their schedules, approve bookings, and set their availability.

The application follows a clean, fast, and simple design philosophy with minimal screens and straightforward user flows. It supports both light and dark themes, automatic language detection (English/Arabic with RTL support), and generates unique booking confirmation numbers.

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

**Architecture Pattern**: Simple REST API with in-memory storage (MemStorage class)

**Session Management**: Currently using in-memory storage, designed to support connect-pg-simple for PostgreSQL sessions

**API Structure**:
- Routes defined in `server/routes.ts` with `/api` prefix
- Storage interface (IStorage) abstracts data operations for easy database swapping
- Middleware for JSON body parsing, URL encoding, and request logging

**Authentication Strategy**: Planned support for:
- Phone number authentication
- Apple Sign-In
- Google Sign-In

Currently uses mock authentication flow in the frontend.

### Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL

**Schema Design** (from `shared/schema.ts`):
- Users table with UUID primary keys
- Schema validation using Zod for type safety
- Designed for extension to include: barbers, services, bookings, time slots, working hours

**Current Implementation**: In-memory storage (MemStorage) with interface-based design allowing easy migration to PostgreSQL

**Database Configuration**: Drizzle Kit configured for PostgreSQL migrations with schema located in `shared/schema.ts` and migrations output to `./migrations` directory

### Key Features and Business Logic

**Location-Based Discovery**:
- GPS-based barber discovery within configurable radius (default 5km)
- Distance calculation and sorting of nearby barbers
- Mock implementation using `getNearbyBarbers()` utility

**Booking System**:
- Multi-step booking flow: Service Selection → Date/Time Selection → Confirmation
- Unique booking ID generation in format `BARB-YYYY-XXXXXX`
- Booking statuses: pending, confirmed, completed, cancelled, declined
- Working hours management for barbers (7-day schedule with open/close times)

**Barber Dashboard**:
- Separate view for barber role with booking management
- Accept/decline pending bookings
- View today's schedule and upcoming appointments
- Toggle availability and set working hours

**User Roles**:
- Customer: Browse, book, and manage appointments
- Barber: Manage schedule, services, and bookings

**Maps Integration**:
- "Open Location" button on barber profiles
- Platform-specific deep linking (Apple Maps for iOS, Google Maps fallback)
- Uses `geo:` URI scheme for mobile, HTTPS for web

**Theme Support**:
- Light/dark mode with CSS custom properties
- Theme persistence in localStorage
- Background images switch based on color scheme preference

## External Dependencies

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Unstyled, accessible component primitives (accordion, dialog, dropdown, popover, etc.)
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
- **Axios**: Planned HTTP client (currently using fetch)

### Date and Time
- **date-fns**: Date manipulation and formatting library

### Database and ORM
- **Drizzle ORM**: TypeScript ORM for PostgreSQL
- **@neondatabase/serverless**: PostgreSQL driver for Neon (serverless-compatible)

### Internationalization
- **i18next**: Internationalization framework
- **react-i18next**: React bindings for i18next

### Session Management
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store (configured but not yet active)

### Build and Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the application
- **ESBuild**: JavaScript bundler for production builds
- **Wouter**: Lightweight routing library

### Replit-Specific Plugins
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation tool
- **@replit/vite-plugin-dev-banner**: Development environment indicator

### Utilities
- **nanoid**: Unique ID generation
- **clsx** and **tailwind-merge**: Conditional CSS class merging

### Planned/Future Integrations
- **Stripe**: Payment processing (dependency present)
- **Nodemailer**: Email notifications (dependency present)
- **OpenAI**: AI features (dependency present)
- **JWT**: Token-based authentication (dependency present)
- **Passport.js**: Authentication strategies (dependency present)