import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SafeCred Backend API'
  });
});

// Test registration endpoint
app.post('/api/test/register', async (req, res) => {
  try {
    console.log('Received registration request:', req.body);
    res.json({ success: true, message: 'Test endpoint works', data: req.body });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal Test Server running on port ${PORT}`);
});
