"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var node_postgres_1 = require("drizzle-orm/node-postgres");
var pg_1 = require("pg");
var schema = require("./schema");
var pool = new pg_1.Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "hinako",
    password: process.env.DB_PASSWORD || "hiphop_map",
    database: process.env.DB_NAME || "hiphop_map",
});
exports.db = (0, node_postgres_1.drizzle)(pool, { schema: schema });
