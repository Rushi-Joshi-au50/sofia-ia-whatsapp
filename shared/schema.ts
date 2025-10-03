import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table for authentication (base schema - keeping this)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Logs table to store application logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  level: text("level").notNull().default("info"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertLogSchema = createInsertSchema(logs).pick({
  message: true,
  level: true,
});

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

// Message table to store sent messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  recipient: text("recipient").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("sent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  recipient: true,
  content: true,
  status: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Contacts table to store marketing contacts
export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  phoneNumber: text("phoneNumber").notNull(),
  name: text("name"),
  status: text("status").notNull().default("pending"),
  lastMessage: text("lastMessage"),
  lastContact: timestamp("lastContact"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  phoneNumber: true,
  name: true,
  status: true,
  notes: true,
});

export const statusValues = ["pending", "contacted", "responded", "scheduled", "completed"] as const;
export const contactStatusSchema = z.enum(statusValues);

export type ContactStatus = z.infer<typeof contactStatusSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
