/**
 * supabase-project-overview.js
 * Shows "Project: <name> (ID <id>)" for:
 * - Admin: currently selected project (window.currentProjectId / ACTIVE_PROJECT_ID)
 * - Client: first project from project_members
 *
 * Requires:
 * - window.supabaseClient
 * - Tables:
 *   - projects(id bigint, name text)
 *   - project_members(project_id bigint, user_id uuid)
 * - RLS:
 *   - admins can select projects
 *   - project members can select projects (policy added in Step 1)
 */
(async () => {
  const supabase = window.supabaseClient;
  const el = document.querySelector("[data-project-indicator]");
  if (!el) return;

  const setText = (t) => (el.textContent = t);

  if (!supabase?.auth?.getSession) {
    setText("Project: unavailable (Supabase not ready)");
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session) {
    window.location.href = "./portal.html"; // change if your login page differs
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

  const renderProject = async (projectId) => {
    if (!projectId) {
      setText("Project: --");
      return;
    }

    const { data: proj, error } = await supabase
      .from("projects")
      .select("id, name, created_at")
      .eq("id", projectId)
      .maybeSingle();

    if (error) {
      console.error("projects read failed:", error);
      setText(`Project: ID ${projectId} (unavailable)`);
      return;
    }

    if (!proj) {
      setText(`Project: ID ${projectId} (not found)`);
      return;
    }

    setText(`Project: ${proj.name} (ID ${proj.id})`);
  };

  // Initial render
  const projectId = isAdmin ? getActiveProjectId() : await getClientProjectId();
  if (!projectId && !isAdmin) {
    setText("Project: (not assigned yet)");
  } else if (!projectId && isAdmin) {
    setText("Project: (select one)");
  } else {
    await renderProject(projectId);
  }

  // Admin: update when project changes
  window.addEventListener("project:changed", async (e) => {
    const pid = Number(e.detail?.projectId);
    if (!Number.isFinite(pid)) return;
    await renderProject(pid);
  });
})();
