import { Outlet } from 'react-router-dom';

/**
 * Root layout — minimal wrapper for the entire app.
 * Individual role layouts handle their own shells.
 */
export default function RootLayout() {
  return <Outlet />;
}
