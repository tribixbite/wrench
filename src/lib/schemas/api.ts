/**
 * Shared Zod schemas for all Wrench Club API request and response bodies.
 *
 * Pure Zod — no @asteasolutions/zod-to-openapi import here. OpenAPI metadata
 * (descriptions, titles, examples) is added in src/lib/server/openapi.ts
 * after extendZodWithOpenApi() is called. This keeps schemas tree-shakeable
 * and importable in test environments without side effects.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

/** Request body for POST /api/waitlist */
export const WaitlistPostBody = z.object({
  email: z.string().email(),
  name: z.string().max(80).optional()
});

/** Success response for POST /api/waitlist */
export const WaitlistSuccessResponse = z.object({
  message: z.string()
});

/** Error response shared across all endpoints */
export const ErrorResponse = z.object({
  error: z.string()
});

// ---------------------------------------------------------------------------
// Bookings — availability
// ---------------------------------------------------------------------------

/** Request body for POST /api/bookings/availability */
export const AvailabilityPostBody = z.object({
  /** Omit or null to search all bays at once */
  bayNumber: z.number().int().min(1).max(5).optional(),
  variationKey: z.enum(['min90', 'hr3']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

/** A single availability slot (flattened from Square Bookings response) */
export const AvailabilitySlot = z.object({
  startAt: z.string(),
  teamMemberId: z.string(),
  bayNumber: z.number().int(),
  durationMinutes: z.number().int(),
  serviceVariationId: z.string()
});

/** Response for POST /api/bookings/availability */
export const AvailabilityPostResponse = z.object({
  slots: z.array(AvailabilitySlot)
});

// ---------------------------------------------------------------------------
// Bookings — create
// ---------------------------------------------------------------------------

/** Request body for POST /api/bookings/create */
export const BookingCreateBody = z.object({
  bayNumber: z.number().int().min(1).max(5),
  variationKey: z.enum(['min90', 'hr3']),
  startAt: z.string().datetime(),
  note: z.string().max(500).optional()
});

/** Response for POST /api/bookings/create */
export const BookingCreateResponse = z.object({
  bookingId: z.string()
});

// ---------------------------------------------------------------------------
// Bookings — list
// ---------------------------------------------------------------------------

/** A single booking from the list response */
export const BookingItem = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  startAt: z.string().optional(),
  locationId: z.string().optional(),
  customerId: z.string().optional(),
  customerNote: z.string().optional(),
  sellerNote: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  appointmentSegments: z.array(z.object({
    teamMemberId: z.string().optional(),
    durationMinutes: z.number().int(),
    serviceVariationId: z.string().optional()
  })).optional()
});

/** Response for GET /api/bookings/list */
export const BookingListResponse = z.object({
  bookings: z.array(BookingItem),
  error: z.string().optional()
});

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/** A single catalog item variation */
export const CatalogVariation = z.object({
  id: z.string(),
  name: z.string(),
  priceCents: z.number().int(),
  currency: z.string(),
  pricingType: z.string()
});

/** A single Square catalog item */
export const CatalogItem = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  variations: z.array(CatalogVariation)
});

/** Response for GET /api/catalog */
export const CatalogResponse = z.object({
  items: z.array(CatalogItem),
  error: z.string().optional()
});

// ---------------------------------------------------------------------------
// Resend verification
// ---------------------------------------------------------------------------

/** Response for POST /api/resend-verification */
export const ResendVerificationResponse = z.object({
  ok: z.boolean(),
  message: z.string().optional()
});
