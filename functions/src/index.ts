import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

// FocusBridge AI proxy. Runs server-side so the LLM API key never ships
// in the client bundle. The web client posts the same body it would send
// to the provider's /chat/completions endpoint; this function forwards it
// with the server-side key and pipes the (possibly streaming) response back.
//
// Deployment:
//   cd functions && npm install && npm run build
//   firebase deploy --only functions
//
// Client wiring: set VITE_FIREBASE_FUNCTIONS_URL to the deployed URL, e.g.
//   https://<region>-<project>.cloudfunctions.net

const AI_BASE_URL =
  process.env.AI_BASE_URL ?? 'https://openrouter.ai/api/v1';
const AI_API_KEY =
  process.env.AI_API_KEY ??
  process.env.OPENROUTER_API_KEY ??
  process.env.FEATHERLESS_API_KEY;
const AI_MODEL =
  process.env.AI_MODEL ??
  process.env.OPENROUTER_MODEL ??
  'qwen/qwen-2.5-7b-instruct';

export const chat = onRequest(
  { cors: true, maxInstances: 10 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    if (!AI_API_KEY) {
      logger.error('AI_API_KEY is not configured');
      res.status(500).json({ error: 'AI provider not configured' });
      return;
    }

    const body = req.body ?? {};
    const payload = {
      model: body.model ?? AI_MODEL,
      stream: body.stream ?? false,
      messages: body.messages,
      max_tokens: body.max_tokens ?? 700,
      temperature: body.temperature ?? 0.2,
      top_p: body.top_p ?? 0.9,
      // Featherless-only: disables Qwen3 chain-of-thought.
      ...(body.chat_template_kwargs ? { chat_template_kwargs: body.chat_template_kwargs } : {}),
    };

    try {
      const upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!upstream.ok) {
        const text = await upstream.text();
        logger.error(`Upstream error ${upstream.status}: ${text}`);
        res.status(upstream.status).json({ error: 'Upstream AI provider error' });
        return;
      }

      const contentType = upstream.headers.get('content-type') ?? 'application/json';
      res.setHeader('Content-Type', contentType);

      if (payload.stream && upstream.body) {
        // Pipe the SSE stream straight through to the client.
        for await (const chunk of upstream.body as any) {
          res.write(chunk);
        }
        res.end();
        return;
      }

      const json = await upstream.json();
      res.json(json);
    } catch (err) {
      logger.error('AI proxy failed', err);
      res.status(502).json({ error: 'AI proxy failed' });
    }
  }
);