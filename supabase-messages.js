/**
 * supabase-messages.js
 * Project-wide messages:
 * - Client: reads messages for their first project (from project_members)
 * - Admin: reads + posts messages for the "active project" (window.currentProjectId / localStorage)
 *
 * Optional:
 * - Client can send messages if dashboard.html includes:
 *   <form class="message-form" data-client-send-form> <textarea name="message">...</textarea> </form>
 *
 * Requires:
 * - window.supabaseClient
 * - Tables:
 *   - profiles(user_id uuid, role text)
 *   - project_members(project_id bigint, user_id uuid)
 *   - project_messages(project_id bigint, user_id uuid, message text, created_at timestamptz)
 */
(async () => {
  const supabase = window.supabaseClient;

  const clientFeedEl = document.querySelector("[data-client-message-feed]");
  const adminFeedEl = document.querySelector("[data-client-messages]");

  const adminFormEl = document.querySelector("[data-client-message-form]");
  const adminTextArea =
    adminFormEl?.querySelector('textarea[name="client-message"]') ||
    adminFormEl?.querySelector("textarea");

  // Client send form (optional)
  const clientSendFormEl = document.querySelector("[data-client-send-form]");
  const clientSendTextArea =
    clientSendFormEl?.querySelector('textarea[name="message"]') ||
    clientSendFormEl?.querySelector("textarea");

  const setFeedMessage = (el, msg) => {
    if (!el) return;
    el.innerHTML = `<p class="muted">${msg}</p>`;
  };

  if (!clientFeedEl && !adminFeedEl) return;

  if (!supabase?.auth?.getSession) {
    console.error("supabaseClient missing on messages loader.");
    setFeedMessage(clientFeedEl, "Messages unavailable (Supabase not ready).");
    setFeedMessage(adminFeedEl, "Messages unavailable (Supabase not ready).");
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
  const isAdmin = role === "admin";

  const getActiveProjectIdForAdmin = () => {
    const id = window.currentProjectId ?? Number(localStorage.getItem("ACTIVE_PROJECT_ID"));
    return Number.isFinite(Number(id)) ? Number(id) : null;
  };

  const getClientProjectId = async () => {
    const { data: memberships, error } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load project membership:", error);
      return null;
    }

    const first = memberships?.[0]?.project_id ?? null;
    return Number.isFinite(Number(first)) ? Number(first) : null;
  };

  const renderMessages = (el, messages) => {
    if (!el) return;

    if (!messages || messages.length === 0) {
      setFeedMessage(el, "No messages yet.");
      return;
    }

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
      meta.textContent = ts;

      const body = document.createElement("div");
      body.className = "message-body";
      body.textContent = m.message ?? "";

      li.appendChild(meta);
      li.appendChild(body);
      ul.appendChild(li);
    }

    el.appendChild(ul);
  };

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

    renderMessages(targetEl, messages);
  };

  // ===== Admin view =====
  if (isAdmin) {
    const projectId = getActiveProjectIdForAdmin();

    if (!projectId) {
      setFeedMessage(adminFeedEl, "Select a project to view messages.");
    } else {
      await fetchMessages(projectId);
    }

    window.addEventListener("project:changed", async (e) => {
      const pid = Number(e.detail?.projectId);
      if (!Number.isFinite(pid)) return;
      await fetchMessages(pid);
    });

    if (adminFormEl) {
      adminFormEl.addEventListener("submit", async (e) => {
        e.preventDefault();

        const pid = getActiveProjectIdForAdmin();
        if (!pid) return alert("Select an active project first.");

        const text = adminTextArea?.value?.trim() || "";
        if (!text) return alert("Write a message first.");

        const { error: insertError } = await supabase
          .from("project_messages")
          .insert({ project_id: pid, user_id: userId, message: text });

        if (insertError) {
          console.error("Insert message failed:", insertError);
          alert(insertError.message || "Failed to post message.");
          return;
        }

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

  // Optional: client sending messages
  if (clientSendFormEl) {
    clientSendFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();

      const text = clientSendTextArea?.value?.trim() || "";
      if (!text) return;

      const { error: insErr } = await supabase
        .from("project_messages")
        .insert({ project_id: projectId, user_id: userId, message: text });

      if (insErr) {
        console.error("Client message insert failed:", insErr);
        alert(insErr.message || "Failed to send message.");
        return;
      }

      if (clientSendTextArea) clientSendTextArea.value = "";
      await fetchMessages(projectId);
    });
  }
})();
