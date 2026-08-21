import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../app/store';
import { ROLE_HOME } from '../constants/routes';
import { api } from '../utils/api';

/** localStorage key for persisting the session */
const SESSION_KEY = 'ddc:session';

/**
 * Hook for authentication state and actions connected to Backend.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  /**
   * Login function — authenticates via API, persists session, navigates to dashboard.
   * @param {string} email
   * @param {string} password
   */
  async function login(email, password) {
    dispatch(loginStart());
    try {
      const response = await api.login(email, password);

      // Support both flat response and nested data wrapper shapes
      const userData = response.user || (response.data && response.data.user);
      const userRole = response.role || (response.data && response.data.role) || userData?.role;

      if (response.success && userData) {
        dispatch(loginSuccess({ user: userData, role: userRole }));

        // Persist session so page refresh doesn't lose auth state
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify({ user: userData, role: userRole }));
          // Keep legacy key for apiSlice prepareHeaders compatibility
          localStorage.setItem('persist:auth', JSON.stringify({ role: userRole }));
        } catch (_) {}

        const destPath = ROLE_HOME[userRole] || '/admin';
        navigate(destPath, { replace: true });
        return { success: true };
      } else {
        const errMsg = response.message || response.error || 'Invalid email or password.';
        dispatch(loginFailure(errMsg));
        return { success: false, error: errMsg };
      }
    } catch (err) {
      const errMsg = err.message || 'Failed to connect to server.';
      dispatch(loginFailure(errMsg));
      return { success: false, error: errMsg };
    }
  }

  function logout() {
    dispatch(logoutAction());
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('persist:auth');
    } catch (_) {}
    navigate('/login', { replace: true });
  }

  return { user, role, isAuthenticated, isLoading, error, login, logout };
}
