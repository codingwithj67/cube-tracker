import { Redis } from '@upstash/redis';

export const config = { runtime: 'edge' };

interface UnitRecord {
  id: string;
  status: 'IN_STOCK' | 'SOLD';
  weightKg: number;
  metalType?: string;
  producedAt: string;
  soldAt?: string;
}

function keyFor(id: string): string {
  return `unit:${id}`;
}

export default async function handler(req: Request): Promise<Response> {
  const redis = Redis.fromEnv();
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop() ?? '';

  if (!id) {
    return new Response(JSON.stringify({ error: 'missing_id' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (req.method === 'GET') {
    const unit = await redis.get<UnitRecord>(keyFor(id));
    if (!unit) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(unit), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (req.method === 'PUT') {
    const body = (await req.json()) as UnitRecord;
    if (!body.id || body.id !== id) {
      return new Response(JSON.stringify({ error: 'id_mismatch' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    await redis.set(keyFor(id), body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, PUT' } });
}
