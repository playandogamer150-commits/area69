import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { OptionalClerkProvider } from '@/integrations/clerk'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionalClerkProvider>
      <App />
    </OptionalClerkProvider>
  </React.StrictMode>,
)
