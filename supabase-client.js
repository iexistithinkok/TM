if (!window.__SUPABASE_URL__ || !window.__SUPABASE_ANON_KEY__) {
  console.error("Supabase env missing");
} else {
  window.supabase = supabase.createClient(
    window.__SUPABASE_URL__,
    window.__SUPABASE_ANON_KEY__
  );
  console.log("Supabase client ready");
}
