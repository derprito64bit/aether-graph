import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/space-grotesk'
import './index.css'
import { App } from './App.tsx'

const rootEl = document.getElementById('root')
if (rootEl !== null) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
