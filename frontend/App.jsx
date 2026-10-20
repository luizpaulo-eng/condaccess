import React, { useState, useEffect } from 'react';
import Login from './Login';
import DeliveryAlert from './DeliveryAlert';
import AdminPanel from './AdminPanel';

/**
 * App Component (v4 - Auto-Healing Master Admin Routing) - CondAccess
 * Componente Principal e Roteador da Aplicação com Correção Automática de Sessão
 */
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('condaccess_user');
      if (!stored) return null;
      let parsed = JSON.parse(stored);
      
      // AUTO-HEAL: Se o e-mail ou nome for Master, força a role para administrator e is_master para true
      if (parsed && (parsed.email?.toLowerCase() === 'master@jardinstatuape.com.br' || parsed.is_master || parsed.nome?.includes('Master'))) {
        parsed = {
          ...parsed,
          email: 'master@jardinstatuape.com.br',
          nome: 'Administrador Master (Root System)',
          role: 'administrator',
          is_master: true
        };
        localStorage.setItem('condaccess_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  // Estado para Administrador alternar entre Painel Admin e Painel de Encomendas
  const [adminView, setAdminView] = useState('admin'); // 'admin' ou 'encomendas'

  useEffect(() => {
    if (user) {
      // Garantia contínua de integridade para a Conta Master
      let activeUser = user;
      if (activeUser.email?.toLowerCase() === 'master@jardinstatuape.com.br' || activeUser.is_master || activeUser.nome?.includes('Master')) {
        if (activeUser.role !== 'administrator' || !activeUser.is_master) {
          activeUser = {
            ...activeUser,
            email: 'master@jardinstatuape.com.br',
            nome: 'Administrador Master (Root System)',
            role: 'administrator',
            is_master: true
          };
          setUser(activeUser);
        }
      }
      localStorage.setItem('condaccess_user', JSON.stringify(activeUser));
    } else {
      localStorage.removeItem('condaccess_user');
      localStorage.removeItem('condaccess_token');
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    let activeUser = userData;
    if (activeUser && (activeUser.email?.toLowerCase() === 'master@jardinstatuape.com.br' || activeUser.is_master || activeUser.nome?.includes('Master'))) {
      activeUser = {
        ...activeUser,
        email: 'master@jardinstatuape.com.br',
        nome: 'Administrador Master (Root System)',
        role: 'administrator',
        is_master: true
      };
    }
    setUser(activeUser);
    localStorage.setItem('condaccess_user', JSON.stringify(activeUser));
    
    // Se for admin, direciona obrigatoriamente para a aba do Painel Admin
    if (activeUser.role === 'administrator' || activeUser.role === 'admin' || activeUser.is_master) {
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

  // Checagem absoluta de privilégios de Administrador
  const isAdmin = 
    user?.role === 'administrator' || 
    user?.role === 'admin' || 
    user?.is_master === true || 
    user?.email?.toLowerCase() === 'master@jardinstatuape.com.br' ||
    user?.email?.toLowerCase() === 'admin@jardinstatuape.com.br' ||
    (user?.nome && (user.nome.includes('Master') || user.nome.includes('Síndica')));

  const isDoorman = !isAdmin && (user?.role === 'portaria' || user?.role === 'doorman');

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
            Usuário: <strong>{user.nome || user.name || user.email}</strong> | Perfil: <strong>{isAdmin ? (user.is_master ? '👑 Administrador Master' : '👑 Administrador') : isDoorman ? '🛡️ Portaria' : '🏡 Morador'}</strong>
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
