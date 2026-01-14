/**
 * supabase-admin-notes.js
 * - Admin: reads notes for the currently selected project (window.currentProjectId)
 *         and allows posting notes via [data-admin-note-form]
 * - Client: reads notes for the client’s project(s) via project_members
 *
 * Requires:
 * - window.supabaseClient
 * - Tables:
 *   - profiles(user_id uuid, role text)
 *   - project_members(project_id bigint, user_id uuid)
 *   - admin_notes(project_id bigint, user_id uuid, note text, created_at timestamptz)
 * - RLS:
 *   - admin_notes SELECT allowed for project members + admins (you already added)
 *   - admin_notes INSERT allowed for admins (you likely already have; if not, I’ll give SQL next)
 */
(async () => {
  const supabase = window.supabaseClient;
  const listEl = document.querySelector("[data-admin-notes]");
  const formEl = document.querySelector("[data-admin-note-form]");

  if (!listEl) return;

  const setListMessage = (msg) => {
    listEl.innerHTML = `<p class="muted">${msg}</p>`;
  };

  if (!supabase?.auth?.getSession) {
    console.error("supabaseClient missing on admin notes loader.");
    setListMessage("Notes unavailable (Supabase client not loaded).");
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.error(sessionError);

  const session = sessionData?.session;
  if (!session) {
    window.location.href = "./portal.html"; // change if your login page differs
    return;
  }

  const userId = session.user.id;

  // Fetch role (keep it simple + consistent with your dashboard logic)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) console.error("Profile fetch failed:", profileError);

  const role = (profile?.role || "client").toLowerCase();
  const isAdmin = role === "admin";

  const renderNotes = (notes) => {
    if (!notes || notes.length === 0) {
      setListMessage("No notes yet.");
      return;
    }

    listEl.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "message-thread";

    for (const n of notes) {
      const li = document.createElement("li");
      li.className = "message-item";

      const when = n.created_at ? new Date(n.created_at) : null;
      const ts = when ? when.toLocaleString() : "";

      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.textContent = ts;

      const body = document.createElement("div");
      body.className = "message-body";
      body.textContent = n.note ?? "";

      li.appendChild(meta);
      li.appendChild(body);
      ul.appendChild(li);
    }

    listEl.appendChild(ul);
  };

  const fetchNotesForProject = async (projectId) => {
    setListMessage("Loading notes…");

    const { data: notes, error } = await supabase
      .from("admin_notes")
      .select("id, created_at, user_id, project_id, note")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load notes:", error);
      setListMessage("Unable to load notes (check RLS).");
      return;
    }

    renderNotes(notes);
  };

  const fetchClientProjectIds = async () => {
    const { data: memberships, error } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load project memberships:", error);
      return [];
    }
    return (memberships || []).map((m) => m.project_id).filter((v) => Number.isFinite(Number(v)));
  };

  // CLIENT view: show notes for first project (simple), or merge later if needed
  if (!isAdmin) {
    const projectIds = await fetchClientProjectIds();
    if (projectIds.length === 0) {
      setListMessage("No project assigned yet.");
      return;
    }
    await fetchNotesForProject(projectIds[0]);
    return;
  }

  // ADMIN view: notes follow the active project selection
  const getActiveProjectId = () => {
    const id = window.currentProjectId ?? Number(localStorage.getItem("ACTIVE_PROJECT_ID"));
    return Number.isFinite(Number(id)) ? Number(id) : null;
  };

  const active = getActiveProjectId();
  if (active) {
    await fetchNotesForProject(active);
  } else {
    setListMessage("Select a project to view notes.");
  }

  // Reload notes when admin changes project
  window.addEventListener("project:changed", async (e) => {
    const projectId = Number(e.detail?.projectId);
    if (!Number.isFinite(projectId)) return;
    await fetchNotesForProject(projectId);
  });

  // Admin posting notes
  if (formEl) {
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();

      const projectId = getActiveProjectId();
      if (!projectId) return alert("Select an active project first.");

      // Accept either <textarea name="note"> or any textarea inside the form
      const noteField =
        formEl.querySelector('textarea[name="note"]') ||
        formEl.querySelector("textarea");

      const note = noteField?.value?.trim() || "";
      if (!note) return alert("Write a note first.");

      const { error: insertError } = await supabase
        .from("admin_notes")
        .insert({ project_id: projectId, user_id: userId, note });

      if (insertError) {
        console.error("Insert note failed:", insertError);
        alert(insertError.message || "Failed to post note.");
        return;
      }

      if (noteField) noteField.value = "";
      await fetchNotesForProject(projectId);
    });
  }
})();
