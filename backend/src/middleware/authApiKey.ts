import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiKeyModel } from '../models/ApiKey.js';
import { hashApiKey } from '../utils/keyUtils.js';
import { memoryStore } from '../controllers/apiKeyController.js';

export const authApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let rawKey: string | undefined;

    // Extract API key from x-api-key header, Authorization header, or query
    const headerApiKey = req.headers['x-api-key'] as string;
    const authHeader = req.headers['authorization'];
    const queryKey = req.query.key as string;

    if (headerApiKey) {
      rawKey = headerApiKey;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.substring(7);
    } else if (queryKey) {
      rawKey = queryKey;
    }

    if (!rawKey) {
      res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        message: "Missing API Key. Provide key via 'x-api-key' header or 'Authorization: Bearer <key>'.",
      });
      return;
    }

    const keyHash = hashApiKey(rawKey);

    // Try MongoDB query first, fallback to memoryStore if DB is offline
    let keyDoc: any = null;
    try {
      keyDoc = await ApiKeyModel.findOne({ keyHash });
    } catch {
      keyDoc = null;
    }

    // Fallback check in memory store
    if (!keyDoc) {
      keyDoc = memoryStore.findByHash(keyHash);
    }

    if (!keyDoc) {
      res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid API Key provided.',
      });
      return;
    }

    // Check status
    if (keyDoc.status === 'revoked') {
      res.status(403).json({
        status: 403,
        error: 'Forbidden',
        message: 'This API key has been revoked and can no longer be used.',
      });
      return;
    }

    // Check expiration
    if (keyDoc.expiresAt && new Date() > new Date(keyDoc.expiresAt)) {
      if (keyDoc.status !== 'expired') {
        keyDoc.status = 'expired';
        if (keyDoc.save) await keyDoc.save().catch(() => {});
      }
      res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        message: 'This API key has expired.',
      });
      return;
    }

    // Update usage statistics asynchronously
    keyDoc.usageCount = (keyDoc.usageCount || 0) + 1;
    keyDoc.lastUsedAt = new Date();
    
    if (keyDoc.save && mongoose.connection.readyState === 1) {
      keyDoc.save().catch((err: any) => console.error('Failed to update key usage stats:', err));
    }

    // Attach key object to req
    (req as any).apiKey = keyDoc;
    next();
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
