/**
 * supabase-admin-notes.js
 * Renders admin notes into ALL [data-admin-notes] containers (admin + client views).
 * Admin can post notes to active project via [data-admin-note-form].
 */
(async () => {
  const supabase = window.supabaseClient;
  const listEls = Array.from(document.querySelectorAll("[data-admin-notes]"));
  const formEl = document.querySelector("[data-admin-note-form]");

  if (listEls.length === 0) return;

  const setAll = (msg) => {
    listEls.forEach((el) => (el.innerHTML = `<p class="muted">${msg}</p>`));
  };

  if (!supabase?.auth?.getSession) return setAll("Notes unavailable (Supabase not ready).");

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session) return (window.location.href = "./portal.html");

  const userId = session.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const role = (profile?.role || "client").toLowerCase();
  const isAdmin = role === "admin";

  const getActiveProjectId = () => {
    const raw = window.currentProjectId ?? localStorage.getItem("ACTIVE_PROJECT_ID");
    const pid = raw == null ? null : Number(raw);
    return Number.isFinite(pid) ? pid : null;
  };

  const getClientProjectId = async () => {
    const { data: memberships, error } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) return (console.error("project_members read failed:", error), null);

    const pid = memberships?.[0]?.project_id ?? null;
    return Number.isFinite(Number(pid)) ? Number(pid) : null;
  };

  const render = (notes) => {
    if (!notes || notes.length === 0) return setAll("No updates yet.");

    listEls.forEach((el) => {
      el.innerHTML = "";
      const ul = document.createElement("ul");
      ul.className = "message-thread";

      for (const n of notes) {
        const li = document.createElement("li");
        li.className = "message-item";

        const meta = document.createElement("div");
        meta.className = "message-meta";
        meta.textContent = n.created_at ? new Date(n.created_at).toLocaleString() : "";

        const body = document.createElement("div");
        body.className = "message-body";
        body.textContent = n.note ?? "";

        li.appendChild(meta);
        li.appendChild(body);
        ul.appendChild(li);
      }

      el.appendChild(ul);
    });
  };

  const load = async (projectId) => {
    if (!projectId) {
      return setAll(isAdmin ? "Select a project to view updates." : "No project assigned yet.");
    }

    setAll("Loading updates…");

    const { data, error } = await supabase
      .from("admin_notes")
      .select("id, created_at, note, project_id, user_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return (console.error("admin_notes load failed:", error), setAll("Unable to load updates."));

    render(data);
  };

  const initialProjectId = isAdmin ? getActiveProjectId() : await getClientProjectId();
  await load(initialProjectId);

  window.addEventListener("project:changed", async (e) => {
    const pid = Number(e.detail?.projectId);
    if (!Number.isFinite(pid)) return;
    await load(pid);
  });

  if (isAdmin && formEl) {
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();

      const pid = getActiveProjectId();
      if (!pid) return alert("Select an active project first.");

      const noteField = formEl.querySelector('textarea[name="note"]') || formEl.querySelector("textarea");
      const note = noteField?.value?.trim() || "";
      if (!note) return alert("Write an update first.");

      const { error } = await supabase.from("admin_notes").insert({ project_id: pid, user_id: userId, note });
      if (error) return alert(error.message || "Failed to post update.");

      if (noteField) noteField.value = "";
      await load(pid);
    });
  }
})();
