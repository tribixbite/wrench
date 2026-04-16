/**
 * OpenAPI 3.1 spec generator for the Wrench Club API.
 *
 * Calls extendZodWithOpenApi here (not in schemas/api.ts) so that pure Zod
 * schemas remain importable in test environments without side effects.
 * The .openapi() metadata extension is applied at registration time below.
 *
 * Exposed as a cached singleton via getOpenApiSpec() — safe to call on every
 * request since the result is memoized after the first call.
 */
import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod's ZodType prototype with .openapi() — must run before any
// .openapi() calls below. Safe to call multiple times (idempotent).
extendZodWithOpenApi(z);

import {
  WaitlistPostBody,
  WaitlistSuccessResponse,
  ErrorResponse,
  AvailabilityPostBody,
  AvailabilityPostResponse,
  BookingCreateBody,
  BookingCreateResponse,
  BookingListResponse,
  CatalogResponse,
  ResendVerificationResponse
} from '$lib/schemas/api';

const registry = new OpenAPIRegistry();

// ---------------------------------------------------------------------------
// Security schemes
// ---------------------------------------------------------------------------

/** Cookie-based session auth used by authenticated routes */
const cookieAuth = registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'auth_session',
  description: 'Lucia session cookie — obtained via POST /auth/login'
});

// ---------------------------------------------------------------------------
// Register schemas as reusable components (with OpenAPI titles + descriptions)
// ---------------------------------------------------------------------------

registry.register('WaitlistPostBody', WaitlistPostBody.openapi({
  title: 'WaitlistPostBody',
  description: 'Request body for joining the waitlist'
}));
registry.register('WaitlistSuccessResponse', WaitlistSuccessResponse.openapi({
  title: 'WaitlistSuccessResponse'
}));
registry.register('ErrorResponse', ErrorResponse.openapi({
  title: 'ErrorResponse',
  description: 'Human-readable error returned on 4xx/5xx responses'
}));
registry.register('AvailabilityPostBody', AvailabilityPostBody.openapi({
  title: 'AvailabilityPostBody',
  description: 'Request body for bay availability search'
}));
registry.register('AvailabilityPostResponse', AvailabilityPostResponse.openapi({
  title: 'AvailabilityPostResponse'
}));
registry.register('BookingCreateBody', BookingCreateBody.openapi({
  title: 'BookingCreateBody',
  description: 'Request body for creating a bay reservation'
}));
registry.register('BookingCreateResponse', BookingCreateResponse.openapi({
  title: 'BookingCreateResponse'
}));
registry.register('BookingListResponse', BookingListResponse.openapi({
  title: 'BookingListResponse'
}));
registry.register('CatalogResponse', CatalogResponse.openapi({
  title: 'CatalogResponse'
}));
registry.register('ResendVerificationResponse', ResendVerificationResponse.openapi({
  title: 'ResendVerificationResponse'
}));

// ---------------------------------------------------------------------------
// POST /api/waitlist
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/waitlist',
  summary: 'Join the waitlist',
  description:
    'Adds an email address to the Wrench Club waitlist. Sends a confirmation email via Resend if RESEND_API_KEY is configured. Idempotent — re-submitting an existing email returns 200 instead of 201.',
  tags: ['Waitlist'],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: WaitlistPostBody } }
    }
  },
  responses: {
    201: {
      description: 'Successfully added to the waitlist',
      content: { 'application/json': { schema: WaitlistSuccessResponse } }
    },
    200: {
      description: 'Email already on waitlist',
      content: { 'application/json': { schema: WaitlistSuccessResponse } }
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponse } }
    }
  }
});

// ---------------------------------------------------------------------------
// POST /api/bookings/availability
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/bookings/availability',
  summary: 'Search bay availability',
  description:
    'Queries Square Bookings for available time slots on a specific bay and date. Returns all open slots from 00:00–23:59 UTC for the requested date.',
  tags: ['Bookings'],
  security: [{ [cookieAuth.name]: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: AvailabilityPostBody } }
    }
  },
  responses: {
    200: {
      description: 'Available time slots',
      content: { 'application/json': { schema: AvailabilityPostResponse } }
    },
    400: {
      description: 'Invalid bay number, variation key, or date format',
      content: { 'application/json': { schema: ErrorResponse } }
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: ErrorResponse } }
    },
    502: {
      description: 'Square API error',
      content: { 'application/json': { schema: ErrorResponse } }
    }
  }
});

// ---------------------------------------------------------------------------
// POST /api/bookings/create
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/bookings/create',
  summary: 'Create a bay booking',
  description:
    'Creates a Square booking for the authenticated user. Requires a Square customer ID on the user record (set at registration). Returns the Square booking ID on success.',
  tags: ['Bookings'],
  security: [{ [cookieAuth.name]: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: BookingCreateBody } }
    }
  },
  responses: {
    200: {
      description: 'Booking created successfully',
      content: { 'application/json': { schema: BookingCreateResponse } }
    },
    400: {
      description: 'Invalid input or missing Square customer ID',
      content: { 'application/json': { schema: ErrorResponse } }
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: ErrorResponse } }
    },
    502: {
      description: 'Square API error',
      content: { 'application/json': { schema: ErrorResponse } }
    }
  }
});

// ---------------------------------------------------------------------------
// GET /api/bookings/list
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/bookings/list',
  summary: 'List upcoming bookings',
  description:
    "Returns all non-cancelled upcoming bookings for the authenticated user's Square customer account, sorted by start time ascending.",
  tags: ['Bookings'],
  security: [{ [cookieAuth.name]: [] }],
  responses: {
    200: {
      description: 'List of bookings (may be empty if no Square customer ID on file)',
      content: { 'application/json': { schema: BookingListResponse } }
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: ErrorResponse } }
    }
  }
});

// ---------------------------------------------------------------------------
// GET /api/catalog
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/catalog',
  summary: 'Fetch catalog items',
  description:
    'Returns Square catalog items (membership tiers, bay bookings, add-ons) with pricing. Uses catalog.list() for the API endpoint; store page uses catalog.search() for broader coverage. Cached for 5 minutes via Cache-Control.',
  tags: ['Catalog'],
  responses: {
    200: {
      description: 'Catalog items with variations and pricing',
      content: { 'application/json': { schema: CatalogResponse } }
    }
  }
});

// ---------------------------------------------------------------------------
// POST /api/resend-verification
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/resend-verification',
  summary: 'Resend email verification',
  description:
    'Generates a fresh 24-hour email verification token and sends a verification email. Replaces any existing token. Returns immediately if the account is already verified.',
  tags: ['Auth'],
  security: [{ [cookieAuth.name]: [] }],
  responses: {
    200: {
      description: 'Verification email sent (or already verified)',
      content: { 'application/json': { schema: ResendVerificationResponse } }
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: ErrorResponse } }
    }
  }
});

// ---------------------------------------------------------------------------
// Spec generator — memoized singleton
// ---------------------------------------------------------------------------

let _cachedSpec: ReturnType<OpenApiGeneratorV31['generateDocument']> | null = null;

/**
 * Generates and returns the OpenAPI 3.1 document as a plain JavaScript object.
 * Memoized — the registry is built once at module load time, so this is safe
 * to call on every request without performance overhead.
 */
export function getOpenApiSpec() {
  if (_cachedSpec) return _cachedSpec;

  const generator = new OpenApiGeneratorV31(registry.definitions);

  _cachedSpec = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Wrench Club API',
      version: '1.0.0',
      description:
        'Internal API for the Wrench Club member portal. Handles waitlist signup, Square catalog queries, and bay reservation booking flows. All Square calls are server-side — no API keys are exposed to clients.',
      contact: {
        name: 'Wrench Club',
        email: 'info@thewrench.club',
        url: 'https://thewrench.club'
      }
    },
    servers: [
      { url: 'https://thewrench.club', description: 'Production' },
      { url: 'http://localhost:5173', description: 'Local dev' }
    ]
  });

  return _cachedSpec;
}
