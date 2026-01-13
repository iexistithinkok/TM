/**
 * supabase-messages.js
 * Placeholder: confirms message containers exist.
 */
(() => {
  const clientFeed = document.querySelector("[data-client-message-feed]");
  const adminFeed = document.querySelector("[data-admin-message-feed]");

  console.log("supabase-messages loaded", {
    hasClientFeed: !!clientFeed,
    hasAdminFeed: !!adminFeed,
    path: window.location.pathname,
  });

  if (clientFeed) clientFeed.insertAdjacentHTML("beforeend", "<p class='muted'>Client feed ready.</p>");
  if (adminFeed) adminFeed.insertAdjacentHTML("beforeend", "<p class='muted'>Admin feed ready.</p>");
})();
