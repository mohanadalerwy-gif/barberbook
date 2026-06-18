import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";

const sql = neon(process.env.DATABASE_URL!);

// Check all test accounts
console.log("=== Checking test accounts ===");
const users = await sql`
  SELECT u.id, u.email, u.role, u.email_verified, u.password_hash IS NOT NULL as has_password,
         b.id as barber_id, b.is_approved
  FROM users u
  LEFT JOIN barbers b ON b.user_id = u.id
  WHERE u.email IN ('barber@test.com', 'mohanad.alerwy@gmail.com', 'customer@test.com')
  ORDER BY u.email
`;
console.table(users);

// Fix barber@test.com
const barberPassword = await bcrypt.hash("Test1234", 12);

const existingBarber = users.find((u: any) => u.email === 'barber@test.com');

if (!existingBarber) {
  console.log("barber@test.com does not exist — creating it...");
  const newUser = await sql`
    INSERT INTO users (email, role, email_verified, password_hash, first_name, last_name)
    VALUES ('barber@test.com', 'barber', true, ${barberPassword}, 'Test', 'Barber')
    RETURNING id, email, role, email_verified
  `;
  console.log("Created user:", newUser[0]);

  // Create barber profile
  const barberProfile = await sql`
    INSERT INTO barbers (user_id, shop_name, is_approved, is_demo)
    VALUES (${newUser[0].id}, 'Test Barber Shop', true, false)
    RETURNING id, user_id, shop_name, is_approved
  `;
  console.log("Created barber profile:", barberProfile[0]);
} else {
  console.log("barber@test.com exists — resetting password and fixing status...");
  const updated = await sql`
    UPDATE users
    SET password_hash = ${barberPassword},
        role = 'barber',
        email_verified = true
    WHERE email = 'barber@test.com'
    RETURNING id, email, role, email_verified
  `;
  console.log("Updated user:", updated[0]);

  if (!existingBarber.barber_id) {
    console.log("No barber profile found — creating one...");
    const barberProfile = await sql`
      INSERT INTO barbers (user_id, shop_name, is_approved, is_demo)
      VALUES (${existingBarber.id}, 'Test Barber Shop', true, false)
      RETURNING id, user_id, shop_name, is_approved
    `;
    console.log("Created barber profile:", barberProfile[0]);
  } else {
    const updatedBarber = await sql`
      UPDATE barbers SET is_approved = true WHERE user_id = ${existingBarber.id}
      RETURNING id, user_id, is_approved
    `;
    console.log("Updated barber profile:", updatedBarber[0]);
  }
}

// Final state of all test accounts
console.log("\n=== Final state of test accounts ===");
const final = await sql`
  SELECT u.id, u.email, u.role, u.email_verified, u.password_hash IS NOT NULL as has_password,
         b.id as barber_id, b.is_approved as barber_approved
  FROM users u
  LEFT JOIN barbers b ON b.user_id = u.id
  WHERE u.email IN ('barber@test.com', 'mohanad.alerwy@gmail.com', 'customer@test.com')
  ORDER BY u.email
`;
console.table(final);
