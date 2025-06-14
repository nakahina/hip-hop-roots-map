import { db } from "./index";
import { artists } from "./schema";
import { eq, and, sql } from "drizzle-orm";

export async function getAllArtists() {
  return db.select().from(artists);
}

export async function getArtistsByPrefecture(prefecture: string) {
  return db.select().from(artists).where(eq(artists.prefecture, prefecture));
}

export async function getArtistsByLocation(
  lat: number,
  lng: number,
  radius: number
) {
  // 位置情報に基づく検索の実装
  // 注: 実際の実装では、PostGISの機能を使用する必要があります
  return db
    .select()
    .from(artists)
    .where(
      sql`earth_distance(ll_to_earth(${lat}, ${lng}), ll_to_earth(${artists.lat}, ${artists.lng})) <= ${radius}`
    );
}

export async function getArtistsWithLocation() {
  return db
    .select()
    .from(artists)
    .where(
      and(
        sql`${artists.lat} IS NOT NULL`,
        sql`${artists.lng} IS NOT NULL`,
        sql`NOT (${artists.lat} = 0 AND ${artists.lng} = 0)`
      )
    );
}

export async function createArtist(artist: typeof artists.$inferInsert) {
  return db.insert(artists).values(artist).returning();
}

export async function updateArtist(
  id: number,
  artist: Partial<typeof artists.$inferInsert>
) {
  return db.update(artists).set(artist).where(eq(artists.id, id)).returning();
}

export async function deleteArtist(id: number) {
  return db.delete(artists).where(eq(artists.id, id)).returning();
}
