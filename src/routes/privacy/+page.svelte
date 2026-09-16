<script lang="ts">
  import SEO from '$lib/components/layout/SEO.svelte';
</script>

<SEO
  title="Privacy Policy"
  description="How Wrench Club collects, uses, and protects your personal information."
/>

<div class="page-header">
  <div class="container mx-auto px-6">
    <p class="overline">Legal</p>
    <h1 class="page-title font-display">Privacy Policy</h1>
    <p class="page-sub">
      Plain English. No legalese. Here's exactly what we collect, why, and how to get it removed.
    </p>
    <p class="effective-date">Effective August 25, 2026</p>
  </div>
</div>

<div class="content-wrap">
  <div class="container mx-auto px-6">
    <div class="doc">

      <section class="doc-section">
        <h2>Who We Are</h2>
        <p>
          Wrench Club, LLC is a membership-based DIY auto shop located at
          522 Stocking Ave NW, Grand Rapids, MI 49504. This policy covers
          the website at <strong>thewrench.club</strong> and the member portal
          accessed through it.
        </p>
        <p>
          Questions? Email us at
          <a href="mailto:info@thewrench.club">info@thewrench.club</a>.
        </p>
      </section>

      <section class="doc-section">
        <h2>What We Collect</h2>

        <h3>Account information</h3>
        <p>
          When you create an account we collect your first name, last name, and
          email address. Your password is hashed with Argon2id before being
          stored — we never store or see your plain-text password.
        </p>

        <h3>Vehicle information</h3>
        <p>
          You can optionally add vehicles to your profile (year, make, model,
          notes). This is voluntary and used only to personalize your
          experience.
        </p>

        <h3>Payment information</h3>
        <p>
          Membership billing is handled entirely by
          <strong>Square</strong> (squareup.com). When you enter your card
          details, that information goes directly to Square's PCI-compliant
          servers — Wrench Club never sees, stores, or transmits your raw card
          number. We store a Square Customer ID and a card-on-file token that
          Square issues us; these reference your payment method without
          containing it.
        </p>

        <h3>Waitlist</h3>
        <p>
          If you sign up for the waitlist before creating an account, we store
          only your email address.
        </p>
      </section>

      <section class="doc-section">
        <h2>Cookies</h2>
        <p>
          We set one cookie to keep you logged in during your session. It is
          deleted when you log out or your session expires.
        </p>
        <p>
          This is a strictly necessary cookie — it is not used for tracking and
          does not require your consent.
        </p>
      </section>

      <section class="doc-section">
        <h2>Analytics</h2>
        <p>
          We use <strong>Umami</strong>, a privacy-first analytics tool that
          collects no cookies and stores no personally identifiable information.
          It counts page views and general traffic patterns using an anonymized
          daily hash — not a persistent identifier. It honors your browser's
          Do Not Track signal.
        </p>
        <p>
          We do not use Google Analytics, Meta Pixel, or any advertising or
          retargeting trackers.
        </p>
      </section>

      <section class="doc-section">
        <h2>Email</h2>
        <p>
          Transactional emails (account verification, welcome message, password
          reset) are sent via <strong>Resend</strong> (resend.com). We send
          these emails because they're necessary for your account to function.
          We do not send marketing emails without your explicit opt-in, and we
          do not sell your email address to third parties.
        </p>
      </section>

      <section class="doc-section">
        <h2>How We Use Your Information</h2>
        <ul>
          <li>To create and maintain your Wrench Club account</li>
          <li>To process membership billing through Square</li>
          <li>To manage your bay reservations</li>
          <li>To send you account-related emails (verification, receipts, booking confirmations)</li>
          <li>To display your upcoming reservations and membership status in the member portal</li>
          <li>To improve the site using aggregated, anonymized analytics</li>
        </ul>
        <p>We do not sell your information. We do not use it for advertising.</p>
      </section>

      <section class="doc-section">
        <h2>Third-Party Services</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Purpose</th>
                <th>Data shared</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Square</td>
                <td>Payment processing, membership billing, bay booking</td>
                <td>Name, email, payment method (direct from your browser)</td>
              </tr>
              <tr>
                <td>Resend</td>
                <td>Transactional email delivery</td>
                <td>Name, email address</td>
              </tr>
              <tr>
                <td>Umami</td>
                <td>Privacy-first analytics</td>
                <td>Anonymized page views only — no PII</td>
              </tr>
              <tr>
                <td>Railway</td>
                <td>Hosting and infrastructure</td>
                <td>Encrypted database on Railway's servers</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="doc-section">
        <h2>Data Retention</h2>
        <p>
          Your account data is kept for as long as your account is active.
          Session tokens expire automatically (typically within 30 days of
          inactivity). Waitlist entries are kept until we migrate them to our
          mailing list or you ask us to remove your email.
        </p>
        <p>
          If you delete your account, we remove your name, email, password
          hash, and vehicle records from our database. Your Square customer
          record may persist in Square's system per their data retention policy.
        </p>
      </section>

      <section class="doc-section">
        <h2>Your Rights</h2>
        <p>You can:</p>
        <ul>
          <li>Update your name, email, and password at any time from your <a href="/app/profile">profile page</a></li>
          <li>Add or remove vehicles from your profile</li>
          <li>Cancel your membership at any time from your profile page</li>
          <li>Request a copy of the personal data we hold about you</li>
          <li>Request that we delete your account and associated data</li>
        </ul>
        <p>
          To request data access or deletion, email
          <a href="mailto:info@thewrench.club">info@thewrench.club</a> from the
          address on your account. We'll respond within 5 business days.
        </p>
      </section>

      <section class="doc-section">
        <h2>Children's Privacy</h2>
        <p>
          Wrench Club is intended for adults 18 and older. We do not knowingly
          collect personal information from anyone under 18. If you believe a
          minor has created an account, contact us and we'll remove it.
        </p>
      </section>

      <section class="doc-section">
        <h2>Changes to This Policy</h2>
        <p>
          If we make material changes to this policy, we'll notify you by email
          at least 7 days before they take effect. The effective date at the top
          of this page is always the date of the most recent version.
        </p>
      </section>

      <section class="doc-section">
        <h2>Contact</h2>
        <p>
          Wrench Club, LLC<br />
          522 Stocking Ave NW<br />
          Grand Rapids, MI 49504<br />
          <a href="mailto:info@thewrench.club">info@thewrench.club</a>
        </p>
      </section>

    </div>
  </div>
</div>

<style>
  .page-header {
    padding-top: 8rem;
    padding-bottom: 4rem;
    border-bottom: 1px solid var(--border);
  }

  .overline {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1rem;
  }

  .page-title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 1.25rem;
  }

  .page-sub {
    font-size: 1.125rem;
    color: var(--text-secondary);
    max-width: 540px;
    line-height: 1.6;
    margin-bottom: 0.75rem;
  }

  .effective-date {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  .content-wrap {
    padding: 4rem 0 6rem;
  }

  .doc {
    max-width: 720px;
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .doc-section h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  .doc-section h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 1.25rem 0 0.5rem;
  }

  .doc-section p {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.75;
    margin-bottom: 0.875rem;
  }

  .doc-section p:last-child {
    margin-bottom: 0;
  }

  .doc-section ul {
    list-style: disc;
    padding-left: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-bottom: 0.875rem;
  }

  .doc-section li {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .doc-section a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .doc-section strong {
    color: var(--text-primary);
    font-weight: 600;
  }

  .table-wrap {
    overflow-x: auto;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th {
    text-align: left;
    padding: 0.75rem 1rem;
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-weight: 600;
    border-bottom: 1px solid var(--border);
  }

  td {
    padding: 0.75rem 1rem;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
  }
</style>
