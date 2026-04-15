/**
 * GET /api/docs/openapi.json
 *
 * Serves the machine-readable OpenAPI 3.1 specification.
 * CORS header is included so external tools (Postman, Insomnia, etc.)
 * can import the spec directly from the production URL.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOpenApiSpec } from '$lib/server/openapi';

export const GET: RequestHandler = async () => {
  return json(getOpenApiSpec(), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60'
    }
  });
};
