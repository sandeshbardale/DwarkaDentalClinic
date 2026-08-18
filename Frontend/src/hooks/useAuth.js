import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../app/store';
import { MOCK_USERS, ROLE_HOME } from '../data/users';

/**
 * Hook for authentication state and actions.
 * Replace the mock loginUser function with a real API call in production.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, isAuthenticated, isLoading, error } = useSelector(state => state.auth);

  /**
   * Mock login — simulates async API call.
   * @param {string} email
   * @param {string} password
   */
  async function login(email, password) {
    dispatch(loginStart());
    // Simulate network latency
    await new Promise(r => setTimeout(r, 800));

    const found = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (found) {
      // Omit password from stored user object
      const { password: _pw, ...safeUser } = found;
      dispatch(loginSuccess({ user: safeUser, role: found.role }));
      navigate(ROLE_HOME[found.role]);
      return { success: true };
    } else {
      dispatch(loginFailure('Invalid email or password. Please try again.'));
      return { success: false };
    }
  }

  function logout() {
    dispatch(logoutAction());
    navigate('/login');
  }

  return { user, role, isAuthenticated, isLoading, error, login, logout };
}
