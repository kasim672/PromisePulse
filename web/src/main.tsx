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
import './algorithm-playground.css'
import './soft-cyan.css'
import './project-assistant.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
