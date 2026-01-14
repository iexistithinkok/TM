/**
 * supabase-files.js
 * Renders project files into ALL [data-project-files] containers (admin + client views).
 * Admin can add files via [data-add-file-form].
 */
(async () => {
  const supabase = window.supabaseClient;
  const listEls = Array.from(document.querySelectorAll("[data-project-files]"));
  const addForm = document.querySelector("[data-add-file-form]");

  if (listEls.length === 0) return;

  const setAll = (msg) => {
    listEls.forEach((el) => (el.innerHTML = `<p class="muted">${msg}</p>`));
  };

  if (!supabase?.auth?.getSession) return setAll("Files unavailable (Supabase not ready).");

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

  const render = (items) => {
    if (!items || items.length === 0) return setAll("No files yet.");

    listEls.forEach((el) => {
      el.innerHTML = "";
      const ul = document.createElement("ul");
      ul.className = "message-thread";

      for (const f of items) {
        const li = document.createElement("li");
        li.className = "message-item";

        const meta = document.createElement("div");
        meta.className = "message-meta";
        meta.textContent = `${f.kind || "link"} • ${f.created_at ? new Date(f.created_at).toLocaleString() : ""}`;

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

      el.appendChild(ul);
    });
  };

  const load = async (projectId) => {
    if (!projectId) return setAll(isAdmin ? "Select a project to view files." : "No project assigned yet.");

    setAll("Loading files…");

    const { data, error } = await supabase
      .from("project_files")
      .select("id, created_at, project_id, title, url, kind")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return (console.error("project_files load failed:", error), setAll("Unable to load files."));

    render(data);
  };

  const initialProjectId = isAdmin ? getActiveProjectId() : await getClientProjectId();
  await load(initialProjectId);

  window.addEventListener("project:changed", async (e) => {
    const pid = Number(e.detail?.projectId);
    if (!Number.isFinite(pid)) return;
    await load(pid);
  });

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

      if (error) return alert(error.message || "Failed to add file.");

      addForm.reset();
      await load(pid);
    });
  }
})();
