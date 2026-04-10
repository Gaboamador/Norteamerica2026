export function requireAuthForAction({
  uid,
  navigate,
  location,
  onAuthRequired,
  autoRedirect = true,
}) {
  if (uid) return true;

  sessionStorage.setItem(
    "na2026_post_auth_redirect",
    location.pathname + location.search
  );

  onAuthRequired?.();
  
  if (autoRedirect && navigate) {
    navigate("/auth");
  }

  return false;
}
