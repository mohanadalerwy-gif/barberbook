import { 
  users, barbers, services, workingHours, bookings,
  type User, type InsertUser,
  type Barber, type InsertBarber,
  type Service, type InsertService,
  type WorkingHours, type InsertWorkingHours,
  type Booking, type InsertBooking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByAuthProvider(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  getBarber(id: string): Promise<Barber | undefined>;
  getBarberByUserId(userId: string): Promise<Barber | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
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

  async getNearbyBarbers(lat: number, lng: number, radiusKm: number): Promise<(Barber & { user: User; distance: number })[]> {
    const result = await db.execute(sql`
      SELECT 
        b.*,
        u.id as user_id,
        u.name as user_name,
        u.phone as user_phone,
        u.email as user_email,
        u.role as user_role,
        u.avatar as user_avatar,
        (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(b.lat::float)) *
            cos(radians(b.lng::float) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(b.lat::float))
          )
        ) AS distance
      FROM barbers b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_approved = true
      HAVING (
        6371 * acos(
          cos(radians(${lat})) * cos(radians(b.lat::float)) *
          cos(radians(b.lng::float) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(b.lat::float))
        )
      ) <= ${radiusKm}
      ORDER BY distance
    `);
    
    return (result.rows as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      bio: row.bio,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      priceRange: row.price_range,
      isApproved: row.is_approved,
      rating: row.rating,
      reviewCount: row.review_count,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        phone: row.user_phone,
        email: row.user_email,
        role: row.user_role,
        avatar: row.user_avatar,
        authProvider: null,
        authProviderId: null,
        createdAt: null,
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
}

export const storage = new DatabaseStorage();
