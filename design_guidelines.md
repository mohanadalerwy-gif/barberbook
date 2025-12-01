# Design Guidelines: Barber Booking Platform MVP

## Design Approach

**Hybrid Reference-Based**: Drawing inspiration from booking platforms (Airbnb, Booking.com, Calendly) for customer-facing interfaces combined with productivity tool patterns (Linear, Notion) for dashboard management interfaces. This balances visual appeal for customer trust with functional efficiency for barber workflows.

## Core Design Principles

1. **Role-Based Visual Hierarchy**: Each user type (customer, barber, admin) receives interface optimized for their primary tasks
2. **Trust Through Polish**: Professional presentation builds confidence in booking service
3. **Scan-First Design**: Information density balanced with breathing room for quick decision-making
4. **Calendar-Centric**: Booking flow and schedule management prioritize time-based interactions

---

## Typography

**Font Stack**:
- **Primary**: Inter (via Google Fonts) - Body text, UI elements
- **Display**: Cal Sans or Clash Display - Headers, hero sections

**Hierarchy**:
- Hero Headlines: 3.5rem (desktop) / 2.25rem (mobile), bold weight
- Section Headers: 2rem (desktop) / 1.5rem (mobile), semibold
- Card Titles: 1.25rem, medium weight
- Body Text: 1rem, regular weight
- UI Labels: 0.875rem, medium weight
- Captions: 0.75rem, regular weight

---

## Layout System

**Spacing Units**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20** for consistency
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20
- Grid gaps: gap-4, gap-6, gap-8

**Container Strategy**:
- Full-width sections: w-full with inner max-w-7xl mx-auto
- Content areas: max-w-6xl mx-auto
- Form containers: max-w-2xl mx-auto
- Reading content: max-w-prose

**Grid Patterns**:
- Barber/Shop Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Service Selection: grid-cols-1 sm:grid-cols-2
- Dashboard Stats: grid-cols-2 lg:grid-cols-4
- Calendar View: Custom calendar grid (7 columns for days)

---

## Component Library

### Navigation
**Customer-Facing Header**:
- Logo left, navigation center, auth/profile right
- Sticky position with subtle shadow on scroll
- Height: h-16
- Include: Browse Barbers, Services, My Bookings, Account

**Dashboard Navigation**:
- Sidebar layout (w-64) for barber/admin dashboards
- Collapsible on mobile (hamburger menu)
- Active state with subtle background treatment

### Cards

**Barber/Shop Cards**:
- Aspect ratio 4:3 image
- Overlay gradient for name/rating on hover
- Content: Image, Name, Rating (stars), Specialty, Location
- CTA: "View Profile" or "Book Now"
- Rounded corners: rounded-xl
- Shadow: shadow-md hover:shadow-xl transition

**Service Cards**:
- Horizontal layout on desktop (image left, content right)
- Vertical stack on mobile
- Include: Service name, duration, description
- Radio button or checkbox for selection

**Appointment Cards**:
- Clear date/time display at top
- Barber photo thumbnail
- Service details
- Status badge (Pending/Confirmed/Completed)
- Action buttons based on status

### Forms

**Booking Flow**:
1. Select Barber/Shop (card grid)
2. Choose Service (radio cards)
3. Pick Time Slot (calendar + time picker)
4. Confirm Details (summary + submit)

**Form Inputs**:
- Input height: h-12
- Label: Above input, 0.875rem, medium weight
- Border: 2px solid, rounded-lg
- Focus state: Prominent ring
- Error states: Red border with icon + message below

### Calendar Interface

**Time Slot Picker**:
- Week view by default (7 columns)
- Each slot: min-h-16, rounded-lg border
- Available slots: Interactive, hover state
- Booked slots: Disabled with visual distinction
- Selected slot: Prominent highlight
- Mobile: Single day view with swipe navigation

**Barber Schedule Manager**:
- Weekly grid view
- Drag-to-block time slots
- Toggle switches for recurring availability
- Visual distinction between booked/available/blocked times

### Buttons

**Primary CTA**: 
- Height: h-12, px-8
- Rounded: rounded-full
- Font: medium weight, 1rem
- Built-in hover/active states

**Secondary**: 
- Same size, bordered variant
- Built-in hover/active states

**Buttons on Images**:
- Backdrop blur background (backdrop-blur-sm)
- No custom hover/active states (inherit button defaults)

### Dashboards

**Stats Overview** (Barber/Admin):
- 4-column grid on desktop (grid-cols-4)
- Cards with: Icon, Number (large), Label (small)
- Height: consistent h-32

**Booking Requests Panel**:
- List view with compact appointment cards
- Accept/Decline actions inline
- Quick filters: Pending, Today, This Week

**Admin Tables**:
- Sortable columns
- Row actions: Edit, Delete, View Details
- Pagination at bottom
- Search/filter bar at top

---

## Page Layouts

### Customer Landing Page
1. **Hero Section** (80vh):
   - Large hero image (barber shop interior or professional barber at work)
   - Centered headline: "Find Your Perfect Barber"
   - Search bar: Location + Service type
   - Backdrop-blurred CTA buttons

2. **Featured Barbers** (py-20):
   - 3-column grid of top-rated barbers
   - "View All Barbers" CTA

3. **How It Works** (py-16):
   - 3-column process steps with icons
   - Browse → Book → Get Groomed

4. **Service Categories** (py-20):
   - 2-column grid with large imagery
   - Haircuts, Beard Grooming, Full Service

5. **Social Proof** (py-16):
   - 3-column testimonial cards with customer photos
   - Rating stars and short quotes

6. **Footer** (py-12):
   - 4-column grid: About, Quick Links, Contact, Social
   - Newsletter signup form
   - Copyright and legal links

### Barber Profile Page
- Split layout: 40% sidebar (photo, rating, bio, contact), 60% main (services, calendar, reviews)
- Sticky booking widget on sidebar (desktop)
- Mobile: Stack vertically

### Booking Dashboard (Customer)
- Tabs: Upcoming, Past, Cancelled
- Appointment cards in single column list
- Empty state with CTA to browse barbers

### Barber Dashboard
- Sidebar navigation
- Today's appointments highlighted
- Calendar view toggle: Day/Week
- Quick stats at top (4-column grid)

### Admin Dashboard
- Full data tables
- Metrics overview (grid-cols-4)
- Filters and search prominent
- Export functionality

---

## Images

**Required Images**:
1. **Hero Image**: Professional barber shop interior or barber working - warm, inviting, high-quality. Dimensions: 1920x1080 minimum
2. **Barber Profile Photos**: Headshots of barbers, 800x800px, professional quality
3. **Shop Photos**: Interiors showing chairs, equipment, ambiance - 1200x900px
4. **Service Category Images**: High-quality photos for each service type (haircut action shot, beard grooming, etc.) - 800x600px
5. **Testimonial Customer Photos**: Headshots or avatars - 200x200px

**Placement**:
- Hero: Full-width background with overlay gradient
- Barber Cards: Top of card, aspect-ratio-4/3
- Profile Pages: Large image in sidebar
- Service Selection: Thumbnail left of service details

---

## Animations

**Minimal Approach** - Use only for:
- Card hover: Subtle scale (scale-105) and shadow increase
- Calendar slot selection: Quick highlight transition
- Page transitions: Fade-in for dashboard content switches
- Loading states: Skeleton screens (no spinners)

**Avoid**: Scroll animations, complex entrance effects, unnecessary motion

---

## Accessibility

- Minimum touch targets: 44x44px
- Form labels always visible (not placeholder-only)
- Calendar keyboard navigation support
- Clear focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Status announcements for booking confirmations