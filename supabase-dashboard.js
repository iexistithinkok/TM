console.log("Dashboard script loading...");

if (!window.__SUPABASE_URL__ || !window.__SUPABASE_ANON_KEY__) {
  console.error("Supabase env not loaded");
  alert("Supabase env missing");
}

const supabase = window.supabase.createClient(
  window.__SUPABASE_URL__,
  window.__SUPABASE_ANON_KEY__
);

function renderRole(role) {
  const indicator = document.querySelector("[data-role-indicator]");
  if (indicator) indicator.textContent = "Detected role: " + role;

  document.querySelectorAll("[data-role]").forEach(el => {
    el.hidden = el.dataset.role !== role;
  });
}

function redirectToLogin() {
  window.location.href = "login.html";
}

async function loadDashboard() {
  console.log("Checking session...");

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    console.warn("No session");
    return redirectToLogin();
  }

  const userId = session.user.id;
  console.log("User:", userId);

  let { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    const { data } = await supabase
      .from("profiles")
      .insert({ user_id: userId, role: "client" })
      .select()
      .single();

    profile = data;
  }

  console.log("Role:", profile.role);
  renderRole(profile.role);
}

loadDashboard();
