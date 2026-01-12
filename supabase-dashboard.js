console.log("Dashboard script loading...");

if (!window.__SUPABASE_URL__ || !window.__SUPABASE_ANON_KEY__) {
  console.error("Supabase env not loaded");
  alert("Supabase env missing");
}

const supabase = window.supabase.createClient(
  window.__SUPABASE_URL__,
  window.__SUPABASE_ANON_KEY__
);

// ================== UI HELPERS ==================

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

// ================== MAIN ==================

async function loadDashboard() {
  console.log("Checking session...");

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    return redirectToLogin();
  }

  if (!session) {
    console.warn("No session");
    return redirectToLogin();
  }

  const userId = session.user.id;
  console.log("User ID:", userId);

  // Fetch profile
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Profile fetch error:", profileError);
    return redirectToLogin();
  }

  // Create profile if missing
  if (!profile) {
    console.log("Creating profile for user");

    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({ user_id: userId, role: "client" })
      .select()
      .single();

    if (insertError) {
      console.error("Profile create failed:", insertError);
      return redirectToLogin();
    }

    profile = newProfile;
  }

  console.log("User role:", profile.role);

  renderRole(profile.role);
}

// Run
loadDashboard();
