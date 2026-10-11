import { takedownSchema } from '../lib/validate.js';
import * as data from '../lib/data/mock.js';
import { todayKst } from '../lib/format.js';

const DAILY_LIMIT = 50;

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? parse(req.body, req.headers['content-type']) : req.body;
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) throw new Error('too large');
  }
  return parse(raw, req.headers['content-type']);
}

function parse(raw, contentType = '') {
  if (contentType.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { data: null, error: { code: 'INVALID_INPUT', message: 'POST만 지원합니다.' } });
  }
  const isForm = (req.headers['content-type'] ?? '').includes('application/x-www-form-urlencoded');
  let input;
  try {
    input = takedownSchema.safeParse(await readBody(req));
  } catch {
    input = { success: false };
  }
  if (!input.success) {
    return send(res, 400, { data: null, error: { code: 'INVALID_INPUT', message: '입력값을 확인해 주세요.' } });
  }
  const today = todayKst();
  if ((await data.countTakedownsToday(today)) >= DAILY_LIMIT) {
    return send(res, 429, { data: null, error: { code: 'RATE_LIMITED', message: '오늘의 접수 한도를 넘었습니다. 내일 다시 시도해 주세요.' } });
  }
  const receivedAt = new Date();
  const dueAt = new Date(receivedAt.getTime() + 7 * 86_400_000);
  await data.saveTakedown({
    channelId: input.data.channelId ?? null,
    contactEmail: input.data.email,
    message: input.data.message,
    status: 'received',
    receivedOn: today,
    receivedAt: receivedAt.toISOString(),
    dueAt: dueAt.toISOString(),
  });
  if (isForm) {
    res.statusCode = 303;
    res.setHeader('Location', '/takedown?received=1');
    res.setHeader('Cache-Control', 'no-store');
    return res.end();
  }
  return send(res, 200, { data: { received: true, dueAt: dueAt.toISOString() }, error: null });
}
