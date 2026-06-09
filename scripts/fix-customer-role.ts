import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const r = await sql`UPDATE users SET role='customer' WHERE email='customer@test.com' RETURNING email, role`;
console.log("Updated:", r[0]);
