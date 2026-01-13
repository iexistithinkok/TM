/**
 * supabase-client.js
 * Create ONE shared Supabase client for the whole page context.
 *
 * Requirements:
 * - supabase-env.js must set: window.__SUPABASE_URL__ and window.__SUPABASE_ANON_KEY__
 * - Supabase CDN must be loaded before this file
 */
(() => {
  if (window.supabaseClient) return; // Prevent duplicate clients

  const url = window.__SUPABASE_URL__;
  const anonKey = window.__SUPABASE_ANON_KEY__;

  if (!window.supabase?.createClient) {
    console.error(
      "Supabase JS not loaded. Ensure the CDN script (@supabase/supabase-js@2) loads before supabase-client.js"
    );
    return;
  }

  if (!url || !anonKey) {
    console.error(
      "Missing Supabase env. Ensure supabase-env.js defines window.__SUPABASE_URL__ and window.__SUPABASE_ANON_KEY__"
    );
    return;
  }

  window.supabaseClient = window.supabase.createClient(url, anonKey);

  // Optional convenience logout you can call from buttons: onclick="dashboardLogout()"
  window.dashboardLogout = async function dashboardLogout() {
    try {
      await window.supabaseClient.auth.signOut();
    } finally {
      window.location.href = "login.html";
    }
  };
})();
