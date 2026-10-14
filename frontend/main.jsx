import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './Login';
import DeliveryAlert from './DeliveryAlert';

function App() {
  const [user, setUser] = useState(null);

  // Carrega a sessão salva no navegador se o usuário já fez login
  useEffect(() => {
    const savedUser = localStorage.getItem('condaccess_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Erro ao carregar sessão:', err);
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('condaccess_token');
    localStorage.removeItem('condaccess_user');
    setUser(null);
  };

  // Exibe a Tela de Login se não houver usuário autenticado
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Exibe o painel de encomendas para o usuário logado
  return (
    <div>
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 24px', 
        backgroundColor: '#1e293b', 
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <span>
          Usuário: <strong>{user.nome || [link suspeito removido]}</strong> | Perfil: <strong>{user.role === 'admin' ? 'Portaria / Admin' : 'Morador'}</strong>
        </span>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#ef4444', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '4px', 
            fontWeight: 'bold', 
            cursor: 'pointer' 
          }}
        >
          Sair
        </button>
      </nav>

      <DeliveryAlert 
        currentUserId={[link suspeito removido] || '98765432-e89b-12d3-a456-426614174000'} 
        apartmentId={user.apartmentId || '123e4567-e89b-12d3-a456-426614174000'} 
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);