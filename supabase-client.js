/**
 * supabase-client.js
 * Ensures a shared Supabase client exists and provides logout.
 */
(() => {
  const url = window.__SUPABASE_URL__;
  const anonKey = window.__SUPABASE_ANON_KEY__;

  if (!window.supabaseClient && window.supabase?.createClient && url && anonKey) {
    window.supabaseClient = window.supabase.createClient(url, anonKey);
  }

  window.dashboardLogout = async function () {
    if (window.supabaseClient?.auth) {
      await window.supabaseClient.auth.signOut();
    }
    window.location.href = "login.html";
  };
})();
