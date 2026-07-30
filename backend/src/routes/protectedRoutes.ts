import { Router, Request, Response } from 'express';
import { authApiKey } from '../middleware/authApiKey.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @route POST /api/v1/ai/generate
 * @desc Protected Gemini AI completion endpoint requiring x-api-key header & enforcing rate limiting
 */
router.post('/generate', authApiKey, rateLimiter, (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;
  const rateLimitInfo = (req as any).rateLimitInfo;
  const { prompt = 'Generate a summary' } = req.body || {};

  // Mock Gemini AI responses
  const mockResponses = [
    `Gemini AI Response: Processing query '${prompt}'. API Key validation successful. System online and performing optimal response generation.`,
    `Gemini AI Response: Understood '${prompt}'. Rate limit quota check passed. Everything operating normally.`,
    `Gemini AI Response: Successfully completed analysis for prompt '${prompt}'. Usage metrics updated in database.`,
  ];
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  res.json({
    success: true,
    status: 200,
    timestamp: new Date().toISOString(),
    service: 'Protected AI Completion Service',
    prompt,
    result: randomResponse,
    keyContext: {
      keyId: apiKey._id,
      name: apiKey.name,
      displayPrefix: apiKey.displayPrefix,
      scopes: apiKey.scopes,
      totalUsageCount: apiKey.usageCount,
    },
    quota: {
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      resetInSeconds: rateLimitInfo.resetSeconds,
    },
  });
});

/**
 * @route GET /api/v1/protected/status
 * @desc Quick test endpoint for key validation
 */
router.get('/status', authApiKey, rateLimiter, (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;
  const rateLimitInfo = (req as any).rateLimitInfo;

  res.json({
    success: true,
    status: 200,
    message: 'API Key active and valid.',
    keyName: apiKey.name,
    quota: rateLimitInfo,
  });
});

export default router;
