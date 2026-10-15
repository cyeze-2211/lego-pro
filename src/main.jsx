import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from './Components/ui/provider'

// Prodda qaysi sborka turganini tez aniqlash uchun (DevTools → Console)
console.info(`%cLego ERP build ${__APP_BUILD__.hash} · ${__APP_BUILD__.time}`, 'color:#CA8A04;font-weight:bold');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider>
      <App />
    </Provider>
  </StrictMode>,
)