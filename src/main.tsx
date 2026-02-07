import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import InventoryManager from './pages/InventoryManager.tsx' // Ensure this path is correct
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/inventory" element={<InventoryManager />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)