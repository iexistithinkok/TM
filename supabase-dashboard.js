console.log("Dashboard loading");

const supabase = window.supabaseClient;

function renderRole(role) {
  document.querySelector("[data-role-indicator]").textContent =
    "Detected role: " + role;

  document.querySelectorAll("[data-role]").forEach(el => {
    el.hidden = el.dataset.role !== role;
  });
}

function redirectToLogin() {
  window.location.href = "login.html";
}

async function loadDashboard() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirectToLogin();
    return;
  }

  const userId = session.user.id;

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

  console.log("ROLE:", profile.role);
  renderRole(profile.role);
}

loadDashboard();
