import React, { useState, useEffect, useCallback } from 'react';

/**
 * AdminPanel Component (v2 - Super Admin Master Protection) - CondAccess
 * Painel Administrativo de Gestão e Governança Total do Condomínio.
 * 
 * Funcionalidades do Administrador Master:
 * 1. Conta Root / Master inviolável (master@jardinstatuape.com.br), protegida contra exclusão e desativação.
 * 2. Permissão total para cadastrar todas as demais contas (Administradores, Portaria, Zeladoria e Moradores).
 * 3. Gestão e alteração de permissões/perfis em tempo real.
 * 4. Mapeamento de 5 Blocos e 340 unidades com estatísticas de ocupação.
 * 5. Logs de auditoria para rastreabilidade do sistema.
 */

const getApiBaseUrl = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
  } catch (e) {}
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

// Conta Master do Sistema + Usuários Padrão para Demonstração
const INITIAL_ADMIN_USERS = [
  { 
    id: '00000000-0000-4000-a000-000000000000', 
    name: 'Administrador Master (Root System)', 
    email: 'master@jardinstatuape.com.br', 
    role: 'administrator', 
    is_master: true, 
    apartment: 'Gestão Central / TI', 
    status: 'Ativo (Inviolável)', 
    created_at: '2026-01-01' 
  },
  { 
    id: '00000000-0000-4000-a000-000000000001', 
    name: 'Sílvia Ramos (Síndica Geral)', 
    email: 'admin@jardinstatuape.com.br', 
    role: 'administrator', 
    is_master: false, 
    apartment: 'Administração', 
    status: 'Ativo', 
    created_at: '2026-01-10' 
  },
  { 
    id: '98765432-e89b-12d3-a456-426614174000', 
    name: 'Carlos Silva (Porteiro Social)', 
    email: 'porteiro@jardinstatuape.com.br', 
    role: 'doorman', 
    is_master: false, 
    apartment: 'Portaria Social', 
    status: 'Ativo', 
    created_at: '2026-02-15' 
  },
  { 
    id: '88765432-e89b-12d3-a456-426614174111', 
    name: 'Francisco Santos (Zelador)', 
    email: 'zelador@jardinstatuape.com.br', 
    role: 'janitor', 
    is_master: false, 
    apartment: 'Zeladoria Central', 
    status: 'Ativo', 
    created_at: '2026-03-01' 
  },
  { 
    id: '11223344-e89b-12d3-a456-426614174000', 
    name: 'Ana Oliveira', 
    email: 'morador101@jardinstatuape.com.br', 
    role: 'resident', 
    is_master: false, 
    apartment: 'Bloco 1 - Apto 101', 
    status: 'Ativo', 
    created_at: '2026-03-20' 
  },
  { 
    id: '22334455-e89b-12d3-a456-426614174000', 
    name: 'Roberto Almeida', 
    email: 'morador202@jardinstatuape.com.br', 
    role: 'resident', 
    is_master: false, 
    apartment: 'Bloco 2 - Apto 202', 
    status: 'Ativo', 
    created_at: '2026-04-05' 
  }
];

const getStoredUsersList = () => {
  try {
    const raw = localStorage.getItem('condaccess_users_db');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Garante que a Conta Master inviolável sempre esteja no topo da lista
      const hasMaster = parsed.some(u => u.is_master || u.id === '00000000-0000-4000-a000-000000000000');
      if (!hasMaster) {
        return [INITIAL_ADMIN_USERS[0], ...parsed];
      }
      return parsed;
    }
  } catch (e) {}
  return INITIAL_ADMIN_USERS;
};

const saveUsersList = (list) => {
  try {
    localStorage.setItem('condaccess_users_db', JSON.stringify(list));
  } catch (e) {}
};

export default function AdminPanel({ user = null, onLogout = null }) {
  const [usersList, setUsersList] = useState(getStoredUsersList);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'units', 'logs'
  const [highContrast, setHighContrast] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [bannerMessage, setBannerMessage] = useState(null);

  // Estados para o formulário modal (Novo usuário ou alteração de permissão)
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('resident');
  const [newApartment, setNewApartment] = useState('Bloco 1 - Apto 101');

  // Atualiza localStorage sempre que usersList mudar
  useEffect(() => {
    saveUsersList(usersList);
  }, [usersList]);

  // Abre formulário para cadastrar novo usuário
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('resident');
    setNewApartment('Bloco 1 - Apto 101');
    setShowUserModal(true);
  };

  // Abre formulário para editar permissões de um usuário existente
  const handleOpenEditUser = (u) => {
    setEditingUserId(u.id);
    setNewName(u.name);
    setNewEmail(u.email);
    setNewPassword('');
    setNewRole(u.role);
    setNewApartment(u.apartment || 'Administração');
    setShowUserModal(true);
  };

  // Processa o salvamento do usuário
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert('Por favor, preencha o Nome e o E-mail do usuário.');
      return;
    }

    if (editingUserId) {
      // Edição de Permissões
      setUsersList(prev => {
        const updated = prev.map(u => {
          if (u.id === editingUserId) {
            // Proteção: A Conta Master não pode perder o papel de administrator
            if (u.is_master && newRole !== 'administrator') {
              alert('🔒 A Conta Master do Sistema deve manter o perfil de Administrador.');
              return { ...u, name: newName, email: newEmail, apartment: newApartment };
            }
            return {
              ...u,
              name: newName,
              email: newEmail,
              role: newRole,
              apartment: newApartment
            };
          }
          return u;
        });
        return updated;
      });

      const msg = `✅ Permissões de "${newName}" atualizadas com sucesso para ${newRole.toUpperCase()}!`;
      setBannerMessage({ type: 'success', text: msg });
      setAnnouncement(msg);
    } else {
      // Novo Cadastro pelo Administrador Master
      const newUser = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
        name: newName,
        email: newEmail,
        role: newRole,
        is_master: false,
        apartment: newApartment,
        status: 'Ativo',
        created_at: new Date().toISOString().split('T')[0]
      };

      setUsersList(prev => [newUser, ...prev]);
      const msg = `✅ Nova conta cadastrada com sucesso: "${newName}" (${newRole.toUpperCase()})!`;
      setBannerMessage({ type: 'success', text: msg });
      setAnnouncement(msg);
    }

    setShowUserModal(false);
  };

  // Alterna status Ativo / Inativo com proteção rígida para a Conta Master
  const handleToggleStatus = (userId, currentName, currentStatus) => {
    const target = usersList.find(u => u.id === userId);
    if (target && (target.is_master || target.id === '00000000-0000-4000-a000-000000000000' || target.email === 'master@jardinstatuape.com.br')) {
      const lockMsg = '🔒 AÇÃO BLOQUEADA: A Conta Master de Administrador é inviolável e protegida contra desativação ou exclusão!';
      alert(lockMsg);
      setBannerMessage({ type: 'error', text: lockMsg });
      setAnnouncement(lockMsg);
      return;
    }

    const nextStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    const msg = `Status do usuário "${currentName}" alterado para ${nextStatus}.`;
    setBannerMessage({ type: 'info', text: msg });
    setAnnouncement(msg);
  };

  // Exclusão definitiva com proteção rígida para a Conta Master
  const handleDeleteUser = (userId, currentName) => {
    const target = usersList.find(u => u.id === userId);
    if (target && (target.is_master || target.id === '00000000-0000-4000-a000-000000000000' || target.email === 'master@jardinstatuape.com.br')) {
      const lockMsg = '🔒 AÇÃO BLOQUEADA: A Conta Master de Administrador é a raiz do sistema e não pode ser excluída!';
      alert(lockMsg);
      setBannerMessage({ type: 'error', text: lockMsg });
      setAnnouncement(lockMsg);
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir permanentemente a conta de "${currentName}"?`)) {
      setUsersList(prev => prev.filter(u => u.id !== userId));
      const msg = `Conta de "${currentName}" removida do sistema com sucesso.`;
      setBannerMessage({ type: 'info', text: msg });
      setAnnouncement(msg);
    }
  };

  const theme = {
    bg: highContrast ? '#000000' : '#f8fafc',
    text: highContrast ? '#ffffff' : '#0f172a',
    cardBg: highContrast ? '#111111' : '#ffffff',
    border: highContrast ? '#ffff00' : '#e2e8f0',
    btnPrimaryBg: highContrast ? '#ffff00' : '#2563eb',
    btnPrimaryText: highContrast ? '#000000' : '#ffffff',
    btnSuccessBg: highContrast ? '#00ff00' : '#16a34a',
    btnSuccessText: highContrast ? '#000000' : '#ffffff',
    btnDangerBg: highContrast ? '#ff0000' : '#dc2626',
    btnDangerText: '#ffffff'
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      
      {/* LEITORES DE TELA (ARIA-LIVE) */}
      <div aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}>
        {announcement}
      </div>

      {/* CABEÇALHO PRINCIPAL DO PAINEL ADMINISTRATIVO */}
      <header style={{ borderBottom: `2px solid ${theme.border}`, paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>CondAccess - Painel de Controle Master do Administrador</h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.85, fontSize: '0.95rem' }}>
            Condomínio Residencial Jardins do Tatuapé | <strong>Conta Ativa: {user?.nome || 'Administrador Master (Root System)'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setHighContrast(!highContrast)}
            style={{ minHeight: '48px', padding: '10px 18px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: `2px solid ${theme.border}`, borderRadius: '6px' }}
          >
            {highContrast ? "Contraste Padrão" : "Alto Contraste"}
          </button>
          
          {onLogout && (
            <button 
              onClick={onLogout}
              style={{ minHeight: '48px', padding: '10px 18px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px' }}
            >
              Sair da Conta
            </button>
          )}
        </div>
      </header>

      {/* BANNER VISÍVEL DE MENSAGENS */}
      {bannerMessage && (
        <div style={{ marginTop: '16px', padding: '14px 20px', backgroundColor: bannerMessage.type === 'error' ? (highContrast ? '#450a0a' : '#fef2f2') : (highContrast ? '#003300' : '#dcfce7'), color: bannerMessage.type === 'error' ? (highContrast ? '#ff9999' : '#991b1b') : (highContrast ? '#00ff00' : '#14532d'), border: `2px solid ${bannerMessage.type === 'error' ? '#ef4444' : (highContrast ? '#00ff00' : '#86efac')}`, borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{bannerMessage.text}</span>
          <button onClick={() => setBannerMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* ABAS NAVEGÁVEIS */}
      <nav style={{ marginTop: '24px', display: 'flex', gap: '12px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ minHeight: '44px', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'users' ? theme.btnPrimaryBg : theme.cardBg, color: activeTab === 'users' ? theme.btnPrimaryText : theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px' }}
        >
          👥 Gestão de Usuários e Permissões ({usersList.length})
        </button>
        <button 
          onClick={() => setActiveTab('units')}
          style={{ minHeight: '44px', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'units' ? theme.btnPrimaryBg : theme.cardBg, color: activeTab === 'units' ? theme.btnPrimaryText : theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px' }}
        >
          🏢 Blocos e Unidades (5 Blocos / 340 Aptos)
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{ minHeight: '44px', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'logs' ? theme.btnPrimaryBg : theme.cardBg, color: activeTab === 'logs' ? theme.btnPrimaryText : theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px' }}
        >
          📊 Logs de Auditoria do Sistema
        </button>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main style={{ marginTop: '24px' }}>
        
        {/* ABA 1: GESTÃO DE USUÁRIOS */}
        {activeTab === 'users' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Gerenciamento do Cadastro Geral de Usuários</h2>
                <small style={{ opacity: '0.8' }}>A partir desta conta Master, é possível criar, editar permissões ou remover qualquer outra conta do condomínio.</small>
              </div>
              <button 
                onClick={handleOpenAddUser}
                style={{ minHeight: '48px', padding: '12px 20px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnSuccessBg, color: theme.btnSuccessText, border: 'none', borderRadius: '6px' }}
              >
                + Cadastrar Novo Usuário / Funcionário
              </button>
            </div>

            {/* TABELA DE USUÁRIOS */}
            <div style={{ overflowX: 'auto', backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                    <th style={{ padding: '12px' }}>Nome</th>
                    <th style={{ padding: '12px' }}>E-mail de Acesso</th>
                    <th style={{ padding: '12px' }}>Perfil / Nível</th>
                    <th style={{ padding: '12px' }}>Unidade / Setor</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Ações de Controle</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isMasterAcc = u.is_master || u.id === '00000000-0000-4000-a000-000000000000' || u.email === 'master@jardinstatuape.com.br';

                    return (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: isMasterAcc ? (highContrast ? '#112200' : '#f0fdf4') : 'transparent' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>
                          {u.name}
                          {isMasterAcc && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#16a34a', fontWeight: 'bold' }}>
                              🔒 CONTA MASTER INVIOLÁVEL
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}><code>{u.email}</code></td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: isMasterAcc ? '#fef08a' : u.role === 'administrator' ? '#fde047' : u.role === 'doorman' ? '#bfdbfe' : u.role === 'janitor' ? '#fed7aa' : '#e2e8f0', color: '#000000' }}>
                            {isMasterAcc ? '👑 Super Admin Master' : u.role === 'administrator' ? '👑 Administrador' : u.role === 'doorman' ? '🛡️ Portaria' : u.role === 'janitor' ? '🔧 Zeladoria' : '🏡 Morador'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{u.apartment}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontWeight: 'bold', color: u.status.includes('Inviolável') || u.status === 'Ativo' ? '#16a34a' : '#dc2626' }}>
                            ● {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleOpenEditUser(u)}
                            style={{ padding: '6px 12px', minHeight: '36px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '4px' }}
                          >
                            ✏️ Editar Permissão
                          </button>
                          
                          {/* BOTÃO DE STATUS (DESATIVADO PARA CONTA MASTER) */}
                          <button 
                            onClick={() => handleToggleStatus(u.id, u.name, u.status)}
                            disabled={isMasterAcc}
                            title={isMasterAcc ? "A Conta Master não pode ser desativada" : "Alternar status da conta"}
                            style={{ 
                              padding: '6px 12px', 
                              minHeight: '36px', 
                              fontSize: '0.85rem', 
                              fontWeight: 'bold', 
                              cursor: isMasterAcc ? 'not-allowed' : 'pointer', 
                              backgroundColor: isMasterAcc ? '#e2e8f0' : u.status === 'Ativo' ? '#fee2e2' : '#dcfce7', 
                              color: isMasterAcc ? '#94a3b8' : u.status === 'Ativo' ? '#991b1b' : '#14532d', 
                              border: 'none', 
                              borderRadius: '4px',
                              opacity: isMasterAcc ? 0.6 : 1
                            }}
                          >
                            {isMasterAcc ? '🔒 Protegida' : u.status === 'Ativo' ? '🚫 Desativar' : '✅ Reativar'}
                          </button>

                          {/* BOTÃO DE EXCLUSÃO (DESATIVADO PARA CONTA MASTER) */}
                          {!isMasterAcc && (
                            <button 
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              style={{ padding: '6px 10px', minHeight: '36px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnDangerBg, color: theme.btnDangerText, border: 'none', borderRadius: '4px' }}
                            >
                              🗑️ Excluir
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* MODAL / FORMULÁRIO DE CADASTRO E EDIÇÃO */}
        {showUserModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '12px', padding: '28px', maxWidth: '540px', width: '90%' }}>
              <h3 style={{ marginTop: 0, fontSize: '1.4rem' }}>
                {editingUserId ? "Alterar Permissões e Perfil do Usuário" : "+ Cadastrar Nova Conta no Sistema"}
              </h3>
              <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Nome Completo *</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Endereço de E-mail (Login) *</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>

                {!editingUserId && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Senha Inicial *</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Senha de acesso" required style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Perfil / Nível de Permissão *</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}>
                    <option value="resident">🏡 Morador (Acesso restrito ao próprio Apto)</option>
                    <option value="doorman">🛡️ Portaria (Controle de encomendas e visitantes)</option>
                    <option value="janitor">🔧 Zeladoria (Acesso a ocorrências e manutenção)</option>
                    <option value="administrator">👑 Administrador do Sistema / Síndico (Acesso Total)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Unidade ou Setor Responsável</label>
                  <input type="text" value={newApartment} onChange={e => setNewApartment(e.target.value)} placeholder="Ex: Bloco 1 - Apto 101 ou Portaria Social" style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowUserModal(false)} style={{ minHeight: '44px', padding: '8px 16px', cursor: 'pointer', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '4px' }}>Cancelar</button>
                  <button type="submit" style={{ minHeight: '44px', padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: 'none', borderRadius: '4px' }}>Salvar Alterações</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ABA 2: ESTRUTURA DO CONDOMÍNIO */}
        {activeTab === 'units' && (
          <section style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '24px' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.4rem' }}>Estrutura de Unidades Habitação - Condomínio Residencial Jardins do Tatuapé</h2>
            <p>O condomínio é composto por <strong>5 Blocos</strong>, com 17 andares cada (4 apartamentos por andar = 68 unidades por bloco), totalizando <strong>340 apartamentos</strong>.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
              <div style={{ border: `1px solid ${theme.border}`, padding: '16px', borderRadius: '6px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>🌳 Bloco 1 - Macieira</h3>
                <small>68 Apartamentos (Aptos 11 ao 174)</small>
                <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#16a34a' }}>68 Moradores Cadastrados</div>
              </div>

              <div style={{ border: `1px solid ${theme.border}`, padding: '16px', borderRadius: '6px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>🍐 Bloco 2 - Pereira</h3>
                <small>68 Apartamentos (Aptos 11 ao 174)</small>
                <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#16a34a' }}>68 Moradores Cadastrados</div>
              </div>

              <div style={{ border: `1px solid ${theme.border}`, padding: '16px', borderRadius: '6px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>🌰 Bloco 3 - Nogueira</h3>
                <small>68 Apartamentos (Aptos 11 ao 174)</small>
                <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#16a34a' }}>68 Moradores Cadastrados</div>
              </div>

              <div style={{ border: `1px solid ${theme.border}`, padding: '16px', borderRadius: '6px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>🫐 Bloco 4 - Amoreira</h3>
                <small>68 Apartamentos (Aptos 11 ao 174)</small>
                <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#16a34a' }}>68 Moradores Cadastrados</div>
              </div>

              <div style={{ border: `1px solid ${theme.border}`, padding: '16px', borderRadius: '6px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>🌸 Bloco 5 - Cerejeira</h3>
                <small>68 Apartamentos (Aptos 11 ao 174)</small>
                <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#16a34a' }}>68 Moradores Cadastrados</div>
              </div>
            </div>
          </section>
        )}

        {/* ABA 3: LOGS DE AUDITORIA */}
        {activeTab === 'logs' && (
          <section style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '24px' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.4rem' }}>Logs de Auditoria e Atividades do Sistema</h2>
            <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ padding: '12px', borderBottom: `1px solid ${theme.border}`, fontSize: '0.95rem' }}>
                <strong>[2026-10-19 18:00]</strong> Conta Master <code>master@jardinstatuape.com.br</code> cadastrou novo usuário no sistema com perfil de Administrador.
              </li>
              <li style={{ padding: '12px', borderBottom: `1px solid ${theme.border}`, fontSize: '0.95rem' }}>
                <strong>[2026-10-19 17:15]</strong> Usuario <code>admin@jardinstatuape.com.br</code> autenticado no painel.
              </li>
              <li style={{ padding: '12px', borderBottom: `1px solid ${theme.border}`, fontSize: '0.95rem' }}>
                <strong>[2026-10-19 16:40]</strong> Porteiro Carlos Silva registrou nova encomenda para o <strong>Bloco 1 - Apto 101</strong> (Notificação por e-mail disparada).
              </li>
              <li style={{ padding: '12px', borderBottom: `1px solid ${theme.border}`, fontSize: '0.95rem' }}>
                <strong>[2026-10-19 15:20]</strong> Moradora Ana Oliveira confirmou a baixa/retirada de pacote no painel do morador.
              </li>
            </ul>
          </section>
        )}

      </main>
    </div>
  );
}
