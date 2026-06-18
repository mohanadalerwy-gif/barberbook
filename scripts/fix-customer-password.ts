import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";

const sql = neon(process.env.DATABASE_URL!);
const hash = await bcrypt.hash("Test1234", 12);
const r = await sql`
  UPDATE users
  SET password_hash = ${hash}, email_verified = true
  WHERE email = 'customer@test.com'
  RETURNING id, email, role, email_verified
`;
console.log("Updated customer:", r[0]);
