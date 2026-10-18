import React, { useState, useEffect, useCallback } from 'react';

/**
 * DeliveryAlert Component
 * Componente React Acessível (WCAG 2.1 AA) com Seletores de Bloco, Apartamento e Controle de Perfil.
 * Condomínio Residencial Jardins do Tatuapé (5 Blocos / 340 Unidades)
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

// Lista oficial dos 5 Blocos do Condomínio Residencial Jardins do Tatuapé
const BLOCOS_CONDOMINIO = [
  { id: 1, nome: 'Bloco 1 - Macieira' },
  { id: 2, nome: 'Bloco 2 - Pereira' },
  { id: 3, nome: 'Bloco 3 - Nogueira' },
  { id: 4, nome: 'Bloco 4 - Amoreira' },
  { id: 5, nome: 'Bloco 5 - Cerejeira' }
];

export default function DeliveryAlert({ 
  apartmentId = DEFAULT_APARTMENT_ID, 
  currentUserId = DEFAULT_USER_ID,
  userRole = 'portaria'
}) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [highContrast, setHighContrast] = useState(false);

  // Define se o usuário logado é da Portaria / Administração
  const isPortaria = userRole === 'portaria' || userRole === 'admin';

  // Estados do formulário de cadastro de encomenda (Interface da Portaria)
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedBloco, setSelectedBloco] = useState('');
  const [selectedApto, setSelectedApto] = useState('');
  const [aptosDisponiveis, setAptosDisponiveis] = useState([]);
  const [description, setDescription] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualiza a lista de apartamentos conforme o bloco selecionado
  useEffect(() => {
    if (!selectedBloco) {
      setAptosDisponiveis([]);
      setSelectedApto('');
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
    setSelectedApto('');
  }, [selectedBloco]);

  // GET /apartments/{apartment_id}/packages
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/apartments/${apartmentId}/packages?status_filter=received`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!response.ok) throw new Error(`Erro: ${response.status}`);
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      console.error('Erro ao buscar encomendas:', err);
      setError('Não foi possível conectar ao servidor backend.');
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // PUT /packages/{package_id}/deliver
  const handleDeliverPackage = async (packageId, packageDescription) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/packages/${packageId}/deliver?resident_id=${currentUserId}`,
        { method: 'PUT', headers: { 'Accept': 'application/json' } }
      );
      if (!response.ok) throw new Error(`Erro: ${response.status}`);
      setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
      setAnnouncement(`Encomenda "${packageDescription}" retirada com sucesso.`);
    } catch (err) {
      alert('Erro ao registrar a retirada.');
    }
  };

  // POST /packages
  const handleRegisterPackage = async (evt) => {
    evt.preventDefault();
    if (!selectedBloco || !selectedApto) {
      alert('Por favor, selecione o Bloco e o Apartamento.');
      return;
    }
    if (!description.trim()) {
      alert('Por favor, informe a descrição da encomenda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        apartment_id: apartmentId,
        description: description,
        tracking_code: trackingCode || null,
        notes: notes ? `[Bloco ${selectedBloco} - Apto ${selectedApto}] ${notes}` : `[Bloco ${selectedBloco} - Apto ${selectedApto}]`
      };

      const response = await fetch(
        `${API_BASE_URL}/packages?current_user_id=${currentUserId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) throw new Error(`Erro: ${response.status}`);

      setDescription('');
      setTrackingCode('');
      setNotes('');
      setSelectedBloco('');
      setSelectedApto('');
      setShowRegisterForm(false);
      setAnnouncement(`Nova encomenda cadastrada com sucesso para o Apto ${selectedApto}.`);
      fetchPackages();
    } catch (err) {
      alert('Erro ao registrar encomenda no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
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
      <header style={{ borderBottom: `2px solid ${theme.border}`, paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>CondAccess - Painel de Encomendas</h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>Condomínio Residencial Jardins do Tatuapé</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setHighContrast(!highContrast)}
            style={{ minHeight: '48px', padding: '10px 18px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: 'none', borderRadius: '6px' }}
            aria-label={highContrast ? "Desativar modo de alto contraste" : "Ativar modo de alto contraste"}
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

      {/* Região ARIA-LIVE para Leitores de Tela */}
      <div aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}>
        {announcement}
      </div>

      {/* Banner Visual Verde de Confirmação */}
      {announcement && (
        <div 
          style={{
            marginTop: '16px',
            padding: '12px 20px',
            backgroundColor: highContrast ? '#003300' : '#dcfce7',
            color: highContrast ? '#00ff00' : '#15803d',
            border: `1px solid ${highContrast ? '#00ff00' : '#86efac'}`,
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1rem',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>✅ {announcement}</span>
          <button 
            onClick={() => setAnnouncement('')}
            style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '12px' }}
            aria-label="Fechar notificação"
          >
            ✕
          </button>
        </div>
      )}

      <main style={{ marginTop: '24px' }}>
        {/* BOTÃO DE RECEBER ENCOMENDA: EXIBIDO APENAS PARA PERFIL PORTARIA / ADMIN */}
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

        {/* FORMULÁRIO DE REGISTRO DA PORTARIA */}
        {isPortaria && showRegisterForm && (
          <form 
            onSubmit={handleRegisterPackage} 
            style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '20px', marginBottom: '24px' }}
          >
            <h2 style={{ fontSize: '1.3rem', marginTop: 0 }}>Receber Nova Encomenda</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Bloco do Condomínio *</label>
                <select 
                  value={selectedBloco}
                  onChange={(e) => setSelectedBloco(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- Selecione o Bloco --</option>
                  {BLOCOS_CONDOMINIO.map(bloco => (
                    <option key={bloco.id} value={bloco.id}>{bloco.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Apartamento *</label>
                <select 
                  value={selectedApto}
                  onChange={(e) => setSelectedApto(e.target.value)}
                  disabled={!selectedBloco}
                  required
                  style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">{selectedBloco ? "-- Selecione o Apto --" : "Selecione o Bloco primeiro"}</option>
                  {aptosDisponiveis.map(apto => (
                    <option key={apto.numero} value={apto.numero}>{apto.rotulo}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Descrição da Encomenda *</label>
              <input 
                type="text"
                placeholder="Ex: Caixa da Amazon - Livros"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Código de Rastreio (opcional)</label>
                <input 
                  type="text"
                  placeholder="Ex: BR123456789"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Observações da Portaria</label>
                <input 
                  type="text"
                  placeholder="Ex: Entregue na recepção social"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnSuccessBg, color: theme.btnSuccessText, border: 'none', borderRadius: '6px' }}
            >
              {isSubmitting ? "Cadastrando..." : "Salvar Encomenda"}
            </button>
          </form>
        )}

        <section aria-label="Encomendas aguardando retirada">
          <h2 style={{ fontSize: '1.4rem' }}>
            Entregas Aguardando Retirada ({packages.length})
          </h2>

          {loading ? (
            <p>Carregando lista de encomendas...</p>
          ) : error ? (
            <p style={{ color: '#ef4444', fontWeight: 'bold' }}>{error}</p>
          ) : packages.length === 0 ? (
            /* MENSAGEM DINÂMICA DE ACORDO COM O PERFIL */
            <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>
              {isPortaria 
                ? "Nenhuma encomenda pendente na portaria." 
                : "Nenhuma encomenda pendente para este apartamento."}
            </p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0, display: 'grid', gap: '16px' }}>
              {packages.map((pkg) => (
                <li 
                  key={pkg.id} 
                  style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
                >
                  <div>
                    <strong style={{ fontSize: '1.1rem', display: 'block' }}>{pkg.description}</strong>
                    {pkg.tracking_code && (
                      <span style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block' }}>Código de Rastreio: {pkg.tracking_code}</span>
                    )}
                    <span style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block' }}>
                      Recebido em: {new Date(pkg.received_at).toLocaleString('pt-BR')}
                    </span>
                    {pkg.notes && (
                      <span style={{ fontSize: '0.85rem', color: theme.btnPrimaryBg, display: 'block', marginTop: '4px' }}>
                        Obs: {pkg.notes}
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => handleDeliverPackage(pkg.id, pkg.description)}
                    style={{ padding: '10px 16px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnSuccessBg, color: theme.btnSuccessText, border: 'none', borderRadius: '6px' }}
                  >
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
