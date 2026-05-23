import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts — eliminates the render-blocking Google Fonts CSS link
// and removes the third-party DNS lookup + TCP handshake. Each @fontsource
// import is a small CSS file with @font-face + font-display: swap baked in.
// Only the weights actually used in the design system are imported.
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/700.css'

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
