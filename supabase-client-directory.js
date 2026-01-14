/**
 * Admin client autocomplete using profiles(email, user_id).
 * Requires: admins can select public.profiles.
 */
(async () => {
  const supabase = window.supabaseClient;
  const searchInput = document.querySelector("[data-client-search]");
  const datalist = document.querySelector("[data-client-datalist]");
  const userIdInput = document.querySelector('[data-add-member-form] input[name="user_id"]');

  if (!searchInput || !datalist || !userIdInput) return;
  if (!supabase?.auth?.getSession) return;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) return;

  // Load client directory (admin only by RLS)
  const { data: people, error } = await supabase
    .from("profiles")
    .select("user_id, email")
    .not("email", "is", null)
    .order("email", { ascending: true })
    .limit(500);

  if (error) {
    console.error("Failed to load client directory:", error);
    return;
  }

  const map = new Map(); // email -> user_id
  datalist.innerHTML = "";
  for (const p of people || []) {
    map.set((p.email || "").toLowerCase(), p.user_id);
    const opt = document.createElement("option");
    opt.value = p.email;
    datalist.appendChild(opt);
  }

  // When admin selects an email, fill the UUID input
  searchInput.addEventListener("change", () => {
    const email = (searchInput.value || "").trim().toLowerCase();
    const uid = map.get(email);
    if (uid) userIdInput.value = uid;
  });
})();
