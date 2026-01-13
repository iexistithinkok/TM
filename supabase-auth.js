/**
 * supabase-auth.js
 * Creates a Supabase client and wires login/signup forms.
 */
(() => {
  const devModeEnabled = window.__DEV_MODE__ === true;
  const DEV_EMAIL = "dev@transform.test";
  const DEV_PASSWORD = "dev123";
  const DEV_SESSION_KEY = "DEV_AUTH";

  const url = window.__SUPABASE_URL__;
  const anonKey = window.__SUPABASE_ANON_KEY__;

  if (!url || !anonKey) {
    console.warn("Supabase env missing: __SUPABASE_URL__ / __SUPABASE_ANON_KEY__");
    return;
  }
  if (!window.supabase?.createClient) {
    console.warn("Supabase JS not loaded (missing window.supabase.createClient).");
    return;
  }

  // Single shared client used across pages.
  const supabaseClient = window.supabase.createClient(url, anonKey);
  window.supabaseClient = supabaseClient;

  const forms = document.querySelectorAll("form[data-auth-mode]");

  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const mode = form.getAttribute("data-auth-mode");
      const emailInput = form.querySelector('input[type="email"]');
      const passwordInput = form.querySelector('input[type="password"]');

      if (!emailInput || !passwordInput) return;

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (devModeEnabled && email === DEV_EMAIL && password === DEV_PASSWORD) {
        localStorage.setItem(DEV_SESSION_KEY, "true");
        window.location.href = "dashboard.html";
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
        alert("Unable to authenticate. Please try again.");
      }
    });
  });

  supabaseClient.auth.getSession().then(({ data }) => {
    const isLoginPage =
      window.location.pathname.endsWith("login.html") ||
      window.location.pathname.endsWith("client-login.html") ||
      window.location.pathname.endsWith("portal.html");

    if (data?.session && isLoginPage) {
      window.location.href = "dashboard.html";
    }
  });
})();
