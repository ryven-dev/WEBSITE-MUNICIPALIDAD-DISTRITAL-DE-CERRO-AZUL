// src/main.tsx

// ------------------------------------------
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import Modal from 'react-modal'; 
import { AuthProvider } from './context/AuthContext'; 

// Vincular el modal al elemento raíz de tu app
Modal.setAppElement('#root'); 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/sgc"> 
     <AuthProvider>
      <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)