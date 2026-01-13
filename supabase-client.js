console.log("Session loaded");

window.dashboardLogout = async function () {
  await window.supabase.auth.signOut();
  window.location.href = "login.html";
};
