import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['customer', 'barber']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'declined', 'completed', 'cancelled']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  role: userRoleEnum("role").notNull().default('customer'),
  avatar: text("avatar"),
  authProvider: text("auth_provider"),
  authProviderId: text("auth_provider_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const barbers = pgTable("barbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  address: text("address"),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  priceRange: text("price_range"),
  isApproved: boolean("is_approved").default(false),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  barberId: varchar("barber_id").notNull().references(() => barbers.id),
  name: text("name").notNull(),
  duration: integer("duration").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export const workingHours = pgTable("working_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  barberId: varchar("barber_id").notNull().references(() => barbers.id),
  day: text("day").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isWorking: boolean("is_working").default(true),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: text("booking_id").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  barberId: varchar("barber_id").notNull().references(() => barbers.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: bookingStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  barber: one(barbers, {
    fields: [users.id],
    references: [barbers.userId],
  }),
  bookings: many(bookings),
}));

export const barbersRelations = relations(barbers, ({ one, many }) => ({
  user: one(users, {
    fields: [barbers.userId],
    references: [users.id],
  }),
  services: many(services),
  workingHours: many(workingHours),
  bookings: many(bookings),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  barber: one(barbers, {
    fields: [services.barberId],
    references: [barbers.id],
  }),
  bookings: many(bookings),
}));

export const workingHoursRelations = relations(workingHours, ({ one }) => ({
  barber: one(barbers, {
    fields: [workingHours.barberId],
    references: [barbers.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
  }),
  barber: one(barbers, {
    fields: [bookings.barberId],
    references: [barbers.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBarberSchema = createInsertSchema(barbers).omit({
  id: true,
  createdAt: true,
  rating: true,
  reviewCount: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertWorkingHoursSchema = createInsertSchema(workingHours).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Barber = typeof barbers.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertWorkingHours = z.infer<typeof insertWorkingHoursSchema>;
export type WorkingHours = typeof workingHours.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
