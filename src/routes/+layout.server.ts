import type { LayoutServerLoad } from './$types';

/** Pass user session to all pages via layout */
export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
