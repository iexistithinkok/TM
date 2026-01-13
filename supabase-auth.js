/**
 * supabase-auth.js
 * Uses the already-created window.supabaseClient from supabase-client.js.
 * DO NOT create a new client here (prevents multiple GoTrueClient instances).
 */
(() => {
  const supabaseClient = window.supabaseClient;
  if (!supabaseClient?.auth?.getSession) {
    console.error("supabaseClient missing. Load supabase-client.js first.");
    return;
  }

  // If you're logging this for debugging, it's fine; remove later.
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) console.error(error);
    console.log("session:", data?.session);
  });

  const forms = document.querySelectorAll("form[data-auth-mode]");

  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const mode = form.getAttribute("data-auth-mode"); // "login" or "signup"
      const email = form.querySelector('input[type="email"]')?.value?.trim() || "";
      const password = form.querySelector('input[type="password"]')?.value || "";

      if (!email || !password) {
        alert("Email and password are required.");
        return;
      }

      try {
        if (mode === "signup") {
          const { error } = await supabaseClient.auth.signUp({ email, password });
          if (error) return alert(error.message);
        } else {
          const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (error) return alert(error.message);
        }

        window.location.href = "dashboard.html";
      } catch {
        alert("Login failed. Please try again.");
      }
    });
  });

  // Optional: redirect away from login page if already signed in
  supabaseClient.auth.getSession().then(({ data }) => {
    const path = window.location.pathname.toLowerCase();
    const isLoginLike =
      path.endsWith("/login.html") || path.endsWith("/client-login.html") || path.endsWith("/portal.html");

    if (data?.session && isLoginLike) {
      window.location.href = "dashboard.html";
    }
  });
})();
