import express from 'express';
import cors from 'cors';

const app = express();

// Basic CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'],
  credentials: true
}));

// Basic middleware
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Categories test route
app.get('/api/categories', (req, res) => {
  res.json([]);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

export default app;
