import { z } from "zod";

// Note collaborator schema
export const collaboratorSchema = z.object({
  email: z.string().email(),
  uid: z.string().optional(),
  permission: z.enum(["viewer", "editor"]),
  addedAt: z.number(),
});

export type Collaborator = z.infer<typeof collaboratorSchema>;

// Note schema for Firestore
export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  owner: z.string(), // uid
  ownerEmail: z.string().email(),
  ownerName: z.string().optional(),
  collaborators: z.array(collaboratorSchema).default([]),
  pinned: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Note = z.infer<typeof noteSchema>;

// Insert schema for creating notes
export const insertNoteSchema = noteSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type InsertNote = z.infer<typeof insertNoteSchema>;

// Update schema for editing notes
export const updateNoteSchema = noteSchema.partial().omit({ id: true });

export type UpdateNote = z.infer<typeof updateNoteSchema>;

// Share link permission types
export type SharePermission = "viewer" | "editor";

// User profile schema (optional storage in Firestore)
export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  createdAt: z.number(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Legacy exports for compatibility
import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
