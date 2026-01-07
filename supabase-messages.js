const buildMessageItem = (message) => {
  const item = document.createElement("div");
  item.className = "message-item";
  const timestamp = new Date(message.created_at).toLocaleString();
  item.innerHTML = `
    <strong>Project ${message.project_id}</strong>
    <span>By ${message.author_id} • ${timestamp}</span>
    <p>${message.content}</p>
  `;
  return item;
};

const renderMessageList = (container, messages) => {
  container.innerHTML = "";
  if (!messages.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No messages yet.";
    container.appendChild(empty);
    return;
  }

  messages.forEach((message) => {
    container.appendChild(buildMessageItem(message));
  });
};

if (window.__SUPABASE_URL__ && window.__SUPABASE_ANON_KEY__) {
  const supabaseClient = window.supabase.createClient(
    window.__SUPABASE_URL__,
    window.__SUPABASE_ANON_KEY__
  );

  const adminNotesContainer = document.querySelector("[data-admin-notes]");
  const clientMessagesContainer = document.querySelector("[data-client-messages]");
  const clientFeedContainer = document.querySelector("[data-client-message-feed]");

  const adminNoteForm = document.querySelector("[data-admin-note-form]");
  const clientMessageForm = document.querySelector("[data-client-message-form]");

  const loadAdminNotes = async () => {
    if (!adminNotesContainer) {
      return;
    }

    const { data, error } = await supabaseClient
      .from("admin_notes")
      .select("project_id, author_id, content, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      renderMessageList(adminNotesContainer, []);
      return;
    }

    renderMessageList(adminNotesContainer, data || []);
  };

  const loadClientMessages = async (container) => {
    if (!container) {
      return;
    }

    const { data, error } = await supabaseClient
      .from("project_messages")
      .select("project_id, author_id, content, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      renderMessageList(container, []);
      return;
    }

    renderMessageList(container, data || []);
  };

  const submitAdminNote = async (event) => {
    event.preventDefault();
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const formData = new FormData(event.target);
    const content = String(formData.get("admin-note") || "").trim();
    const projectId = String(formData.get("admin-project-id") || "").trim();

    if (!userId || !content || !projectId) {
      return;
    }

    const { error } = await supabaseClient.from("admin_notes").insert({
      project_id: projectId,
      author_id: userId,
      content,
    });

    if (!error) {
      event.target.reset();
      await loadAdminNotes();
    }
  };

  const submitClientMessage = async (event) => {
    event.preventDefault();
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const formData = new FormData(event.target);
    const content = String(formData.get("client-message") || "").trim();
    const projectId = String(formData.get("client-project-id") || "").trim();

    if (!userId || !content || !projectId) {
      return;
    }

    const { error } = await supabaseClient.from("project_messages").insert({
      project_id: projectId,
      author_id: userId,
      content,
    });

    if (!error) {
      event.target.reset();
      await loadClientMessages(clientMessagesContainer);
    }
  };

  if (adminNoteForm) {
    adminNoteForm.addEventListener("submit", submitAdminNote);
  }

  if (clientMessageForm) {
    clientMessageForm.addEventListener("submit", submitClientMessage);
  }

  loadAdminNotes();
  loadClientMessages(clientMessagesContainer);
  loadClientMessages(clientFeedContainer);
}
