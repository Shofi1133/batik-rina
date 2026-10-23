import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import './styles.css'

const Root = window.location.pathname.startsWith('/dashboard/products') ? AdminDashboard : App

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
