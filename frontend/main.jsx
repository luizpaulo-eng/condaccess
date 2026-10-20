import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * main.jsx - Ponto de Entrada do Vite no Frontend do CondAccess
 * Renderiza o componente central <App /> que gerencia o roteamento de perfis:
 * - Administrador Master / Síndico -> AdminPanel
 * - Portaria -> DeliveryAlert (Visão Operacional)
 * - Morador -> DeliveryAlert (Visão da Unidade)
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
