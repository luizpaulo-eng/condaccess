import React, { useState, useEffect } from 'react';

/**
 * VisitorManager.jsx - Módulo de Controle de Visitantes e Prestadores de Serviços
 * Componente React Acessível (WCAG 2.1 AA / WAI-ARIA) para o CondAccess
 * 
 * Integração com Backend FastAPI (/visitors, /visits) e Supabase (PostgreSQL)
 */
const INITIAL_DEMO_VISITS = [
  {
    id: 'v1',
    visitor_name: 'Carlos Eduardo Mendes',
    document_id: '345.678.901-22',
    visitor_type: 'contractor',
    company: 'Manutenção de Elevadores Otis',
    block: 'Bloco 2 - Pereira',
    apartment: '304',
    entry_time: '14:30',
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
    entry_time: '15:15',
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


export default function VisitorManager({ isHighContrast = false }) {
  // Estado para armazenar a lista de visitas ativas (com persistência no localStorage)
  const [activeVisits, setActiveVisits] = useState(() => getLocalVisitors());


  // Estados do formulário
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [visitorType, setVisitorType] = useState('visitor');
  const [company, setCompany] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('Bloco 1 - Macieira');
  const [selectedApartment, setSelectedApartment] = useState('11');

  // Estado para região ARIA-Live (anúncio para leitores de tela)
  const [announcement, setAnnouncement] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  // Blocos e apartamentos (340 unidades)
  const blocks = [
    'Bloco 1 - Macieira',
    'Bloco 2 - Pereira',
    'Bloco 3 - Nogueira',
    'Bloco 4 - Amoreira',
    'Bloco 5 - Cerejeira'
  ];

  const apartments = Array.from({ length: 68 }, (_, i) => `${(Math.floor(i / 4) + 1) * 10 + (i % 4 + 1)}`);

  // Submissão do formulário de entrada
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
      entry_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'active'
    };

    const updatedVisits = [newVisit, ...activeVisits];
    setActiveVisits(updatedVisits);
    saveLocalVisitors(updatedVisits);

    // Mensagem de anúncio acessível WAI-ARIA
    const typeLabel = visitorType === 'contractor' ? 'Prestador de serviço' : visitorType === 'delivery_person' ? 'Entregador' : 'Visitante';
    const msg = `Entrada de ${typeLabel} ${name} registrada para o ${selectedBlock}, Apartamento ${selectedApartment}.`;
    
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

  // Baixa / Registro de Saída
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

  // Estilos de Alto Contraste vs Padrão
  const themeStyles = {
    container: {
      backgroundColor: isHighContrast ? '#000000' : '#f8fafc',
      color: isHighContrast ? '#ffffff' : '#0f172a',
      padding: '24px',
      borderRadius: '12px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    card: {
      backgroundColor: isHighContrast ? '#121212' : '#ffffff',
      border: isHighContrast ? '2px solid #ffff00' : '1px solid #e2e8f0',
      color: isHighContrast ? '#ffffff' : '#0f172a',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '24px'
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '1rem',
      backgroundColor: isHighContrast ? '#000000' : '#ffffff',
      color: isHighContrast ? '#ffff00' : '#0f172a',
      border: isHighContrast ? '2px solid #ffff00' : '1px solid #cbd5e1',
      borderRadius: '6px',
      marginTop: '6px',
      marginBottom: '16px',
      minHeight: '48px' // Área de toque acessível
    },
    buttonPrimary: {
      backgroundColor: isHighContrast ? '#ffff00' : '#2563eb',
      color: isHighContrast ? '#000000' : '#ffffff',
      fontWeight: 'bold',
      fontSize: '1rem',
      padding: '14px 24px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      minHeight: '48px',
      width: '100%'
    },
    buttonDanger: {
      backgroundColor: isHighContrast ? '#ff0000' : '#dc2626',
      color: '#ffffff',
      fontWeight: 'bold',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      minHeight: '44px'
    },
    badge: (type) => ({
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      backgroundColor: isHighContrast ? '#ffff00' : (type === 'contractor' ? '#fef3c7' : type === 'delivery_person' ? '#e0e7ff' : '#dcfce7'),
      color: isHighContrast ? '#000000' : (type === 'contractor' ? '#92400e' : type === 'delivery_person' ? '#3730a3' : '#166534')
    })
  };

  return (
    <div style={themeStyles.container} className="visitor-manager-module">
      {/* Região Dinâmica WAI-ARIA para Leitores de Tela */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}
      >
        {announcement}
      </div>

      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 8px 0', color: isHighContrast ? '#ffff00' : '#1e293b' }}>
          🚪 Controle de Visitantes e Prestadores de Serviços
        </h2>
        <p style={{ margin: 0, color: isHighContrast ? '#ffffff' : '#64748b' }}>
          Portaria Social — Condomínio Residencial Jardins do Tatuapé
        </p>
      </header>

      {/* Banner de Confirmação Visual */}
      {showSuccessBanner && (
        <div 
          role="status" 
          style={{
            backgroundColor: isHighContrast ? '#00ff00' : '#dcfce7',
            color: isHighContrast ? '#000000' : '#14532d',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontWeight: 'bold',
            border: isHighContrast ? '2px solid #000000' : '1px solid #bbf7d0'
          }}
        >
          ✅ {bannerMessage}
        </div>
      )}

      {/* Formulário de Novo Registro de Visita */}
      <section style={themeStyles.card} aria-labelledby="form-title">
        <h3 id="form-title" style={{ marginTop: 0, color: isHighContrast ? '#ffff00' : '#0f172a' }}>
          + Registrar Nova Entrada na Portaria
        </h3>
        
        <form onSubmit={handleRegisterEntry}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label htmlFor="vis-name" style={{ fontWeight: 'bold' }}>Nome Completo *</label>
              <input 
                id="vis-name"
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: João da Silva" 
                required 
                style={themeStyles.input}
              />
            </div>

            <div>
              <label htmlFor="vis-doc" style={{ fontWeight: 'bold' }}>Documento (CPF / RG) *</label>
              <input 
                id="vis-doc"
                type="text" 
                value={documentId} 
                onChange={(e) => setDocumentId(e.target.value)} 
                placeholder="Ex: 123.456.789-00" 
                required 
                style={themeStyles.input}
              />
            </div>

            <div>
              <label htmlFor="vis-type" style={{ fontWeight: 'bold' }}>Tipo de Acesso *</label>
              <select 
                id="vis-type"
                value={visitorType} 
                onChange={(e) => setVisitorType(e.target.value)}
                style={themeStyles.input}
              >
                <option value="visitor">👤 Visitante Social</option>
                <option value="contractor">🛠️ Prestador de Serviço</option>
                <option value="delivery_person">🛵 Entregador / Courier</option>
              </select>
            </div>

            <div>
              <label htmlFor="vis-company" style={{ fontWeight: 'bold' }}>Empresa / Prestadora</label>
              <input 
                id="vis-company"
                type="text" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
                placeholder="Ex: Enel, Comgás, Uber Eats" 
                style={themeStyles.input}
              />
            </div>

            <div>
              <label htmlFor="vis-block" style={{ fontWeight: 'bold' }}>Bloco de Destino *</label>
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
              <label htmlFor="vis-apt" style={{ fontWeight: 'bold' }}>Apartamento *</label>
              <select 
                id="vis-apt"
                value={selectedApartment} 
                onChange={(e) => setSelectedApartment(e.target.value)}
                style={themeStyles.input}
              >
                {apartments.map(apt => <option key={apt} value={apt}>Apto {apt}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" style={themeStyles.buttonPrimary}>
            Confirmar e Autorizar Entrada
          </button>
        </form>
      </section>

      {/* Lista de Visitantes Ativos no Condomínio */}
      <section style={themeStyles.card} aria-labelledby="active-list-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 id="active-list-title" style={{ margin: 0, color: isHighContrast ? '#ffff00' : '#0f172a' }}>
            📋 Visitantes Atualmente no Condomínio ({activeVisits.length})
          </h3>
        </div>

        {activeVisits.length === 0 ? (
          <p style={{ textAlign: 'center', color: isHighContrast ? '#ffffff' : '#64748b', padding: '20px 0' }}>
            Nenhum visitante ou prestador de serviço no interior do condomínio neste momento.
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
                      <small style={{ color: isHighContrast ? '#cccccc' : '#64748b' }}>Doc: {visit.document_id}</small>
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
                    <td style={{ padding: '12px' }}>{visit.entry_time}</td>
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
      </section>
    </div>
  );
}
`,TargetFile:
