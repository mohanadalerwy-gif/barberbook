import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const bookings = await sql`
  SELECT b.booking_id, b.status, b.date, b.time,
         u.email as customer_email, u.role as customer_role
  FROM bookings b
  JOIN users u ON b.customer_id = u.id
  ORDER BY b.created_at DESC
  LIMIT 20
`;
console.log("=== BOOKINGS ===");
console.table(bookings);

const users = await sql`SELECT id, email, role FROM users ORDER BY created_at DESC`;
console.log("=== USERS ===");
console.table(users);
