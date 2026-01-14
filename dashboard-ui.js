/**
 * dashboard-ui.js
 * Tabs for admin/client panels + Admin "Preview Client View" toggle.
 * UI-only: does not change auth/role, only hides/shows panels.
 */
(() => {
  const roleEl = document.querySelector("[data-role-indicator]");
  const previewBtn = document.querySelector("[data-toggle-preview]");
  const adminSection = document.querySelector('section[data-role="admin"]');
  const clientSection = document.querySelector('section[data-role="client"]');

  const showPanel = (scopeEl, panelName) => {
    if (!scopeEl) return;
    scopeEl.querySelectorAll("[data-panel]").forEach((p) => {
      p.hidden = p.getAttribute("data-panel") !== panelName;
    });
  };

  const setupTabs = (scopeEl, defaultPanel) => {
    if (!scopeEl) return;
    const buttons = scopeEl.querySelectorAll("[data-tab]");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => showPanel(scopeEl, btn.getAttribute("data-tab")));
    });
    showPanel(scopeEl, defaultPanel);
  };

  setupTabs(adminSection, "admin-projects");
  setupTabs(clientSection, "client-overview");

  const roleLooksAdmin = () => (roleEl?.textContent || "").toLowerCase().includes("admin");

  const setPreviewMode = (on) => {
    if (!adminSection || !clientSection || !previewBtn) return;
    if (on) {
      adminSection.hidden = true;
      clientSection.hidden = false;
      previewBtn.textContent = "Back to Admin View";
      setupTabs(clientSection, "client-overview");
    } else {
      adminSection.hidden = false;
      clientSection.hidden = true;
      previewBtn.textContent = "Preview Client View";
      setupTabs(adminSection, "admin-projects");
    }
  };

  const boot = () => {
    if (!previewBtn) return;
    if (!roleLooksAdmin()) return;

    previewBtn.hidden = false;
    let previewOn = false;
    previewBtn.addEventListener("click", () => {
      previewOn = !previewOn;
      setPreviewMode(previewOn);
    });
  };

  setTimeout(boot, 300);
})();
