import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

console.log("Running pricing migration...");

await sql`
  ALTER TABLE services
    ADD COLUMN IF NOT EXISTS display_price integer,
    ADD COLUMN IF NOT EXISTS customer_price integer,
    ADD COLUMN IF NOT EXISTS barber_price integer
`;
console.log("✓ Added price columns to services");

await sql`
  ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS snapshot_display_price integer,
    ADD COLUMN IF NOT EXISTS snapshot_customer_price integer,
    ADD COLUMN IF NOT EXISTS snapshot_barber_price integer
`;
console.log("✓ Added snapshot columns to bookings");

// Seed existing services with the new three-tier prices based on Arabic service name
await sql`
  UPDATE services SET
    display_price  = CASE name_ar
      WHEN 'حلاقة شعر'       THEN 35
      WHEN 'حلاقة دقن'       THEN 28
      WHEN 'شعر + دقن'       THEN 48
      WHEN 'صبغة شعر'        THEN 65
      WHEN 'صبغة دقن'        THEN 40
      WHEN 'حمام زيت'        THEN 100
      WHEN 'استشوار'         THEN 35
      WHEN 'تنظيف بشرة'      THEN 40
      WHEN 'ماسك وجه'        THEN 35
      WHEN 'شمع وجه'         THEN 28
      WHEN 'بروتين شعر قصير' THEN 220
      WHEN 'فرد شعر'         THEN 130
      WHEN 'باكج عريس'       THEN 450
      ELSE ROUND(price::numeric)::integer
    END,
    customer_price = CASE name_ar
      WHEN 'حلاقة شعر'       THEN 26
      WHEN 'حلاقة دقن'       THEN 21
      WHEN 'شعر + دقن'       THEN 37
      WHEN 'صبغة شعر'        THEN 52
      WHEN 'صبغة دقن'        THEN 31
      WHEN 'حمام زيت'        THEN 83
      WHEN 'استشوار'         THEN 26
      WHEN 'تنظيف بشرة'      THEN 31
      WHEN 'ماسك وجه'        THEN 26
      WHEN 'شمع وجه'         THEN 21
      WHEN 'بروتين شعر قصير' THEN 185
      WHEN 'فرد شعر'         THEN 103
      WHEN 'باكج عريس'       THEN 360
      ELSE ROUND(price::numeric)::integer
    END,
    barber_price   = CASE name_ar
      WHEN 'حلاقة شعر'       THEN 25
      WHEN 'حلاقة دقن'       THEN 20
      WHEN 'شعر + دقن'       THEN 35
      WHEN 'صبغة شعر'        THEN 50
      WHEN 'صبغة دقن'        THEN 30
      WHEN 'حمام زيت'        THEN 80
      WHEN 'استشوار'         THEN 25
      WHEN 'تنظيف بشرة'      THEN 30
      WHEN 'ماسك وجه'        THEN 25
      WHEN 'شمع وجه'         THEN 20
      WHEN 'بروتين شعر قصير' THEN 180
      WHEN 'فرد شعر'         THEN 100
      WHEN 'باكج عريس'       THEN 350
      ELSE ROUND(price::numeric)::integer
    END
  WHERE display_price IS NULL
`;
console.log("✓ Seeded three-tier prices on all existing services");

const rows = await sql`SELECT COUNT(*) as total, COUNT(display_price) as priced FROM services`;
console.log(`  Services: ${rows[0].total} total, ${rows[0].priced} priced`);

console.log("Migration complete.");
