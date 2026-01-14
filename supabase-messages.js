/**
 * supabase-messages.js
 * Loads and renders project messages for the signed-in user.
 *
 * Requires:
 * - dashboard.html contains: [data-client-message-feed]
 * - window.supabaseClient is created (supabase-client.js)
 * - Tables:
 *   - public.project_members(project_id bigint, user_id uuid, role text)
 *   - public.project_messages(project_id bigint, user_id uuid, message text, created_at timestamptz)
 */
(async () => {
  const feedEl = document.querySelector("[data-client-message-feed]");
  if (!feedEl) return;

  const supabase = window.supabaseClient;
  if (!supabase?.auth?.getSession) {
    console.error("supabaseClient missing on messages loader.");
    feedEl.textContent = "Messages unavailable (Supabase client not loaded).";
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.error(sessionError);

  const session = sessionData?.session;
  if (!session) {
    // Change this to your actual login page if different:
    window.location.href = "./portal.html";
    return;
  }

  const userId = session.user.id;

  // 1) Find user's project(s)
  const { data: memberships, error: memberError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (memberError) {
    console.error("Failed to load project membership:", memberError);
    feedEl.textContent = "Unable to load messages (membership check failed).";
    return;
  }

  if (!memberships || memberships.length === 0) {
    feedEl.textContent = "No project assigned yet.";
    return;
  }

  // For now: pick first project
  const projectId = memberships[0].project_id;

  // 2) Fetch messages
  const { data: messages, error: msgError } = await supabase
    .from("project_messages")
    .select("id, created_at, user_id, message")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (msgError) {
    console.error("Failed to load project messages:", msgError);
    feedEl.textContent = "Unable to load messages.";
    return;
  }

  // 3) Render
  if (!messages || messages.length === 0) {
    feedEl.textContent = "No messages yet.";
    return;
  }

  feedEl.innerHTML = "";

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

  feedEl.appendChild(ul);
})();
