// Supabase public configuration. Populate via environment variables at deploy time.
// Example for Cloudflare Pages: set SUPABASE_URL and SUPABASE_ANON_KEY env vars
// and replace the placeholders in this file during deployment.
window.__SUPABASE_URL__ = window.__SUPABASE_URL__ || "{{SUPABASE_URL}}";
window.__SUPABASE_ANON_KEY__ = window.__SUPABASE_ANON_KEY__ || "{{SUPABASE_ANON_KEY}}";
// DEV ONLY: toggle to allow developer login without Supabase auth.
window.__DEV_MODE__ = window.__DEV_MODE__ || false;
// Optional: set admin emails to auto-assign admin role on login/signup.
window.__ADMIN_EMAILS__ = window.__ADMIN_EMAILS__ || [];
