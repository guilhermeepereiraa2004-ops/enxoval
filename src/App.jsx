import React, { useState, useEffect } from 'react';
import { Gift, Link as LinkIcon, Plus, Trash2, Shield, Heart } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  const [items, setItems] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  
  const [itemName, setItemName] = useState('');
  const [itemLink, setItemLink] = useState('');

  // Reservation states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedItemToReserve, setSelectedItemToReserve] = useState(null);
  const [guestName, setGuestName] = useState('');

  // Fetch items from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(`${API_URL}/items`);
        const data = await response.json();
        setItems(data);
      } catch (error) {
        toast.error('Erro ao conectar com o banco de dados');
      }
    };
    fetchItems();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Ggap121021') {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      toast.success('Acesso liberado aos noivos!');
    } else {
      toast.error('Senha incorreta!');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemLink) return;

    let finalLink = itemLink;
    if (!/^https?:\/\//i.test(finalLink)) {
      finalLink = 'http://' + finalLink;
    }

    try {
      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: itemName, link: finalLink })
      });
      
      const savedItem = await response.json();

      const newItems = [savedItem, ...items].sort((a, b) => 
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      );

      setItems(newItems);
      setItemName('');
      setItemLink('');
      toast.success('Presente adicionado!');
    } catch (error) {
      toast.error('Erro ao adicionar presente');
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Tem certeza que deseja remover este item?')) {
      try {
        await fetch(`${API_URL}/items/${id}`, { method: 'DELETE' });
        setItems(items.filter(item => item._id !== id));
        toast.success('Item removido!');
      } catch (error) {
        toast.error('Erro ao remover o item');
      }
    }
  };

  const handleReserveClick = (item) => {
    setSelectedItemToReserve(item);
    setShowReservationModal(true);
  };

  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/items/${selectedItemToReserve._id}/reserve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: guestName.trim() })
      });
      
      const updatedItem = await response.json();

      setItems(items.map(item => {
        if (item._id === selectedItemToReserve._id) {
          return updatedItem;
        }
        return item;
      }));

      setShowReservationModal(false);
      setSelectedItemToReserve(null);
      setGuestName('');
      toast.success('Obrigado pelo seu presente!');
    } catch (error) {
      toast.error('Erro ao reservar presente');
    }
  };

  const handleCancelReservation = async (id) => {
    if(confirm('Tem certeza que deseja remover a reserva deste item?')) {
      try {
        const response = await fetch(`${API_URL}/items/${id}/cancel-reservation`, { method: 'PATCH' });
        const updatedItem = await response.json();
        
        setItems(items.map(item => {
          if (item._id === id) {
            return updatedItem;
          }
          return item;
        }));
        toast.success('Reserva cancelada!');
      } catch (error) {
        toast.error('Erro ao cancelar reserva');
      }
    }
  };

  const logoutItem = () => {
    setIsAdmin(false);
  };

  const visibleItems = isAdmin ? items : items.filter(item => !item.reservedBy);

  return (
    <div className="app-container">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="header">
        <h1>Nosso Enxoval</h1>
        <p>Lista de itens</p>
      </div>

      <div className="glass-card">
        {isAdmin && (
          <form className="add-item-form" onSubmit={handleAddItem}>
            <div className="form-group">
              <label>Nome do Produto</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ex: Jogo de Panelas Tramontina"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Link (Shopee, Mercado Livre, etc)</label>
              <input 
                type="url" 
                className="input-field" 
                placeholder="https://..."
                value={itemLink}
                onChange={(e) => setItemLink(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <Plus size={20} />
              Adicionar Presente
            </button>
          </form>
        )}

        <ul className="items-list">
          {visibleItems.length === 0 ? (
            <div className="empty-state">
              <Heart size={48} className="empty-icon" />
              <h3>Nenhum item adicionado ainda</h3>
              {isAdmin && <p>Adicione acima o primeiro presente da lista!</p>}
              {!isAdmin && <p>Os noivos ainda não adicionaram os presentes. Volte em breve!</p>}
            </div>
          ) : (
            visibleItems.map((item, index) => (
              <li 
                key={item._id} 
                className={`item-card ${item.reservedBy ? 'reserved' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="item-info">
                  <div className="item-icon">
                    <Gift size={22} />
                  </div>
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    {item.reservedBy && (
                      <span className="reserved-badge">
                        Presenteado por: {isAdmin ? item.reservedBy : 'Alguém especial'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="item-actions">
                  {(!item.reservedBy || isAdmin) && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-link"
                    >
                      <LinkIcon size={16} />
                      Ver na Loja
                    </a>
                  )}

                  {!item.reservedBy && !isAdmin && (
                    <button 
                      className="btn-reserve" 
                      onClick={() => handleReserveClick(item)}
                    >
                      Dar de Presente
                    </button>
                  )}
                  
                  {isAdmin && (
                    <div className="admin-actions">
                      {item.reservedBy && (
                        <button 
                          onClick={() => handleCancelReservation(item._id)} 
                          className="btn-cancel-reservation"
                          title="Remover Reserva"
                        >
                          Cancelar Reserva
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(item._id)} 
                        className="btn btn-danger"
                        title="Remover Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="admin-toggle">
        {isAdmin ? (
          <button onClick={logoutItem}>Sair do Modo Noivos</button>
        ) : (
          <button onClick={() => setShowLogin(true)}>
            <Shield size={14} style={{display: 'inline', marginRight: '4px', verticalAlign: 'middle'}}/>
            Acesso dos noivos
          </button>
        )}
      </div>

      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Área dos noivos</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Senha de Acesso</label>
                <input 
                  type="password" 
                  className="input-field" 
                  autoFocus
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogin(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="modal-overlay" onClick={() => setShowReservationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Oba! Você vai dar este presente?</h2>
            <p style={{marginBottom: '1.5rem', color: 'var(--text-muted)'}}>
              Você escolheu dar o <strong>{selectedItemToReserve?.name}</strong> aos noivos.
              Por favor, informe seu nome abaixo.
            </p>
            <form onSubmit={handleReserveSubmit}>
              <div className="form-group">
                <label>Seu Nome</label>
                <input 
                  type="text" 
                  className="input-field" 
                  autoFocus
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReservationModal(false)}>
                  Voltar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Presente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
