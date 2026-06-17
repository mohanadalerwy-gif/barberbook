import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

await sql`ALTER TABLE barbers ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false`;
await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS name_ar text`;
await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS name_en text`;

console.log("Migration complete: added is_demo, name_ar, name_en columns");
