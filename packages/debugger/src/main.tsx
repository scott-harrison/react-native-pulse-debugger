import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './styles.css'

// Create root element if it doesn't exist
const rootElement = document.getElementById('root') || document.createElement('div')
if (!rootElement.id) {
  rootElement.id = 'root'
  document.body.appendChild(rootElement)
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
