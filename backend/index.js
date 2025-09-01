import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import path from "path"

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true, 
  }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.use(express.static(path.join(__dirname, '/frontend/dist')));

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('✅ Connected to MongoDB');
})
.catch((error) => {
    console.log('❌ Error connecting to MongoDB', error);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});