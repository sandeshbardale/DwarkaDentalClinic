import { useSelector, useDispatch } from 'react-redux';
import { markAsRead, markAllAsRead } from '../app/store';

/**
 * Hook for managing notifications state.
 */
export function useNotifications() {
  const dispatch = useDispatch();
  const { list } = useSelector(state => state.notifications);
  const { role } = useSelector(state => state.auth);

  const roleNotifications = list.filter(n => n.role === role);
  const unreadCount = roleNotifications.filter(n => !n.read).length;

  return {
    notifications: roleNotifications,
    unreadCount,
    markAsRead: (id) => dispatch(markAsRead(id)),
    markAllAsRead: () => dispatch(markAllAsRead()),
  };
}
