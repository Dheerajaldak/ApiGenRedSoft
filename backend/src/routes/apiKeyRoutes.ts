import { Router } from 'express';
import {
  createApiKey,
  getApiKeys,
  getApiKeyById,
  updateApiKey,
  revokeApiKey,
  rollApiKey,
  deleteApiKey,
} from '../controllers/apiKeyController.js';

const router = Router();

router.post('/', createApiKey);
router.get('/', getApiKeys);
router.get('/:id', getApiKeyById);
router.patch('/:id', updateApiKey);
router.post('/:id/revoke', revokeApiKey);
router.post('/:id/roll', rollApiKey);
router.delete('/:id', deleteApiKey);

export default router;
