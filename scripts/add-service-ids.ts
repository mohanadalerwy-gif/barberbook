import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_ids text`;
console.log("Added service_ids column to bookings");
