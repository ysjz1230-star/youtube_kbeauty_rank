// YouTube Data API 호출 래퍼 (현재는 키 점검만 구현. 수집 단계에서 확장한다).
// 키는 쿼리스트링이 아니라 헤더로 보내고, 어떤 로그·응답에도 키와 API 응답 본문을 싣지 않는다.
const ENDPOINT = 'https://www.googleapis.com/youtube/v3/channels';
const PROBE_CHANNEL_ID = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Google for Developers 공식 채널 (1 unit)

// Google 오류 reason → 사용자에게 보여줄 한국어 안내
const REASONS = {
  keyInvalid: 'API 키가 올바르지 않습니다. 키를 다시 복사했는지 확인하세요.',
  API_KEY_INVALID: 'API 키가 올바르지 않습니다. 키를 다시 복사했는지 확인하세요.',
  accessNotConfigured: 'Google Cloud에서 YouTube Data API v3가 활성화되지 않았습니다.',
  SERVICE_DISABLED: 'Google Cloud에서 YouTube Data API v3가 활성화되지 않았습니다.',
  quotaExceeded: '오늘의 쿼터(10,000 units)를 모두 사용했습니다. 키 자체는 유효합니다.',
  rateLimitExceeded: '요청이 너무 잦습니다. 잠시 후 다시 시도하세요.',
  ipRefererBlocked: '키의 IP/HTTP 리퍼러 제한 때문에 막혔습니다. 서버용 키는 제한을 IP 또는 없음으로 설정하세요.',
  API_KEY_HTTP_REFERRER_BLOCKED: '키의 HTTP 리퍼러 제한 때문에 막혔습니다. 서버용 키에는 리퍼러 제한을 쓰지 마세요.',
  API_KEY_SERVICE_BLOCKED: '이 키는 YouTube Data API v3 사용이 허용되지 않았습니다. 키의 API 제한을 확인하세요.',
  forbidden: '접근이 거부되었습니다. 키의 API 제한과 프로젝트 설정을 확인하세요.',
};

export async function checkYoutubeKey(key = process.env.YOUTUBE_API_KEY, { timeoutMs = 8000 } = {}) {
  const checkedAt = new Date().toISOString();
  if (!key) {
    return { configured: false, valid: false, status: 'not_configured', message: 'YOUTUBE_API_KEY가 설정되지 않았습니다. .env에 값을 넣어 주세요.', checkedAt };
  }
  try {
    const url = `${ENDPOINT}?part=id&id=${PROBE_CHANNEL_ID}`;
    const res = await fetch(url, { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(timeoutMs) });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      const found = Array.isArray(body.items) && body.items.length > 0;
      return {
        configured: true,
        valid: true,
        status: 'ok',
        message: found ? 'YouTube API 키가 유효하고 정상 동작합니다. (channels.list 1 unit 사용)' : '키는 유효하지만 점검용 채널 조회 결과가 비어 있습니다.',
        checkedAt,
      };
    }
    const reason = body?.error?.errors?.[0]?.reason ?? body?.error?.details?.[0]?.reason ?? body?.error?.status ?? 'unknown';
    // 쿼터 초과는 키가 유효하다는 뜻이다
    const valid = reason === 'quotaExceeded' || reason === 'rateLimitExceeded';
    return {
      configured: true,
      valid,
      status: valid ? 'limited' : 'rejected',
      httpStatus: res.status,
      reason,
      message: REASONS[reason] ?? `YouTube API가 요청을 거부했습니다 (HTTP ${res.status}, reason: ${reason}).`,
      checkedAt,
    };
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return {
      configured: true,
      valid: false,
      status: 'unreachable',
      message: timedOut ? 'YouTube API 응답이 없습니다(시간 초과). 네트워크를 확인하세요.' : 'YouTube API에 연결하지 못했습니다. 네트워크를 확인하세요.',
      checkedAt,
    };
  }
}

// ── 수집용 호출 (channels.list / playlistItems.list / videos.list: 모두 1 unit) ──
const BASE = 'https://www.googleapis.com/youtube/v3/';
REASONS.keyMissing = 'YOUTUBE_API_KEY가 설정되지 않았습니다.';
REASONS.playlistNotFound = '업로드 재생목록을 찾을 수 없습니다.';

// 이번 프로세스에서 쓴 쿼터 (units)
export const quota = { units: 0 };

export class YoutubeApiError extends Error {
  constructor(reason, httpStatus) {
    super(REASONS[reason] ?? `YouTube API 오류 (HTTP ${httpStatus}, reason: ${reason})`);
    this.reason = reason;
    this.httpStatus = httpStatus;
  }
}

export async function ytGet(resource, params, { key = process.env.YOUTUBE_API_KEY, timeoutMs = 15000 } = {}) {
  if (!key) throw new YoutubeApiError('keyMissing', 0);
  const url = new URL(BASE + resource);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(timeoutMs) });
  quota.units += 1;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 응답 본문은 그대로 싣지 않고 reason 코드만 쓴다
    const reason = body?.error?.errors?.[0]?.reason ?? body?.error?.details?.[0]?.reason ?? body?.error?.status ?? 'unknown';
    throw new YoutubeApiError(reason, res.status);
  }
  return body;
}

export const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// 핸들(@이름) → 채널 (1 unit)
export async function resolveHandle(handle) {
  const h = handle.startsWith('@') ? handle : `@${handle}`;
  const body = await ytGet('channels', { part: 'id,snippet', forHandle: h });
  return body.items?.[0] ?? null;
}

// id 최대 50개씩 묶어서 채널 지표 조회
export async function fetchChannels(ids) {
  const out = [];
  for (const batch of chunk(ids, 50)) {
    const body = await ytGet('channels', { part: 'snippet,statistics,contentDetails', id: batch.join(','), maxResults: '50' });
    out.push(...(body.items ?? []));
  }
  return out;
}

// 업로드 재생목록의 최근 영상 (비공개·삭제 영상은 제외)
export async function fetchUploads(playlistId, max = 10) {
  try {
    const body = await ytGet('playlistItems', { part: 'snippet,contentDetails', playlistId, maxResults: String(max) });
    return (body.items ?? []).filter((it) => it.snippet?.title && !['Private video', 'Deleted video'].includes(it.snippet.title));
  } catch (err) {
    if (err instanceof YoutubeApiError && err.reason === 'playlistNotFound') return [];
    throw err;
  }
}

export async function fetchVideoStats(ids) {
  const out = [];
  for (const batch of chunk(ids, 50)) {
    const body = await ytGet('videos', { part: 'statistics', id: batch.join(',') });
    out.push(...(body.items ?? []));
  }
  return out;
}
