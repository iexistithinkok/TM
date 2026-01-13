/**
 * supabase-auth.js
 * Auth handlers that WAIT for the singleton client from supabase-client.js.
 */
(async () => {
  if (!window.getSupabaseClient) {
    console.error("getSupabaseClient missing. Load supabase-client.js before supabase-auth.js");
    return;
  }

  const supabaseClient = await window.getSupabaseClient();
  if (!supabaseClient?.auth?.getSession) {
    console.error("Supabase client not ready (still null). Check Network 404 + env vars.");
    return;
  }

  // Debug: confirms client + session availability
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) console.error(error);
  console.log("session:", data?.session);

  // Form wiring: <form data-auth-mode="login"> or "signup"
  const forms = document.querySelectorAll("form[data-auth-mode]");
  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const mode = form.getAttribute("data-auth-mode"); // "login" | "signup"
      const email = form.querySelector('input[type="email"]')?.value?.trim() || "";
      const password = form.querySelector('input[type="password"]')?.value || "";

      if (!email || !password) return alert("Email and password are required.");

      let result;
      if (mode === "signup") {
        result = await supabaseClient.auth.signUp({ email, password });
      } else {
        result = await supabaseClient.auth.signInWithPassword({ email, password });
      }

      if (result?.error) return alert(result.error.message);

      window.location.href = "dashboard.html";
    });
  });

  // Optional redirect away from login-like pages if already signed in
  const path = window.location.pathname.toLowerCase();
  const isLoginLike =
    path.endsWith("/login.html") || path.endsWith("/client-login.html") || path.endsWith("/portal.html");

  if (data?.session && isLoginLike) {
    window.location.href = "dashboard.html";
  }
})();
