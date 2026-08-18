import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Route guard — redirects unauthenticated users to /login
 * and wrong-role users to /unauthorized.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string|string[]} props.allowedRoles
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useSelector(state => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
