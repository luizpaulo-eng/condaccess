import React, { useState, useEffect, useCallback } from 'react';

/**
 * DeliveryAlert Component (v20 - Data e Hora Completa na Entrada de Visitantes e Acessos) - CondAccess - CondAccess
 * Componente React Acessível (WCAG 2.1 AA / WAI-ARIA) de Gestão de Portaria e Painel do Morador.
 * 
 * Novas Funcionalidades e Regras de Segurança:
 * 1. Isolamento Estrito do Perfil Morador:
 *    - O morador visualiza única e exclusivamente as encomendas destinadas ao seu Bloco e Apartamento.
 *    - Botão "Confirmar Retirada" removido do perfil de Morador (controle exclusivo dos operadores da Portaria).
 *    - Selo de status informativo e seguro: "📦 Disponível para Retirada na Portaria Social".
 * 2. Visualização de Acessos Ativos na Unidade (Visitantes, Entregadores e Prestadores):
 *    - O morador acompanha em tempo real na aba "🚪 Acessos Ativos na Minha Unidade" quem está autorizado e no condomínio para seu apartamento.
 * 3. Acessibilidade Universal (WCAG 2.1 AA):
 *    - Suporte a Alto Contraste, navegação por teclado e sintetizadores de voz (aria-live, tablist, tab).
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
const DEFAULT_APARTMENT_ID = '123e4567-e89b-12d3-a456-426614174000';
const DEFAULT_USER_ID = '98765432-e89b-12d3-a456-426614174000';

// Formata o identificador do operador para exibição amigável, convertendo UUIDs padrão de demonstração para nome legível
// Formata e resolve o nome amigável do operador a partir de nome, e-mail ou UUID
const formatOperatorName = (operator, currentUser = null) => {
  if (!operator) {
    if (currentUser?.name || currentUser?.email) return currentUser.name || currentUser.email;
    return 'Carlos Silva (Porteiro Social)';
  }
  const opStr = String(operator).trim();

  // Se já for um e-mail ou texto comum (não-UUID), retorna diretamente
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(opStr)) {
    return opStr;
  }

  // Se for UUID, verifica primeiro se é o próprio usuário logado no momento
  if (currentUser && (currentUser.id === opStr || opStr === DEFAULT_USER_ID)) {
    if (currentUser.name || currentUser.email) return currentUser.name || currentUser.email;
  }

  // Verifica no cadastro geral de usuários salvos (condaccess_users_db)
  try {
    const rawUsers = localStorage.getItem('condaccess_users_db');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const matched = users.find(u => u.id === opStr || u.email === opStr);
      if (matched && (matched.name || matched.email)) {
        return matched.name || matched.email;
      }
    }
  } catch (e) {}

  // Fallback padrão se for o ID de demonstração da portaria
  if (opStr === DEFAULT_USER_ID || opStr === '98765432-e89b-12d3-a456-426614174000') {
    return 'Carlos Silva (Porteiro Social)';
  }

  return opStr;
};

// Formata datas para o Horário Oficial de Brasília (America/Sao_Paulo / UTC-3)
const formatBrtDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    let iso = String(dateStr).trim();
    if (!iso.endsWith('Z') && !iso.includes('+') && !iso.includes('-0')) {
      iso = iso + 'Z';
    }
    const d = new Date(iso);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch (e) {
    return dateStr;
  }
};

// Formata a data e horário de entrada de visitantes e prestadores (com suporte a retrocompatibilidade)
const formatVisitEntry = (timeStr) => {
  if (!timeStr) return '';
  const s = String(timeStr).trim();
  // Se já contém data (ex: '10/11/2026 07:18' ou '10-11-2026 07:18'), exibe diretamente
  if (s.includes('/') || s.includes('-')) return s;
  // Se contiver apenas horário (ex: '07:18' ou '14:30'), combina com a data atual no horário de Brasília
  try {
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return `${today} ${s}`;
  } catch (e) {
    return s;
  }
};


const INITIAL_DEMO_PACKAGE = {
  id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  apartment_id: DEFAULT_APARTMENT_ID,
  description: 'Pacote e-Commerce (Caixa Grande - Mercado Livre)',
  tracking_code: 'BR987654321',
  status: 'received',
  received_at: new Date().toISOString(),
  notes: '[Bloco 1 - Apto 101] Deixado na portaria social',
  received_by: 'Carlos Silva (Porteiro Social)'
};

const getLocalPackages = () => {
  try {
    const raw = localStorage.getItem('condaccess_demo_pkgs');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveLocalPackages = (pkgs) => {
  try {
    localStorage.setItem('condaccess_demo_pkgs', JSON.stringify(pkgs));
  } catch (e) {}
};

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

const addAuditLog = (logEntry) => {
  try {
    const raw = localStorage.getItem('condaccess_audit_logs');
    const currentLogs = raw ? JSON.parse(raw) : [];
    localStorage.setItem('condaccess_audit_logs', JSON.stringify([logEntry, ...currentLogs]));
  } catch (err) {}
};



// Utilitário para extrair com precisão Bloco e Apartamento de qualquer formato de string
const extractBlockAndApt = (unitStr) => {
  if (!unitStr) return { blockNum: null, aptNum: null };
  const str = String(unitStr).trim();
  const bMatch = str.match(/Bloco\s*([1-5])/i);
  const blockNum = bMatch ? bMatch[1] : null;
  const nums = str.match(/\b\d+\b/g) || [];
  let aptNum = null;
  for (const n of nums) {
    if (n !== blockNum) {
      aptNum = n;
      break;
    }
  }
  return { blockNum, aptNum };
};

const BLOCOS_CONDOMINIO = [
  { id: 1, nome: 'Bloco 1 - Macieira' },
  { id: 2, nome: 'Bloco 2 - Pereira' },
  { id: 3, nome: 'Bloco 3 - Nogueira' },
  { id: 4, nome: 'Bloco 4 - Amoreira' },
  { id: 5, nome: 'Bloco 5 - Cerejeira' }
];

/* ==========================================================================
   SUB-COMPONENTE: VISITOR MANAGER (MÓDULO DE VISITANTES E PRESTADORES)
   ========================================================================== */
const INITIAL_DEMO_VISITS = [
  {
    id: 'v1',
    visitor_name: 'Carlos Eduardo Mendes',
    document_id: '345.678.901-22',
    visitor_type: 'contractor',
    company: 'Manutenção de Elevadores Otis',
    block: 'Bloco 2 - Pereira',
    apartment: '304',
    entry_time: '10/11/2026 14:30',
    status: 'active'
  },
  {
    id: 'v2',
    visitor_name: 'Mariana Souza Santos',
    document_id: '234.567.890-11',
    visitor_type: 'visitor',
    company: 'Particular',
    block: 'Bloco 1 - Macieira',
    apartment: '101',
    entry_time: '10/11/2026 15:15',
    status: 'active'
  }
];

const getLocalVisitors = () => {
  try {
    const raw = localStorage.getItem('condaccess_demo_visitors');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_DEMO_VISITS;
};

const saveLocalVisitors = (visits) => {
  try {
    localStorage.setItem('condaccess_demo_visitors', JSON.stringify(visits));
  } catch (e) {}
};

function VisitorManagerSection({ isHighContrast = false }) {
  const [activeVisits, setActiveVisits] = useState(() => getLocalVisitors());


  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [visitorType, setVisitorType] = useState('visitor');
  const [company, setCompany] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('Bloco 1 - Macieira');
  const [selectedApartment, setSelectedApartment] = useState('11');

  const [announcement, setAnnouncement] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  const blocks = [
    'Bloco 1 - Macieira',
    'Bloco 2 - Pereira',
    'Bloco 3 - Nogueira',
    'Bloco 4 - Amoreira',
    'Bloco 5 - Cerejeira'
  ];

  // 68 unidades por bloco (Aptos 11 ao 174)
  const apartments = Array.from({ length: 68 }, (_, i) => `${(Math.floor(i / 4) + 1) * 10 + (i % 4 + 1)}`);

  const handleRegisterEntry = (e) => {
    e.preventDefault();
    if (!name.trim() || !documentId.trim()) return;

    const newVisit = {
      id: `v_${Date.now()}`,
      visitor_name: name.trim(),
      document_id: documentId.trim(),
      visitor_type: visitorType,
      company: company.trim() || (visitorType === 'visitor' ? 'Particular' : 'Indefinida'),
      block: selectedBlock,
      apartment: selectedApartment,
      entry_time: (() => {
        const now = new Date();
        const d = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const t = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
        return `${d} ${t}`;
      })(),
      status: 'active'
    };

    const updatedVisits = [newVisit, ...activeVisits];
    setActiveVisits(updatedVisits);
    saveLocalVisitors(updatedVisits);

    const typeLabel = visitorType === 'contractor' ? 'Prestador de serviço' : visitorType === 'delivery_person' ? 'Entregador' : 'Visitante';
    const msg = `✅ Entrada de ${typeLabel} "${name}" registrada para o ${selectedBlock}, Apartamento ${selectedApartment}.`;
    
    setAnnouncement(msg);
    setBannerMessage(msg);
    setShowSuccessBanner(true);

    // Registra nos Logs de Auditoria do Sistema
    const timestamp = getBrtTimestamp();
    const logEntry = `[${timestamp}] Portaria registrou entrada de ${typeLabel.toLowerCase()}: "${name}" (Destino: ${selectedBlock} - Apto ${selectedApartment}).`;
    addAuditLog(logEntry);

    setName('');
    setDocumentId('');
    setCompany('');

    setTimeout(() => setShowSuccessBanner(false), 5000);
  };

  const handleCheckout = (id, visitorName) => {
    const targetVisit = activeVisits.find(visit => visit.id === id);
    const updatedVisits = activeVisits.filter(visit => visit.id !== id);
    setActiveVisits(updatedVisits);
    saveLocalVisitors(updatedVisits);
    const msg = `✅ Saída de ${visitorName} registrada com sucesso.`;
    setAnnouncement(msg);
    setBannerMessage(msg);
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 4000);

    // Registra nos Logs de Auditoria do Sistema
    const timestamp = getBrtTimestamp();
    const destInfo = targetVisit ? ` (Destino: ${targetVisit.block} - Apto ${targetVisit.apartment})` : '';
    const logEntry = `[${timestamp}] Portaria registrou saída de visitante/prestador: "${visitorName}"${destInfo}.`;
    addAuditLog(logEntry);
  };

  const themeStyles = {
    card: {
      backgroundColor: isHighContrast ? '#111111' : '#ffffff',
      border: isHighContrast ? '2px solid #ffff00' : '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px'
    },
    input: {
      width: '100%',
      minHeight: '44px',
      padding: '8px 12px',
      borderRadius: '4px',
      border: isHighContrast ? '2px solid #ffff00' : '1px solid #cbd5e1',
      backgroundColor: isHighContrast ? '#000000' : '#ffffff',
      color: isHighContrast ? '#ffffff' : '#0f172a',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    buttonPrimary: {
      backgroundColor: isHighContrast ? '#ffff00' : '#2563eb',
      color: isHighContrast ? '#000000' : '#ffffff',
      border: 'none',
      borderRadius: '6px',
      padding: '12px 20px',
      fontWeight: 'bold',
      fontSize: '1rem',
      cursor: 'pointer',
      minHeight: '48px'
    },
    buttonDanger: {
      backgroundColor: isHighContrast ? '#ff0000' : '#dc2626',
      color: '#ffffff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 14px',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      cursor: 'pointer',
      minHeight: '40px'
    },
    badge: (type) => ({
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      backgroundColor: isHighContrast 
        ? (type === 'contractor' ? '#ff9900' : type === 'delivery_person' ? '#00ffff' : '#00ff00')
        : (type === 'contractor' ? '#ffe4e6' : type === 'delivery_person' ? '#e0f2fe' : '#dcfce7'),
      color: isHighContrast 
        ? '#000000'
        : (type === 'contractor' ? '#9f1239' : type === 'delivery_person' ? '#075985' : '#166534')
    })
  };

  return (
    <section aria-label="Controle de Visitantes e Prestadores">
      {/* REGIÃO ARIA-LIVE */}
      <div aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}>
        {announcement}
      </div>

      {showSuccessBanner && (
        <div role="status" style={{
          marginBottom: '20px',
          padding: '14px 20px',
          backgroundColor: isHighContrast ? '#003300' : '#dcfce7',
          color: isHighContrast ? '#00ff00' : '#14532d',
          border: `2px solid ${isHighContrast ? '#00ff00' : '#86efac'}`,
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}>
          {bannerMessage}
        </div>
      )}

      {/* FORMULÁRIO DE CADASTRO DE VISITANTE */}
      <div style={themeStyles.card}>
        <h2 style={{ marginTop: 0, fontSize: '1.3rem', color: isHighContrast ? '#ffff00' : '#1e293b' }}>
          ➕ Registrar Nova Entrada de Visitante / Prestador
        </h2>
        <form onSubmit={handleRegisterEntry} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label htmlFor="vis-name" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Nome Completo *</label>
            <input 
              id="vis-name"
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: João da Silva"
              style={themeStyles.input}
            />
          </div>

          <div>
            <label htmlFor="vis-doc" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Documento (CPF / RG) *</label>
            <input 
              id="vis-doc"
              type="text" 
              required 
              value={documentId} 
              onChange={(e) => setDocumentId(e.target.value)} 
              placeholder="Ex: 123.456.789-00"
              style={themeStyles.input}
            />
          </div>

          <div>
            <label htmlFor="vis-type" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Tipo de Acesso *</label>
            <select 
              id="vis-type"
              value={visitorType} 
              onChange={(e) => setVisitorType(e.target.value)}
              style={themeStyles.input}
            >
              <option value="visitor">Visitante Social</option>
              <option value="contractor">Prestador de Serviço / Técnico</option>
              <option value="delivery_person">Entregador / Courier</option>
            </select>
          </div>

          <div>
            <label htmlFor="vis-company" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Empresa / Organização</label>
            <input 
              id="vis-company"
              type="text" 
              value={company} 
              onChange={(e) => setCompany(e.target.value)} 
              placeholder="Ex: Enel, Comgás, Mercado Livre..."
              style={themeStyles.input}
            />
          </div>

          <div>
            <label htmlFor="vis-block" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Bloco de Destino *</label>
            <select 
              id="vis-block"
              value={selectedBlock} 
              onChange={(e) => setSelectedBlock(e.target.value)}
              style={themeStyles.input}
            >
              {blocks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="vis-apt" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Apartamento *</label>
            <select 
              id="vis-apt"
              value={selectedApartment} 
              onChange={(e) => setSelectedApartment(e.target.value)}
              style={themeStyles.input}
            >
              {apartments.map(apt => <option key={apt} value={apt}>Apto {apt}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
            <button type="submit" style={themeStyles.buttonPrimary}>
              Confirmar e Autorizar Entrada (Portaria Social)
            </button>
          </div>
        </form>
      </div>

      {/* LISTA DE VISITANTES NO CONDOMÍNIO */}
      <div style={themeStyles.card}>
        <h3 style={{ marginTop: 0, fontSize: '1.2rem', color: isHighContrast ? '#ffff00' : '#1e293b', marginBottom: '16px' }}>
          📋 Visitantes e Prestadores Atualmente no Condomínio ({activeVisits.length})
        </h3>

        {activeVisits.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.8, padding: '20px 0' }}>
            Nenhum visitante ou prestador no interior do condomínio neste momento.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: isHighContrast ? '2px solid #ffff00' : '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Nome / Documento</th>
                  <th style={{ padding: '12px' }}>Tipo</th>
                  <th style={{ padding: '12px' }}>Empresa</th>
                  <th style={{ padding: '12px' }}>Destino</th>
                  <th style={{ padding: '12px' }}>Entrada</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {activeVisits.map((visit) => (
                  <tr key={visit.id} style={{ borderBottom: isHighContrast ? '1px solid #333333' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{visit.visitor_name}</strong>
                      <br />
                      <small style={{ opacity: 0.8 }}>Doc: {visit.document_id}</small>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={themeStyles.badge(visit.visitor_type)}>
                        {visit.visitor_type === 'contractor' ? 'Prestador' : visit.visitor_type === 'delivery_person' ? 'Entregador' : 'Visitante'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{visit.company}</td>
                    <td style={{ padding: '12px' }}>
                      {visit.block} — <strong>Apto {visit.apartment}</strong>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{formatVisitEntry(visit.entry_time)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleCheckout(visit.id, visit.visitor_name)}
                        style={themeStyles.buttonDanger}
                        aria-label={`Registrar saída de ${visit.visitor_name}`}
                      >
                        Registrar Saída
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
   SUB-COMPONENTE: RESIDENT VISITORS SECTION (ACESSO EXCLUSIVO DO MORADOR)
   ========================================================================== */
function ResidentVisitorsSection({ 
  isHighContrast = false, 
  user = null, 
  userUnit = '', 
  userBlock = null, 
  userApt = null 
}) {
  const [activeVisits, setActiveVisits] = useState(() => getLocalVisitors());

  useEffect(() => {
    const handleStorage = () => setActiveVisits(getLocalVisitors());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filtra as visitas ativas estritamente para o bloco e apartamento do morador
  const unitVisits = activeVisits.filter(visit => {
    if (visit.status !== 'active') return false;
    const { blockNum: vBlock, aptNum: vApt } = extractBlockAndApt(`${visit.block} ${visit.apartment}`);
    if (userBlock && userApt && vBlock && vApt) {
      return userBlock === vBlock && userApt === vApt;
    }
    if (userUnit && `${visit.block} ${visit.apartment}`.toLowerCase().includes(userUnit.toLowerCase())) {
      return true;
    }
    return false;
  });

  const theme = {
    cardBg: isHighContrast ? '#111111' : '#ffffff',
    border: isHighContrast ? '#ffff00' : '#e2e8f0',
    text: isHighContrast ? '#ffffff' : '#1e293b'
  };

  const getBadgeStyle = (type) => ({
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    backgroundColor: isHighContrast 
      ? (type === 'contractor' ? '#ff9900' : type === 'delivery_person' ? '#00ffff' : '#00ff00')
      : (type === 'contractor' ? '#ffe4e6' : type === 'delivery_person' ? '#e0f2fe' : '#dcfce7'),
    color: isHighContrast 
      ? '#000000'
      : (type === 'contractor' ? '#9f1239' : type === 'delivery_person' ? '#075985' : '#166534')
  });

  return (
    <section aria-label="Acessos e visitas ativas na sua unidade">
      <div style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: '0 0 4px 0' }}>
              🚪 Acessos e Visitas Ativas na sua Unidade ({unitVisits.length})
            </h2>
            <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.85 }}>
              Monitoramento em tempo real de visitantes sociais, entregadores e prestadores de serviço com entrada liberada pela portaria para <strong>{userUnit || 'seu apartamento'}</strong>.
            </p>
          </div>
          <span style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            backgroundColor: isHighContrast ? '#003300' : '#dcfce7',
            color: isHighContrast ? '#00ff00' : '#166534',
            border: `1px solid ${isHighContrast ? '#00ff00' : '#86efac'}`
          }}>
            ● Sincronizado com a Portaria Social
          </span>
        </div>

        {unitVisits.length === 0 ? (
          <div style={{
            padding: '24px',
            backgroundColor: isHighContrast ? '#000000' : '#f8fafc',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              🟢 Nenhum visitante, prestador ou entregador com acesso ativo no momento.
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>
              Quando a portaria autorizar a entrada de alguém direcionado ao seu apartamento, o registro e o horário de entrada serão exibidos aqui instantaneamente.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: isHighContrast ? '2px solid #ffff00' : '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Nome / Documento</th>
                  <th style={{ padding: '12px' }}>Tipo de Acesso</th>
                  <th style={{ padding: '12px' }}>Empresa / Vínculo</th>
                  <th style={{ padding: '12px' }}>Entrada Liberada</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status Atual</th>
                </tr>
              </thead>
              <tbody>
                {unitVisits.map((visit) => (
                  <tr key={visit.id} style={{ borderBottom: isHighContrast ? '1px solid #333333' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{visit.visitor_name}</strong>
                      {visit.document_id && (
                        <div>
                          <small style={{ opacity: 0.8 }}>Doc: {visit.document_id}</small>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={getBadgeStyle(visit.visitor_type)}>
                        {visit.visitor_type === 'contractor' 
                          ? '🔧 Prestador de Serviço' 
                          : visit.visitor_type === 'delivery_person' 
                          ? '🛵 Entregador' 
                          : '🏡 Visitante Social'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>
                      {visit.company || 'Particular'}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      🕒 {formatVisitEntry(visit.entry_time)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        backgroundColor: isHighContrast ? '#003300' : '#ecfdf5',
                        color: isHighContrast ? '#00ff00' : '#047857',
                        border: `1px solid ${isHighContrast ? '#00ff00' : '#a7f3d0'}`
                      }}>
                        🟢 No Condomínio
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: DELIVERY ALERT (COM ABAS DE NAVEGAÇÃO)
   ========================================================================== */
export default function DeliveryAlert({ 
  user: userProp = null,
  apartmentId: aptProp = null, 
  currentUserId: userPropId = null 
}) {
  const getStoredUser = () => {
    if (userProp) return userProp;
    try {
      const stored = localStorage.getItem('condaccess_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  };

  const user = getStoredUser();
  const isPortaria = !user || ['portaria', 'doorman', 'administrator', 'admin'].includes(user?.role);

  // Identificação e extração da unidade do usuário logado
  const userUnit = user?.apartment || user?.unidade || '';
  const { blockNum: userBlock, aptNum: userApt } = extractBlockAndApt(userUnit);

  const effectiveApartmentId = aptProp || user?.apartmentId || DEFAULT_APARTMENT_ID;
  const effectiveUserId = userPropId || user?.id || DEFAULT_USER_ID;

  // Estado da Aba Ativa ('deliveries' ou 'visitors')
  const [activeTab, setActiveTab] = useState('deliveries');
  const [activeVisitsCount, setActiveVisitsCount] = useState(0);

  // Monitora contagem de visitas ativas em tempo real
  useEffect(() => {
    const updateVisitsCount = () => {
      const allVisits = getLocalVisitors();
      if (isPortaria) {
        setActiveVisitsCount(allVisits.filter(v => v.status === 'active').length);
      } else {
        const myVisits = allVisits.filter(v => {
          if (v.status !== 'active') return false;
          const { blockNum: vBlock, aptNum: vApt } = extractBlockAndApt(`${v.block} ${v.apartment}`);
          if (userBlock && userApt && vBlock && vApt) {
            return userBlock === vBlock && userApt === vApt;
          }
          if (userUnit && `${v.block} ${v.apartment}`.toLowerCase().includes(userUnit.toLowerCase())) {
            return true;
          }
          return false;
        });
        setActiveVisitsCount(myVisits.length);
      }
    };

    updateVisitsCount();
    window.addEventListener('storage', updateVisitsCount);
    return () => window.removeEventListener('storage', updateVisitsCount);
  }, [isPortaria, userBlock, userApt, userUnit]);

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [bannerMessage, setBannerMessage] = useState(null);
  const [highContrast, setHighContrast] = useState(false);

  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedBloco, setSelectedBloco] = useState('1');
  const [selectedApto, setSelectedApto] = useState('101');
  const [aptosDisponiveis, setAptosDisponiveis] = useState([]);
  const [description, setDescription] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para o Modal de Confirmação de Retirada (Quem efetuou a retirada)
  const [deliveringPkg, setDeliveringPkg] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverDoc, setReceiverDoc] = useState('');

  useEffect(() => {
    if (!selectedBloco) {
      setAptosDisponiveis([]);
      return;
    }
    const lista = [];
    for (let andar = 1; andar <= 17; andar++) {
      for (let final = 1; final <= 4; final++) {
        const num = andar * 10 + final;
        lista.push({ numero: num, rotulo: `Apto ${num} (${andar}º Andar)` });
      }
    }
    setAptosDisponiveis(lista);
  }, [selectedBloco]);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);

    let apiData = [];
    try {
      const response = await fetch(
        `${API_BASE_URL}/apartments/${effectiveApartmentId}/packages?status_filter=received`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (response.ok) {
        apiData = await response.json();
      }
    } catch (err) {
      console.warn('Aviso: backend indisponível ou em carregamento:', err);
    }

    let localPkgs = getLocalPackages();
    if (localPkgs.length === 0 && apiData.length === 0) {
      localPkgs = [INITIAL_DEMO_PACKAGE];
      saveLocalPackages(localPkgs);
    }

    const apiIds = new Set(apiData.map(p => p.id));
    const apiKeys = new Set(apiData.map(p => `${p.apartment_id}_${(p.description || '').trim().toLowerCase()}`));

    const uniqueLocals = localPkgs.filter(p => {
      if (p.status !== 'received') return false;
      if (apiIds.has(p.id)) return false;
      const key = `${p.apartment_id}_${(p.description || '').trim().toLowerCase()}`;
      if (apiKeys.has(key)) return false;
      return true;
    });

    const merged = [...apiData, ...uniqueLocals];

    setPackages(merged);
    const countMsg = merged.length === 0 
      ? 'Nenhuma encomenda pendente encontrada.' 
      : `${merged.length} encomenda(s) carregada(s) com sucesso.`;
    setAnnouncement(countMsg);
    setLoading(false);
  }, [effectiveApartmentId]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Filtra as encomendas: Portaria/Admin vê todas do condomínio. Morador vê estritamente as da sua unidade.
  const displayedPackages = packages.filter(pkg => {
    if (isPortaria) return true; // Portaria e Administradores têm visão global

    if (user?.apartmentId && pkg.apartment_id && user.apartmentId === pkg.apartment_id) {
      return true;
    }

    if (!userUnit && !userBlock && !userApt) {
      return true; // Fallback se o cadastro não contiver unidade especificada
    }

    const pkgText = `${pkg.notes || ''} ${pkg.description || ''} ${pkg.apartment || ''}`;
    const { blockNum: pkgBlock, aptNum: pkgApt } = extractBlockAndApt(pkgText);

    if (userBlock && userApt && pkgBlock && pkgApt) {
      return userBlock === pkgBlock && userApt === pkgApt;
    }

    if (userUnit && pkgText.toLowerCase().includes(userUnit.toLowerCase())) {
      return true;
    }

    return false;
  });

  // Abre o modal de confirmação de retirada
  const handleOpenDeliverModal = (pkg) => {
    setDeliveringPkg(pkg);
    setReceiverName('');
    setReceiverDoc('');
  };

  // Confirma a retirada com registro de quem retirou e quem entregou
  const handleConfirmDeliver = async (e) => {
    if (e) e.preventDefault();
    if (!deliveringPkg) return;
    const cleanReceiver = receiverName.trim();
    if (!cleanReceiver) {
      alert('Por favor, informe o nome de quem efetuou a retirada.');
      return;
    }

    const pkgId = deliveringPkg.id;
    const pkgDesc = deliveringPkg.description;
    const operatorName = user?.name || user?.email || (isPortaria ? 'Carlos Silva (Porteiro Social)' : 'Portaria Social');
    const cleanDoc = receiverDoc.trim();

    try {
      await fetch(
        `${API_BASE_URL}/packages/${pkgId}/deliver?resident_id=${effectiveUserId}`,
        { method: 'PUT', headers: { 'Accept': 'application/json' } }
      );
    } catch (err) {
      console.warn('Aviso: baixa registrada localmente:', err);
    }

    const currentLocals = getLocalPackages();
    const updatedLocals = currentLocals.filter(pkg => pkg.id !== pkgId);
    saveLocalPackages(updatedLocals);

    setPackages(prev => prev.filter(pkg => pkg.id !== pkgId));
    const successMsg = `✅ Encomenda "${pkgDesc}" retirada com sucesso por "${cleanReceiver}"!`;
    setBannerMessage({ type: 'success', text: successMsg });
    setAnnouncement(successMsg);

    // Registra nos Logs de Auditoria do Sistema com rastreabilidade total
    const timestamp = getBrtTimestamp();
    const unitInfo = deliveringPkg?.notes ? ` referente a ${deliveringPkg.notes}` : '';
    const trackingInfo = deliveringPkg?.tracking_code ? ` (Rastreio: ${deliveringPkg.tracking_code})` : '';
    const docInfo = cleanDoc ? ` [Doc/Vínculo: ${cleanDoc}]` : '';
    const logEntry = `[${timestamp}] Retirada de encomenda na Portaria: "${pkgDesc}"${trackingInfo}${unitInfo}. Retirado por: "${cleanReceiver}"${docInfo}. Entregue pelo operador: [${operatorName}].`;
    addAuditLog(logEntry);

    setDeliveringPkg(null);
    setReceiverName('');
    setReceiverDoc('');
  };

  const handleRegisterPackage = async (evt) => {
    evt.preventDefault();
    if (!description.trim()) {
      alert('Por favor, informe a descrição da encomenda.');
      return;
    }

    setIsSubmitting(true);
    const blocoTxt = selectedBloco ? `Bloco ${selectedBloco}` : 'Bloco 1';
    const aptoTxt = selectedApto ? `Apto ${selectedApto}` : '101';
    const formattedNotes = notes ? `[${blocoTxt} - ${aptoTxt}] ${notes}` : `[${blocoTxt} - ${aptoTxt}]`;

    const currentOperator = user?.name || user?.email || (isPortaria ? 'Carlos Silva (Porteiro Social)' : 'Portaria Social');
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pkg-${Date.now()}`;
    let savedPkg = {
      id: tempId,
      apartment_id: effectiveApartmentId,
      description: description,
      tracking_code: trackingCode || null,
      notes: formattedNotes,
      status: 'received',
      received_at: new Date().toISOString(),
      received_by: currentOperator
    };

    try {
      const payload = {
        apartment_id: effectiveApartmentId,
        description: description,
        tracking_code: trackingCode || null,
        notes: formattedNotes
      };

      const response = await fetch(
        `${API_BASE_URL}/packages?current_user_id=${effectiveUserId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const returnedPkg = await response.json();
        if (returnedPkg && returnedPkg.id) {
          savedPkg = {
            ...returnedPkg,
            notes: returnedPkg.notes || formattedNotes,
            received_by: currentOperator // Preserva o nome/e-mail do operador atual em vez do UUID da API
          };
        }
      }
    } catch (err) {
      console.warn('Aviso: salvo no modo de persistência local:', err);
    }

    const currentLocals = getLocalPackages();
    const updatedLocals = [
      savedPkg, 
      ...currentLocals.filter(p => p.id !== tempId && p.id !== savedPkg.id && `${p.apartment_id}_${(p.description||'').trim().toLowerCase()}` !== `${savedPkg.apartment_id}_${(savedPkg.description||'').trim().toLowerCase()}`)
    ];
    saveLocalPackages(updatedLocals);

    setPackages(prev => [
      savedPkg, 
      ...prev.filter(p => p.id !== tempId && p.id !== savedPkg.id && `${p.apartment_id}_${(p.description||'').trim().toLowerCase()}` !== `${savedPkg.apartment_id}_${(savedPkg.description||'').trim().toLowerCase()}`)
    ]);
    const successAlert = `✅ Nova encomenda "${description}" cadastrada com sucesso para o ${aptoTxt}!`;
    setBannerMessage({ type: 'success', text: successAlert });
    setAnnouncement(successAlert);

    // Registra nos Logs de Auditoria do Sistema com operador responsável
    const timestamp = getBrtTimestamp();
    const trackingInfo = trackingCode ? ` (Rastreio: ${trackingCode})` : '';
    const logEntry = `[${timestamp}] Encomenda recebida na Portaria por [${currentOperator}]: "${description}"${trackingInfo} destinada a [${blocoTxt} - ${aptoTxt}].`;
    addAuditLog(logEntry);

    setDescription('');
    setTrackingCode('');
    setNotes('');
    setShowRegisterForm(false);
    setIsSubmitting(false);
  };

  const theme = {
    bg: highContrast ? '#000000' : '#f4f6f8',
    text: highContrast ? '#ffffff' : '#1e293b',
    cardBg: highContrast ? '#111111' : '#ffffff',
    border: highContrast ? '#ffff00' : '#e2e8f0',
    btnPrimaryBg: highContrast ? '#ffff00' : '#2563eb',
    btnPrimaryText: highContrast ? '#000000' : '#ffffff',
    btnSuccessBg: highContrast ? '#00ff00' : '#16a34a',
    btnSuccessText: highContrast ? '#000000' : '#ffffff'
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      
      {/* CABEÇALHO */}
      <header style={{ borderBottom: `2px solid ${theme.border}`, paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
            {isPortaria ? "CondAccess - Painel da Portaria" : "CondAccess - Painel do Morador"}
          </h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.95rem' }}>
            Condomínio Residencial Jardins do Tatuapé
            {!isPortaria && userUnit && <span> • <strong>{userUnit}</strong></span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setHighContrast(!highContrast)}
            style={{ minHeight: '48px', padding: '10px 18px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: `2px solid ${theme.border}`, borderRadius: '6px' }}
          >
            {highContrast ? "Contraste Padrão" : "Alto Contraste"}
          </button>
          <button 
            onClick={fetchPackages}
            disabled={loading}
            style={{ minHeight: '48px', padding: '10px 18px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', backgroundColor: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px' }}
          >
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </div>
      </header>

      {/* REGIÃO ANUNCIADORA PARA LEITORES DE TELA */}
      <div aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}>
        {announcement}
      </div>

      {/* BANNER VISÍVEL DE CONFIRMAÇÃO NA TELA */}
      {bannerMessage && (
        <div 
          role="status" 
          style={{ 
            marginTop: '16px', 
            padding: '14px 20px', 
            backgroundColor: highContrast ? '#003300' : '#dcfce7', 
            color: highContrast ? '#00ff00' : '#14532d', 
            border: `2px solid ${highContrast ? '#00ff00' : '#86efac'}`, 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            fontSize: '1.05rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}
        >
          <span>{bannerMessage.text}</span>
          <button 
            onClick={() => setBannerMessage(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', color: 'inherit' }}
            aria-label="Fechar mensagem"
          >
            ✕
          </button>
        </div>
      )}

      {/* ABAS DE NAVEGAÇÃO (PORTARIA OU MORADOR) */}
      <nav aria-label={isPortaria ? "Navegação da Portaria" : "Navegação do Morador"} style={{ marginTop: '20px', borderBottom: `2px solid ${theme.border}` }}>
        <div role="tablist" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            role="tab"
            aria-selected={activeTab === 'deliveries'}
            aria-controls="tabpanel-deliveries"
            id="tab-deliveries"
            onClick={() => setActiveTab('deliveries')}
            style={{
              padding: '12px 20px',
              fontSize: '1.05rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === 'deliveries' 
                ? (highContrast ? '4px solid #ffff00' : '4px solid #2563eb')
                : '4px solid transparent',
              backgroundColor: activeTab === 'deliveries' ? theme.cardBg : 'transparent',
              color: activeTab === 'deliveries' 
                ? (highContrast ? '#ffff00' : '#2563eb') 
                : theme.text,
              borderRadius: '6px 6px 0 0',
              minHeight: '48px'
            }}
          >
            {isPortaria ? `📦 Gestão de Encomendas (${displayedPackages.length})` : `📦 Minhas Encomendas (${displayedPackages.length})`}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'visitors'}
            aria-controls="tabpanel-visitors"
            id="tab-visitors"
            onClick={() => setActiveTab('visitors')}
            style={{
              padding: '12px 20px',
              fontSize: '1.05rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === 'visitors' 
                ? (highContrast ? '4px solid #ffff00' : '4px solid #2563eb')
                : '4px solid transparent',
              backgroundColor: activeTab === 'visitors' ? theme.cardBg : 'transparent',
              color: activeTab === 'visitors' 
                ? (highContrast ? '#ffff00' : '#2563eb') 
                : theme.text,
              borderRadius: '6px 6px 0 0',
              minHeight: '48px'
            }}
          >
            {isPortaria ? `🚪 Portaria Social & Visitantes (${activeVisitsCount})` : `🚪 Acessos Ativos na Minha Unidade (${activeVisitsCount})`}
          </button>
        </div>
      </nav>

      {/* CONTEÚDO DAS ABAS */}
      <main style={{ marginTop: '24px' }}>
        
        {/* ABA 1: GESTÃO DE ENCOMENDAS */}
        {activeTab === 'deliveries' && (
          <div id="tabpanel-deliveries" role="tabpanel" aria-labelledby="tab-deliveries">
            
            {/* BOTÃO + RECEBER ENCOMENDA */}
            {isPortaria && (
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => setShowRegisterForm(!showRegisterForm)}
                  style={{ minHeight: '48px', padding: '12px 20px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnSuccessBg, color: theme.btnSuccessText, border: 'none', borderRadius: '6px' }}
                >
                  {showRegisterForm ? "Cancelar Cadastro" : "+ Receber Nova Encomenda (Portaria)"}
                </button>
              </div>
            )}

            {/* FORMULÁRIO DE CADASTRO DE ENCOMENDA */}
            {isPortaria && showRegisterForm && (
              <section style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '20px', marginBottom: '24px', maxWidth: '600px' }}>
                <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>Registrar Recebimento na Portaria</h2>
                <form onSubmit={handleRegisterPackage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  <div>
                    <label htmlFor="pkg-bloco" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Bloco / Edifício *</label>
                    <select
                      id="pkg-bloco"
                      value={selectedBloco}
                      onChange={(evt) => setSelectedBloco(evt.target.value)}
                      required
                      style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: theme.cardBg, color: theme.text }}
                    >
                      {BLOCOS_CONDOMINIO.map((bloco) => (
                        <option key={bloco.id} value={bloco.id}>{bloco.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pkg-apto" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Número do Apartamento *</label>
                    <select
                      id="pkg-apto"
                      value={selectedApto}
                      onChange={(evt) => setSelectedApto(evt.target.value)}
                      required
                      style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: theme.cardBg, color: theme.text }}
                    >
                      {aptosDisponiveis.map((item) => (
                        <option key={item.numero} value={item.numero}>{item.rotulo}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pkg-desc" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Descrição da Encomenda *</label>
                    <input 
                      id="pkg-desc" 
                      type="text" 
                      value={description} 
                      onChange={(evt) => setDescription(evt.target.value)} 
                      placeholder="Ex: Pacote Amazon, Caixa Sedex..." 
                      required 
                      style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: theme.cardBg, color: theme.text }} 
                    />
                  </div>

                  <div>
                    <label htmlFor="pkg-tracking" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Código de Rastreio (Opcional)</label>
                    <input 
                      id="pkg-tracking" 
                      type="text" 
                      value={trackingCode} 
                      onChange={(evt) => setTrackingCode(evt.target.value)} 
                      placeholder="Ex: BR123456789" 
                      style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: theme.cardBg, color: theme.text }} 
                    />
                  </div>

                  <div>
                    <label htmlFor="pkg-notes" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Observações (Opcional)</label>
                    <input 
                      id="pkg-notes" 
                      type="text" 
                      value={notes} 
                      onChange={(evt) => setNotes(evt.target.value)} 
                      placeholder="Ex: Deixado na recepção social" 
                      style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: theme.cardBg, color: theme.text }} 
                    />
                  </div>

                  <button type="submit" disabled={isSubmitting} style={{ minHeight: '48px', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: 'none', borderRadius: '6px' }}>
                    {isSubmitting ? "Enviando..." : "Confirmar Recebimento (POST /packages)"}
                  </button>
                </form>
              </section>
            )}

            {/* LISTAGEM DE ENCOMENDAS PENDENTES */}
            <section aria-label="Suas encomendas pendentes">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
                  {isPortaria ? `Entregas Aguardando Retirada (${displayedPackages.length})` : `Suas Encomendas Aguardando Retirada (${displayedPackages.length})`}
                </h2>
                {!isPortaria && (
                  <span style={{ fontSize: '0.85rem', opacity: 0.85, fontStyle: 'italic' }}>
                    * Somente a portaria pode dar baixa física na entrega
                  </span>
                )}
              </div>

              {loading ? (
                <p style={{ fontSize: '1.1rem' }}>Carregando encomendas do servidor...</p>
              ) : error ? (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{error}</p>
                  <button onClick={fetchPackages} style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}>Tentar Novamente</button>
                </div>
              ) : displayedPackages.length === 0 ? (
                <div style={{ padding: '24px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                    {isPortaria ? "Nenhuma encomenda pendente na portaria." : `Nenhuma encomenda pendente para seu apartamento (${userUnit || 'Sua Unidade'}).`}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>
                    {isPortaria ? "Novos pacotes recebidos aparecerão nesta lista." : "Assim que a portaria receber uma correspondência ou encomenda para a sua unidade, ela será listada aqui."}
                  </p>
                </div>
              ) : (
                <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {displayedPackages.map((pkg) => (
                    <li key={pkg.id} style={{ padding: '20px', border: `2px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <strong style={{ fontSize: '1.2rem', color: theme.text }}>{pkg.description}</strong>
                        {pkg.tracking_code && <span>Código de Rastreio: <code>{pkg.tracking_code}</code></span>}
                        <small style={{ opacity: 0.8 }}>Recebido em: {formatBrtDateTime(pkg.received_at)}</small>
                        {pkg.notes && <small style={{ fontStyle: 'italic', fontWeight: '600' }}>Obs: {pkg.notes}</small>}
                      </div>

                      {/* Controle de Baixa: Exclusivo da Portaria. Morador visualiza selo informativo */}
                      {isPortaria ? (
                        <button 
                          onClick={() => handleOpenDeliverModal(pkg)} 
                          style={{ minHeight: '48px', padding: '10px 18px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnSuccessBg, color: theme.btnSuccessText, border: 'none', borderRadius: '6px' }}
                        >
                          Confirmar Retirada
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span style={{ 
                            padding: '8px 14px', 
                            borderRadius: '6px', 
                            fontWeight: 'bold', 
                            fontSize: '0.9rem', 
                            backgroundColor: highContrast ? '#ffff00' : '#dbeafe', 
                            color: highContrast ? '#000000' : '#1e40af', 
                            border: highContrast ? '2px solid #ffff00' : '1px solid #bfdbfe', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px' 
                          }}>
                            📦 Disponível na Portaria
                          </span>
                          <small style={{ fontSize: '0.8rem', opacity: 0.85, maxWidth: '240px', textAlign: 'right' }}>
                            Retirada presencial na portaria mediante apresentação de documento
                          </small>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* MODAL ACESSÍVEL DE CONFIRMAÇÃO DE RETIRADA */}
            {deliveringPkg && (
              <div 
                role="dialog" 
                aria-modal="true" 
                aria-labelledby="modal-deliver-title" 
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}
              >
                <div style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '92%', color: theme.text, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <h3 id="modal-deliver-title" style={{ marginTop: 0, fontSize: '1.3rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>
                    📦 Confirmar Retirada de Encomenda
                  </h3>
                  
                  <div style={{ margin: '14px 0', padding: '12px', backgroundColor: highContrast ? '#222222' : '#f8fafc', borderRadius: '6px', border: `1px solid ${theme.border}`, fontSize: '0.95rem' }}>
                    <p style={{ margin: '0 0 4px 0' }}><strong>Item:</strong> {deliveringPkg.description}</p>
                    {deliveringPkg.tracking_code && <p style={{ margin: '0 0 4px 0' }}><strong>Rastreio:</strong> <code>{deliveringPkg.tracking_code}</code></p>}
                    {deliveringPkg.notes && <p style={{ margin: 0 }}><strong>Destino:</strong> {deliveringPkg.notes}</p>}
                  </div>

                  <form onSubmit={handleConfirmDeliver} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label htmlFor="receiver-name-input" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                        Nome de Quem Retirou *
                      </label>
                      <input 
                        id="receiver-name-input"
                        type="text" 
                        value={receiverName} 
                        onChange={e => setReceiverName(e.target.value)} 
                        placeholder="Ex: Nome do morador ou autorizado" 
                        required 
                        autoFocus
                        style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: `1px solid ${theme.border}`, backgroundColor: highContrast ? '#000000' : '#ffffff', color: theme.text, fontSize: '1rem', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div>
                      <label htmlFor="receiver-doc-input" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                        Documento (RG / CPF) ou Grau de Parentesco (Opcional)
                      </label>
                      <input 
                        id="receiver-doc-input"
                        type="text" 
                        value={receiverDoc} 
                        onChange={e => setReceiverDoc(e.target.value)} 
                        placeholder="Ex: RG 12.345.678-9 ou Filho / Cônjuge" 
                        style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '4px', border: `1px solid ${theme.border}`, backgroundColor: highContrast ? '#000000' : '#ffffff', color: theme.text, fontSize: '1rem', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                      🛡️ <strong>Operador responsável pela entrega:</strong> {user?.name || user?.email || (isPortaria ? 'Carlos Silva (Porteiro Social)' : 'Portaria Social')}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        type="button" 
                        onClick={() => setDeliveringPkg(null)} 
                        style={{ minHeight: '44px', padding: '8px 16px', cursor: 'pointer', backgroundColor: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        style={{ minHeight: '44px', padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: theme.btnSuccessBg, color: theme.btnSuccessText, border: 'none', borderRadius: '4px' }}
                      >
                        Confirmar Baixa e Entrega
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA 2: CONTROLE DE VISITANTES E PRESTADORES */}
        {activeTab === 'visitors' && (
          <div id="tabpanel-visitors" role="tabpanel" aria-labelledby="tab-visitors">
            {isPortaria ? (
              <VisitorManagerSection isHighContrast={highContrast} />
            ) : (
              <ResidentVisitorsSection 
                isHighContrast={highContrast} 
                user={user} 
                userUnit={userUnit}
                userBlock={userBlock}
                userApt={userApt}
              />
            )}
          </div>
        )}

      </main>
    </div>
  );
}
