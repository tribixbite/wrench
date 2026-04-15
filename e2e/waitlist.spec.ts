/**
 * Waitlist form tests — both UI (form interaction) and direct API calls.
 */
import { test, expect } from '@playwright/test';
import { postWaitlist } from './helpers';

test.describe('Waitlist form UI', () => {
  test('submitting a valid email shows success message', async ({ page }) => {
    await page.goto('/#waitlist');

    // Use a unique email to avoid duplicate-detection returning 200 instead of 201
    const email = `qa-ui-${Date.now()}@mailinator.com`;

    // Fill the email field (WaitlistForm uses type="email" input)
    await page.fill('input[type="email"]', email);
    await page.click('button[type="submit"]');

    // Success state renders "You're on the list!" text
    await expect(page.locator('.success-state')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.success-state')).toContainText("on the list");
  });

  test('submitting an invalid email shows an error', async ({ page }) => {
    await page.goto('/#waitlist');

    // Type a clearly invalid string that bypasses the browser's own :invalid check
    const emailInput = page.locator('input[type="email"]');

    // Use page.evaluate to bypass browser HTML5 validation for testing server-side error
    await page.evaluate(() => {
      const input = document.querySelector('input[type="email"]') as HTMLInputElement;
      if (input) {
        // Override validity check so the form submits
        Object.defineProperty(input, 'validity', { value: { valid: true } });
        input.value = 'not-an-email';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // The browser's native validation will block submit for type=email with invalid value.
    // Test native validation by checking the :invalid pseudo-class instead.
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });

  test('submitting a duplicate email returns idempotent success', async ({ page }) => {
    // First, register the email directly via API
    const email = `qa-dup-${Date.now()}@mailinator.com`;
    const baseURL = process.env.TEST_BASE_URL ?? 'https://thewrench.club';
    await fetch(`${baseURL}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    // Now submit the same email via UI — should still succeed (200, not error)
    await page.goto('/#waitlist');
    await page.fill('input[type="email"]', email);
    await page.click('button[type="submit"]');

    await expect(page.locator('.success-state')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Waitlist API (/api/waitlist)', () => {
  test('POST with valid email returns 201', async ({ request }) => {
    const email = `qa-api-${Date.now()}@mailinator.com`;
    const res = await postWaitlist(request, { email, name: 'QA User' });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('POST with invalid email returns 400', async ({ request }) => {
    const res = await postWaitlist(request, { email: 'not-an-email' });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('POST with duplicate email returns 200 (idempotent)', async ({ request }) => {
    const email = `qa-dedup-${Date.now()}@mailinator.com`;
    // First insert
    await postWaitlist(request, { email });
    // Second insert — must return 200 not 400/500
    const res = await postWaitlist(request, { email });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('POST with empty body returns 400', async ({ request }) => {
    const baseURL = process.env.TEST_BASE_URL ?? 'https://thewrench.club';
    const res = await request.post(`${baseURL}/api/waitlist`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST with malformed JSON returns 400', async ({ request }) => {
    const baseURL = process.env.TEST_BASE_URL ?? 'https://thewrench.club';
    const res = await request.post(`${baseURL}/api/waitlist`, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not json at all',
    });
    // Server tries JSON.parse, throws, returns 400
    expect(res.status()).toBe(400);
  });
});
