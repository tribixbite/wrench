#!/usr/bin/env bun
/**
 * Make the 6 production bay team members bookable.
 *
 * Requirement Square enforces: a team member is "enabled for booking" only
 * when it has a job assignment + email address. Once enabled, we can PUT a
 * team_member_booking_profile to flip is_bookable=true.
 *
 *   1. Create (or find) a "Bay Resource" job
 *   2. PUT each team member with email + wage_setting.job_assignments[]
 *   3. PUT each team_member_booking_profile with is_bookable=true
 */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const isProduction = process.env.SQUARE_ENVIRONMENT !== 'sandbox';
const token = isProduction ? process.env.PROD_ACCESS_TOKEN : process.env.SANDBOX_SECRET;
const apiBase = isProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

if (!token) { console.error('Missing token.'); process.exit(1); }

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Square-Version': '2025-01-23'
};

async function api(method: string, path: string, body?: unknown) {
  const r = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  return { status: r.status, ok: r.ok, data, text };
}

const summary = JSON.parse(await readFile('scripts/square-bookings.json', 'utf8'));
const bays = [
  { ref: 'bay-h1', given: 'Hoist Bay',  family: '1', email: 'bay-h1@thewrench.club' },
  { ref: 'bay-h2', given: 'Hoist Bay',  family: '2', email: 'bay-h2@thewrench.club' },
  { ref: 'bay-f1', given: 'Flat Bay',   family: '1', email: 'bay-f1@thewrench.club' },
  { ref: 'bay-f2', given: 'Flat Bay',   family: '2', email: 'bay-f2@thewrench.club' },
  { ref: 'bay-f3', given: 'Flat Bay',   family: '3', email: 'bay-f3@thewrench.club' },
  { ref: 'bay-d1', given: 'Detail Bay', family: '1', email: 'bay-d1@thewrench.club' }
];

console.log(`\n=== Enable bay bookings — ${isProduction ? 'PRODUCTION' : 'SANDBOX'} ===\n`);

// 1. Find or create "Bay Resource" job
console.log('1. Locating / creating "Bay Resource" job …');
const jobsRes = await api('GET', '/v2/team-members/jobs');
let bayJob = jobsRes.data?.jobs?.find((j: any) => j.title === 'Bay Resource');
if (!bayJob) {
  const create = await api('POST', '/v2/team-members/jobs', {
    idempotency_key: randomUUID(),
    job: { title: 'Bay Resource', is_tip_eligible: false }
  });
  if (!create.ok) { console.error('Job create failed:', create.text); process.exit(1); }
  bayJob = create.data?.job;
  console.log(`   created: ${bayJob.id}`);
} else {
  console.log(`   existing: ${bayJob.id}`);
}

// 2. Update each team member with email + job assignment
console.log('\n2. Patching team members with email + job assignment …');
for (const bay of bays) {
  const tmId = summary.teamMemberIds[bay.ref];
  if (!tmId) { console.warn(`   skip ${bay.ref}: no id in summary`); continue; }

  const upd = await api('PUT', `/v2/team-members/${tmId}`, {
    team_member: {
      given_name: bay.given,
      family_name: bay.family,
      email_address: bay.email,
      reference_id: bay.ref,
      status: 'ACTIVE',
      assigned_locations: {
        assignment_type: 'EXPLICIT_LOCATIONS',
        location_ids: [summary.locationId]
      },
      wage_setting: {
        job_assignments: [{ job_id: bayJob.id, pay_type: 'NONE' }],
        is_overtime_exempt: false
      }
    }
  });
  console.log(`   ${bay.ref} (${tmId}) → ${upd.ok ? 'OK' : 'FAIL ' + upd.status + ' ' + upd.text.slice(0, 200)}`);
}

// 3. Enable booking profile for each
console.log('\n3. Enabling team_member_booking_profile.is_bookable=true …');
for (const bay of bays) {
  const tmId = summary.teamMemberIds[bay.ref];
  if (!tmId) continue;
  const displayName = `${bay.given} ${bay.family}`;
  const r = await api('PUT', `/v2/bookings/team-member-booking-profiles/${tmId}`, {
    team_member_booking_profile: { is_bookable: true, display_name: displayName }
  });
  console.log(`   ${bay.ref} → ${r.ok ? '✓ bookable' : '✗ ' + r.status + ' ' + r.text.slice(0, 200)}`);
}

// 4. Verify
console.log('\n4. Verifying booking profiles …');
const list = await api('GET', '/v2/bookings/team-member-booking-profiles');
const profiles = list.data?.team_member_booking_profiles ?? [];
const bayIds = new Set(Object.values(summary.teamMemberIds));
for (const p of profiles) {
  if (bayIds.has(p.team_member_id)) {
    console.log(`   • ${p.display_name} (${p.team_member_id}) — bookable: ${p.is_bookable}`);
  }
}

console.log('\nDone.\n');
