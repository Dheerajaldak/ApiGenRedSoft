import dns from 'node:dns';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 API Key Server running at http://localhost:${PORT}`);
    console.log(`🔑 Key Management API: http://localhost:${PORT}/api/keys`);
    console.log(`⚡ Protected AI API: http://localhost:${PORT}/api/v1/ai/generate`);
    console.log(`==================================================`);
  });
};

startServer();
