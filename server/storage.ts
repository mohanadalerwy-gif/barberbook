import {
  users, barbers, services, workingHours, bookings, supportTickets, priceChangeRequests, emailVerifications,
  type User, type InsertUser, type UpsertUser,
  type Barber, type InsertBarber,
  type Service, type InsertService,
  type WorkingHours, type InsertWorkingHours,
  type Booking, type InsertBooking,
  type SupportTicket, type InsertSupportTicket,
  type PriceChangeRequest, type InsertPriceChangeRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAuthProvider(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  getBarber(id: string): Promise<Barber | undefined>;
  getBarberByUserId(userId: string): Promise<Barber | undefined>;
  getAllBarbers(): Promise<(Barber & { user: User })[]>;
  getNearbyBarbers(lat: number, lng: number, radiusKm: number): Promise<(Barber & { user: User; distance: number })[]>;
  createBarber(barber: InsertBarber): Promise<Barber>;
  updateBarber(id: string, data: Partial<InsertBarber>): Promise<Barber | undefined>;

  getServices(barberId: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;

  getWorkingHours(barberId: string): Promise<WorkingHours[]>;
  setWorkingHours(barberId: string, hours: InsertWorkingHours[]): Promise<WorkingHours[]>;

  getBooking(id: string): Promise<Booking | undefined>;
  getBookingByBookingId(bookingId: string): Promise<Booking | undefined>;
  getBookingsByCustomer(customerId: string): Promise<Booking[]>;
  getBookingsByBarber(barberId: string): Promise<Booking[]>;
  getBookingsByBarberAndDate(barberId: string, date: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: Booking['status']): Promise<Booking | undefined>;
  saveBookingReview(id: string, rating: number, review: string): Promise<Booking | undefined>;
  updateBarberRating(barberId: string): Promise<void>;

  getSupportTicketsByUser(userId: string): Promise<SupportTicket[]>;
  getAllSupportTickets(): Promise<(SupportTicket & { userEmail: string | null; userName: string | null })[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;

  getAllUsers(): Promise<User[]>;
  getAllBarbersAdmin(): Promise<(Barber & { user: User })[]>;
  getBookingStats(): Promise<{ total: number; today: number }>;
  getRevenueStats(): Promise<{ totalRevenue: number; monthlyRevenue: number }>;
  getBarberReviews(barberId: string): Promise<{ rating: number; review: string | null; customerName: string | null; date: string; createdAt: string | null }[]>;
  updateTicketStatus(id: string, status: string): Promise<SupportTicket | undefined>;

  getPriceChangeRequestsByBarber(barberId: string): Promise<PriceChangeRequest[]>;
  getPriceChangeRequest(id: string): Promise<PriceChangeRequest | undefined>;
  createPriceChangeRequest(request: InsertPriceChangeRequest): Promise<PriceChangeRequest>;
  getAllPriceChangeRequests(): Promise<(PriceChangeRequest & { barberName: string; barberShopName: string | null })[]>;
  updatePriceChangeRequestStatus(id: string, status: string): Promise<PriceChangeRequest | undefined>;

  createEmailVerification(userId: string, code: string, expiresAt: Date): Promise<void>;
  getEmailVerification(userId: string): Promise<{ code: string; expiresAt: Date } | undefined>;
  deleteEmailVerification(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByAuthProvider(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.authProvider, provider), eq(users.authProviderId, providerId))
    );
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getBarber(id: string): Promise<Barber | undefined> {
    const [barber] = await db.select().from(barbers).where(eq(barbers.id, id));
    return barber || undefined;
  }

  async getBarberByUserId(userId: string): Promise<Barber | undefined> {
    const [barber] = await db.select().from(barbers).where(eq(barbers.userId, userId));
    return barber || undefined;
  }

  async getAllBarbers(): Promise<(Barber & { user: User })[]> {
    const result = await db
      .select()
      .from(barbers)
      .innerJoin(users, eq(barbers.userId, users.id))
      .where(eq(barbers.isApproved, true));
    
    return result.map(row => ({
      ...row.barbers,
      user: row.users,
    }));
  }

  async getNearbyBarbers(lat: number, lng: number, radiusKm: number): Promise<(Barber & { user: User; distance: number })[]> {
    const result = await db.execute(sql`
      SELECT * FROM (
        SELECT 
          b.id,
          b.user_id,
          b.shop_name,
          b.phone as barber_phone,
          b.bio,
          b.address,
          b.lat,
          b.lng,
          b.haircut_price,
          b.beard_price,
          b.price_range,
          b.is_approved,
          b.rating,
          b.review_count,
          b.created_at,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          u.email as user_email,
          u.phone as user_phone,
          u.role as user_role,
          u.profile_image_url as user_profile_image_url,
          (
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(${lat})) * cos(radians(CAST(b.lat AS float))) *
                cos(radians(CAST(b.lng AS float)) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(CAST(b.lat AS float)))
              ))
            )
          ) AS distance
        FROM barbers b
        JOIN users u ON b.user_id = u.id
        WHERE b.is_approved = true
      ) AS nearby
      WHERE distance <= ${radiusKm}
      ORDER BY distance
    `);
    
    return (result.rows as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      shopName: row.shop_name,
      phone: row.barber_phone,
      bio: row.bio,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      haircutPrice: row.haircut_price,
      beardPrice: row.beard_price,
      priceRange: row.price_range,
      isApproved: row.is_approved,
      rating: row.rating,
      reviewCount: row.review_count,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        email: row.user_email,
        firstName: row.user_first_name,
        lastName: row.user_last_name,
        profileImageUrl: row.user_profile_image_url,
        phone: row.user_phone,
        role: row.user_role,
        authProvider: null,
        authProviderId: null,
        passwordHash: null,
        emailVerified: row.email_verified ?? false,
        createdAt: null,
        updatedAt: null,
      },
      distance: parseFloat(row.distance),
    }));
  }

  async createBarber(insertBarber: InsertBarber): Promise<Barber> {
    const [barber] = await db.insert(barbers).values(insertBarber).returning();
    return barber;
  }

  async updateBarber(id: string, data: Partial<InsertBarber>): Promise<Barber | undefined> {
    const [barber] = await db.update(barbers).set(data).where(eq(barbers.id, id)).returning();
    return barber || undefined;
  }

  async getServices(barberId: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.barberId, barberId));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  async updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db.update(services).set(data).where(eq(services.id, id)).returning();
    return service || undefined;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getWorkingHours(barberId: string): Promise<WorkingHours[]> {
    return await db.select().from(workingHours).where(eq(workingHours.barberId, barberId));
  }

  async setWorkingHours(barberId: string, hours: InsertWorkingHours[]): Promise<WorkingHours[]> {
    await db.delete(workingHours).where(eq(workingHours.barberId, barberId));
    if (hours.length === 0) return [];
    const inserted = await db.insert(workingHours).values(hours).returning();
    return inserted;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingByBookingId(bookingId: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.bookingId, bookingId));
    return booking || undefined;
  }

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.customerId, customerId));
  }

  async getBookingsByBarber(barberId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.barberId, barberId));
  }

  async getBookingsByBarberAndDate(barberId: string, date: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(
      and(eq(bookings.barberId, barberId), eq(bookings.date, date))
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBookingStatus(id: string, status: Booking['status']): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return booking || undefined;
  }

  async saveBookingReview(id: string, rating: number, review: string): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings).set({ rating, review }).where(eq(bookings.id, id)).returning();
    return booking || undefined;
  }

  async updateBarberRating(barberId: string): Promise<void> {
    const [result] = await db
      .select({
        avgRating: sql<number>`avg(${bookings.rating})`,
        reviewCount: sql<number>`count(${bookings.rating})`,
      })
      .from(bookings)
      .where(and(eq(bookings.barberId, barberId), sql`${bookings.rating} IS NOT NULL`));

    const avg = result.avgRating != null ? parseFloat(result.avgRating.toString()).toFixed(1) : '0.0';
    const count = Number(result.reviewCount) || 0;

    await db.update(barbers).set({ rating: avg, reviewCount: count }).where(eq(barbers.id, barberId));
  }

  async getSupportTicketsByUser(userId: string): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets(): Promise<(SupportTicket & { userEmail: string | null; userName: string | null })[]> {
    const [tickets, allUsers] = await Promise.all([
      db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)),
      db.select().from(users),
    ]);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    return tickets.map(ticket => {
      const user = userMap.get(ticket.userId);
      return {
        ...ticket,
        userEmail: user?.email ?? null,
        userName: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || null : null,
      };
    });
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db.insert(supportTickets).values(insertTicket).returning();
    return ticket;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllBarbersAdmin(): Promise<(Barber & { user: User })[]> {
    const result = await db
      .select()
      .from(barbers)
      .innerJoin(users, eq(barbers.userId, users.id))
      .orderBy(desc(barbers.createdAt));
    return result.map(row => ({ ...row.barbers, user: row.users }));
  }

  async getBookingStats(): Promise<{ total: number; today: number }> {
    const today = new Date().toISOString().split('T')[0];
    const [totalResult, todayResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(bookings),
      db.select({ count: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.date, today)),
    ]);
    return {
      total: Number(totalResult[0]?.count ?? 0),
      today: Number(todayResult[0]?.count ?? 0),
    };
  }

  async getRevenueStats(): Promise<{ totalRevenue: number; monthlyRevenue: number }> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const monthStart = `${year}-${month}-01`;
    const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
    const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    const [totalResult, monthlyResult] = await Promise.all([
      db.select({ revenue: sql<string>`COALESCE(SUM(${services.price}), 0)` })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(eq(bookings.status, 'completed')),
      db.select({ revenue: sql<string>`COALESCE(SUM(${services.price}), 0)` })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(and(
          eq(bookings.status, 'completed'),
          sql`${bookings.date} >= ${monthStart}`,
          sql`${bookings.date} <= ${monthEnd}`
        )),
    ]);

    return {
      totalRevenue: parseFloat(totalResult[0]?.revenue ?? '0'),
      monthlyRevenue: parseFloat(monthlyResult[0]?.revenue ?? '0'),
    };
  }

  async getBarberReviews(barberId: string): Promise<{ rating: number; review: string | null; customerName: string | null; date: string; createdAt: string | null }[]> {
    const result = await db
      .select({
        rating: bookings.rating,
        review: bookings.review,
        date: bookings.date,
        createdAt: bookings.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .where(and(
        eq(bookings.barberId, barberId),
        sql`${bookings.rating} IS NOT NULL`
      ))
      .orderBy(desc(bookings.createdAt));

    return result.map(r => ({
      rating: r.rating!,
      review: r.review,
      date: r.date,
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
      customerName: [r.firstName, r.lastName].filter(Boolean).join(' ') || null,
    }));
  }

  async updateTicketStatus(id: string, status: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .update(supportTickets)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket || undefined;
  }

  async getPriceChangeRequestsByBarber(barberId: string): Promise<PriceChangeRequest[]> {
    return await db.select().from(priceChangeRequests)
      .where(eq(priceChangeRequests.barberId, barberId))
      .orderBy(desc(priceChangeRequests.createdAt));
  }

  async createPriceChangeRequest(insertRequest: InsertPriceChangeRequest): Promise<PriceChangeRequest> {
    const [request] = await db.insert(priceChangeRequests).values(insertRequest).returning();
    return request;
  }

  async getPriceChangeRequest(id: string): Promise<PriceChangeRequest | undefined> {
    const [request] = await db.select().from(priceChangeRequests).where(eq(priceChangeRequests.id, id));
    return request || undefined;
  }

  async getAllPriceChangeRequests(): Promise<(PriceChangeRequest & { barberName: string; barberShopName: string | null })[]> {
    const [requests, allBarbers, allUsers] = await Promise.all([
      db.select().from(priceChangeRequests).orderBy(desc(priceChangeRequests.createdAt)),
      db.select().from(barbers),
      db.select().from(users),
    ]);
    const barberMap = new Map(allBarbers.map(b => [b.id, b]));
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    return requests.map(req => {
      const barber = barberMap.get(req.barberId);
      const user = barber ? userMap.get(barber.userId) : undefined;
      return {
        ...req,
        barberShopName: barber?.shopName ?? null,
        barberName: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown' : 'Unknown',
      };
    });
  }

  async updatePriceChangeRequestStatus(id: string, status: string): Promise<PriceChangeRequest | undefined> {
    const [request] = await db
      .update(priceChangeRequests)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(priceChangeRequests.id, id))
      .returning();
    return request || undefined;
  }

  async createEmailVerification(userId: string, code: string, expiresAt: Date): Promise<void> {
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
    await db.insert(emailVerifications).values({ userId, code, expiresAt });
  }

  async getEmailVerification(userId: string): Promise<{ code: string; expiresAt: Date } | undefined> {
    const [row] = await db
      .select({ code: emailVerifications.code, expiresAt: emailVerifications.expiresAt })
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, userId));
    return row || undefined;
  }

  async deleteEmailVerification(userId: string): Promise<void> {
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
