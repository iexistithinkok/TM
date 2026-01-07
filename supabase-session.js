const devModeEnabled = window.__DEV_MODE__ === true;
const DEV_SESSION_KEY = "DEV_AUTH";

if (window.__SUPABASE_URL__ && window.__SUPABASE_ANON_KEY__) {
  const supabaseClient = window.supabase.createClient(
    window.__SUPABASE_URL__,
    window.__SUPABASE_ANON_KEY__
  );

  supabaseClient.auth.getSession().then(({ data }) => {
    const hasDevSession =
      devModeEnabled && localStorage.getItem(DEV_SESSION_KEY) === "true";
    if (!data.session && !hasDevSession) {
      window.location.href = "login.html";
    }
  });
}
