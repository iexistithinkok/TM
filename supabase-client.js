/**
 * supabase-client.js
 * Robust singleton client init that works even if script load order is imperfect.
 *
 * Requires:
 *  - supabase-env.js sets window.__SUPABASE_URL__ and window.__SUPABASE_ANON_KEY__
 *  - Supabase CDN provides window.supabase.createClient
 */
(() => {
  if (window.getSupabaseClient) return; // already installed

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitForDeps({ timeoutMs = 8000, pollMs = 50 } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const hasEnv = !!window.__SUPABASE_URL__ && !!window.__SUPABASE_ANON_KEY__;
      const hasSDK = !!window.supabase?.createClient;
      if (hasEnv && hasSDK) return true;
      await sleep(pollMs);
    }
    return false;
  }

  async function initClientOnce() {
    if (window.supabaseClient) return window.supabaseClient;

    const ok = await waitForDeps();
    if (!ok) {
      console.error("Supabase deps not ready:", {
        urlPresent: !!window.__SUPABASE_URL__,
        anonKeyPresent: !!window.__SUPABASE_ANON_KEY__,
        supabaseGlobal: !!window.supabase,
        createClientPresent: !!window.supabase?.createClient,
      });
      return null;
    }

    if (!window.supabaseClient) {
      window.supabaseClient = window.supabase.createClient(
        window.__SUPABASE_URL__,
        window.__SUPABASE_ANON_KEY__
      );
    }
    return window.supabaseClient;
  }

  // One shared promise to prevent multiple GoTrueClient instances.
  const readyPromise = initClientOnce();

  window.getSupabaseClient = () => readyPromise;

  // Optional convenience logout
  window.dashboardLogout = async function dashboardLogout() {
    const client = await window.getSupabaseClient();
    if (client?.auth) await client.auth.signOut();
    window.location.href = "login.html";
  };
})();
