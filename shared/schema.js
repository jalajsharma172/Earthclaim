import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
// Drizzle Table Definitions
export const login = pgTable("login", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    username: text("username").unique(),
    useremail: text("useremail").unique(),
    walletAddress: text("wallet_address").unique(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const userPath = pgTable("userpath", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    username: text("username").references(() => login.username),
    walletAddress: text("wallet_address").references(() => login.walletAddress),
    path: jsonb("path").array().default([]),
});
export const userPolygon = pgTable("userpolygon", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    username: text("username").references(() => login.username),
    walletAddress: text("wallet_address").references(() => login.walletAddress),
    polygon: jsonb("polygon").array().default([]),
});
// Zod Schemas
export const insertLoginSchema = createInsertSchema(login);
export const selectLoginSchema = createInsertSchema(login);
export const insertUserPathSchema = createInsertSchema(userPath);
export const insertUserPolygonSchema = createInsertSchema(userPolygon);
// Zod Schemas
export const loginSchema = z.object({
    useremail: z.string().email("Invalid email format").optional(),
    username: z.string().min(1, "Username is required").optional(),
    walletAddress: z.string().optional(),
}).refine(data => data.username || data.walletAddress, {
    message: "Either username or wallet address is required",
});
export const userpathSchema = z.object({
    username: z.string().min(1, "Username is required").optional(),
    walletAddress: z.string().optional(),
    path: z.array(z.object({
        lat: z.number(),
        lon: z.number()
    })).default([]),
});
export const UserPolygonSchema = z.array(z.object({
    UserName: z.string(),
    IPFS: z.string(),
    Area: z.string()
})).default([]);
