import React, { useState, useEffect, useCallback } from 'react';

/**
 * DeliveryAlert Component (v6)
 * Componente React Acessível (WCAG 2.1 AA) com Seletores de Bloco e Apartamento.
 * Atualização otimista do estado para exibição imediata de encomendas na Portaria.
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
  currentUserId = DEFAULT_USER_ID 
}) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [highContrast, setHighContrast] = useState(false);

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
      setAnnouncement(
        data.length === 0 
          ? 'Nenhuma encomenda pendente encontrada.' 
          : `${data.length} encomenda(s) carregada(s) com sucesso.`
      );
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
      const formattedNotes = notes 
        ? `[Bloco ${selectedBloco} - Apto ${selectedApto}] ${notes}` 
        : `[Bloco ${selectedBloco} - Apto ${selectedApto}]`;

      const payload = {
        apartment_id: apartmentId,
        description: description,
        tracking_code: trackingCode || null,
        notes: formattedNotes
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

      const responseData = await response.json();

      // Objeto de encomenda para atualização instantânea na UI (Optimistic Update)
      const newPackage = {
        id: responseData.id || Math.random().toString(),
        apartment_id: apartmentId,
        description: description,
        tracking_code: trackingCode || null,
        notes: formattedNotes,
        status: 'received',
        received_at: responseData.received_at || new Date().toISOString()
      };

      // Atualiza o estado React imediatamente para a encomenda aparecer na tela da portaria
      setPackages(prev => [newPackage, ...prev]);
      setAnnouncement(`Nova encomenda cadastrada com sucesso para o Apto ${selectedApto}.`);

      // Limpa os campos do formulário
      setDescription('');
      setTrackingCode('');
      setNotes('');
      setSelectedBloco('');
      setSelectedApto('');
      setShowRegisterForm(false);
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
          <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.95rem' }}>Condomínio Residencial Jardins do Tatuapé</p>
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

      <div aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}>
        {announcement}
      </div>

      <main style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            style={{ minHeight: '48px', padding: '12px 20px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnSuccessBg, color: theme.btnSuccessText, border: 'none', borderRadius: '6px' }}
          >
            {showRegisterForm ? "Cancelar Cadastro" : "+ Receber Nova Encomenda (Portaria)"}
          </button>
        </div>

        {/* FORMULÁRIO COM SELETORES DE BLOCO E APARTAMENTO */}
        {showRegisterForm && (
          <section style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '20px', marginBottom: '24px', maxWidth: '600px' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>Registrar Recebimento na Portaria</h2>
            <form onSubmit={handleRegisterPackage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* SELEÇÃO DO BLOCO */}
              <div>
                <label htmlFor="pkg-bloco" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Bloco / Edifício *</label>
                <select
                  id="pkg-bloco"
                  value={selectedBloco}
                  onChange={(evt) => setSelectedBloco(evt.target.value)}
                  required
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- Selecione o Bloco --</option>
                  {BLOCOS_CONDOMINIO.map((bloco) => (
                    <option key={bloco.id} value={bloco.id}>{bloco.nome}</option>
                  ))}
                </select>
              </div>

              {/* SELEÇÃO DO APARTAMENTO */}
              <div>
                <label htmlFor="pkg-apto" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Número do Apartamento *</label>
                <select
                  id="pkg-apto"
                  value={selectedApto}
                  onChange={(evt) => setSelectedApto(evt.target.value)}
                  disabled={!selectedBloco}
                  required
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: !selectedBloco ? '#e2e8f0' : '#ffffff' }}
                >
                  <option value="">
                    {!selectedBloco ? '-- Escolha primeiro o Bloco --' : '-- Selecione o Apartamento --'}
                  </option>
                  {aptosDisponiveis.map((item) => (
                    <option key={item.numero} value={item.numero}>{item.rotulo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pkg-desc" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Descrição da Encomenda *</label>
                <input id="pkg-desc" type="text" value={description} onChange={(evt) => setDescription(evt.target.value)} placeholder="Ex: Pacote Amazon, Caixa Sedex..." required style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <div>
                <label htmlFor="pkg-tracking" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Código de Rastreio (Opcional)</label>
                <input id="pkg-tracking" type="text" value={trackingCode} onChange={(evt) => setTrackingCode(evt.target.value)} placeholder="Ex: BR123456789" style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <div>
                <label htmlFor="pkg-notes" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Observações (Opcional)</label>
                <input id="pkg-notes" type="text" value={notes} onChange={(evt) => setNotes(evt.target.value)} placeholder="Ex: Deixado na recepção social" style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <button type="submit" disabled={isSubmitting} style={{ minHeight: '48px', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: 'none', borderRadius: '6px' }}>
                {isSubmitting ? "Enviando..." : "Salvar no Banco (POST /packages)"}
              </button>
            </form>
          </section>
        )}

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
                    {pkg.notes && <small style={{ fontStyle: 'italic', color: highContrast ? '#ffff00' : '#1e40af', fontWeight: 'bold' }}>Localização / Bloco-Apto: {pkg.notes}</small>}
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