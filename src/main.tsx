import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Dashboard } from './dashboard/Dashboard';
import './styles.css';

const el = document.getElementById('root');
if (!el) throw new Error('#root not found');

/** 網址加 ?dashboard 進入教官看板 */
const isDashboard = new URLSearchParams(window.location.search).has('dashboard');

createRoot(el).render(
  <StrictMode>{isDashboard ? <Dashboard /> : <App />}</StrictMode>,
);
