import React, { useState, useEffect } from 'react';
import { Gift, Link as LinkIcon, Plus, Trash2, Shield, Heart, Loader, Pencil } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
  
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('@ListaEnxoval:isAdmin') === 'true';
  });
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  
  const [itemName, setItemName] = useState('');
  const [itemLink, setItemLink] = useState('');

  // Reservation states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedItemToReserve, setSelectedItemToReserve] = useState(null);
  const [guestName, setGuestName] = useState('');

  // Editing state
  const [editingItemId, setEditingItemId] = useState(null);

  // Fetch items from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(`${API_URL}/items`);
        if (!response.ok) throw new Error('Falha no servidor');
        const data = await response.json();
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems([]);
        }
      } catch (error) {
        setItems([]);
        toast.error('Erro ao conectar com o banco de dados');
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [API_URL]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Ggap121021') {
      setIsAdmin(true);
      localStorage.setItem('@ListaEnxoval:isAdmin', 'true');
      setShowLogin(false);
      setPassword('');
      toast.success('Acesso liberado aos noivos!');
    } else {
      toast.error('Senha incorreta!');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!itemName || !itemLink) return;

    let finalLink = itemLink.trim();
    if (finalLink.startsWith('data:')) {
      toast.error('Você colou uma imagem em vez do link da loja!');
      return;
    }

    if (!/^https?:\/\//i.test(finalLink)) {
      finalLink = 'http://' + finalLink;
    }

    try {
      if (editingItemId) {
        const response = await fetch(`${API_URL}/items/${editingItemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: itemName, link: finalLink })
        });
        
        if (!response.ok) throw new Error('Falha ao atualizar');
        const updatedItem = await response.json();

        setItems(items.map(item => item._id === editingItemId ? updatedItem : item).sort((a, b) => 
          (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
        ));

        setEditingItemId(null);
        setItemName('');
        setItemLink('');
        toast.success('Presente atualizado com sucesso!');
      } else {
        const response = await fetch(`${API_URL}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: itemName, link: finalLink })
        });
        
        if (!response.ok) throw new Error('Falha ao adicionar');
        const savedItem = await response.json();

        const newItems = [savedItem, ...items].sort((a, b) => 
          (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
        );

        setItems(newItems);
        setItemName('');
        setItemLink('');
        toast.success('Presente adicionado!');
      }
    } catch (error) {
      toast.error(editingItemId ? 'Erro ao atualizar presente' : 'Erro ao adicionar presente');
    }
  };

  const handleEditClick = (item) => {
    setEditingItemId(item._id);
    setItemName(item.name);
    setItemLink(item.link);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setItemName('');
    setItemLink('');
  };

  const handleDelete = async (id) => {
    if(confirm('Tem certeza que deseja remover este item?')) {
      try {
        const response = await fetch(`${API_URL}/items/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Falha ao remover');
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
      
      if (!response.ok) throw new Error('Falha ao reservar');
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
        if (!response.ok) throw new Error('Falha ao cancelar');
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
    localStorage.removeItem('@ListaEnxoval:isAdmin');
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
          <form className="add-item-form" onSubmit={handleSubmitForm}>
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
            <div className="form-actions" style={{display: 'flex', gap: '0.8rem'}}>
              <button type="submit" className="btn btn-primary">
                {editingItemId ? <Pencil size={20} /> : <Plus size={20} />}
                {editingItemId ? 'Salvar Alterações' : 'Adicionar Presente'}
              </button>
              {editingItemId && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}

        <ul className="items-list">
          {isLoading ? (
            <div className="empty-state">
              <Loader size={48} className="empty-icon spin" />
            </div>
          ) : visibleItems.length === 0 ? (
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
                      <button 
                        onClick={() => handleEditClick(item)} 
                        className="btn-edit-item"
                        title="Editar Presente"
                      >
                        <Pencil size={18} />
                      </button>

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
