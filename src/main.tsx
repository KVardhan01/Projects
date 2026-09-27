import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Purge any stale legacy demo or test session keys on load
try {
  localStorage.removeItem('qll_current_user_v1');
  localStorage.removeItem('qll_demo_role');
  localStorage.removeItem('qubify_demo_mode');
  localStorage.removeItem('qubify_role');
  localStorage.removeItem('demo_role');
  localStorage.removeItem('qll_users_v1');
  localStorage.removeItem('qll_demo_user');
  localStorage.removeItem('user');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('role');
  localStorage.removeItem('qubify_google_client_id');
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
