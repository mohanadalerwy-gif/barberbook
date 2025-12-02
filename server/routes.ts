import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookingSchema, insertBarberSchema, insertServiceSchema, insertWorkingHoursSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const barber = await storage.getBarberByUserId(userId);
      res.json({ ...user, barber });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phone, role } = req.body;
      const user = await storage.updateUser(userId, { phone, role });
      res.json(user);
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

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const result = insertBookingSchema.safeParse({
        ...req.body,
        customerId: userId,
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
          const service = await storage.getService(booking.serviceId);

          return {
            ...booking,
            barberName: barberUser 
              ? [barberUser.firstName, barberUser.lastName].filter(Boolean).join(' ') 
              : 'Unknown',
            customerName: customer 
              ? [customer.firstName, customer.lastName].filter(Boolean).join(' ') 
              : 'Unknown',
            customerPhone: customer?.phone,
            serviceName: service?.name || 'Unknown',
            duration: service?.duration || 0,
            price: service ? parseFloat(service.price) : 0,
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

  return httpServer;
}
