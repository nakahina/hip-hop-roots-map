import { db } from "./index.js";
import { artists } from "./schema.js";
import { artists as artistData } from "../data/artist.js";

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // データを挿入
    const result = await db.insert(artists).values(artistData).returning();

    console.log(`✅ Successfully seeded ${result.length} artists`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

seed();
