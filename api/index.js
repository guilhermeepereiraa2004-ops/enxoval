import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  link: { type: String, required: true },
  reservedBy: { type: String, default: null },
  reservedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

app.get('/api/items', async (req, res) => {
  await connectDB();
  try {
    const items = await Item.find().sort({ name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os itens' });
  }
});

app.post('/api/items', async (req, res) => {
  await connectDB();
  try {
    const { name, link } = req.body;
    const newItem = new Item({ name, link });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ error: 'Falha ao adicionar' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  await connectDB();
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item removido' });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao remover item' });
  }
});

app.put('/api/items/:id', async (req, res) => {
  await connectDB();
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

app.patch('/api/items/:id/reserve', async (req, res) => {
  await connectDB();
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

app.patch('/api/items/:id/cancel-reservation', async (req, res) => {
  await connectDB();
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $unset: { reservedBy: "", reservedAt: "" } },
      { new: true }
    );
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: 'Falha ao cancelar reserva' });
  }
});

export default app;
