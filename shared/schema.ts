import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, decimal, timestamp, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['customer', 'barber', 'admin']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'declined', 'completed', 'cancelled']);
export const ticketStatusEnum = pgEnum('ticket_status', ['pending', 'approved', 'rejected']);
export const ticketCategoryEnum = pgEnum('ticket_category', ['price_change', 'technical_issue', 'general_question']);

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default('customer'),
  authProvider: text("auth_provider"),
  authProviderId: text("auth_provider_id"),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const barbers = pgTable("barbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  shopName: text("shop_name"),
  phone: text("phone"),
  bio: text("bio"),
  address: text("address"),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  haircutPrice: decimal("haircut_price", { precision: 10, scale: 2 }),
  beardPrice: decimal("beard_price", { precision: 10, scale: 2 }),
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
  serviceIds: text("service_ids"),
  rating: integer("rating"),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: ticketCategoryEnum("category").notNull(),
  message: text("message").notNull(),
  photoUrl: text("photo_url"),
  status: ticketStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const priceChangeRequests = pgTable("price_change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  barberId: varchar("barber_id").notNull().references(() => barbers.id),
  oldHaircutPrice: decimal("old_haircut_price", { precision: 10, scale: 2 }).notNull(),
  oldBeardPrice: decimal("old_beard_price", { precision: 10, scale: 2 }).notNull(),
  newHaircutPrice: decimal("new_haircut_price", { precision: 10, scale: 2 }).notNull(),
  newBeardPrice: decimal("new_beard_price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  status: ticketStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export type UpsertUser = typeof users.$inferInsert;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceChangeRequestSchema = createInsertSchema(priceChangeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export type InsertPriceChangeRequest = z.infer<typeof insertPriceChangeRequestSchema>;
export type PriceChangeRequest = typeof priceChangeRequests.$inferSelect;

export const updateUserProfileSchema = z.object({
  firstName: z.string().max(100).optional().transform(val => val || undefined),
  lastName: z.string().max(100).optional().transform(val => val || undefined),
  profileImageUrl: z.string().optional().nullable().transform(val => {
    if (!val || val.trim() === '') return null;
    return val;
  }),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export const createSupportTicketInputSchema = z.object({
  category: z.enum(['price_change', 'technical_issue', 'general_question']),
  message: z.string().min(10).max(2000),
  photoUrl: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().url().optional().nullable()
  ),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketInputSchema>;

export const createPriceChangeRequestInputSchema = z.object({
  newHaircutPrice: z.union([z.string(), z.number()]).transform(val => parseFloat(String(val))).refine(val => !isNaN(val) && val >= 0, { message: "Invalid haircut price" }),
  newBeardPrice: z.union([z.string(), z.number()]).transform(val => parseFloat(String(val))).refine(val => !isNaN(val) && val >= 0, { message: "Invalid beard price" }),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreatePriceChangeRequestInput = z.infer<typeof createPriceChangeRequestInputSchema>;
