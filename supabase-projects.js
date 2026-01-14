/**
 * supabase-projects.js
 * Admin-only:
 * - loads projects into a dropdown
 * - creates a new project
 * - stores the selected project_id in localStorage + window.currentProjectId
 *
 * Other scripts can listen for:
 *   window.addEventListener("project:changed", (e) => console.log(e.detail.projectId))
 */
(async () => {
  const supabase = window.supabaseClient;
  const selectEl = document.querySelector("[data-project-select]");
  const formEl = document.querySelector("[data-create-project-form]");
  const statusEl = document.querySelector("[data-project-status]");

  if (!selectEl || !formEl) return;
  if (!supabase?.auth?.getSession) {
    if (statusEl) statusEl.textContent = "Supabase not ready.";
    return;
  }

  const setStatus = (msg) => {
    if (statusEl) statusEl.textContent = msg || "";
  };

  const loadSavedProjectId = () => {
    const raw = localStorage.getItem("ACTIVE_PROJECT_ID");
    const num = raw ? Number(raw) : NaN;
    return Number.isFinite(num) ? num : null;
  };

  const saveActiveProjectId = (projectId) => {
    window.currentProjectId = projectId;
    localStorage.setItem("ACTIVE_PROJECT_ID", String(projectId));
    window.dispatchEvent(new CustomEvent("project:changed", { detail: { projectId } }));
  };

  const ensureSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.error(error);
    return data?.session ?? null;
  };

  const renderProjects = (projects, activeId) => {
    selectEl.innerHTML = "";
    for (const p of projects) {
      const opt = document.createElement("option");
      opt.value = String(p.id);
      opt.textContent = `${p.name} (ID ${p.id})`;
      if (activeId && p.id === activeId) opt.selected = true;
      selectEl.appendChild(opt);
    }
  };

  const fetchProjects = async () => {
    setStatus("Loading projects…");

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Failed to load projects:", error);
      setStatus("Could not load projects (check RLS policies).");
      return [];
    }

    setStatus("");
    return data ?? [];
  };

  const createProject = async (name) => {
    setStatus("Creating project…");

    const { data: created, error: createError } = await supabase
      .from("projects")
      .insert({ name })
      .select("id, name")
      .single();

    if (createError) {
      console.error("Create project failed:", createError);
      setStatus("Create failed (check RLS).");
      return null;
    }

    // Add creator as a member with role 'admin' (optional, but useful)
    const session = await ensureSession();
    if (session) {
      const userId = session.user.id;
      const { error: memberErr } = await supabase
        .from("project_members")
        .insert({ project_id: created.id, user_id: userId, role: "admin" });

      if (memberErr) {
        // Not fatal; project is created.
        console.warn("Created project but could not add admin as member:", memberErr);
      }
    }

    setStatus(`Created: ${created.name}`);
    return created;
  };

  // Boot
  const session = await ensureSession();
  if (!session) {
    setStatus("Not signed in.");
    return;
  }

  // Load projects and set active
  let projects = await fetchProjects();
  if (projects.length === 0) {
    setStatus("No projects yet. Create one.");
  } else {
    const saved = loadSavedProjectId();
    const fallback = projects[0].id;
    const activeId = saved && projects.some((p) => p.id === saved) ? saved : fallback;

    renderProjects(projects, activeId);
    saveActiveProjectId(activeId);
  }

  // Change active project
  selectEl.addEventListener("change", () => {
    const projectId = Number(selectEl.value);
    if (Number.isFinite(projectId)) {
      saveActiveProjectId(projectId);
      setStatus(`Active project set to ID ${projectId}`);
    }
  });

  // Create project submit
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = formEl.querySelector('input[name="name"]')?.value?.trim();
    if (!name) return;

    const created = await createProject(name);
    if (!created) return;

    projects = await fetchProjects();
    renderProjects(projects, created.id);
    saveActiveProjectId(created.id);

    formEl.reset();
  });
})();
