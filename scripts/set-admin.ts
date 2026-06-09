import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const email = "customer@test.com";

const result = await sql`
  UPDATE users SET role = 'admin' WHERE email = ${email} RETURNING id, email, role
`;

if (result.length === 0) {
  console.error("No user found with email:", email);
  process.exit(1);
}
console.log("Updated:", result[0]);
