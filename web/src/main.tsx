import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './premium.css'
import './measured-glass.css'
import './theme.css'
import './atlas.css'
import './expansion.css'
import './syllabus.css'
import './syllabus-hub.css'
import './editorial.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
