import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import store from './app/store';
import router from './app/router';

// Purge any legacy phone or name blocklists from localStorage so newly registered patients are never suppressed
try {
  const rawDel = localStorage.getItem('ddc_deleted_patients');
  if (rawDel) {
    const parsed = JSON.parse(rawDel);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(x => !String(x).startsWith('phone:') && !String(x).startsWith('name:'));
      localStorage.setItem('ddc_deleted_patients', JSON.stringify(cleaned));
    }
  }
} catch (_) {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
