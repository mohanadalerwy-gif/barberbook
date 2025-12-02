import { 
  users, barbers, services, workingHours, bookings, supportTickets, priceChangeRequests,
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

  getSupportTicketsByUser(userId: string): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;

  getPriceChangeRequestsByBarber(barberId: string): Promise<PriceChangeRequest[]>;
  createPriceChangeRequest(request: InsertPriceChangeRequest): Promise<PriceChangeRequest>;
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

  async getSupportTicketsByUser(userId: string): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db.insert(supportTickets).values(insertTicket).returning();
    return ticket;
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
}

export const storage = new DatabaseStorage();
