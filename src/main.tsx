import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { AppProviders } from '@/app/AppProviders'
import App from '@/App'
import '@/index.css'

const routerMode = import.meta.env.VITE_ROUTER_MODE
const app = (
  <AppProviders>
    <App />
  </AppProviders>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {routerMode === 'hash' ? <HashRouter>{app}</HashRouter> : <BrowserRouter basename={import.meta.env.BASE_URL}>{app}</BrowserRouter>}
  </StrictMode>,
)
