import { pool } from "./pool";

/**
 * Seeds the database with sample sites for local development.
 * In production, sites come from the seeding pipeline (OS, OSM, Natural England, etc.)
 * These are real locations in South East London for realistic testing.
 */
async function seed() {
  const sites = [
    // Ponds
    { name: "Blackheath Pond", type: "pond", lon: 0.0087, lat: 51.4713 },
    { name: "Greenwich Park Pond", type: "pond", lon: -0.0014, lat: 51.4769 },
    { name: "Beckenham Place Park Lake", type: "pond", lon: -0.0228, lat: 51.4128 },
    { name: "Ladywell Fields Pond", type: "pond", lon: -0.0192, lat: 51.4535 },
    { name: "Hilly Fields Pond", type: "pond", lon: -0.0360, lat: 51.4590 },
    // Hedgerows
    { name: "Oxleas Wood Hedgerow", type: "hedgerow", lon: 0.0666, lat: 51.4650 },
    { name: "Sutcliffe Park Hedgerow", type: "hedgerow", lon: 0.0340, lat: 51.4430 },
    { name: "Chinbrook Meadows Hedge", type: "hedgerow", lon: 0.0497, lat: 51.4260 },
    // Meadows
    { name: "Blackheath Meadow", type: "meadow", lon: 0.0050, lat: 51.4720 },
    { name: "Kidbrooke Green Meadow", type: "meadow", lon: 0.0290, lat: 51.4540 },
    { name: "Eltham Common Meadow", type: "meadow", lon: 0.0580, lat: 51.4480 },
    { name: "Bostall Heath Meadow", type: "meadow", lon: 0.1010, lat: 51.4770 },
    // Rivers
    { name: "River Quaggy at Lewisham", type: "river", lon: -0.0120, lat: 51.4570 },
    { name: "River Ravensbourne at Catford", type: "river", lon: -0.0230, lat: 51.4400 },
    { name: "River Quaggy at Sutcliffe Park", type: "river", lon: 0.0330, lat: 51.4440 },
    // Woodlands
    { name: "Oxleas Wood", type: "woodland", lon: 0.0680, lat: 51.4660 },
    { name: "Lesnes Abbey Wood", type: "woodland", lon: 0.1230, lat: 51.4860 },
    { name: "Bostall Woods", type: "woodland", lon: 0.1060, lat: 51.4810 },
    { name: "Maryon Wilson Park Wood", type: "woodland", lon: 0.0150, lat: 51.4830 },
    // Verges
    { name: "Shooters Hill Road Verge", type: "verge", lon: 0.0410, lat: 51.4650 },
    { name: "Rochester Way Verge", type: "verge", lon: 0.0530, lat: 51.4530 },
    { name: "Well Hall Road Verge", type: "verge", lon: 0.0500, lat: 51.4560 },
    { name: "Westcombe Hill Verge", type: "verge", lon: 0.0070, lat: 51.4750 },
    { name: "Kidbrooke Park Road Verge", type: "verge", lon: 0.0280, lat: 51.4570 },
  ];

  console.log(`Seeding ${sites.length} sites...`);

  for (const site of sites) {
    await pool.query(
      `INSERT INTO sites (name, type, geometry, source)
       VALUES ($1, $2::site_type, ST_SetSRID(ST_MakePoint($3, $4), 4326), 'seeded')
       ON CONFLICT DO NOTHING`,
      [site.name, site.type, site.lon, site.lat],
    );
  }

  // Create the current month's revenue pool
  const monthKey = new Date().toISOString().slice(0, 7);
  await pool.query(
    `INSERT INTO monthly_revenue_pool (month_key)
     VALUES ($1)
     ON CONFLICT DO NOTHING`,
    [monthKey],
  );

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
