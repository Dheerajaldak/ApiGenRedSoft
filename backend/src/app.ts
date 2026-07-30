import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';

const app: Express = express();

// Middlewares
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'API Key Management & Rate Limiting Backend', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/keys', apiKeyRoutes);
app.use('/api/v1/ai', protectedRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.originalUrl} does not exist.` });
});

export default app;
