import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../app/store';
import { ROLE_HOME } from '../data/users';
import { api } from '../utils/api';

/**
 * Hook for authentication state and actions connected to Backend.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, isAuthenticated, isLoading, error } = useSelector(state => state.auth);

  /**
   * Real login - calls Express SQLite backend API.
   * @param {string} email
   * @param {string} password
   */
  async function login(email, password) {
    dispatch(loginStart());
    try {
      const response = await api.login(email, password);
      if (response.success) {
        dispatch(loginSuccess({ user: response.user, role: response.role }));
        
        // Save role in local storage for api headers
        localStorage.setItem('persist:auth', JSON.stringify({ role: response.role }));
        
        navigate(ROLE_HOME[response.role]);
        return { success: true };
      } else {
        dispatch(loginFailure(response.error || 'Invalid email or password.'));
        return { success: false };
      }
    } catch (err) {
      dispatch(loginFailure(err.message || 'Failed to connect to server.'));
      return { success: false };
    }
  }

  function logout() {
    dispatch(logoutAction());
    localStorage.removeItem('persist:auth');
    navigate('/login');
  }

  return { user, role, isAuthenticated, isLoading, error, login, logout };
}
