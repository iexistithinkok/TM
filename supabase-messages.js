/**
 * supabase-messages.js
 * Placeholder: confirms message containers exist.
 */
(() => {
  const clientFeed = document.querySelector("[data-client-message-feed]");
  const adminFeed = document.querySelector("[data-admin-message-feed]");

  if (clientFeed) clientFeed.insertAdjacentHTML("beforeend", "<p class='muted'>Client feed ready.</p>");
  if (adminFeed) adminFeed.insertAdjacentHTML("beforeend", "<p class='muted'>Admin feed ready.</p>");
})();
