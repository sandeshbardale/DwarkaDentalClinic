import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../app/store';
import { ROLE_HOME } from '../constants/routes';
import { api } from '../utils/api';

const SESSION_KEY = 'ddc:session';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, token, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  async function login(email, password) {
    dispatch(loginStart());
    try {
      const response = await api.login(email, password);
      const data = response.data || response;
      const userData = data.user;
      const userRole = data.role || userData?.role;
      const userToken = data.token;

      if (response.success && userData) {
        dispatch(loginSuccess({ user: userData, role: userRole, token: userToken }));

        // Persist full session including JWT token
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify({ user: userData, role: userRole, token: userToken }));
        } catch (_) {}

        const destPath = ROLE_HOME[userRole] || '/admin';
        navigate(destPath, { replace: true });
        return { success: true };
      } else {
        const errMsg = response.message || 'Invalid email or password.';
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
    } catch (_) {}
    navigate('/login', { replace: true });
  }

  return { user, role, token, isAuthenticated, isLoading, error, login, logout };
}
