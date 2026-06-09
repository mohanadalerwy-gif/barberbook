import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
await sql`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin'`;
console.log("Added 'admin' to user_role enum");
