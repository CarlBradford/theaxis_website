import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Temporarily disable StrictMode in development to prevent double API calls
// that cause rate limiting issues
const isDevelopment = import.meta.env.DEV;

createRoot(document.getElementById('root')).render(
  isDevelopment ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  )
)
