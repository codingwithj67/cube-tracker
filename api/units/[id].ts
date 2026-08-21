import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type RedisClientType } from 'redis';

interface UnitRecord {
  id: string;
  status: 'IN_STOCK' | 'SOLD';
  weightKg: number;
  metalType?: string;
  description?: string;
  producedAt: string;
  soldAt?: string;
}

function keyFor(id: string): string {
  return `unit:${id}`;
}

// Cached across warm invocations of the same function instance so we don't
// open a new TCP connection on every request — only cold starts pay that cost.
let client: RedisClientType | null = null;

async function getClient(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({ url: process.env.KV_REDIS_URL });
    client.on('error', (err) => console.error('Redis client error', err));
  }
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = typeof req.query.id === 'string' ? req.query.id : '';

  if (!id) {
    res.status(400).json({ error: 'missing_id' });
    return;
  }

  const redis = await getClient();

  if (req.method === 'GET') {
    const raw = (await redis.get(keyFor(id))) as string | null;
    if (!raw) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(200).json(JSON.parse(raw) as UnitRecord);
    return;
  }

  if (req.method === 'PUT') {
    const body = req.body as UnitRecord;
    if (!body?.id || body.id !== id) {
      res.status(400).json({ error: 'id_mismatch' });
      return;
    }
    await redis.set(keyFor(id), JSON.stringify(body));
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader('allow', 'GET, PUT');
  res.status(405).end('Method Not Allowed');
}
