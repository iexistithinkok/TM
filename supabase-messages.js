/**
 * supabase-messages.js
 * - Admin: views + posts messages for active project.
 * - Client: views + sends messages for their project.
 * - Labels: You/Admin/Client (no extra DB joins).
 * - Auto-refresh every 10s.
 */
(async () => {
  const supabase = window.supabaseClient;

  const clientFeedEl = document.querySelector("[data-client-message-feed]");
  const adminFeedEl = document.querySelector("[data-client-messages]");

  const adminFormEl = document.querySelector("[data-client-message-form]");
  const adminTextArea =
    adminFormEl?.querySelector('textarea[name="client-message"]') || adminFormEl?.querySelector("textarea");

  const clientSendFormEl = document.querySelector("[data-client-send-form]");
  const clientSendTextArea =
    clientSendFormEl?.querySelector('textarea[name="message"]') || clientSendFormEl?.querySelector("textarea");

  const setFeedMessage = (el, msg) => {
    if (!el) return;
    el.innerHTML = `<p class="muted">${msg}</p>`;
  };

  if (!clientFeedEl && !adminFeedEl) return;
  if (!supabase?.auth?.getSession) {
    setFeedMessage(clientFeedEl, "Messages unavailable (Supabase not ready).");
    setFeedMessage(adminFeedEl, "Messages unavailable (Supabase not ready).");
    return;
  }

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

  const getActiveProjectIdForAdmin = () => {
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

    if (error) return (console.error("Failed to load project membership:", error), null);

    const pid = memberships?.[0]?.project_id ?? null;
    return Number.isFinite(Number(pid)) ? Number(pid) : null;
  };

  const senderLabel = (messageUserId) => {
    if (messageUserId === userId) return "You";
    return isAdmin ? "Client" : "Admin";
  };

  const renderMessages = (el, messages) => {
    if (!el) return;
    if (!messages || messages.length === 0) return setFeedMessage(el, "No messages yet.");

    el.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "message-thread";

    for (const m of messages) {
      const li = document.createElement("li");
      li.className = "message-item";

      const when = m.created_at ? new Date(m.created_at) : null;
      const ts = when ? when.toLocaleString() : "";

      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.textContent = `${senderLabel(m.user_id)} • ${ts}`;

      const body = document.createElement("div");
      body.className = "message-body";
      body.textContent = m.message ?? "";

      li.appendChild(meta);
      li.appendChild(body);
      ul.appendChild(li);
    }

    el.appendChild(ul);
  };

  let refreshTimer = null;

  const fetchMessages = async (projectId) => {
    const targetEl = isAdmin ? adminFeedEl : clientFeedEl;
    setFeedMessage(targetEl, "Loading messages…");

    const { data: messages, error } = await supabase
      .from("project_messages")
      .select("id, created_at, user_id, project_id, message")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load messages:", error);
      setFeedMessage(targetEl, "Unable to load messages (check RLS).");
      return;
    }

    if (isAdmin) {
      renderMessages(adminFeedEl, messages);
      if (clientFeedEl) renderMessages(clientFeedEl, messages); // preview mode support
      return;
    }

    renderMessages(clientFeedEl, messages);
  };

  const startAutoRefresh = (projectId) => {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => fetchMessages(projectId), 10_000);
  };

  // ===== Admin view =====
  if (isAdmin) {
    const projectId = getActiveProjectIdForAdmin();
    if (!projectId) setFeedMessage(adminFeedEl, "Select a project to view messages.");
    else {
      await fetchMessages(projectId);
      startAutoRefresh(projectId);
    }

    window.addEventListener("project:changed", async (e) => {
      const pid = Number(e.detail?.projectId);
      if (!Number.isFinite(pid)) return;
      await fetchMessages(pid);
      startAutoRefresh(pid);
    });

    if (adminFormEl) {
      adminFormEl.addEventListener("submit", async (e) => {
        e.preventDefault();

        const pid = getActiveProjectIdForAdmin();
        if (!pid) return alert("Select an active project first.");

        const text = adminTextArea?.value?.trim() || "";
        if (!text) return alert("Write a message first.");

        const { error } = await supabase
          .from("project_messages")
          .insert({ project_id: pid, user_id: userId, message: text });

        if (error) return alert(error.message || "Failed to post message.");

        if (adminTextArea) adminTextArea.value = "";
        await fetchMessages(pid);
      });
    }
    return;
  }

  // ===== Client view =====
  const projectId = await getClientProjectId();
  if (!projectId) {
    setFeedMessage(clientFeedEl, "No project assigned yet.");
    return;
  }

  await fetchMessages(projectId);
  startAutoRefresh(projectId);

  if (clientSendFormEl) {
    clientSendFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();

      const text = clientSendTextArea?.value?.trim() || "";
      if (!text) return;

      const { error } = await supabase
        .from("project_messages")
        .insert({ project_id: projectId, user_id: userId, message: text });

      if (error) return alert(error.message || "Failed to send message.");

      if (clientSendTextArea) clientSendTextArea.value = "";
      await fetchMessages(projectId);
    });
  }
})();
