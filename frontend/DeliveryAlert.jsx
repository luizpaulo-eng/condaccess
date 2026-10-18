import React, { useState, useEffect, useCallback } from 'react';

/**
 * DeliveryAlert Component (v8) - CondAccess
 * Componente React Acessível (WCAG 2.1 AA) de Gestão de Encomendas.
 * 
 * Melhorias e Solução de Persistência:
 * 1. Persistência de Encomendas de Demonstração em localStorage ('condaccess_demo_pkgs'):
 *    Garante que encomendas cadastradas na Portaria fiquem salvas ao dar F5, clicar em Atualizar
 *    ou alternar entre "Demo Portaria" e "Demo Morador".
 * 2. Suporte a Perfis (Portaria vs Morador) via Props e localStorage ('condaccess_user').
 * 3. Botão "+ Receber Nova Encomenda (Portaria)" visível APENAS para o perfil Portaria / Admin.
 * 4. Banners visíveis de confirmação na tela para cadastros e retiradas (+ leitores de tela aria-live).
 * 5. Integração resiliente com a API FastAPI/Supabase em nuvem.
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

const INITIAL_DEMO_PACKAGE = {
  id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  apartment_id: DEFAULT_APARTMENT_ID,
  description: 'Pacote e-Commerce (Caixa Grande - Mercado Livre)',
  tracking_code: 'BR987654321',
  status: 'received',
  received_at: new Date().toISOString(),
  notes: 'Deixado na portaria social'
};

// Funções auxiliares para persistência em localStorage no navegador
const getLocalPackages = () => {
  try {
    const raw = localStorage.getItem('condaccess_demo_pkgs');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalPackages = (pkgs) => {
  try {
    localStorage.setItem('condaccess_demo_pkgs', JSON.stringify(pkgs));
  } catch (e) {}
};

// Lista oficial dos 5 Blocos do Condomínio Residencial Jardins do Tatuapé
const BLOCOS_CONDOMINIO = [
  { id: 1, nome: 'Bloco 1 - Macieira' },
  { id: 2, nome: 'Bloco 2 - Pereira' },
  { id: 3, nome: 'Bloco 3 - Nogueira' },
  { id: 4, nome: 'Bloco 4 - Amoreira' },
  { id: 5, nome: 'Bloco 5 - Cerejeira' }
];

export default function DeliveryAlert({ 
  user: userProp = null,
  apartmentId: aptProp = null, 
  currentUserId: userPropId = null 
}) {
  // Obtém o usuário logado via Props ou localStorage
  const getStoredUser = () => {
    if (userProp) return userProp;
    try {
      const stored = localStorage.getItem('condaccess_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  };

  const user = getStoredUser();
  const isPortaria = !user || user.role === 'portaria';

  // Identificador do apartamento alvo (Morador Apto 101 por padrão no Demo)
  const effectiveApartmentId = aptProp || user?.apartmentId || DEFAULT_APARTMENT_ID;
  const effectiveUserId = userPropId || user?.id || DEFAULT_USER_ID;

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [bannerMessage, setBannerMessage] = useState(null);
  const [highContrast, setHighContrast] = useState(false);

  // Estados do formulário de cadastro
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedBloco, setSelectedBloco] = useState('1');
  const [selectedApto, setSelectedApto] = useState('101');
  const [aptosDisponiveis, setAptosDisponiveis] = useState([]);
  const [description, setDescription] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualiza a lista de apartamentos (11 a 174) conforme o bloco selecionado
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

  // Consulta backend + sincroniza com localStorage
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

    // Carrega encomendas salvas no navegador
    let localPkgs = getLocalPackages();
    if (localPkgs.length === 0 && apiData.length === 0) {
      localPkgs = [INITIAL_DEMO_PACKAGE];
      saveLocalPackages(localPkgs);
    }

    // Mescla API e localStorage sem duplicar IDs
    const apiIds = new Set(apiData.map(p => p.id));
    const merged = [
      ...apiData,
      ...localPkgs.filter(p => p.status === 'received' && !apiIds.has(p.id))
    ];

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

  // Registra a retirada
  const handleDeliverPackage = async (packageId, packageDescription) => {
    try {
      await fetch(
        `${API_BASE_URL}/packages/${packageId}/deliver?resident_id=${effectiveUserId}`,
        { method: 'PUT', headers: { 'Accept': 'application/json' } }
      );
    } catch (err) {
      console.warn('Aviso: baixa registrada localmente:', err);
    }

    // Atualiza o estado local e remove do localStorage
    const currentLocals = getLocalPackages();
    const updatedLocals = currentLocals.filter(pkg => pkg.id !== packageId);
    saveLocalPackages(updatedLocals);

    setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
    const successMsg = `✅ Encomenda "${packageDescription}" confirmada como retirada com sucesso!`;
    setBannerMessage({ type: 'success', text: successMsg });
    setAnnouncement(successMsg);
  };

  // Cadastra nova encomenda
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

    const newPkg = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pkg-${Date.now()}`,
      apartment_id: effectiveApartmentId,
      description: description,
      tracking_code: trackingCode || null,
      notes: formattedNotes,
      status: 'received',
      received_at: new Date().toISOString()
    };

    // Salva no localStorage para persistência permanente no navegador
    const currentLocals = getLocalPackages();
    const updatedLocals = [newPkg, ...currentLocals];
    saveLocalPackages(updatedLocals);

    // Tenta gravar no backend FastAPI
    try {
      const payload = {
        apartment_id: effectiveApartmentId,
        description: description,
        tracking_code: trackingCode || null,
        notes: formattedNotes
      };

      await fetch(
        `${API_BASE_URL}/packages?current_user_id=${effectiveUserId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
    } catch (err) {
      console.warn('Aviso: salvo no modo de persistência local:', err);
    }

    setPackages(prev => [newPkg, ...prev]);
    const successAlert = `✅ Nova encomenda "${description}" cadastrada com sucesso para o ${aptoTxt}!`;
    setBannerMessage({ type: 'success', text: successAlert });
    setAnnouncement(successAlert);

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
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>CondAccess - Painel de Encomendas</h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.95rem' }}>
            Condomínio Residencial Jardins do Tatuapé
            {user && (
              <span style={{ fontWeight: 'bold', marginLeft: '10px', color: highContrast ? '#ffff00' : '#2563eb' }}>
                | Perfil: {isPortaria ? 'Portaria / Admin' : 'Morador'} ({user.nome || user.email})
              </span>
            )}
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

      <main style={{ marginTop: '24px' }}>
        
        {/* BOTÃO + RECEBER ENCOMENDA - VISÍVEL APENAS PARA PERFIL PORTARIA */}
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

        {/* FORMULÁRIO DE CADASTRO (PORTARIA) */}
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
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
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
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
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
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }} 
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
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }} 
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
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }} 
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
          <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Entregas Aguardando Retirada ({packages.length})</h2>
          {loading ? (
            <p style={{ fontSize: '1.1rem' }}>Carregando encomendas do servidor...</p>
          ) : error ? (
            <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{error}</p>
              <button onClick={fetchPackages} style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}>Tentar Novamente</button>
            </div>
          ) : packages.length === 0 ? (
            <p style={{ fontSize: '1.1rem' }}>Nenhuma encomenda pendente na portaria.</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {packages.map((pkg) => (
                <li key={pkg.id} style={{ padding: '20px', border: `2px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <strong style={{ fontSize: '1.2rem', color: theme.text }}>{pkg.description}</strong>
                    {pkg.tracking_code && <span>Código de Rastreio: <code>{pkg.tracking_code}</code></span>}
                    <small style={{ opacity: 0.8 }}>Recebido em: {new Date(pkg.received_at).toLocaleString('pt-BR')}</small>
                    {pkg.notes && <small style={{ fontStyle: 'italic', fontWeight: '600' }}>Obs: {pkg.notes}</small>}
                  </div>
                  <button onClick={() => handleDeliverPackage(pkg.id, pkg.description)} style={{ minHeight: '48px', padding: '10px 18px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnSuccessBg, color: theme.btnSuccessText, border: 'none', borderRadius: '6px' }}>
                    Confirmar Retirada
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
