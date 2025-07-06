import {
  pgTable,
  serial,
  varchar,
  real,
  text,
  timestamp,
  PgArray,
  date,
  integer,
} from "drizzle-orm/pg-core";

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  genres: text("genres").array().notNull(),
  songTitle: varchar("song_title", { length: 255 }).notNull(),
  spotifyTrackId: varchar("spotify_track_id", { length: 255 }),
  originalImage: varchar("original_image", { length: 255 }),
  smallImage: varchar("small_image", { length: 255 }),
  youtubeUrl: varchar("youtube_url", { length: 255 }),
  instagramUrl: varchar("instagram_url", { length: 255 }),
  twitterUrl: varchar("twitter_url", { length: 255 }),
  facebookUrl: varchar("facebook_url", { length: 255 }),
  youtubeChannelUrl: varchar("youtube_channel_url", { length: 255 }),
  tiktokUrl: varchar("tiktok_url", { length: 255 }),
  prefecture: varchar("prefecture", { length: 255 }).notNull(),
  bioSummary: text("bio_summary"),
  bioUrl: varchar("bio_url", { length: 500 }),
  birthdate: date("birthdate"),
  deathdate: date("deathdate"),
  yearsActiveStart: integer("years_active_start"),
  yearsActiveEnd: integer("years_active_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 型定義
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
