import React, { useState, useEffect, useCallback } from 'react';

/**
 * DeliveryAlert Component (v4 - Backend Integrado)
 * Componente React Acessível (WCAG 2.1 AA) conectado aos endpoints da API CondAccess.
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

const DEFAULT_APARTMENT_ID = '123e4567-e89b-12d3-a456-426614174000';
const DEFAULT_USER_ID = '98765432-e89b-12d3-a456-426614174000';

export default function DeliveryAlert({ 
  apartmentId = DEFAULT_APARTMENT_ID, 
  currentUserId = DEFAULT_USER_ID 
}) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [highContrast, setHighContrast] = useState(false);

  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [description, setDescription] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. GET /apartments/{apartment_id}/packages
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/apartments/${apartmentId}/packages?status_filter=received`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setPackages(data);

      const msg = data.length === 0 
        ? 'Nenhuma encomenda pendente encontrada.' 
        : `${data.length} encomenda(s) pendente(s) carregada(s) com sucesso.`;
      
      setAnnouncement(msg);
    } catch (err) {
      console.error('Erro ao buscar encomendas:', err);
      setError('Não foi possível conectar ao servidor. Verifique se o backend está online.');
      setAnnouncement('Erro ao carregar as encomendas do condomínio.');
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // 2. PUT /packages/{package_id}/deliver
  const handleDeliverPackage = async (packageId, packageDescription) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/packages/${packageId}/deliver?resident_id=${currentUserId}`,
        {
          method: 'PUT',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) throw new Error(`Erro ao confirmar entrega: ${response.status}`);

      setPackages(prev => prev.filter(p => p.id !== packageId));
      setAnnouncement(`Encomenda "${packageDescription}" confirmada como retirada com sucesso.`);
    } catch (err) {
      console.error('Erro ao dar baixa na encomenda:', err);
      alert('Ocorreu um erro ao registrar a retirada.');
    }
  };

  // 3. POST /packages
  const handleRegisterPackage = async (e) => {
    e.preventDefault();
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
        notes: notes || null
      };

      const response = await fetch(
        `${API_BASE_URL}/packages?current_user_id=${currentUserId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) throw new Error(`Erro ao cadastrar pacote: ${response.status}`);

      setDescription('');
      setTrackingCode('');
      setNotes('');
      setShowRegisterForm(false);

      setAnnouncement(`Nova encomenda "${payload.description}" cadastrada.`);
      fetchPackages();
    } catch (err) {
      console.error('Erro ao cadastrar encomenda:', err);
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
    btnSuccessText: highContrast ? '#000000' : '#ffffff',
    accentText: highContrast ? '#ffff00' : '#2563eb'
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
            style={{ minHeight: '48px', minWidth: '160px', padding: '10px 18px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.btnPrimaryBg, color: theme.btnPrimaryText, border: `2px solid ${theme.border}`, borderRadius: '6px' }}
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

        {showRegisterForm && (
          <section style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '20px', marginBottom: '24px', maxWidth: '600px' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>Registrar Recebimento na Portaria</h2>
            <form onSubmit={handleRegisterPackage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="pkg-desc" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Descrição da Encomenda *</label>
                <input id="pkg-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Caixa Mercado Livre, Pacote Sedex..." required style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label htmlFor="pkg-tracking" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Código de Rastreio (Opcional)</label>
                <input id="pkg-tracking" type="text" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Ex: BR123456789" style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label htmlFor="pkg-notes" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Observações (Opcional)</label>
                <input id="pkg-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Deixado na recepção social" style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }} />
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
            <div style={{ padding: '16px', backgroundColor: highContrast ? '#330000' : '#fee2e2', color: highContrast ? '#ff9999' : '#991b1b', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{error}</p>
              <button onClick={fetchPackages} style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}>Tentar Novamente</button>
            </div>
          ) : packages.length === 0 ? (
            <p style={{ fontSize: '1.1rem', color: theme.accentText }}>Nenhuma encomenda pendente para este apartamento.</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {packages.map((pkg) => (
                <li key={pkg.id} style={{ padding: '20px', border: `2px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <strong style={{ fontSize: '1.2rem', color: theme.text }}>{pkg.description}</strong>
                    {pkg.tracking_code && <span>Código de Rastreio: <code>{pkg.tracking_code}</code></span>}
                    <small style={{ opacity: 0.8 }}>Recebido em: {new Date(pkg.received_at).toLocaleString('pt-BR')}</small>
                    {pkg.notes && <small style={{ fontStyle: 'italic' }}>Obs: {pkg.notes}</small>}
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