console.log("Supabase session loader");

window.supabaseClient = supabase.createClient(
  window.__SUPABASE_URL__,
  window.__SUPABASE_ANON_KEY__
);

window.dashboardLogout = async function () {
  await window.supabaseClient.auth.signOut();
  window.location.href = "login.html";
};
