/**
 * supabase-members.js
 * Admin-only project membership management using project_members table.
 *
 * Requires:
 * - window.supabaseClient
 * - window.currentProjectId or localStorage ACTIVE_PROJECT_ID set by supabase-projects.js
 * - Tables:
 *   - profiles(user_id uuid, role text)
 *   - project_members(project_id bigint, user_id uuid, role text, created_at timestamptz)
 *
 * RLS needed (you already set these):
 * - Admins: SELECT/INSERT/DELETE on project_members
 */
(async () => {
  const supabase = window.supabaseClient;
  const listEl = document.querySelector("[data-project-members]");
  const formEl = document.querySelector("[data-add-member-form]");

  if (!listEl || !formEl) return;

  const setListMessage = (msg) => {
    listEl.innerHTML = `<p class="muted">${msg}</p>`;
  };

  const isUuid = (s) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

  if (!supabase?.auth?.getSession) {
    setListMessage("Members unavailable (Supabase not ready).");
    console.error("supabaseClient missing on members loader.");
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.error(sessionError);

  const session = sessionData?.session;
  if (!session) {
    window.location.href = "./portal.html";
    return;
  }

  const userId = session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) console.error("Profile fetch failed:", profileError);

  const role = (profile?.role || "client").toLowerCase();
  if (role !== "admin") {
    // Not an error; admin-only UI.
    setListMessage("Members list is available to admins only.");
    return;
  }

  const getActiveProjectId = () => {
    const id = window.currentProjectId ?? Number(localStorage.getItem("ACTIVE_PROJECT_ID"));
    return Number.isFinite(Number(id)) ? Number(id) : null;
  };

  const renderMembers = (members) => {
    if (!members || members.length === 0) {
      setListMessage("No members assigned to this project yet.");
      return;
    }

    listEl.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "message-thread";

    for (const m of members) {
      const li = document.createElement("li");
      li.className = "message-item";

      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.textContent = `${m.user_id} • ${m.role || "client"}`;

      const actions = document.createElement("div");
      actions.className = "message-body";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "secondary-btn";
      btn.textContent = "Remove";
      btn.addEventListener("click", async () => {
        const pid = getActiveProjectId();
        if (!pid) return;

        const { error: delErr } = await supabase
          .from("project_members")
          .delete()
          .eq("project_id", pid)
          .eq("user_id", m.user_id);

        if (delErr) {
          console.error("Remove member failed:", delErr);
          alert(delErr.message || "Failed to remove member.");
          return;
        }

        await loadMembers();
      });

      actions.appendChild(btn);
      li.appendChild(meta);
      li.appendChild(actions);
      ul.appendChild(li);
    }

    listEl.appendChild(ul);
  };

  const loadMembers = async () => {
    const projectId = getActiveProjectId();
    if (!projectId) {
      setListMessage("Select an active project to load members.");
      return;
    }

    setListMessage("Loading members…");

    const { data: members, error } = await supabase
      .from("project_members")
      .select("user_id, role, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load members:", error);
      setListMessage("Unable to load members (check RLS).");
      return;
    }

    renderMembers(members);
  };

  // Initial load
  await loadMembers();

  // Reload when admin changes project
  window.addEventListener("project:changed", loadMembers);

  // Add member form
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const projectId = getActiveProjectId();
    if (!projectId) return alert("Select an active project first.");

    const userIdInput = formEl.querySelector('input[name="user_id"]');
    const roleSelect = formEl.querySelector('select[name="role"]');

    const memberUserId = (userIdInput?.value || "").trim();
    const memberRole = (roleSelect?.value || "client").trim().toLowerCase();

    if (!isUuid(memberUserId)) return alert("User ID must be a valid UUID.");
    if (!memberRole) return alert("Role is required.");

    // Avoid duplicates (best-effort)
    const { data: existing, error: existErr } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", memberUserId)
      .maybeSingle();

    if (existErr) console.warn("Membership existence check failed:", existErr);

    if (existing?.user_id) {
      alert("User is already a member of this project.");
      return;
    }

    const { error: insErr } = await supabase
      .from("project_members")
      .insert({ project_id: projectId, user_id: memberUserId, role: memberRole });

    if (insErr) {
      console.error("Add member failed:", insErr);
      alert(insErr.message || "Failed to add member.");
      return;
    }

    formEl.reset();
    await loadMembers();
  });
})();
