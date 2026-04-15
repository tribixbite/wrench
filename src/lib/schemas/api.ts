/**
 * Shared Zod schemas for all Wrench Club API request and response bodies.
 * These schemas serve dual purpose: runtime validation via safeParse() in
 * route handlers, and static OpenAPI documentation via zod-to-openapi.
 *
 * Import order matters: extendZodWithOpenApi must be called before any
 * schema definitions so that .openapi() is available on all Zod types.
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

/** Request body for POST /api/waitlist */
export const WaitlistPostBody = z
  .object({
    email: z.string().email().openapi({
      description: 'Email address to add to the waitlist',
      example: 'driver@example.com'
    }),
    name: z.string().max(80).optional().openapi({
      description: 'Optional full name (max 80 characters)',
      example: 'Alex Smith'
    })
  })
  .openapi({ title: 'WaitlistPostBody' });

/** Success response for POST /api/waitlist */
export const WaitlistSuccessResponse = z
  .object({
    message: z.string().openapi({
      description: 'Human-readable confirmation message',
      example: "You're on the list! We'll reach out when Wrench Club opens in 2026."
    })
  })
  .openapi({ title: 'WaitlistSuccessResponse' });

/** Error response shared across all endpoints */
export const ErrorResponse = z
  .object({
    error: z.string().openapi({
      description: 'Human-readable error message',
      example: 'Please enter a valid email address.'
    })
  })
  .openapi({ title: 'ErrorResponse' });

// ---------------------------------------------------------------------------
// Bookings — availability
// ---------------------------------------------------------------------------

/** Request body for POST /api/bookings/availability */
export const AvailabilityPostBody = z
  .object({
    bayNumber: z.number().int().min(1).max(5).openapi({
      description: 'Bay number (1–5)',
      example: 2
    }),
    variationKey: z.enum(['min90', 'hr3']).openapi({
      description: '"min90" = 90-minute block ($40), "hr3" = 3-hour block ($60)',
      example: 'min90'
    }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).openapi({
      description: 'ISO date string (YYYY-MM-DD)',
      example: '2026-06-15'
    })
  })
  .openapi({ title: 'AvailabilityPostBody' });

/** A single availability slot returned by Square */
export const AvailabilitySlot = z
  .object({
    startAt: z.string().openapi({
      description: 'Slot start time in ISO 8601 format',
      example: '2026-06-15T10:00:00Z'
    }),
    appointmentSegments: z.array(z.unknown()).openapi({
      description: 'Raw Square appointment segments'
    })
  })
  .openapi({ title: 'AvailabilitySlot' });

/** Response for POST /api/bookings/availability */
export const AvailabilityPostResponse = z
  .object({
    slots: z.array(AvailabilitySlot).openapi({
      description: 'Available time slots for the requested bay and date'
    })
  })
  .openapi({ title: 'AvailabilityPostResponse' });

// ---------------------------------------------------------------------------
// Bookings — create
// ---------------------------------------------------------------------------

/** Request body for POST /api/bookings/create */
export const BookingCreateBody = z
  .object({
    bayNumber: z.number().int().min(1).max(5).openapi({
      description: 'Bay number (1–5)',
      example: 1
    }),
    variationKey: z.enum(['min90', 'hr3']).openapi({
      description: '"min90" = 90-minute block ($40), "hr3" = 3-hour block ($60)',
      example: 'hr3'
    }),
    startAt: z.string().datetime().openapi({
      description: 'Booking start time (full ISO 8601 with offset)',
      example: '2026-06-15T10:00:00Z'
    }),
    note: z.string().max(500).optional().openapi({
      description: 'Optional note for the booking (max 500 characters)',
      example: 'Bringing a 2019 BMW M3 — will need the alignment rack'
    })
  })
  .openapi({ title: 'BookingCreateBody' });

/** Response for POST /api/bookings/create */
export const BookingCreateResponse = z
  .object({
    bookingId: z.string().openapi({
      description: 'Square booking ID for the created reservation',
      example: 'TStzTcbTHlqXJAVUHQm8vcOA'
    })
  })
  .openapi({ title: 'BookingCreateResponse' });

// ---------------------------------------------------------------------------
// Bookings — list
// ---------------------------------------------------------------------------

/** Response for GET /api/bookings/list */
export const BookingListResponse = z
  .object({
    bookings: z.array(z.unknown()).openapi({
      description: 'Upcoming Square bookings for the authenticated user'
    }),
    error: z.string().optional().openapi({
      description: 'Non-fatal error message when Square API returned an error but empty list is still returned'
    })
  })
  .openapi({ title: 'BookingListResponse' });

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/** A single catalog item variation */
export const CatalogVariation = z
  .object({
    id: z.string(),
    name: z.string(),
    priceCents: z.number().int(),
    currency: z.string(),
    pricingType: z.string()
  })
  .openapi({ title: 'CatalogVariation' });

/** A single Square catalog item */
export const CatalogItem = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    variations: z.array(CatalogVariation)
  })
  .openapi({ title: 'CatalogItem' });

/** Response for GET /api/catalog */
export const CatalogResponse = z
  .object({
    items: z.array(CatalogItem).openapi({
      description: 'Square catalog items (membership tiers, add-ons, etc.)'
    }),
    error: z.string().optional().openapi({
      description: 'Error message when catalog is unavailable'
    })
  })
  .openapi({ title: 'CatalogResponse' });

// ---------------------------------------------------------------------------
// Resend verification
// ---------------------------------------------------------------------------

/** Response for POST /api/resend-verification */
export const ResendVerificationResponse = z
  .object({
    ok: z.boolean(),
    message: z.string().optional().openapi({
      description: 'Optional status message (e.g. "Already verified")'
    })
  })
  .openapi({ title: 'ResendVerificationResponse' });
