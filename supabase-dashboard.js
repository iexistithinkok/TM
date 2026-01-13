/**
 * supabase-dashboard.js
 * - Requires an active session
 * - Loads/creates profile in `profiles` table
 * - Shows either [data-role="admin"] or [data-role="client"]
 */
(async () => {
  const supabase = window.supabaseClient;
  if (!supabase?.auth?.getSession) {
    console.error("supabaseClient missing on dashboard. Ensure supabase-client.js is loaded.");
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.error(sessionError);

  const session = sessionData?.session;
  if (!session) {
    window.location.href = "./client-login.html"; // change to your actual login page if different
    return;
  }

  const userId = session.user.id;

  // Get profile
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) console.error(profileError);

  // Create default profile if missing
  if (!profile) {
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({ user_id: userId, role: "client" })
      .select("user_id, role")
      .single();

    if (createError) {
      console.error(createError);
      return;
    }
    profile = created;
  }

  const role = (profile?.role || "client").toLowerCase();

  const indicator = document.querySelector("[data-role-indicator]");
  if (indicator) indicator.textContent = `Detected role: ${role}`;

  document.querySelectorAll('[data-role="admin"]').forEach((el) => {
    el.hidden = role !== "admin";
  });

  document.querySelectorAll('[data-role="client"]').forEach((el) => {
    el.hidden = role !== "client";
  });
})();
