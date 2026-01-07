const renderRoleIndicator = (role) => {
  const indicator = document.querySelector("[data-role-indicator]");
  if (indicator) {
    indicator.textContent = `Detected role: ${role}`;
  }
};

const toggleRoleSections = (role) => {
  const adminBlocks = document.querySelectorAll('[data-role="admin"]');
  const clientBlocks = document.querySelectorAll('[data-role="client"]');

  adminBlocks.forEach((el) => {
    el.hidden = role !== "admin";
  });

  clientBlocks.forEach((el) => {
    el.hidden = role !== "client";
  });
};

const redirectToLogin = () => {
  window.location.href = "login.html";
};

const clearLocalSession = () => {
  localStorage.removeItem("DEV_AUTH");
  sessionStorage.clear();
};

const logout = async (supabaseClient) => {
  try {
    await supabaseClient.auth.signOut();
  } finally {
    clearLocalSession();
    redirectToLogin();
  }
};

if (window.__SUPABASE_URL__ && window.__SUPABASE_ANON_KEY__) {
  const supabaseClient = window.supabase.createClient(
    window.__SUPABASE_URL__,
    window.__SUPABASE_ANON_KEY__
  );

  window.dashboardLogout = () => logout(supabaseClient);

  const initializeDashboard = async () => {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      redirectToLogin();
      return;
    }

    const userId = session.user?.id;
    if (!userId) {
      redirectToLogin();
      return;
    }

    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      redirectToLogin();
      return;
    }

    let role = profile?.role;

    if (!role) {
      const { data: created, error: insertError } = await supabaseClient
        .from("profiles")
        .insert({ user_id: userId, role: "client" })
        .select("role")
        .single();

      if (insertError) {
        redirectToLogin();
        return;
      }

      role = created?.role;
    }

    if (role !== "admin" && role !== "client") {
      redirectToLogin();
      return;
    }

    renderRoleIndicator(role);
    toggleRoleSections(role);
  };

  initializeDashboard();
}
