/* ===========================================================================
   Visitor tracking configuration
   ===========================================================================

   Tracking is OFF until you fill in the two Supabase values below. While they
   are empty the tracker stays completely silent and the dashboard shows demo
   data, so you can review the design before wiring anything up.

   Supabase is a free *hosted* service — you do not need a server of your own.
   The free tier (500 MB database, unlimited API requests) is far more than a
   personal site needs.

   Setup (about 5 minutes):
     1. Create a project at https://supabase.com
     2. Open the SQL editor and run the schema in  docs/visitor-setup.md
     3. Go to  Project Settings → API  and copy:
          - Project URL        → supabaseUrl
          - anon / public key  → supabaseKey
     4. Paste them below and redeploy.

   No IP addresses are stored or displayed — only city/country and the page.
   =========================================================================== */

window.VISITOR_CONFIG = {
  // e.g. 'https://abcdefghijklmnop.supabase.co'
  supabaseUrl: 'https://kydegkrxpkiohkojutcl.supabase.co',

  // the "anon public" key (safe to expose — row level security protects it)
  supabaseKey: 'sb_publishable_Dlce1OaPxWoU3p_OK9tk_g_tNUgzcjW',

  // how many rows the dashboard fetches, newest first
  fetchLimit: 1000,
};
