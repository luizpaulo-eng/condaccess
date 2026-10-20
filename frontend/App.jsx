import React, { useState, useEffect } from 'react';
import Login from './Login';
import DeliveryAlert from './DeliveryAlert';
import AdminPanel from './AdminPanel';

/**
 * App Component (v1) - CondAccess
 * Componente Principal e Roteador da Aplicação
 *
 * Gerencia a navegação com base no perfil do usuário logado:
 * - Administrator / Admin -> Exibe o Painel Administrativo (com alternância opcional para Painel de Encomendas)
 * - Portaria / Doorman -> Exibe o Painel de Encomendas (Visão Geral Portaria)
 * - Morador / Resident -> Exibe o Painel de Encomendas (Visão do Apartamento)
 */
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('condaccess_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // Estado para Administrador alternar entre o Painel Admin e a Visão da Portaria
  const [adminView, setAdminView] = useState('admin'); // 'admin' ou 'encomendas'

  useEffect(() => {
    if (user) {
      localStorage.setItem('condaccess_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('condaccess_user');
      localStorage.removeItem('condaccess_token');
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Se for admin, garante que a visualização inicial seja o Painel Admin
    if (userData.role === 'administrator' || userData.role === 'admin') {
      setAdminView('admin');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('condaccess_user');
    localStorage.removeItem('condaccess_token');
  };

  // 1. Tela de Login (Usuário não autenticado)
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user.role === 'administrator' || user.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de Navegação Superior e Logout */}
      <nav style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <strong style={{ fontSize: '1.2rem', color: '#60a5fa' }}>CondAccess</strong>
          <span style={{ fontSize: '0.9rem', opacity: 0.9, backgroundColor: '#1e293b', padding: '4px 10px', borderRadius: '4px' }}>
            Usuário: <strong>{user.nome || user.name || user.email}</strong> | Perfil: <strong>{isAdmin ? '👑 Administrador' : user.role === 'portaria' || user.role === 'doorman' ? '🛡️ Portaria' : '🏡 Morador'}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Se for Administrador, permite alternar entre o Painel Admin e o Painel de Encomendas */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '6px' }}>
              <button
                onClick={() => setAdminView('admin')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: adminView === 'admin' ? '#2563eb' : 'transparent',
                  color: '#ffffff'
                }}
              >
                👑 Painel Admin
              </button>
              <button
                onClick={() => setAdminView('encomendas')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: adminView === 'encomendas' ? '#2563eb' : 'transparent',
                  color: '#ffffff'
                }}
              >
                📦 Painel de Encomendas
              </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px'
            }}
          >
            Sair 🚪
          </button>
        </div>
      </nav>

      {/* Conteúdo do Painel de acordo com o perfil e seleção */}
      <div style={{ flex: 1 }}>
        {isAdmin ? (
          adminView === 'admin' ? (
            <AdminPanel user={user} />
          ) : (
            <DeliveryAlert user={user} />
          )
        ) : (
          <DeliveryAlert user={user} />
        )}
      </div>
    </div>
  );
}
