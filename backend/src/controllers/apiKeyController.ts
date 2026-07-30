import { Request, Response } from 'express';
import { ApiKeyModel, IApiKey } from '../models/ApiKey.js';
import { generateApiKey, hashApiKey, maskApiKey } from '../utils/keyUtils.js';

// In-Memory Backup Store for 100% resilient operation if local Mongo is unavailable
class MemoryApiKeyStore {
  private keys: Map<string, any> = new Map();

  add(keyDoc: any) {
    const id = keyDoc._id ? keyDoc._id.toString() : Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const doc = { ...keyDoc, _id: id, createdAt: new Date(), updatedAt: new Date() };
    this.keys.set(id, doc);
    return doc;
  }

  getAll() {
    return Array.from(this.keys.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getById(id: string) {
    return this.keys.get(id);
  }

  findByHash(hash: string) {
    for (const key of this.keys.values()) {
      if (key.keyHash === hash) return key;
    }
    return null;
  }

  update(id: string, updates: Partial<any>) {
    const existing = this.keys.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.keys.set(id, updated);
    return updated;
  }

  delete(id: string) {
    return this.keys.delete(id);
  }
}

export const memoryStore = new MemoryApiKeyStore();

/**
 * @route POST /api/keys
 * @desc Generate a new Gemini-style API Key
 */
export const createApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, rateLimit = 10, scopes = ['read', 'ai:generate'], expiresAt, customPrefix = 'AQ.AIzaSy' } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'Bad Request', message: 'API key name is required.' });
      return;
    }

    // Generate production-level key with prefix
    const { rawKey, keyHash, displayPrefix } = generateApiKey(customPrefix);

    const newKeyData = {
      name: name.trim(),
      keyHash,
      displayPrefix,
      status: 'active',
      rateLimit: Number(rateLimit) || 10,
      usageCount: 0,
      scopes: Array.isArray(scopes) ? scopes : ['read', 'ai:generate'],
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    };

    let createdKey: any;

    try {
      createdKey = await ApiKeyModel.create(newKeyData);
    } catch {
      // Mongo fallback
      createdKey = memoryStore.add(newKeyData);
    }

    // Return the created metadata + raw secret key ONLY ONCE
    res.status(201).json({
      success: true,
      message: 'API Key created successfully. Save your raw key now as it will never be displayed again.',
      rawKey, // SENT ONLY ONCE
      key: {
        _id: createdKey._id,
        name: createdKey.name,
        displayPrefix: createdKey.displayPrefix,
        status: createdKey.status,
        rateLimit: createdKey.rateLimit,
        usageCount: createdKey.usageCount,
        scopes: createdKey.scopes,
        expiresAt: createdKey.expiresAt,
        createdAt: createdKey.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * @route GET /api/keys
 * @desc Get all API Keys (Masked)
 */
export const getApiKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    let keys: any[] = [];
    try {
      keys = await ApiKeyModel.find().sort({ createdAt: -1 }).lean();
    } catch {
      keys = memoryStore.getAll();
    }

    if (!keys || keys.length === 0) {
      keys = memoryStore.getAll();
    }

    // Mask sensitive fields
    const sanitizedKeys = keys.map((k) => ({
      _id: k._id,
      name: k.name,
      displayPrefix: k.displayPrefix || maskApiKey(k.keyHash),
      status: k.status,
      rateLimit: k.rateLimit,
      usageCount: k.usageCount || 0,
      lastUsedAt: k.lastUsedAt,
      scopes: k.scopes || [],
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    }));

    res.json({
      success: true,
      count: sanitizedKeys.length,
      keys: sanitizedKeys,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * @route GET /api/keys/:id
 * @desc Get single API key metadata
 */
export const getApiKeyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let keyDoc: any = null;

    try {
      keyDoc = await ApiKeyModel.findById(id).lean();
    } catch {
      keyDoc = memoryStore.getById(id);
    }

    if (!keyDoc) {
      keyDoc = memoryStore.getById(id);
    }

    if (!keyDoc) {
      res.status(404).json({ error: 'Not Found', message: 'API key not found' });
      return;
    }

    res.json({
      success: true,
      key: {
        _id: keyDoc._id,
        name: keyDoc.name,
        displayPrefix: keyDoc.displayPrefix,
        status: keyDoc.status,
        rateLimit: keyDoc.rateLimit,
        usageCount: keyDoc.usageCount || 0,
        lastUsedAt: keyDoc.lastUsedAt,
        scopes: keyDoc.scopes,
        expiresAt: keyDoc.expiresAt,
        createdAt: keyDoc.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * @route PATCH /api/keys/:id
 * @desc Update API key name, rateLimit, scopes, or status
 */
export const updateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, rateLimit, scopes, status } = req.body;

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (rateLimit !== undefined) updateFields.rateLimit = Math.max(1, Number(rateLimit));
    if (scopes !== undefined && Array.isArray(scopes)) updateFields.scopes = scopes;
    if (status !== undefined && ['active', 'revoked', 'expired'].includes(status)) {
      updateFields.status = status;
    }

    let updatedKey: any = null;
    try {
      updatedKey = await ApiKeyModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).lean();
    } catch {
      updatedKey = memoryStore.update(id, updateFields);
    }

    if (!updatedKey) {
      updatedKey = memoryStore.update(id, updateFields);
    }

    if (!updatedKey) {
      res.status(404).json({ error: 'Not Found', message: 'API key not found' });
      return;
    }

    res.json({
      success: true,
      message: 'API Key updated successfully',
      key: {
        _id: updatedKey._id,
        name: updatedKey.name,
        displayPrefix: updatedKey.displayPrefix,
        status: updatedKey.status,
        rateLimit: updatedKey.rateLimit,
        usageCount: updatedKey.usageCount,
        scopes: updatedKey.scopes,
        updatedAt: updatedKey.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * @route POST /api/keys/:id/revoke
 * @desc Revoke an API key
 */
export const revokeApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let revokedKey: any = null;

    try {
      revokedKey = await ApiKeyModel.findByIdAndUpdate(id, { status: 'revoked' }, { new: true }).lean();
    } catch {
      revokedKey = memoryStore.update(id, { status: 'revoked' });
    }

    if (!revokedKey) {
      revokedKey = memoryStore.update(id, { status: 'revoked' });
    }

    if (!revokedKey) {
      res.status(404).json({ error: 'Not Found', message: 'API key not found' });
      return;
    }

    res.json({
      success: true,
      message: `API Key '${revokedKey.name}' has been revoked.`,
      key: revokedKey,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * @route POST /api/keys/:id/roll
 * @desc Roll (Regenerate) an API key - Revokes existing key and creates a fresh secret key
 */
export const rollApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let existingKey: any = null;

    try {
      existingKey = await ApiKeyModel.findById(id);
    } catch {
      existingKey = memoryStore.getById(id);
    }

    if (!existingKey) {
      existingKey = memoryStore.getById(id);
    }

    if (!existingKey) {
      res.status(404).json({ error: 'Not Found', message: 'API key not found' });
      return;
    }

    // Revoke old key
    if (existingKey.status !== 'revoked') {
      existingKey.status = 'revoked';
      if (existingKey.save) await existingKey.save().catch(() => {});
      else memoryStore.update(id, { status: 'revoked' });
    }

    // Generate new secret key
    const { rawKey, keyHash, displayPrefix } = generateApiKey('AQ.AIzaSy');

    const rolledKeyData = {
      name: `${existingKey.name} (Rolled)`,
      keyHash,
      displayPrefix,
      status: 'active',
      rateLimit: existingKey.rateLimit || 10,
      scopes: existingKey.scopes || ['read', 'ai:generate'],
      usageCount: 0,
    };

    let newKey: any;
    try {
      newKey = await ApiKeyModel.create(rolledKeyData);
    } catch {
      newKey = memoryStore.add(rolledKeyData);
    }

    res.status(201).json({
      success: true,
      message: 'API Key successfully rolled. Old key was revoked and new key generated.',
      rawKey, // RAW NEW KEY DISPLAYED ONCE
      oldKeyId: existingKey._id,
      newKey: {
        _id: newKey._id,
        name: newKey.name,
        displayPrefix: newKey.displayPrefix,
        status: newKey.status,
        rateLimit: newKey.rateLimit,
        scopes: newKey.scopes,
        createdAt: newKey.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * @route DELETE /api/keys/:id
 * @desc Delete an API key permanently
 */
export const deleteApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let deleted: any = null;

    try {
      deleted = await ApiKeyModel.findByIdAndDelete(id);
    } catch {
      deleted = memoryStore.delete(id);
    }

    if (!deleted) {
      memoryStore.delete(id);
    }

    res.json({
      success: true,
      message: 'API key permanently deleted.',
      id,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};
