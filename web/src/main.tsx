import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './premium.css'
import './measured-glass.css'
import './theme.css'
import './atlas.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
