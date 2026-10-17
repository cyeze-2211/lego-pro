import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from './Components/ui/provider'

// Prodda qaysi sborka turganini tez aniqlash uchun (DevTools → Console)
console.info(`%cLego ERP build ${__APP_BUILD__.hash} · ${__APP_BUILD__.time}`, 'color:#CA8A04;font-weight:bold');

// number-wheel-guard: sichqoncha g‘ildiragi fokusdagi <input type="number"> qiymatini o‘zgartirmasin.
// Fokusni olib qo‘yamiz — sahifa odatdagidek aylanadi, qiymat esa joyida qoladi.
document.addEventListener('wheel', (event) => {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement && el.type === 'number' && el.contains(event.target)) el.blur();
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider>
      <App />
    </Provider>
  </StrictMode>,
)