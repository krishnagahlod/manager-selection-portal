// Import candidates from Manager Responses CSV into Supabase
// Run with: node scripts/import-candidates.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env vars from .env.local
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = 'SusCell@2026';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Simple CSV parser handling quoted multi-line fields
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') {}
      else field += c;
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Map a CSV vertical string to enum values
const VERTICAL_MAP = {
  'projects & policies': 'projects_policies',
  'events & operations': 'events_operations',
  'web & design': 'web_design',
};

function parseVerticals(str) {
  return (str || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .map((v) => VERTICAL_MAP[v])
    .filter(Boolean);
}

// Parse "Chemical, 2nd year" → { department: 'Chemical', year: 2 }
function parseDeptYear(str) {
  const s = (str || '').trim();
  const yearMatch = s.match(/(\d+)\s*(st|nd|rd|th)?\s*year/i);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  const dept = s.split(/,/)[0]?.trim() || null;
  return { department: dept, year_of_study: year };
}

async function importCandidates() {
  const csvPath = path.join(__dirname, '..', 'Manager Responses - Sheet1.csv');
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csv);
  const headers = rows[0];
  const data = rows.slice(1).filter((r) => r[0] && r[0].trim());

  console.log(`Importing ${data.length} candidates...\n`);

  const results = { created: 0, updated: 0, failed: 0, errors: [] };

  for (const row of data) {
    const name = row[0]?.trim();
    const rollNumber = row[1]?.trim();
    const contact = row[2]?.trim();
    const ldapEmail = row[3]?.trim().toLowerCase();
    const personalEmail = row[4]?.trim();
    const deptYearStr = row[5]?.trim();
    const verticalStr = row[6]?.trim();
    const sop = row[7]?.trim();
    const initiatives = row[8]?.trim();
    const hostel = row[9]?.trim();
    const cpi = row[10]?.trim();

    if (!ldapEmail || !ldapEmail.includes('@')) {
      console.log(`SKIP  ${name} — invalid LDAP email`);
      results.failed++;
      continue;
    }

    const { department, year_of_study } = parseDeptYear(deptYearStr);
    const verticals = parseVerticals(verticalStr);

    const form_responses = {
      roll_number: rollNumber || '',
      personal_email: personalEmail || '',
      hostel_number: hostel || '',
      cpi: cpi || '',
      statement_of_purpose: sop || '',
      liked_initiatives: initiatives || '',
    };

    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = existingUsers?.users?.find((u) => u.email === ldapEmail);

      let userId;
      let action;

      if (existing) {
        userId = existing.id;
        action = 'UPDATE';
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: ldapEmail,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          app_metadata: { role: 'candidate' },
        });
        if (createError) throw createError;
        userId = newUser.user.id;
        action = 'CREATE';
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          phone: contact || null,
          department,
          year_of_study,
          form_responses,
          role: 'candidate',
        })
        .eq('id', userId);
      if (profileError) throw profileError;

      // Clear and re-insert verticals
      await supabase.from('candidate_verticals').delete().eq('candidate_id', userId);
      if (verticals.length > 0) {
        const { error: vError } = await supabase
          .from('candidate_verticals')
          .insert(verticals.map((v) => ({ candidate_id: userId, vertical: v })));
        if (vError) throw vError;
      }

      console.log(`${action}  ${name.padEnd(30)} ${ldapEmail.padEnd(25)} [${verticals.join(', ')}]`);
      if (action === 'CREATE') results.created++;
      else results.updated++;
    } catch (err) {
      console.error(`FAIL  ${name} — ${err.message}`);
      results.failed++;
      results.errors.push({ name, email: ldapEmail, error: err.message });
    }
  }

  console.log('\n========== Summary ==========');
  console.log(`Created: ${results.created}`);
  console.log(`Updated: ${results.updated}`);
  console.log(`Failed:  ${results.failed}`);
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((e) => console.log(`  - ${e.name} (${e.email}): ${e.error}`));
  }
  console.log(`\nDefault password for all new accounts: ${DEFAULT_PASSWORD}`);
}

importCandidates().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
