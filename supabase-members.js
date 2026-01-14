/**
 * supabase-members.js
 * Admin-only: manage project_members by EMAIL (profiles.email -> user_id).
 *
 * Requirements:
 * - window.supabaseClient
 * - profiles(user_id uuid, email text, role text)
 * - project_members(project_id bigint, user_id uuid, role text, created_at)
 * - RLS:
 *   - admins can select profiles
 *   - admins can select/insert/delete project_members
 */
(async () => {
  const supabase = window.supabaseClient;

  const listEl = document.querySelector("[data-project-members]");
  const formEl = document.querySelector("[data-add-member-form]");
  const emailInput = document.querySelector("[data-client-search]");
  const datalistEl = document.querySelector("[data-client-datalist]");

  if (!listEl || !formEl || !emailInput || !datalistEl) return;

  const setListMsg = (msg) => {
    listEl.innerHTML = `<p class="muted">${msg}</p>`;
  };

  const getActiveProjectId = () => {
    const raw = window.currentProjectId ?? localStorage.getItem("ACTIVE_PROJECT_ID");
    const pid = raw == null ? null : Number(raw);
    return Number.isFinite(pid) ? pid : null;
  };

  if (!supabase?.auth?.getSession) {
    setListMsg("Members unavailable (Supabase not ready).");
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session) {
    window.location.href = "./portal.html";
    return;
  }

  const me = session.user.id;

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", me)
    .maybeSingle();

  const isAdmin = (myProfile?.role || "").toLowerCase() === "admin";
  if (!isAdmin) {
    setListMsg("Members list is available to admins only.");
    return;
  }

  // ---- Load directory (email -> user_id) for autocomplete
  const directory = new Map(); // emailLower -> { user_id, email }

  const loadDirectory = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, email")
      .not("email", "is", null)
      .order("email", { ascending: true })
      .limit(1000);

    if (error) {
      console.error("Failed to load directory:", error);
      return;
    }

    directory.clear();
    datalistEl.innerHTML = "";

    for (const p of data || []) {
      const email = (p.email || "").trim();
      if (!email) continue;

      directory.set(email.toLowerCase(), { user_id: p.user_id, email });

      const opt = document.createElement("option");
      opt.value = email;
      datalistEl.appendChild(opt);
    }
  };

  await loadDirectory();

  const renderMembers = (rows, emailByUserId) => {
    if (!rows || rows.length === 0) {
      setListMsg("No members assigned yet.");
      return;
    }

    listEl.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "message-thread";

    for (const r of rows) {
      const li = document.createElement("li");
      li.className = "message-item";

      const email = emailByUserId.get(r.user_id) || r.user_id;
      const role = (r.role || "client").toLowerCase();

      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.textContent = `${email} • ${role}`;

      const body = document.createElement("div");
      body.className = "message-body";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "secondary-btn";
      btn.textContent = "Remove";
      btn.addEventListener("click", async () => {
        const pid = getActiveProjectId();
        if (!pid) return;

        const { error } = await supabase
          .from("project_members")
          .delete()
          .eq("project_id", pid)
          .eq("user_id", r.user_id);

        if (error) {
          console.error("Remove member failed:", error);
          alert(error.message || "Failed to remove member.");
          return;
        }

        await loadMembers();
      });

      body.appendChild(btn);
      li.appendChild(meta);
      li.appendChild(body);
      ul.appendChild(li);
    }

    listEl.appendChild(ul);
  };

  const loadMembers = async () => {
    const projectId = getActiveProjectId();
    if (!projectId) {
      setListMsg("Select an active project to load members.");
      return;
    }

    setListMsg("Loading members…");

    const { data: rows, error } = await supabase
      .from("project_members")
      .select("user_id, role, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load project members:", error);
      setListMsg("Unable to load members (check RLS).");
      return;
    }

    const ids = (rows || []).map((r) => r.user_id);
    const emailByUserId = new Map();

    if (ids.length > 0) {
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", ids);

      if (pErr) console.error("Failed to map emails:", pErr);

      for (const p of profs || []) {
        if (p.user_id) emailByUserId.set(p.user_id, p.email || "");
      }
    }

    renderMembers(rows, emailByUserId);
  };

  await loadMembers();
  window.addEventListener("project:changed", loadMembers);

  // Autofill hidden UUID when an email is chosen
  const userIdHidden = formEl.querySelector('input[name="user_id"]');
  emailInput.addEventListener("change", () => {
    const email = (emailInput.value || "").trim().toLowerCase();
    const hit = directory.get(email);
    if (hit && userIdHidden) userIdHidden.value = hit.user_id;
  });

  // Add member by email selection
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const projectId = getActiveProjectId();
    if (!projectId) return alert("Select an active project first.");

    const email = (emailInput.value || "").trim().toLowerCase();
    const hit = directory.get(email);

    if (!hit) return alert("Pick a client email from the dropdown list.");

    const makeAdmin = !!formEl.querySelector('input[name="make_admin"]')?.checked;
    const memberRole = makeAdmin ? "admin" : "client";

    // prevent duplicates
    const { data: existing, error: exErr } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", hit.user_id)
      .maybeSingle();

    if (exErr) console.warn("Duplicate check failed:", exErr);
    if (existing?.user_id) return alert("That user is already assigned to this project.");

    const { error } = await supabase
      .from("project_members")
      .insert({ project_id: projectId, user_id: hit.user_id, role: memberRole });

    if (error) {
      console.error("Add member failed:", error);
      alert(error.message || "Failed to add member.");
      return;
    }

    formEl.reset();
    emailInput.value = "";
    if (userIdHidden) userIdHidden.value = "";
    await loadMembers();
  });
})();
