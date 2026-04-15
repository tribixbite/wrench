import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/** Local auth users — Square Customer ID links to Square's data */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // nanoid
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  /** member | admin | staff */
  role: text('role').notNull().default('member'),
  /** Links to Square Customers API — all business data lives in Square */
  squareCustomerId: text('square_customer_id'),
  /** 1 once the user clicks the verification link */
  emailVerified: integer('email_verified').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`)
});

/** Time-limited tokens for password reset links */
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  /** Unix timestamp — 1 h after creation */
  expiresAt: integer('expires_at').notNull()
});

/** Time-limited tokens for email address verification */
export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: text('id').primaryKey(), // nanoid
  userId: text('user_id').notNull().references(() => users.id),
  /** URL-safe token sent in the verification link */
  token: text('token').notNull().unique(),
  /** Unix timestamp — 24 h after creation */
  expiresAt: integer('expires_at').notNull()
});

/** Lucia v3 session table */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  /** Unix timestamp — Lucia stores/reads as number, not Date */
  expiresAt: integer('expires_at').notNull()
});

/** Pre-launch waitlist — migrates to Square Marketing API at launch */
export const waitlist = sqliteTable('waitlist', {
  id: text('id').primaryKey(), // nanoid
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`)
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type WaitlistEntry = typeof waitlist.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
