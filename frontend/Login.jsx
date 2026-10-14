import React, { useState } from 'react';

/**
 * Login Component (v1) - CondAccess
 * Componente React de Autenticação Acessível (WCAG 2.1 AA)
 * Suporta JWT Tokens, Perfis (Portaria/Morador), Modo Alto Contraste e Leitores de Tela.
 * Condomínio Residencial Jardins do Tatuapé
 */

const getApiBaseUrl = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (err) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
  } catch (err) {}
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

// Usuários de Demonstração / Teste Rápido (Dev Mode)
const DEMO_USERS = {
  portaria: {
    email: 'porteiro@jardinstatuape.com.br',
    password: 'senha123porteiro',
    role: 'portaria',
    nome: 'Carlos Silva (Portaria Social)',
    userId: '98765432-e89b-12d3-a456-426614174000',
    apartmentId: null
  },
  morador: {
    email: 'morador101@jardinstatuape.com.br',
    password: 'senha123morador',
    role: 'morador',
    nome: 'Ana Oliveira (Bloco 1 - Apto 101)',
    userId: '11223344-e89b-12d3-a456-426614174000',
    apartmentId: '123e4567-e89b-12d3-a456-426614174000'
  }
};

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('portaria');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [highContrast, setHighContrast] = useState(false);

  // Preenche credenciais de teste com 1 clique
  const handleQuickDemo = (role) => {
    const demo = DEMO_USERS[role];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      setSelectedRole(role);
      setErrorMsg('');
      setAnnouncement(`Credenciais de teste para ${demo.nome} preenchidas.`);
    }
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setErrorMsg('');
    setAnnouncement('');

    if (!email.trim() || !password.trim()) {
      const msg = 'Por favor, preencha o e-mail e a senha.';
      setErrorMsg(msg);
      setAnnouncement(msg);
      return;
    }

    setLoading(true);
    setAnnouncement('Autenticando credenciais no servidor...');

    try {
      // Requisição POST ao backend FastAPI
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          role: selectedRole
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Armazena Token JWT e dados da sessão
        if (data.access_token) {
          localStorage.setItem('condaccess_token', data.access_token);
        }
        localStorage.setItem('condaccess_user', JSON.stringify(data.user || { email, role: selectedRole }));
        
        setAnnouncement('Login realizado com sucesso! Redirecionando...');
        if (onLoginSuccess) {
          onLoginSuccess(data.user || { email, role: selectedRole }, data.access_token);
        }
      } else {
        // Trata erro de autenticação ou se API não estiver rodando
        throw new Error(`Código ${response.status}`);
      }
    } catch (err) {
      console.warn('Erro na requisição ao backend. Verificando modo demo local:', err);

      // Fallback para Modo Demo se as credenciais baterem com os usuários de teste
      const demoUser = DEMO_USERS[selectedRole];
      if (email.trim() === demoUser.email && password === demoUser.password) {
        const mockToken = `mock-jwt-token-${Date.now()}`;
        const userData = {
          id: demoUser.userId,
          nome: demoUser.nome,
          email: demoUser.email,
          role: demoUser.role,
          apartmentId: demoUser.apartmentId
        };

        localStorage.setItem('condaccess_token', mockToken);
        localStorage.setItem('condaccess_user', JSON.stringify(userData));

        setAnnouncement('Login de teste autenticado com sucesso no modo local!');
        if (onLoginSuccess) {
          onLoginSuccess(userData, mockToken);
        }
      } else {
        const failMsg = 'E-mail ou senha incorretos. Tente novamente ou use as credenciais de teste.';
        setErrorMsg(failMsg);
        setAnnouncement(failMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cores do tema (Acessibilidade e Alto Contraste)
  const theme = {
    bg: highContrast ? '#000000' : '#f4f6f8',
    text: highContrast ? '#ffffff' : '#1e293b',
    cardBg: highContrast ? '#111111' : '#ffffff',
    border: highContrast ? '#ffff00' : '#cbd5e1',
    inputBg: highContrast ? '#000000' : '#ffffff',
    inputText: highContrast ? '#ffffff' : '#0f172a',
    inputBorder: highContrast ? '#ffff00' : '#94a3b8',
    btnPrimaryBg: highContrast ? '#ffff00' : '#2563eb',
    btnPrimaryText: highContrast ? '#000000' : '#ffffff',
    btnSecondaryBg: highContrast ? '#333333' : '#e2e8f0',
    btnSecondaryText: highContrast ? '#ffffff' : '#334155',
    errorBg: highContrast ? '#450a0a' : '#fef2f2',
    errorText: highContrast ? '#fca5a5' : '#991b1b',
    errorBorder: highContrast ? '#ef4444' : '#f87171'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: theme.bg,
      color: theme.text,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Região Anunciadora para Leitores de Tela (Acessibilidade) */}
      <div 
        aria-live="polite" 
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}
      >
        {announcement}
      </div>

      {/* Cabeçalho de Controle de Acessibilidade */}
      <header style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button
          onClick={() => setHighContrast(!highContrast)}
          style={{
            minHeight: '44px',
            padding: '8px 16px',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: theme.btnSecondaryBg,
            color: theme.btnSecondaryText,
            border: `2px solid ${theme.border}`,
            borderRadius: '6px'
          }}
          aria-label={highContrast ? "Desativar Alto Contraste" : "Ativar Alto Contraste"}
        >
          {highContrast ? "Contraste Padrão" : "Alto Contraste"}
        </button>
      </header>

      {/* Card Principal do Formulário */}
      <main style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: theme.cardBg,
        border: `2px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '28px 24px',
        boxShadow: highContrast ? 'none' : '0 10px 15px -3px rgba(0,0,0,0.1)'
      }}>
        
        {/* Identificação do Sistema */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 6px 0', color: theme.text }}>
            CondAccess
          </h1>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.85 }}>
            Sistema Acessível de Portaria e Encomendas
          </p>
          <small style={{ display: 'block', marginTop: '4px', fontSize: '0.85rem', color: highContrast ? '#ffff00' : '#2563eb', fontWeight: '600' }}>
            Condomínio Residencial Jardins do Tatuapé
          </small>
        </div>

        {/* Mensagem de Erro com Alto Contraste e ARIA */}
        {errorMsg && (
          <div 
            role="alert" 
            style={{
              backgroundColor: theme.errorBg,
              color: theme.errorText,
              border: `1.5px solid ${theme.errorBorder}`,
              borderRadius: '6px',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '0.95rem',
              fontWeight: 'bold'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Seletor de Perfil (Portaria / Morador) */}
          <fieldset style={{
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: '6px',
            padding: '12px 14px',
            margin: 0
          }}>
            <legend style={{ fontWeight: 'bold', padding: '0 6px', fontSize: '0.9rem', color: theme.text }}>
              Perfil de Acesso *
            </legend>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', minHeight: '36px' }}>
                <input
                  type="radio"
                  name="userRole"
                  value="portaria"
                  checked={selectedRole === 'portaria'}
                  onChange={() => setSelectedRole('portaria')}
                  style={{ width: '20px', height: '20px' }}
                />
                Portaria / Admin
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', minHeight: '36px' }}>
                <input
                  type="radio"
                  name="userRole"
                  value="morador"
                  checked={selectedRole === 'morador'}
                  onChange={() => setSelectedRole('morador')}
                  style={{ width: '20px', height: '20px' }}
                />
                Morador
              </label>
            </div>
          </fieldset>

          {/* Campo de E-mail */}
          <div>
            <label htmlFor="login-email" style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.95rem' }}>
              E-mail ou Usuário *
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@jardinstatuape.com.br"
              required
              aria-required="true"
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '10px 14px',
                fontSize: '1rem',
                borderRadius: '6px',
                border: `1.5px solid ${theme.inputBorder}`,
                backgroundColor: theme.inputBg,
                color: theme.inputText,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Campo de Senha com Opção Exibir/Ocultar */}
          <div>
            <label htmlFor="login-password" style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.95rem' }}>
              Senha de Acesso *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                aria-required="true"
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: '10px 48px 10px 14px',
                  fontSize: '1rem',
                  borderRadius: '6px',
                  border: `1.5px solid ${theme.inputBorder}`,
                  backgroundColor: theme.inputBg,
                  color: theme.inputText,
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  minHeight: '36px',
                  padding: '4px 10px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  background: 'none',
                  border: 'none',
                  color: highContrast ? '#ffff00' : '#2563eb',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? "Ocultar" : "Exibir"}
              </button>
            </div>
          </div>

          {/* Botão Principal de Login */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '12px',
              fontSize: '1.05rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: theme.btnPrimaryBg,
              color: theme.btnPrimaryText,
              border: `2px solid ${theme.border}`,
              borderRadius: '6px',
              marginTop: '6px',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>

        {/* Seção de Atalho para Testes de Demonstração (Dev / Avaliação) */}
        <section style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: `1px solid ${theme.border}`,
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', opacity: 0.85, fontWeight: 'bold' }}>
            Atalhos para Teste e Avaliação Rápida (Dev Mode):
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('portaria')}
              style={{
                minHeight: '40px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: theme.btnSecondaryBg,
                color: theme.btnSecondaryText,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px'
              }}
            >
              Demo Portaria
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('morador')}
              style={{
                minHeight: '40px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: theme.btnSecondaryBg,
                color: theme.btnSecondaryText,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px'
              }}
            >
              Demo Morador
            </button>
          </div>
        </section>
      </main>

      {/* Rodapé Informativo */}
      <footer style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', opacity: 0.75 }}>
        CondAccess &copy; 2026 — Projeto Integrador II (UNIVESP PJI240)
      </footer>
    </div>
  );
}
