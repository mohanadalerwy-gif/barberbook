import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const barberData = [
  { name: "أحمد",   lat: "24.4672", lng: "39.6024", rating: "4.8", homeService: true,  homePrice: 40 },
  { name: "خالد",   lat: "24.4710", lng: "39.6100", rating: "4.5", homeService: false, homePrice: null },
  { name: "محمد",   lat: "24.4805", lng: "39.5990", rating: "4.9", homeService: true,  homePrice: 50 },
  { name: "عبدالله",lat: "24.4630", lng: "39.6150", rating: "4.3", homeService: false, homePrice: null },
  { name: "فهد",    lat: "24.4750", lng: "39.5920", rating: "4.7", homeService: true,  homePrice: 45 },
  { name: "سامي",   lat: "24.4690", lng: "39.6200", rating: "4.2", homeService: false, homePrice: null },
  { name: "يوسف",  lat: "24.4580", lng: "39.6050", rating: "4.6", homeService: true,  homePrice: 35 },
  { name: "كريم",   lat: "24.4820", lng: "39.6080", rating: "4.0", homeService: false, homePrice: null },
  { name: "نواف",   lat: "24.4660", lng: "39.5880", rating: "4.9", homeService: true,  homePrice: 55 },
  { name: "طارق",   lat: "24.4770", lng: "39.6180", rating: "4.4", homeService: false, homePrice: null },
];

const serviceList = [
  { nameAr: "حلاقة شعر",         nameEn: "Haircut",                price: "25.00",  duration: 30 },
  { nameAr: "حلاقة دقن",         nameEn: "Beard Trim",             price: "20.00",  duration: 20 },
  { nameAr: "شعر + دقن",         nameEn: "Haircut + Beard",        price: "35.00",  duration: 45 },
  { nameAr: "صبغة شعر",          nameEn: "Hair Dye",               price: "50.00",  duration: 60 },
  { nameAr: "صبغة دقن",          nameEn: "Beard Dye",              price: "30.00",  duration: 30 },
  { nameAr: "حمام زيت",           nameEn: "Oil Treatment",          price: "80.00",  duration: 60 },
  { nameAr: "استشوار",            nameEn: "Blowdry",                price: "25.00",  duration: 30 },
  { nameAr: "تنظيف بشرة",        nameEn: "Skin Cleansing",         price: "30.00",  duration: 30 },
  { nameAr: "ماسك وجه",           nameEn: "Face Mask",              price: "25.00",  duration: 20 },
  { nameAr: "شمع وجه",            nameEn: "Face Wax",               price: "20.00",  duration: 15 },
  { nameAr: "بروتين شعر قصير",   nameEn: "Short Hair Protein",     price: "180.00", duration: 90 },
  { nameAr: "فرد شعر",            nameEn: "Hair Straightening",     price: "100.00", duration: 60 },
  { nameAr: "باكج عريس",          nameEn: "Groom Package",          price: "350.00", duration: 180 },
];

console.log("Seeding 10 demo barbers with services in Madinah...");

for (const b of barberData) {
  const [user] = await sql`
    INSERT INTO users (first_name, role, email_verified)
    VALUES (${b.name}, 'barber', false)
    RETURNING id
  `;

  const [barber] = await sql`
    INSERT INTO barbers (
      user_id, shop_name, address, lat, lng,
      rating, is_approved, is_demo,
      home_service_enabled, home_service_price,
      haircut_price, beard_price, price_range
    )
    VALUES (
      ${user.id},
      ${`صالون ${b.name}`},
      ${'المدينة المنورة، المملكة العربية السعودية'},
      ${b.lat}, ${b.lng},
      ${b.rating}, true, true,
      ${b.homeService}, ${b.homePrice},
      '25.00', '20.00', '25 - 350 ريال'
    )
    RETURNING id
  `;

  for (const svc of serviceList) {
    await sql`
      INSERT INTO services (barber_id, name, name_ar, name_en, duration, price)
      VALUES (${barber.id}, ${svc.nameAr}, ${svc.nameAr}, ${svc.nameEn}, ${svc.duration}, ${svc.price})
    `;
  }

  console.log(`  Created barber: ${b.name} (${barber.id})`);
}

console.log("Done! 10 demo barbers seeded with 13 services each.");
