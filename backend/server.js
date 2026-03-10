const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Item = require('./models/Item');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch((err) => console.error('❌ Erro no MongoDB:', err));

// Rotas do nosso servidor

app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os itens' });
  }
});

// 2. Adicionar um novo item (Admin)
app.post('/api/items', async (req, res) => {
  try {
    const { name, link } = req.body;
    const newItem = new Item({ name, link });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ error: 'Falha ao adicionar' });
  }
});

// 3. Deletar item (Admin)
app.delete('/api/items/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item removido' });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao remover item' });
  }
});

// Editar item (Admin)
app.put('/api/items/:id', async (req, res) => {
  try {
    const { name, link } = req.body;
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { name, link },
      { new: true }
    );
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: 'Falha ao atualizar' });
  }
});

// 4. Reservar o item (Dar o presente - Convidado)
app.patch('/api/items/:id/reserve', async (req, res) => {
  try {
    const { guestName } = req.body;
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { reservedBy: guestName, reservedAt: new Date() },
      { new: true }
    );
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: 'Falha ao reservar presente' });
  }
});

// 5. Cancelar a reserva (Admin)
app.patch('/api/items/:id/cancel-reservation', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $unset: { reservedBy: "", reservedAt: "" } }, // Remove o campo
      { new: true }
    );
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: 'Falha ao cancelar reserva' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
