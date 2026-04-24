/**
 * Tests for transactional email functions in src/lib/server/email.ts.
 * All tests mock the global fetch and $env/dynamic/private so no real
 * HTTP requests are made and no real API keys are required.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// vi.hoisted runs before vi.mock factories and before module imports.
// We use it to create the mutable env object that the mock factory closes over.
// This avoids the "Cannot access variable before initialization" error that
// occurs when a plain `let` variable is referenced inside a hoisted vi.mock.
// ---------------------------------------------------------------------------
const { mockEnv } = vi.hoisted(() => {
  return { mockEnv: { RESEND_API_KEY: '' } };
});

vi.mock('$env/dynamic/private', () => ({
  env: mockEnv
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import {
  sendWaitlistConfirmation,
  sendPasswordReset,
  sendEmailVerification,
  sendRegistrationWelcome
} from '../email';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Install a global fetch stub that returns a 200 ok and records calls. */
function stubFetchOk() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'OK'
    } as unknown as Response)
  );
}

/** Install a global fetch stub that returns a 400 error response. */
function stubFetchError() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request'
    } as unknown as Response)
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  mockEnv.RESEND_API_KEY = '';
});

// ---------------------------------------------------------------------------
// sendWaitlistConfirmation
// ---------------------------------------------------------------------------

describe('sendWaitlistConfirmation', () => {
  it('returns without throwing when RESEND_API_KEY is not set', async () => {
    mockEnv.RESEND_API_KEY = '';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendWaitlistConfirmation({ to: 'user@example.com', name: 'Alex' })
    ).resolves.toBeUndefined();

    // fetch must NOT have been called — no key, no request
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls Resend API when key is set', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendWaitlistConfirmation({ to: 'user@example.com', name: 'Alex' });

    expect(fetch).toHaveBeenCalledOnce();
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
  });

  it('sends to the correct recipient', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendWaitlistConfirmation({ to: 'waitlister@example.com' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.to).toBe('waitlister@example.com');
  });

  it('includes the brand name in the from address', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendWaitlistConfirmation({ to: 'user@example.com' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.from).toContain('Wrench Club');
    expect(body.from).toMatch(/<[^>]+@[^>]+>/);
  });

  it('does not throw when Resend returns an error response', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchError();

    // Email errors are non-fatal — must not throw
    await expect(
      sendWaitlistConfirmation({ to: 'user@example.com' })
    ).resolves.toBeUndefined();
  });

  it('personalises the greeting using the first name', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendWaitlistConfirmation({ to: 'user@example.com', name: 'Jordan Smith' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    // Greeting should contain first name only
    expect(body.html).toContain('Hey Jordan,');
  });

  it('uses a generic greeting when name is null', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendWaitlistConfirmation({ to: 'user@example.com', name: null });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.html).toContain('Hey,');
  });
});

// ---------------------------------------------------------------------------
// sendPasswordReset
// ---------------------------------------------------------------------------

describe('sendPasswordReset', () => {
  it('returns without throwing when RESEND_API_KEY is not set', async () => {
    mockEnv.RESEND_API_KEY = '';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendPasswordReset({ to: 'user@example.com', resetUrl: 'https://thewrench.club/auth/reset/abc' })
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('includes the reset URL in the email HTML', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    const resetUrl = 'https://thewrench.club/auth/reset/tok_abc123';
    await sendPasswordReset({ to: 'user@example.com', resetUrl });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.html).toContain(resetUrl);
  });

  it('has a clickable link pointing to the reset URL', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    const resetUrl = 'https://thewrench.club/auth/reset/tok_xyz';
    await sendPasswordReset({ to: 'user@example.com', resetUrl });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.html).toContain(`href="${resetUrl}"`);
  });

  it('uses the correct subject line', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendPasswordReset({ to: 'user@example.com', resetUrl: 'https://example.com/reset/t' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.subject).toContain('password');
  });
});

// ---------------------------------------------------------------------------
// sendEmailVerification
// ---------------------------------------------------------------------------

describe('sendEmailVerification', () => {
  it('returns without throwing when RESEND_API_KEY is not set', async () => {
    mockEnv.RESEND_API_KEY = '';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendEmailVerification({
        to: 'user@example.com',
        name: 'Chris',
        verifyUrl: 'https://thewrench.club/auth/verify/tok'
      })
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('includes the verify URL in the HTML body', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    const verifyUrl = 'https://thewrench.club/auth/verify/tok_abc';
    await sendEmailVerification({ to: 'user@example.com', name: 'Chris Lee', verifyUrl });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.html).toContain(verifyUrl);
  });

  it('has an href pointing to the verify URL', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    const verifyUrl = 'https://thewrench.club/auth/verify/tok_xyz';
    await sendEmailVerification({ to: 'user@example.com', name: 'Chris', verifyUrl });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.html).toContain(`href="${verifyUrl}"`);
  });

  it('personalises the heading with the first name', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendEmailVerification({
      to: 'user@example.com',
      name: 'Taylor Swift',
      verifyUrl: 'https://thewrench.club/auth/verify/tok'
    });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    // The heading is "Verify your email, {first}."
    expect(body.html).toContain('Taylor');
    expect(body.html).not.toContain('Taylor Swift'); // only first name used
  });
});

// ---------------------------------------------------------------------------
// sendRegistrationWelcome
// ---------------------------------------------------------------------------

describe('sendRegistrationWelcome', () => {
  it('returns without throwing when RESEND_API_KEY is not set', async () => {
    mockEnv.RESEND_API_KEY = '';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendRegistrationWelcome({ to: 'user@example.com', name: 'Sam' })
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the correct Welcome subject', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendRegistrationWelcome({ to: 'user@example.com', name: 'Sam' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.subject).toContain('Welcome');
  });

  it('uses the first name in the welcome heading', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendRegistrationWelcome({ to: 'user@example.com', name: 'Sam Jones' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.html).toContain('Welcome, Sam');
  });

  it('links to the member dashboard', async () => {
    mockEnv.RESEND_API_KEY = 'test-resend-key';
    stubFetchOk();

    await sendRegistrationWelcome({ to: 'user@example.com', name: 'Sam' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.html).toContain('/app/dashboard');
  });
});
