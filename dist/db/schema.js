"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.artists = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.artists = (0, pg_core_1.pgTable)("artists", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    city: (0, pg_core_1.varchar)("city", { length: 255 }).notNull(),
    lat: (0, pg_core_1.real)("lat").notNull(),
    lng: (0, pg_core_1.real)("lng").notNull(),
    genres: (0, pg_core_1.text)("genres").array().notNull(),
    songTitle: (0, pg_core_1.varchar)("song_title", { length: 255 }).notNull(),
    spotifyTrackId: (0, pg_core_1.varchar)("spotify_track_id", { length: 255 }),
    originalImage: (0, pg_core_1.varchar)("original_image", { length: 255 }),
    smallImage: (0, pg_core_1.varchar)("small_image", { length: 255 }),
    youtubeUrl: (0, pg_core_1.varchar)("youtube_url", { length: 255 }),
    instagramUrl: (0, pg_core_1.varchar)("instagram_url", { length: 255 }),
    twitterUrl: (0, pg_core_1.varchar)("twitter_url", { length: 255 }),
    facebookUrl: (0, pg_core_1.varchar)("facebook_url", { length: 255 }),
    youtubeChannelUrl: (0, pg_core_1.varchar)("youtube_channel_url", { length: 255 }),
    tiktokUrl: (0, pg_core_1.varchar)("tiktok_url", { length: 255 }),
    prefecture: (0, pg_core_1.varchar)("prefecture", { length: 255 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
