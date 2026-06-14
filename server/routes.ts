import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isEmployee } from "./replitAuth";
import { generateCsrfToken, csrfProtection } from "./csrf";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import {
  insertBookingSchema,
  insertBarberSchema,
  insertServiceSchema,
  insertWorkingHoursSchema,
  updateUserProfileSchema,
  createSupportTicketInputSchema,
  createPriceChangeRequestInputSchema
} from "@shared/schema";

/** Strip fields that must never be sent to clients. */
function sanitizeUser<T extends { passwordHash?: unknown; authProviderId?: unknown }>(
  user: T,
): Omit<T, 'passwordHash' | 'authProviderId'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, authProviderId, ...safe } = user;
  return safe as Omit<T, 'passwordHash' | 'authProviderId'>;
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many booking requests, please wait before trying again." },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  // CSRF token endpoint — GET is always safe; no CSRF check needed here.
  app.get("/api/csrf-token", (req: any, res) => {
    res.json({ token: generateCsrfToken(req) });
  });

  // Validate CSRF tokens on all mutating API requests (POST/PUT/PATCH/DELETE).
  app.use("/api", csrfProtection);

  app.use("/api", apiLimiter);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const barber = await storage.getBarberByUserId(userId);
      res.json({ ...sanitizeUser(user), barber });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const parseResult = updateUserProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }
      
      const { firstName, lastName, profileImageUrl } = parseResult.data;
      const user = await storage.updateUser(userId, { firstName, lastName, profileImageUrl });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get('/api/barbers', async (req, res) => {
    try {
      const allBarbers = await storage.getAllBarbers();

      const formatted = allBarbers.map(b => ({
        id: b.id,
        name: [b.user.firstName, b.user.lastName].filter(Boolean).join(' ') || 'Unknown',
        avatar: b.user.profileImageUrl || '',
        rating: parseFloat(b.rating || '0'),
        reviewCount: b.reviewCount || 0,
        priceRange: b.priceRange || '$20 - $50',
        address: b.address || '',
        bio: b.bio || '',
        isApproved: b.isApproved,
        lat: parseFloat(b.lat || '0'),
        lng: parseFloat(b.lng || '0'),
        shopName: b.shopName || '',
        phone: b.phone || '',
        haircutPrice: b.haircutPrice ? parseFloat(b.haircutPrice) : null,
        beardPrice: b.beardPrice ? parseFloat(b.beardPrice) : null,
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Error fetching barbers:", error);
      res.status(500).json({ message: "Failed to fetch barbers" });
    }
  });

  app.get('/api/barbers/nearby', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string) || 5;

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      const barbers = await storage.getNearbyBarbers(lat, lng, radius);

      const formatted = barbers.map(b => ({
        id: b.id,
        name: [b.user.firstName, b.user.lastName].filter(Boolean).join(' ') || 'Unknown',
        avatar: b.user.profileImageUrl || '',
        rating: parseFloat(b.rating || '0'),
        reviewCount: b.reviewCount || 0,
        distance: Math.round(b.distance * 10) / 10,
        priceRange: b.priceRange || '$20 - $50',
        address: b.address || '',
        bio: b.bio || '',
        isApproved: b.isApproved,
        lat: parseFloat(b.lat || '0'),
        lng: parseFloat(b.lng || '0'),
        shopName: b.shopName || '',
        phone: b.phone || '',
        haircutPrice: b.haircutPrice ? parseFloat(b.haircutPrice) : null,
        beardPrice: b.beardPrice ? parseFloat(b.beardPrice) : null,
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Error fetching nearby barbers:", error);
      res.status(500).json({ message: "Failed to fetch barbers" });
    }
  });

  app.get('/api/barbers/:id', async (req, res) => {
    try {
      const barber = await storage.getBarber(req.params.id);
      if (!barber) {
        return res.status(404).json({ message: "Barber not found" });
      }

      const user = await storage.getUser(barber.userId);
      const services = await storage.getServices(barber.id);
      const workingHours = await storage.getWorkingHours(barber.id);

      res.json({
        id: barber.id,
        name: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : 'Unknown',
        avatar: user?.profileImageUrl || '',
        rating: parseFloat(barber.rating || '0'),
        reviewCount: barber.reviewCount || 0,
        priceRange: barber.priceRange || '$20 - $50',
        address: barber.address || '',
        bio: barber.bio || '',
        isApproved: barber.isApproved,
        lat: parseFloat(barber.lat || '0'),
        lng: parseFloat(barber.lng || '0'),
        shopName: barber.shopName || '',
        phone: barber.phone || '',
        haircutPrice: barber.haircutPrice ? parseFloat(barber.haircutPrice) : null,
        beardPrice: barber.beardPrice ? parseFloat(barber.beardPrice) : null,
        services: services.map(s => ({
          id: s.id,
          barberId: s.barberId,
          name: s.name,
          duration: s.duration,
          price: parseFloat(s.price),
        })),
        workingHours,
      });
    } catch (error) {
      console.error("Error fetching barber:", error);
      res.status(500).json({ message: "Failed to fetch barber" });
    }
  });

  app.get('/api/barbers/:id/services', async (req, res) => {
    try {
      const services = await storage.getServices(req.params.id);
      res.json(services.map(s => ({
        id: s.id,
        barberId: s.barberId,
        name: s.name,
        duration: s.duration,
        price: parseFloat(s.price),
      })));
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/barbers/:id/booked-slots', async (req, res) => {
    try {
      const date = req.query.date as string;
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      const bookings = await storage.getBookingsByBarberAndDate(req.params.id, date);
      const bookedTimes = bookings
        .filter(b => b.status !== 'cancelled' && b.status !== 'declined')
        .map(b => b.time);
      res.json(bookedTimes);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      res.status(500).json({ message: "Failed to fetch booked slots" });
    }
  });

  app.post('/api/barbers/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const existingBarber = await storage.getBarberByUserId(userId);
      if (existingBarber) {
        return res.status(400).json({ message: "User is already registered as a barber" });
      }

      const { fullName, shopName, phone, haircutPrice, beardPrice, address, bio, lat, lng, priceRange } = req.body;

      if (!shopName || !phone || !haircutPrice || !beardPrice || !address) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const nameParts = (fullName || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await storage.updateUser(userId, { 
        role: 'barber',
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      });

      const barberData = {
        userId,
        shopName: shopName,
        phone: phone,
        haircutPrice: haircutPrice,
        beardPrice: beardPrice,
        address: address,
        bio: bio || '',
        lat: lat || '25.2048',
        lng: lng || '55.2708',
        priceRange: priceRange || `$${haircutPrice} - $${parseFloat(haircutPrice) + parseFloat(beardPrice)}`,
        isApproved: true,
      };

      const barber = await storage.createBarber(barberData);

      const haircutService = await storage.createService({
        barberId: barber.id,
        name: 'Haircut',
        duration: 30,
        price: haircutPrice,
      });

      const beardService = await storage.createService({
        barberId: barber.id,
        name: 'Beard Trim',
        duration: 15,
        price: beardPrice,
      });

      res.status(201).json({ ...barber, services: [haircutService, beardService] });
    } catch (error) {
      console.error("Error registering barber:", error);
      res.status(500).json({ message: "Failed to register barber" });
    }
  });

  app.patch('/api/barbers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const barber = await storage.getBarber(req.params.id);

      if (!barber || barber.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateBarber(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating barber:", error);
      res.status(500).json({ message: "Failed to update barber" });
    }
  });

  app.post('/api/barbers/:id/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const barber = await storage.getBarber(req.params.id);

      if (!barber || barber.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const result = insertServiceSchema.safeParse({ ...req.body, barberId: req.params.id });
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.issues });
      }

      const service = await storage.createService(result.data);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.get('/api/barbers/:id/working-hours', async (req, res) => {
    try {
      const savedHours = await storage.getWorkingHours(req.params.id);
      
      const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const defaultHours = dayOrder.map(day => ({
        day,
        isWorking: !['Friday', 'Saturday'].includes(day),
        startTime: '09:00',
        endTime: '18:00',
      }));

      const mergedHours = defaultHours.map(defaultDay => {
        const saved = savedHours.find(h => h.day === defaultDay.day);
        return saved ? {
          id: saved.id,
          barberId: saved.barberId,
          day: saved.day,
          isWorking: saved.isWorking,
          startTime: saved.startTime,
          endTime: saved.endTime,
        } : defaultDay;
      });

      res.json(mergedHours);
    } catch (error) {
      console.error("Error fetching working hours:", error);
      res.status(500).json({ message: "Failed to fetch working hours" });
    }
  });

  app.put('/api/barbers/:id/working-hours', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const barberId = req.params.id;
      const barber = await storage.getBarber(barberId);

      if (!barber || barber.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { hours } = req.body;
      if (!Array.isArray(hours) || hours.length === 0) {
        return res.status(400).json({ message: "Invalid hours data" });
      }

      const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      const hoursWithBarberId = hours.map((h: any) => {
        if (!h.day || !validDays.includes(h.day)) {
          throw new Error(`Invalid day: ${h.day}`);
        }
        if (!h.startTime || !h.endTime) {
          throw new Error(`Missing time for ${h.day}`);
        }
        
        return {
          barberId,
          day: h.day,
          startTime: h.startTime,
          endTime: h.endTime,
          isWorking: h.isWorking ?? true,
        };
      });

      const updated = await storage.setWorkingHours(barberId, hoursWithBarberId);
      console.log(`Saved ${updated.length} working hours for barber ${barberId}`);
      res.json(updated);
    } catch (error) {
      console.error("Error updating working hours:", error);
      res.status(500).json({ message: "Failed to update working hours" });
    }
  });

  app.delete('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const service = await storage.getService(req.params.id);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const barber = await storage.getBarber(service.barberId);
      if (!barber || barber.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteService(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  app.post('/api/bookings', bookingLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { serviceIds, ...bodyRest } = req.body;

      const result = insertBookingSchema.safeParse({
        ...bodyRest,
        customerId: userId,
        // Multi-service: first ID becomes primary serviceId, all stored as JSON
        ...(Array.isArray(serviceIds) && serviceIds.length > 0 && {
          serviceId: bodyRest.serviceId || serviceIds[0],
          serviceIds: JSON.stringify(serviceIds),
        }),
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.issues });
      }

      const existingBookings = await storage.getBookingsByBarberAndDate(
        result.data.barberId,
        result.data.date
      );

      const timeConflict = existingBookings.some(
        b => b.time === result.data.time && 
            b.status !== 'cancelled' && 
            b.status !== 'declined'
      );

      if (timeConflict) {
        return res.status(409).json({ message: "Time slot is no longer available" });
      }

      const booking = await storage.createBooking(result.data);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let bookings;
      if (user.role === 'barber') {
        const barber = await storage.getBarberByUserId(userId);
        if (!barber) {
          return res.status(404).json({ message: "Barber profile not found" });
        }
        bookings = await storage.getBookingsByBarber(barber.id);
      } else {
        bookings = await storage.getBookingsByCustomer(userId);
      }

      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const barber = await storage.getBarber(booking.barberId);
          const barberUser = barber ? await storage.getUser(barber.userId) : null;
          const customer = await storage.getUser(booking.customerId);

          // Resolve all service IDs (multi-service support)
          const allServiceIds: string[] = booking.serviceIds
            ? JSON.parse(booking.serviceIds)
            : [booking.serviceId];
          const allServices = await Promise.all(allServiceIds.map(id => storage.getService(id)));

          return {
            ...booking,
            barberName: barberUser
              ? [barberUser.firstName, barberUser.lastName].filter(Boolean).join(' ')
              : 'Unknown',
            barberAddress: barber?.address || '',
            barberLat: barber?.lat || null,
            barberLng: barber?.lng || null,
            customerName: customer
              ? [customer.firstName, customer.lastName].filter(Boolean).join(' ')
              : 'Unknown',
            customerPhone: customer?.phone,
            serviceName: allServices.filter(Boolean).map(s => s!.name).join(' + ') || 'Unknown',
            duration: allServices.reduce((sum, s) => sum + (s?.duration || 0), 0),
            price: allServices.reduce((sum, s) => sum + parseFloat(s?.price || '0'), 0),
          };
        })
      );

      res.json(enrichedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.patch('/api/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.body;

      if (!['confirmed', 'declined', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const user = await storage.getUser(userId);
      const barber = await storage.getBarber(booking.barberId);

      const isBarber = barber?.userId === userId;
      const isCustomer = booking.customerId === userId;

      if (status === 'cancelled' && !isCustomer) {
        return res.status(403).json({ message: "Only customers can cancel bookings" });
      }

      if ((status === 'confirmed' || status === 'declined' || status === 'completed') && !isBarber) {
        return res.status(403).json({ message: "Only barbers can update this status" });
      }

      const updated = await storage.updateBookingStatus(req.params.id, status);
      res.json(updated);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  app.post('/api/bookings/:id/review', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rating, review } = req.body;
      console.log('[review] received', { bookingId: req.params.id, userId, rating, review });

      if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        console.log('[review] validation failed', { rating });
        return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
      }

      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.customerId !== userId) {
        console.log('[review] unauthorized', { customerId: booking.customerId, userId });
        return res.status(403).json({ message: "Unauthorized" });
      }
      if (booking.status !== 'completed') {
        console.log('[review] not completed', { status: booking.status });
        return res.status(400).json({ message: "Can only review completed bookings" });
      }
      if (booking.rating !== null && booking.rating !== undefined) {
        console.log('[review] already reviewed', { rating: booking.rating });
        return res.status(409).json({ message: "Booking already reviewed" });
      }

      const updated = await storage.saveBookingReview(req.params.id, rating, review || '');
      console.log('[review] saved', { id: updated?.id, rating: updated?.rating });

      await storage.updateBarberRating(booking.barberId);
      console.log('[review] barber rating updated', { barberId: booking.barberId });

      res.json(updated);
    } catch (error) {
      console.error("Error saving review:", error);
      res.status(500).json({ message: "Failed to save review" });
    }
  });

  app.get('/api/support-tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tickets = await storage.getSupportTicketsByUser(userId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.post('/api/support-tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const parseResult = createSupportTicketInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { category, message, photoUrl } = parseResult.data;

      const ticketData = {
        userId,
        category,
        message,
        photoUrl: photoUrl || null,
        status: 'pending' as const,
      };

      const ticket = await storage.createSupportTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.get('/api/price-change-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const barber = await storage.getBarberByUserId(userId);

      if (!barber) {
        return res.status(403).json({ message: "Only barbers can view price change requests" });
      }

      const requests = await storage.getPriceChangeRequestsByBarber(barber.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching price change requests:", error);
      res.status(500).json({ message: "Failed to fetch price change requests" });
    }
  });

  app.post('/api/price-change-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const barber = await storage.getBarberByUserId(userId);

      if (!barber) {
        return res.status(403).json({ message: "Only barbers can request price changes" });
      }

      const parseResult = createPriceChangeRequestInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { newHaircutPrice, newBeardPrice, notes } = parseResult.data;

      const requestData = {
        barberId: barber.id,
        oldHaircutPrice: barber.haircutPrice || '0',
        oldBeardPrice: barber.beardPrice || '0',
        newHaircutPrice: newHaircutPrice.toString(),
        newBeardPrice: newBeardPrice.toString(),
        notes: notes || null,
        status: 'pending' as const,
      };

      const priceRequest = await storage.createPriceChangeRequest(requestData);
      res.status(201).json(priceRequest);
    } catch (error) {
      console.error("Error creating price change request:", error);
      res.status(500).json({ message: "Failed to create price change request" });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectId } = await objectStorageService.getObjectEntityUploadURL();
      
      if (!req.session.pendingUploads) {
        req.session.pendingUploads = [];
      }
      req.session.pendingUploads.push(objectId);
      if (req.session.pendingUploads.length > 10) {
        req.session.pendingUploads = req.session.pendingUploads.slice(-10);
      }
      
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put("/api/profile-images", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    const userId = req.user?.claims?.sub;
    const imageURL = req.body.imageURL;

    try {
      const objectStorageService = new ObjectStorageService();
      
      if (!imageURL.startsWith("https://storage.googleapis.com/")) {
        return res.status(400).json({ error: "Invalid image URL format" });
      }
      
      const url = new URL(imageURL);
      const objectPath = url.pathname;
      const privateDir = objectStorageService.getPrivateObjectDir();
      
      const normalizedPrivateDir = privateDir.endsWith("/") ? privateDir : `${privateDir}/`;
      
      if (!objectPath.startsWith(normalizedPrivateDir)) {
        return res.status(403).json({ error: "Access denied: invalid object path" });
      }
      
      if (!objectPath.includes("/uploads/")) {
        return res.status(403).json({ error: "Access denied: not an upload path" });
      }
      
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageURL,
        {
          owner: userId,
          visibility: "public",
        }
      );

      await storage.updateUser(userId, { profileImageUrl: normalizedPath });

      res.status(200).json({ objectPath: normalizedPath });
    } catch (error) {
      console.error("Error setting profile image:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAdmin, async (_req, res) => {
    try {
      const [bookingStats, revenueStats, adminCounts] = await Promise.all([
        storage.getBookingStats(),
        storage.getRevenueStats(),
        storage.getAdminCounts(),
      ]);
      res.json({ ...bookingStats, ...revenueStats, ...adminCounts });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/barbers/:id/reviews', isAdmin, async (req, res) => {
    try {
      const reviews = await storage.getBarberReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching barber reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/admin/barbers', isAdmin, async (_req, res) => {
    try {
      const barbers = await storage.getAllBarbersAdmin();
      res.json(barbers);
    } catch (error) {
      console.error("Error fetching admin barbers:", error);
      res.status(500).json({ message: "Failed to fetch barbers" });
    }
  });

  app.patch('/api/admin/barbers/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;
      if (typeof isApproved !== 'boolean') {
        return res.status(400).json({ message: "isApproved must be a boolean" });
      }
      const barber = await storage.updateBarber(id, { isApproved });
      if (!barber) return res.status(404).json({ message: "Barber not found" });
      res.json(barber);
    } catch (error) {
      console.error("Error updating barber approval:", error);
      res.status(500).json({ message: "Failed to update barber" });
    }
  });

  app.get('/api/admin/support-tickets', isAdmin, async (_req, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching admin tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/admin/users', isAdmin, async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers.map(sanitizeUser));
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/support-tickets/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const ticket = await storage.updateTicketStatus(id, status);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });
      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!['customer', 'barber', 'admin', 'employee'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updated = await storage.updateUser(id, { role });
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json({ id: updated.id, email: updated.email, role: updated.role });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.get('/api/admin/price-change-requests', isAdmin, async (_req, res) => {
    try {
      const requests = await storage.getAllPriceChangeRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching admin price change requests:", error);
      res.status(500).json({ message: "Failed to fetch price change requests" });
    }
  });

  app.patch('/api/admin/price-change-requests/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const request = await storage.getPriceChangeRequest(id);
      if (!request) return res.status(404).json({ message: "Price change request not found" });
      if (request.status !== 'pending') {
        return res.status(400).json({ message: "Request has already been processed" });
      }

      const updated = await storage.updatePriceChangeRequestStatus(id, status);

      if (status === 'approved') {
        await storage.updateBarber(request.barberId, {
          haircutPrice: request.newHaircutPrice,
          beardPrice: request.newBeardPrice,
        });
        const barberServices = await storage.getServices(request.barberId);
        await Promise.all(barberServices.map(service => {
          const name = service.name.toLowerCase();
          if (name.includes('haircut')) return storage.updateService(service.id, { price: request.newHaircutPrice });
          if (name.includes('beard')) return storage.updateService(service.id, { price: request.newBeardPrice });
          return Promise.resolve();
        }));
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating price change request:", error);
      res.status(500).json({ message: "Failed to update price change request" });
    }
  });

  app.get('/api/admin/bookings', isAdmin, async (_req, res) => {
    try {
      const allBookings = await storage.getAllBookingsAdmin();
      res.json(allBookings);
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/admin/users-detailed', isAdmin, async (_req, res) => {
    try {
      const usersDetailed = await storage.getUsersDetailed();
      res.json(usersDetailed.map(sanitizeUser));
    } catch (error) {
      console.error("Error fetching detailed users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/employees', isAdmin, async (_req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get('/api/admin/tasks', isAdmin, async (_req, res) => {
    try {
      const allTasks = await storage.getAllTasks();
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/admin/tasks', isAdmin, async (req: any, res) => {
    try {
      const { title, message, assignedTo } = req.body;
      if (!title || !message || !assignedTo) {
        return res.status(400).json({ message: "title, message, and assignedTo are required" });
      }
      const createdBy = req.user.claims.sub;
      const task = await storage.createTask({ title, message, assignedTo, createdBy, status: 'pending' });
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/admin/tasks/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['pending', 'done'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const task = await storage.updateTaskStatus(id, status);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.get('/api/tasks', isEmployee, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const myTasks = await storage.getTasksByEmployee(userId);
      res.json(myTasks);
    } catch (error) {
      console.error("Error fetching employee tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.patch('/api/tasks/:id/done', isEmployee, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const allMyTasks = await storage.getTasksByEmployee(userId);
      const task = allMyTasks.find(t => t.id === id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      const updated = await storage.updateTaskStatus(id, 'done');
      res.json(updated);
    } catch (error) {
      console.error("Error marking task done:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.post('/api/admin/set-role', async (req: any, res) => {
    try {
      const { email, role } = req.body;
      if (!email || !role) return res.status(400).json({ message: "email and role are required" });
      if (!['customer', 'barber', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const allUsers = await storage.getAllUsers();
      const adminExists = allUsers.some(u => u.role === 'admin');

      if (adminExists) {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
        const currentUser = await storage.getUser(req.user.claims.sub);
        if (!currentUser || currentUser.role !== 'admin') {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const target = await storage.getUserByEmail(email.toLowerCase());
      if (!target) return res.status(404).json({ message: "User not found" });

      const updated = await storage.updateUser(target.id, { role });
      res.json({ id: updated?.id, email: updated?.email, role: updated?.role });
    } catch (error) {
      console.error("Error setting role:", error);
      res.status(500).json({ message: "Failed to set role" });
    }
  });

  return httpServer;
}
