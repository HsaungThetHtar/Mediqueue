export function useIsAuthenticated() {
  // Check for authToken in localStorage (matches app logic)
  return Boolean(localStorage.getItem('authToken'));
}
