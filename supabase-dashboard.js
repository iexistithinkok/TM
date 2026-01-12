const renderRoleIndicator = (role) => {
  const indicator = document.querySelector("[data-role-indicator]");
  if (indicator) indicator.textContent = `Detected role: ${role}`;
};

const toggleRoleSections = (role) => {
  document.querySelectorAll('[data-role="admin"]').forEach(el => {
    el.hidden = role !== "admin";
  });
  document.querySelectorAll('[data-role="client"]').forEach(el => {
    el.hidden = role !== "client";
  });
};

const redirectToLogin = () => {
  window.location.href = "login.html";
};

if (window.__SUPABASE_URL__ && window.__SUPABASE_ANON_KEY__) {
  const supabase = window.supabase.createClient(
  window.__SUPABASE_URL__,
  window.__SUPABASE_ANON_KEY__
);

  );

  const initDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return redirectToLogin();

    const userId = session.user.id;

    // Try to fetch existing profile
    let { data: profile, error } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", userId)
      .single();

    // If none exists, create one ONCE
    if (!profile) {
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert({ user_id: userId, role: "client" })
        .select("role")
        .single();

      if (insertError) {
        console.error(insertError);
        return redirectToLogin();
      }

      profile = created;
    }

    if (!profile?.role) return redirectToLogin();

    renderRoleIndicator(profile.role);
    toggleRoleSections(profile.role);
  };

  initDashboard();
}
