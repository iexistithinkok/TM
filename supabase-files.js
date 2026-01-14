/**
 * supabase-files.js
 * - Client: loads files for their first project
 * - Admin: loads files for selected project (ACTIVE_PROJECT_ID) and can add new links
 */
(async () => {
  const supabase = window.supabaseClient;
  const listEl = document.querySelector("[data-project-files]");
  const addForm = document.querySelector("[data-add-file-form]");

  if (!listEl) return;

  const setMsg = (m) => (listEl.innerHTML = `<p class="muted">${m}</p>`);

  if (!supabase?.auth?.getSession) {
    setMsg("Files unavailable (Supabase not ready).");
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session) {
    window.location.href = "./portal.html";
    return;
  }

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

    if (error) {
      console.error("project_members read failed:", error);
      return null;
    }

    const pid = memberships?.[0]?.project_id ?? null;
    return Number.isFinite(Number(pid)) ? Number(pid) : null;
  };

  const render = (items) => {
    if (!items || items.length === 0) {
      setMsg("No files yet.");
      return;
    }

    listEl.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "message-thread";

    for (const f of items) {
      const li = document.createElement("li");
      li.className = "message-item";

      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.textContent = `${f.kind || "link"} • ${new Date(f.created_at).toLocaleString()}`;

      const body = document.createElement("div");
      body.className = "message-body";

      const a = document.createElement("a");
      a.href = f.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = f.title;

      body.appendChild(a);
      li.appendChild(meta);
      li.appendChild(body);
      ul.appendChild(li);
    }

    listEl.appendChild(ul);
  };

  const loadFiles = async (projectId) => {
    if (!projectId) {
      setMsg(isAdmin ? "Select a project to view files." : "No project assigned yet.");
      return;
    }

    setMsg("Loading files…");

    const { data, error } = await supabase
      .from("project_files")
      .select("id, created_at, project_id, title, url, kind")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("project_files load failed:", error);
      setMsg("Unable to load files (check RLS).");
      return;
    }

    render(data);
  };

  const projectId = isAdmin ? getActiveProjectId() : await getClientProjectId();
  await loadFiles(projectId);

  window.addEventListener("project:changed", async (e) => {
    const pid = Number(e.detail?.projectId);
    if (!Number.isFinite(pid)) return;
    await loadFiles(pid);
  });

  // Admin add file
  if (isAdmin && addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const pid = getActiveProjectId();
      if (!pid) return alert("Select an active project first.");

      const title = addForm.querySelector('input[name="title"]')?.value?.trim() || "";
      const url = addForm.querySelector('input[name="url"]')?.value?.trim() || "";
      const kind = addForm.querySelector('select[name="kind"]')?.value || "link";

      if (!title || !url) return alert("Title and URL are required.");

      const { error } = await supabase
        .from("project_files")
        .insert({ project_id: pid, user_id: userId, title, url, kind });

      if (error) {
        console.error("Insert file failed:", error);
        alert(error.message || "Failed to add file.");
        return;
      }

      addForm.reset();
      await loadFiles(pid);
    });
  }
})();
