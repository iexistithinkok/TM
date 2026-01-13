const devModeEnabled = window.__DEV_MODE__ === true;
const DEV_EMAIL = "dev@transform.test";
const DEV_PASSWORD = "dev123";
const DEV_SESSION_KEY = "DEV_AUTH";

if (window.__SUPABASE_URL__ && window.__SUPABASE_ANON_KEY__) {
const supabaseClient = window.supabase;(
    window.__SUPABASE_URL__,
    window.__SUPABASE_ANON_KEY__
  );

  const forms = document.querySelectorAll("[data-auth-mode]");

  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const mode = form.getAttribute("data-auth-mode");
      const emailInput = form.querySelector("input[type=\"email\"]");
      const passwordInput = form.querySelector("input[type=\"password\"]");

      if (!emailInput || !passwordInput) {
        return;
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (devModeEnabled && email === DEV_EMAIL && password === DEV_PASSWORD) {
        // DEV ONLY: store a temporary session flag for local testing.
        localStorage.setItem(DEV_SESSION_KEY, "true");
        window.location.href = "dashboard.html";
        return;
      }

      try {
        if (mode === "signup") {
          const { error } = await supabaseClient.auth.signUp({ email, password });
          if (error) {
            alert(error.message);
            return;
          }
        } else {
          const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            alert(error.message);
            return;
          }
        }

        window.location.href = "dashboard.html";
      } catch (err) {
        alert("Unable to authenticate. Please try again.");
      }
    });
  });

  supabaseClient.auth.getSession().then(({ data }) => {
    const isLoginPage =
      window.location.pathname.endsWith("login.html") ||
      window.location.pathname.endsWith("client-login.html");
    if (data.session && isLoginPage) {
      window.location.href = "dashboard.html";
    }
  });
}
