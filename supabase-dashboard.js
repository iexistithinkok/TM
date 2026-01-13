console.log("Dashboard loading");

const supabase = window.supabaseClient;

async function loadDashboard() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.log("No session, redirecting");
    window.location.href = "login.html";
    return;
  }

  const userId = session.user.id;
  console.log("User:", userId);

  let { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    console.log("Creating profile");
    const res = await supabase.from("profiles").insert({
      user_id: userId,
      role: "client"
    }).select().single();
    profile = res.data;
  }

  console.log("ROLE:", profile.role);

  const indicator = document.querySelector("[data-role-indicator]");
  if (indicator) indicator.textContent = "Detected role: " + profile.role;

  document.querySelectorAll('[data-role="admin"]').forEach(el => {
    el.hidden = profile.role !== "admin";
  });

  document.querySelectorAll('[data-role="client"]').forEach(el => {
    el.hidden = profile.role !== "client";
  });
}

loadDashboard();
