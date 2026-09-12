import React, { useState } from 'react';

export default function DeliveryAlert({ initialPackages = [] }) {
  const [packages, setPackages] = useState(initialPackages);
  const [announcement, setAnnouncement] = useState('');
  const [highContrast, setHighContrast] = useState(false);

  // Simulação de recebimento dinâmico de nova encomenda via Supabase
  const simulateNewDelivery = () => {
    const newPkg = {
      id: Math.random().toString(),
      description: "Pacote de e-Commerce (Caixa Grande)",
      trackingCode: "BR987654321",
      receivedAt: new Date().toLocaleTimeString()
    };

    setPackages(prev => [newPkg, ...prev]);
    // Este texto será anunciado automaticamente pelo leitor de tela
    setAnnouncement(`Nova encomenda recebida para seu apartamento: ${newPkg.description}`);
  };

  return (
    <div 
      style={{
        padding: '20px',
        fontFamily: 'sans-serif',
        // Alternância dinâmica para modo de Alto Contraste (essencial para idosos)
        backgroundColor: highContrast ? '#000000' : '#f9f9f9',
        color: highContrast ? '#ffffff' : '#333333',
        minHeight: '100vh',
        transition: 'all 0.2s ease'
      }}
    >
      <header style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        <h1 style={{ fontSize: '2rem' }}>CondoAccess - Encomendas</h1>
        
        {/* Botão de acessibilidade com área de clique ampliada */}
        <button 
          onClick={() => setHighContrast(!highContrast)}
          style={{
            minWidth: '150px',
            minHeight: '48px', // Respeitando a WCAG (mínimo de 44px)
            padding: '10px 15px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: highContrast ? '#ffff00' : '#007bff',
            color: highContrast ? '#000000' : '#ffffff',
            border: 'none',
            borderRadius: '4px',
            marginTop: '10px'
          }}
          aria-label={highContrast ? "Desativar modo de alto contraste" : "Ativar modo de alto contraste"}
        >
          {highContrast ? "Contraste Padrão" : "Alto Contraste"}
        </button>
      </header>

      <main style={{ marginTop: '20px' }}>
        {/* Botão para testes locais de desenvolvimento */}
        <button 
          onClick={simulateNewDelivery}
          style={{
            minHeight: '48px',
            padding: '10px 20px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          [Simular Recebimento na Portaria]
        </button>

        {/* 
          REGIÃO ARIA-LIVE (Polite): Sempre que o estado de 'announcement' mudar, 
          o leitor de tela narrará o novo texto silenciosamente em segundo plano.
        */}
        <div 
          aria-live="polite" 
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(1px, 1px, 1px, 1px)'
          }}
        >
          {announcement}
        </div>

        <section aria-label="Suas encomendas pendentes">
          <h2 style={{ fontSize: '1.5rem' }}>Suas Entregas Aguardando Retirada</h2>
          {packages.length === 0 ? (
            <p style={{ fontSize: '1.1rem' }}>Nenhum pacote pendente na portaria.</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {packages.map((pkg) => (
                <li 
                  key={pkg.id} 
                  style={{
                    padding: '15px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    backgroundColor: highContrast ? '#111111' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                  }}
                >
                  <strong style={{ fontSize: '1.2rem' }}>{pkg.description}</strong>
                  <span style={{ fontSize: '1rem' }}>Código de Rastreio: <code>{pkg.trackingCode}</code></span>
                  <small style={{ fontSize: '0.9rem' }}>Recebido às: {pkg.receivedAt}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
