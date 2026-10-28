import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/archivo/wdth.css'
import './index.css'
import { App } from './App.tsx'
import { startLoader } from './loader/loader.ts'

// The loading page takes over from its boot script before React renders.
startLoader()

const rootEl = document.getElementById('root')
if (rootEl !== null) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
