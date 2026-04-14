// See https://svelte.dev/docs/kit/types#app.d.ts for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string;
        name: string;
        role: 'member' | 'admin' | 'staff';
        squareCustomerId: string | null;
      } | null;
      session: import('lucia').Session | null;
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
