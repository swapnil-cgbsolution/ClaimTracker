import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initialize as initializePowerApps } from '@microsoft/power-apps/app'
import './index.css'
import App from './App.tsx'

async function bootstrap() {
  try {
    await initializePowerApps()
  } catch (error) {
    console.error('Power Apps host failed to initialize', error)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
