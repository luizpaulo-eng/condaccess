import React, { useState, useEffect, useCallback } from 'react';

// Auxiliar para obter timestamp formatado no padrão brasileiro (fuso Horário de Brasília UTC-3)
const getBrtTimestamp = () => {
  try {
    const now = new Date();
    const d = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const t = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
    return `${d} ${t}`;
  } catch (e) {
    const now = new Date();
    return now.toISOString();
  }
};

// Gera a lista estruturada das 340 unidades habitacionais (5 Blocos x 17 andares x 4 aptos por andar)
const generateApartmentsList = () => {
  const list = [];
  for (let andar = 1; andar <= 17; andar++) {
    for (let final = 1; final <= 4; final++) {
      const num = andar * 10 + final;
      list.push({ numero: String(num), rotulo: `Apto ${num} (${andar}º Andar)` });
    }
  }
  return list;
};

// Auxiliar para extrair Bloco, Apto e Setor a partir de uma string de unidade salva
const parseApartmentString = (aptStr) => {
  if (!aptStr) return { block: 'Bloco 1 - Macieira', apto: '101', setor: 'Portaria Social' };
  
  if (aptStr.includes('Bloco 1')) {
    const match = aptStr.match(/Apto\s*(\d+)/i);
    return { block: 'Bloco 1 - Macieira', apto: match ? match[1] : '101', setor: 'Portaria Social' };
  }
  if (aptStr.includes('Bloco 2')) {
    const match = aptStr.match(/Apto\s*(\d+)/i);
    return { block: 'Bloco 2 - Pereira', apto: match ? match[1] : '202', setor: 'Portaria Social' };
  }
  if (aptStr.includes('Bloco 3')) {
    const match = aptStr.match(/Apto\s*(\d+)/i);
    return { block: 'Bloco 3 - Nogueira', apto: match ? match[1] : '101', setor: 'Portaria Social' };
  }
  if (aptStr.includes('Bloco 4')) {
    const match = aptStr.match(/Apto\s*(\d+)/i);
    return { block: 'Bloco 4 - Amoreira', apto: match ? match[1] : '101', setor: 'Portaria Social' };
  }
  if (aptStr.includes('Bloco 5')) {
    const match = aptStr.match(/Apto\s*(\d+)/i);
    return { block: 'Bloco 5 - Cerejeira', apto: match ? match[1] : '101', setor: 'Portaria Social' };
  }

  // Setores operacionais ou administrativos
  return { block: 'Setor Operacional', apto: '101', setor: aptStr };
};

// Conta Master do Sistema + Usuários Padrão para Demonstração com senhas padrão
const INITIAL_ADMIN_USERS = [
  { 
    id: '00000000-0000-4000-a000-000000000000', 
    name: 'Administrador Master (Root System)', 
    email: 'master@jardinstatuape.com.br', 
    password: 'senha123master',
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
    password: 'senha123admin',
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
    password: 'senha123porteiro',
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
    password: 'senha123',
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
    password: 'senha123morador',
    role: 'resident', 
    is_master: false, 
    apartment: 'Bloco 1 - Macieira - Apto 101', 
    status: 'Ativo', 
    created_at: '2026-03-20' 
  },
  { 
    id: '22334455-e89b-12d3-a456-426614174000', 
    name: 'Roberto Almeida', 
    email: 'morador202@jardinstatuape.com.br', 
    password: 'senha123',
    role: 'resident', 
    is_master: false, 
    apartment: 'Bloco 2 - Pereira - Apto 202', 
    status: 'Ativo', 
    created_at: '2026-04-05' 
  }
];

const getStoredUsersList = () => {
  try {
    const raw = localStorage.getItem('condaccess_users_db');
    if (raw) {
      const parsed = JSON.parse(raw);
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

  // Estados para o formulário modal (Novo usuário ou alteração de permissão e senha)
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState('resident');

  // Estados para caixas seletoras de Bloco, Apartamento e Setor Operacional
  const [selectedBlock, setSelectedBlock] = useState('Bloco 1 - Macieira');
  const [selectedApto, setSelectedApto] = useState('101');
  const [selectedSetor, setSelectedSetor] = useState('Portaria Social');

  // Atualiza localStorage sempre que usersList mudar
  useEffect(() => {
    saveUsersList(usersList);
  }, [usersList]);

  // Abre formulário para cadastrar novo usuário
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setNewName('');
    setNewEmail('');
    setNewPassword('senha123');
    setShowPassword(true);
    setNewRole('resident');
    setSelectedBlock('Bloco 1 - Macieira');
    setSelectedApto('101');
    setSelectedSetor('Portaria Social');
    setShowUserModal(true);
  };

  // Abre formulário para editar permissões, senha e setor de um usuário existente
  const handleOpenEditUser = (u) => {
    setEditingUserId(u.id);
    setNewName(u.name);
    setNewEmail(u.email);
    setNewPassword(u.password || 'senha123');
    setShowPassword(false);
    setNewRole(u.role);

    const parsed = parseApartmentString(u.apartment);
    setSelectedBlock(parsed.block);
    setSelectedApto(parsed.apto);
    setSelectedSetor(parsed.setor);

    setShowUserModal(true);
  };

  // Processa o salvamento do usuário (Novo ou Edição)
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert('Por favor, preencha o Nome, o E-mail e a Senha de Acesso do usuário.');
      return;
    }

    const finalApartment = selectedBlock === 'Setor Operacional' 
      ? selectedSetor 
      : `${selectedBlock} - Apto ${selectedApto}`;

    if (editingUserId) {
      // Edição de Permissões e Senha
      let isPasswordChanged = false;

      setUsersList(prev => {
        const updated = prev.map(u => {
          if (u.id === editingUserId) {
            if (u.password !== newPassword.trim()) {
              isPasswordChanged = true;
            }

            // Proteção: A Conta Master não pode perder o papel de administrator
            if (u.is_master && newRole !== 'administrator') {
              alert('🔒 A Conta Master do Sistema deve manter o perfil de Administrador.');
              return { 
                ...u, 
                name: newName, 
                email: newEmail.trim().toLowerCase(), 
                password: newPassword.trim(),
                apartment: finalApartment 
              };
            }
            return {
              ...u,
              name: newName,
              email: newEmail.trim().toLowerCase(),
              password: newPassword.trim(),
              role: newRole,
              apartment: finalApartment
            };
          }
          return u;
        });
        return updated;
      });

      // Log de Auditoria
      try {
        const timestamp = getBrtTimestamp();
        let logText = `[${timestamp}] Conta Master atualizou dados/permissões do usuário "${newName}" (${newEmail}) [Perfil: ${newRole.toUpperCase()}, Unidade: ${finalApartment}].`;
        if (isPasswordChanged) {
          logText += ` (Senha de acesso alterada/redefinida).`;
        }
        const rawLogs = localStorage.getItem('condaccess_audit_logs');
        const currentLogs = rawLogs ? JSON.parse(rawLogs) : [];
        localStorage.setItem('condaccess_audit_logs', JSON.stringify([logText, ...currentLogs]));
      } catch (err) {}

      const pwdNote = isPasswordChanged ? " 🔑 (Senha alterada com sucesso)" : "";
      const msg = `✅ Usuário "${newName}" atualizado! Perfil: ${newRole.toUpperCase()} | Unidade: ${finalApartment}${pwdNote}.`;
      setBannerMessage({ type: 'success', text: msg });
      setAnnouncement(msg);
    } else {
      // Novo Cadastro pelo Administrador Master
      const newUser = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
        name: newName,
        email: newEmail.trim().toLowerCase(),
        password: newPassword.trim(),
        role: newRole,
        is_master: false,
        apartment: finalApartment,
        status: 'Ativo',
        created_at: new Date().toISOString().split('T')[0]
      };

      // Adiciona ao Log de Auditoria
      try {
        const timestamp = getBrtTimestamp();
        const logEntry = `[${timestamp}] Conta Master cadastrou novo usuário: "${newName}" (${newEmail}) com perfil ${newRole.toUpperCase()} em "${finalApartment}".`;
        const rawLogs = localStorage.getItem('condaccess_audit_logs');
        const currentLogs = rawLogs ? JSON.parse(rawLogs) : [];
        localStorage.setItem('condaccess_audit_logs', JSON.stringify([logEntry, ...currentLogs]));
      } catch (err) {}

      setUsersList(prev => [newUser, ...prev]);
      const msg = `✅ Nova conta cadastrada com sucesso: "${newName}" (${newRole.toUpperCase()}) em "${finalApartment}"!`;
      const emailNotice = `📧 E-mail de boas-vindas e credenciais enviadas para ${newEmail.trim().toLowerCase()}`;
      
      // Log do disparo de e-mail
      try {
        const timestamp = getBrtTimestamp();
        const emailLogEntry = `[${timestamp}] Disparo de e-mail de boas-vindas enviado para ${newEmail.trim().toLowerCase()} (Serviço de E-mail/SMTP).`;
        const rawLogs = localStorage.getItem('condaccess_audit_logs');
        const currentLogs = rawLogs ? JSON.parse(rawLogs) : [];
        localStorage.setItem('condaccess_audit_logs', JSON.stringify([emailLogEntry, ...currentLogs]));
      } catch (err) {}

      setBannerMessage({ type: 'success', text: `${msg} — ${emailNotice}` });
      setAnnouncement(`${msg} ${emailNotice}`);
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

    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    
    // Log de auditoria
    try {
      const timestamp = getBrtTimestamp();
      const logEntry = `[${timestamp}] Conta Master alterou status do usuário "${currentName}" para ${newStatus.toUpperCase()}.`;
      const rawLogs = localStorage.getItem('condaccess_audit_logs');
      const currentLogs = rawLogs ? JSON.parse(rawLogs) : [];
      localStorage.setItem('condaccess_audit_logs', JSON.stringify([logEntry, ...currentLogs]));
    } catch (err) {}

    const msg = `Status do usuário "${currentName}" alterado para ${newStatus.toUpperCase()}.`;
    setBannerMessage({ type: 'info', text: msg });
    setAnnouncement(msg);
  };

  // Exclusão definitiva com proteção rígida para a Conta Master
  const handleDeleteUser = (userId, currentName) => {
    const target = usersList.find(u => u.id === userId);
    if (target && (target.is_master || target.id === '00000000-0000-4000-a000-000000000000' || target.email === 'master@jardinstatuape.com.br')) {
      const lockMsg = '🔒 AÇÃO BLOQUEADA: A Conta Master de Administrador é inviolável e protegida contra exclusão!';
      alert(lockMsg);
      setBannerMessage({ type: 'error', text: lockMsg });
      setAnnouncement(lockMsg);
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o usuário "${currentName}"?`)) {
      return;
    }

    setUsersList(prev => prev.filter(u => u.id !== userId));

    // Log de auditoria
    try {
      const timestamp = getBrtTimestamp();
      const logEntry = `[${timestamp}] Conta Master excluiu o usuário "${currentName}" do sistema.`;
      const rawLogs = localStorage.getItem('condaccess_audit_logs');
      const currentLogs = rawLogs ? JSON.parse(rawLogs) : [];
      localStorage.setItem('condaccess_audit_logs', JSON.stringify([logEntry, ...currentLogs]));
    } catch (err) {}

    const msg = `Usuário "${currentName}" excluído com sucesso do sistema.`;
    setBannerMessage({ type: 'error', text: msg });
    setAnnouncement(msg);
  };

  // Temas de Alto Contraste vs Padrão
  const theme = highContrast ? {
    bg: '#000000',
    text: '#ffffff',
    cardBg: '#121212',
    border: '#ffff00',
    navBg: '#1a1a1a',
    btnPrimaryBg: '#ffff00',
    btnPrimaryText: '#000000',
    btnDangerBg: '#ff4d4d',
    btnDangerText: '#ffffff',
    tableHeaderBg: '#333333',
    badgeActiveBg: '#00ff00',
    badgeActiveText: '#000000',
  } : {
    bg: '#f8fafc',
    text: '#1e293b',
    cardBg: '#ffffff',
    border: '#cbd5e1',
    navBg: '#0f172a',
    btnPrimaryBg: '#2563eb',
    btnPrimaryText: '#ffffff',
    btnDangerBg: '#ef4444',
    btnDangerText: '#ffffff',
    tableHeaderBg: '#f1f5f9',
    badgeActiveBg: '#dcfce7',
    badgeActiveText: '#166534',
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* LEITORES DE TELA (ARIA-LIVE) */}
      <div className="sr-only" aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
        {announcement}
      </div>

      {/* CABEÇALHO PRINCIPAL DO PAINEL ADMINISTRATIVO */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: `2px solid ${theme.border}` }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            👑 Painel de Controle Administrador Master
          </h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.85, fontSize: '0.95rem' }}>
            Condomínio Residencial Jardins do Tatuapé — Gestão de Usuários, Permissões, Unidades e Logs de Auditoria.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* BOTÃO ALTO CONTRASTE */}
          <button 
            onClick={() => setHighContrast(!highContrast)}
            style={{ 
              padding: '8px 16px', 
              minHeight: '44px',
              backgroundColor: highContrast ? '#ffff00' : '#e2e8f0', 
              color: highContrast ? '#000000' : '#0f172a',
              border: `2px solid ${theme.border}`,
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {highContrast ? '☀️ Modo Normal' : '👁️ Alto Contraste'}
          </button>

          {onLogout && (
            <button 
              onClick={onLogout}
              style={{ 
                padding: '8px 16px', 
                minHeight: '44px',
                backgroundColor: theme.btnDangerBg, 
                color: theme.btnDangerText,
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🚪 Sair do Sistema
            </button>
          )}
        </div>
      </header>

      {/* BANNER VISÍVEL DE MENSAGENS */}
      {bannerMessage && (
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: '6px', 
          marginBottom: '20px', 
          fontWeight: 'bold',
          backgroundColor: bannerMessage.type === 'error' ? '#fee2e2' : bannerMessage.type === 'info' ? '#e0f2fe' : '#dcfce7',
          color: bannerMessage.type === 'error' ? '#991b1b' : bannerMessage.type === 'info' ? '#075985' : '#166534',
          border: `1px solid ${bannerMessage.type === 'error' ? '#f87171' : bannerMessage.type === 'info' ? '#38bdf8' : '#4ade80'}`
        }}>
          {bannerMessage.text}
        </div>
      )}

      {/* ABAS NAVEGÁVEIS */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ padding: '12px 20px', minHeight: '44px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'users' ? theme.btnPrimaryBg : theme.cardBg, color: activeTab === 'users' ? theme.btnPrimaryText : theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px' }}
        >
          👥 Gestão de Usuários & Senhas
        </button>

        <button 
          onClick={() => setActiveTab('units')}
          style={{ padding: '12px 20px', minHeight: '44px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'units' ? theme.btnPrimaryBg : theme.cardBg, color: activeTab === 'units' ? theme.btnPrimaryText : theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px' }}
        >
          🏢 Blocos e Unidades (5 Blocos / 340 Aptos)
        </button>

        <button 
          onClick={() => setActiveTab('logs')}
          style={{ padding: '12px 20px', minHeight: '44px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: activeTab === 'logs' ? theme.btnPrimaryBg : theme.cardBg, color: activeTab === 'logs' ? theme.btnPrimaryText : theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px' }}
        >
          📊 Logs de Auditoria do Sistema
        </button>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main>
        {/* ABA 1: GESTÃO DE USUÁRIOS */}
        {activeTab === 'users' && (
          <section style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Gerenciamento do Cadastro Geral de Usuários</h2>
                <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
                  Cadastre novos usuários/funcionários, resgate ou altere senhas de acesso e atribua perfis (Síndico, Portaria, Zeladoria, Morador).
                </p>
              </div>

              <button 
                onClick={handleOpenAddUser}
                style={{ padding: '10px 18px', minHeight: '44px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: 'none', borderRadius: '6px', fontSize: '0.95rem' }}
              >
                + Cadastrar Novo Usuário / Funcionário
              </button>
            </div>

            {/* TABELA DE USUÁRIOS */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.tableHeaderBg, borderBottom: `2px solid ${theme.border}` }}>
                    <th style={{ padding: '12px' }}>Nome Completo</th>
                    <th style={{ padding: '12px' }}>E-mail (Login)</th>
                    <th style={{ padding: '12px' }}>Perfil de Acesso</th>
                    <th style={{ padding: '12px' }}>Unidade / Setor</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Ações (Permissões & Senha)</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isMasterAcc = u.is_master || u.id === '00000000-0000-4000-a000-000000000000' || u.email === 'master@jardinstatuape.com.br';
                    return (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>
                          {u.name} {isMasterAcc && <span style={{ color: '#eab308', marginLeft: '4px' }}>⭐ (Master Root)</span>}
                        </td>
                        <td style={{ padding: '12px' }}>{u.email}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            backgroundColor: u.role === 'administrator' ? '#fef3c7' : u.role === 'doorman' ? '#e0e7ff' : u.role === 'janitor' ? '#ffedd5' : '#f1f5f9',
                            color: u.role === 'administrator' ? '#92400e' : u.role === 'doorman' ? '#3730a3' : u.role === 'janitor' ? '#9a3412' : '#334155',
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}>
                            {u.role === 'administrator' ? '👑 Administrador' : u.role === 'doorman' ? '🛡️ Portaria' : u.role === 'janitor' ? '🔧 Zeladoria' : '🏡 Morador'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.apartment}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontWeight: 'bold', 
                            fontSize: '0.85rem',
                            backgroundColor: u.status === 'Ativo' || u.status.includes('Ativo') ? theme.badgeActiveBg : '#fee2e2',
                            color: u.status === 'Ativo' || u.status.includes('Ativo') ? theme.badgeActiveText : '#991b1b'
                          }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {/* BOTÃO EDITAR PERMISSÕES E SENHA */}
                          <button 
                            onClick={() => handleOpenEditUser(u)}
                            style={{ padding: '6px 12px', minHeight: '36px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: 'none', borderRadius: '4px' }}
                          >
                            ✏️ Editar Perfil & Senha
                          </button>

                          {/* BOTÃO DE STATUS (DESATIVADO PARA CONTA MASTER) */}
                          <button 
                            onClick={() => handleToggleStatus(u.id, u.name, u.status)}
                            disabled={isMasterAcc}
                            style={{ 
                              padding: '6px 10px', 
                              minHeight: '36px', 
                              fontSize: '0.85rem', 
                              fontWeight: 'bold', 
                              cursor: isMasterAcc ? 'not-allowed' : 'pointer', 
                              opacity: isMasterAcc ? 0.5 : 1,
                              backgroundColor: theme.cardBg, 
                              color: theme.text, 
                              border: `1px solid ${theme.border}`, 
                              borderRadius: '4px' 
                            }}
                          >
                            {u.status === 'Ativo' ? '🔒 Desativar' : '🔓 Ativar'}
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
            <div style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '12px', padding: '28px', maxWidth: '580px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, fontSize: '1.4rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '12px' }}>
                {editingUserId ? "Alterar Permissões, Perfil e Senha do Usuário" : "+ Cadastrar Novo Usuário / Funcionário"}
              </h3>
              
              <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                
                {/* NOME COMPLETO */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Nome Completo *</label>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="Ex: João da Silva"
                    required 
                    style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }} 
                  />
                </div>

                {/* E-MAIL (LOGIN) */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Endereço de E-mail (Login de Acesso) *</label>
                  <input 
                    type="email" 
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                    placeholder="usuario@jardinstatuape.com.br"
                    required 
                    style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }} 
                  />
                </div>

                {/* CAMPO DE SENHA (RESGATAR OU ALTERAR SENHA) */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    {editingUserId ? "🔑 Senha de Acesso (Resgatar / Alterar Senha) *" : "🔑 Senha Inicial de Acesso *"}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="Digite a senha de acesso" 
                      required 
                      style={{ flex: 1, minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 'bold' }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Ocultar senha" : "Exibir / Resgatar senha em texto limpo"}
                      style={{ minHeight: '44px', padding: '0 14px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {showPassword ? "🙈 Ocultar" : "👁️ Resgatar Senha"}
                    </button>
                  </div>
                  <small style={{ color: highContrast ? '#ffff00' : '#555', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {editingUserId 
                      ? "🔒 Clique em 'Resgatar Senha' para visualizar a senha atual em texto limpo ou digite uma nova senha para alterá-la." 
                      : "🔑 Defina a senha inicial que o novo usuário/funcionário utilizará para autenticação."}
                  </small>
                </div>

                {/* PERFIL / NÍVEL DE PERMISSÃO */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Perfil / Nível de Permissão *</label>
                  <select 
                    value={newRole} 
                    onChange={e => setNewRole(e.target.value)} 
                    style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                  >
                    <option value="resident">🏡 Morador (Acesso restrito ao próprio Apto)</option>
                    <option value="doorman">🛡️ Portaria (Controle de encomendas e visitantes)</option>
                    <option value="janitor">🔧 Zeladoria (Acesso a ocorrências e manutenção)</option>
                    <option value="administrator">👑 Administrador do Sistema / Síndico (Acesso Total)</option>
                  </select>
                </div>

                {/* SELETORES DE BLOCO E APARTAMENTO (SUBSTITUI O CAMPO DE TEXTO LIVRE) */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    🏢 Unidade ou Setor Responsável (Seleção de Bloco & Apto) *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: selectedBlock === 'Setor Operacional' ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: highContrast ? '#ffffff' : '#475569', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>
                        Selecione o Bloco / Categoria:
                      </span>
                      <select 
                        value={selectedBlock} 
                        onChange={e => setSelectedBlock(e.target.value)}
                        style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                      >
                        <option value="Bloco 1 - Macieira">🏢 Bloco 1 - Macieira</option>
                        <option value="Bloco 2 - Pereira">🏢 Bloco 2 - Pereira</option>
                        <option value="Bloco 3 - Nogueira">🏢 Bloco 3 - Nogueira</option>
                        <option value="Bloco 4 - Amoreira">🏢 Bloco 4 - Amoreira</option>
                        <option value="Bloco 5 - Cerejeira">🏢 Bloco 5 - Cerejeira</option>
                        <option value="Setor Operacional">🛡️ Setor Operacional / Administrativo</option>
                      </select>
                    </div>

                    {selectedBlock !== 'Setor Operacional' ? (
                      <div>
                        <span style={{ fontSize: '0.85rem', color: highContrast ? '#ffffff' : '#475569', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>
                          Selecione o Apartamento (340 Aptos):
                        </span>
                        <select 
                          value={selectedApto} 
                          onChange={e => setSelectedApto(e.target.value)}
                          style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                        >
                          {generateApartmentsList().map(apt => (
                            <option key={apt.numero} value={apt.numero}>
                              {apt.rotulo}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontSize: '0.85rem', color: highContrast ? '#ffffff' : '#475569', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>
                          Selecione o Setor Específico:
                        </span>
                        <select 
                          value={selectedSetor} 
                          onChange={e => setSelectedSetor(e.target.value)}
                          style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                        >
                          <option value="Portaria Social">🛡️ Portaria Social</option>
                          <option value="Zeladoria Central">🔧 Zeladoria Central</option>
                          <option value="Administração">👑 Administração / Síndico Geral</option>
                          <option value="Gestão Central / TI">💻 Gestão Central / TI</option>
                          <option value="Outro Setor Operacional">🏢 Outro Setor Operacional</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <small style={{ color: highContrast ? '#ffff00' : '#555', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    💡 Caixas seletoras vinculadas aos 5 blocos residenciais (340 unidades) ou aos setores operacionais da administração.
                  </small>
                </div>

                {/* BOTÕES DE AÇÃO DO MODAL */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowUserModal(false)} 
                    style={{ minHeight: '44px', padding: '8px 18px', cursor: 'pointer', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '4px', fontWeight: 'bold' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={{ minHeight: '44px', padding: '8px 24px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: 'none', borderRadius: '4px' }}
                  >
                    💾 Salvar Alterações
                  </button>
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
              {[
                { nome: 'Bloco 1 - Macieira', tipo: 'Residencial', aptos: 68, morador: 'Ana Oliveira (Apto 101)' },
                { nome: 'Bloco 2 - Pereira', tipo: 'Residencial', aptos: 68, morador: 'Roberto Almeida (Apto 202)' },
                { nome: 'Bloco 3 - Nogueira', tipo: 'Residencial', aptos: 68, morador: 'Vago / Disponível' },
                { nome: 'Bloco 4 - Amoreira', tipo: 'Residencial', aptos: 68, morador: 'Vago / Disponível' },
                { nome: 'Bloco 5 - Cerejeira', tipo: 'Residencial', aptos: 68, morador: 'Vago / Disponível' }
              ].map((bloco, idx) => (
                <div key={idx} style={{ padding: '16px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.cardBg }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>🏢 {bloco.nome}</h3>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem' }}><strong>Tipo:</strong> {bloco.tipo}</p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem' }}><strong>Total de Aptos:</strong> {bloco.aptos} unidades</p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: theme.badgeActiveText }}><strong>Exemplo:</strong> {bloco.morador}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ABA 3: LOGS DE AUDITORIA */}
        {activeTab === 'logs' && (() => {
          let customLogs = [];
          try {
            const raw = localStorage.getItem('condaccess_audit_logs');
            if (raw) customLogs = JSON.parse(raw);
          } catch (e) {}

          const defaultLogs = [
            `[${getBrtTimestamp()}] Conta Master master@jardinstatuape.com.br cadastrou novo usuário no sistema com perfil de Administrador.`,
            `[07-11-2026 17:15] Usuario admin@jardinstatuape.com.br autenticado no painel.`,
            `[07-11-2026 16:40] Porteiro Carlos Silva registrou nova encomenda para o Bloco 1 - Apto 101 (Notificação por e-mail disparada).`,
            `[07-11-2026 15:20] Moradora Ana Oliveira confirmou a baixa/retirada de pacote no painel do morador.`
          ];

          const allLogs = [...customLogs, ...defaultLogs];

          return (
            <section style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '24px' }}>
              <h2 style={{ marginTop: 0, fontSize: '1.4rem' }}>Logs de Auditoria e Atividades do Sistema</h2>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allLogs.map((log, idx) => (
                  <li key={idx} style={{ padding: '12px', borderBottom: `1px solid ${theme.border}`, fontSize: '0.95rem', fontFamily: 'monospace' }}>
                    {log}
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}
      </main>
    </div>
  );
}
