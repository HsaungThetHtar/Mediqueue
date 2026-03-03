import { useLocation } from 'react-router-dom';

export function useHideAuthNavButtons() {
  const location = useLocation();
  // Hide auth buttons on these routes
  const hideOn = [
    '/signin', '/signup', '/doctor/signin', '/doctor/signup', '/choose-role', '/'
  ];
  return hideOn.includes(location.pathname);
}
