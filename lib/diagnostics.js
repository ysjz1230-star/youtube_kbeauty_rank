// 배포 전 점검용 진단. 비밀값은 어떤 항목에도 그대로 싣지 않는다 (앞 4자·길이·호스트만).
import { checkYoutubeKey } from './youtube.js';
import { getConfig } from './config.js';
import { getIngestMeta } from './data/mock.js';

// 로컬 또는 DIAGNOSTICS_ENABLED=true일 때만 진단 화면을 연다. Vercel(배포) 환경은 기본 비활성.
export const diagnosticsEnabled = () => !process.env.VERCEL || process.env.DIAGNOSTICS_ENABLED === 'true';

const EXPECTED_TABLES = ['channels', 'channel_snapshots', 'videos', 'products', 'places', 'video_mentions', 'sponsors', 'takedown_requests', 'ingest_runs'];

let ytCache = null;
export async function cachedYoutubeCheck({ refresh = false } = {}) {
  if (!refresh && ytCache && Date.now() - ytCache.at < 60_000) return ytCache.result;
  const result = await checkYoutubeKey();
  ytCache = { at: Date.now(), result };
  return result;
}

async function youtubeItem(refresh) {
  const key = process.env.YOUTUBE_API_KEY ?? '';
  const r = await cachedYoutubeCheck({ refresh });
  if (!r.configured) return { id: 'youtube', label: 'YouTube API 키', status: 'error', summary: '미설정', detail: [r.message] };
  const detail = [`키 형식: 앞 4자 ${key.slice(0, 4)}…, 길이 ${key.length}자 ${key.startsWith('AIza') && key.length === 39 ? '(일반적인 Google API 키 형식)' : '(일반적인 형식(AIza로 시작, 39자)과 다릅니다)'}`, r.message];
  if (r.reason) detail.push(`오류 사유 코드: ${r.reason}`);
  detail.push(`점검 시각: ${r.checkedAt} (channels.list 1 unit, 60초 캐시)`);
  const status = r.status === 'ok' ? 'ok' : r.status === 'limited' ? 'warn' : 'error';
  return { id: 'youtube', label: 'YouTube API 키', status, summary: r.status === 'ok' ? '유효 · 정상 동작' : r.status === 'limited' ? '유효 · 쿼터/속도 제한' : '사용할 수 없음', detail };
}

async function databaseItem() {
  const raw = process.env.DATABASE_URL ?? '';
  if (!raw) {
    return { id: 'database', label: '데이터베이스 (Neon)', status: 'info', summary: '미설정 · 목업 데이터 모드', detail: ['DATABASE_URL이 비어 있어 CSV 시드 기반 목업 데이터로 동작합니다. DB 연결 단계에서 값이 필요합니다.'] };
  }
  let host;
  try {
    const u = new URL(raw);
    host = u.host;
    if (!/^postgres(ql)?:$/.test(u.protocol)) throw new Error('scheme');
  } catch {
    return { id: 'database', label: '데이터베이스 (Neon)', status: 'error', summary: '형식 오류', detail: ['DATABASE_URL이 postgresql://… 형식이 아닙니다.'] };
  }
  const detail = [`접속 대상: ${host}${host.includes('-pooler') ? ' (pooled 연결)' : ' (pooler 주소가 아닙니다. Neon의 pooled 연결 문자열 사용을 권장)'}`];
  const level = host.includes('-pooler') ? 'ok' : 'warn';
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(raw);
    const withTimeout = (p) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))]);
    await withTimeout(sql`select 1 as ok`);
    const rows = await withTimeout(sql`select table_name from information_schema.tables where table_schema = 'public'`);
    const have = new Set(rows.map((r) => r.table_name));
    const missing = EXPECTED_TABLES.filter((t) => !have.has(t));
    if (missing.length) {
      detail.push('연결 성공', `마이그레이션 미적용: 없는 테이블 ${missing.join(', ')}`);
      return { id: 'database', label: '데이터베이스 (Neon)', status: 'warn', summary: '연결됨 · 테이블 없음', detail };
    }
    detail.push('연결 성공, 필요한 테이블 9개 모두 존재');
    return { id: 'database', label: '데이터베이스 (Neon)', status: level, summary: '연결됨 · 스키마 정상', detail };
  } catch (err) {
    const msg = err?.message === 'timeout' ? '응답 시간 초과(8초)' : '연결 또는 인증에 실패했습니다. 주소·비밀번호·네트워크를 확인하세요.';
    detail.push(msg);
    return { id: 'database', label: '데이터베이스 (Neon)', status: 'error', summary: '연결 실패', detail };
  }
}

function cronItem() {
  const s = process.env.CRON_SECRET ?? '';
  if (!s) return { id: 'cron', label: 'CRON_SECRET', status: 'info', summary: '미설정 · 크론 미구현', detail: ['수집 크론을 켜기 전에 16자 이상의 임의 문자열을 설정하세요.'] };
  const ok = s.length >= 16;
  return { id: 'cron', label: 'CRON_SECRET', status: ok ? 'ok' : 'warn', summary: ok ? `설정됨 (${s.length}자)` : `너무 짧음 (${s.length}자)`, detail: [ok ? '길이 요건(16자 이상)을 충족합니다.' : '16자 이상이어야 합니다.'] };
}

function settingsItem() {
  const cfg = getConfig();
  const warn = [];
  const detail = [
    `SITE_URL: ${cfg.siteUrl}`,
    `FEATURE_DERIVED_METRICS: ${cfg.derivedMetrics} ${cfg.derivedMetrics ? '(증가 보드 노출 — 승인 전 공개 금지)' : '(기본값, 원본 수치 순위만)'}`,
    `RETENTION_DAYS: ${cfg.retentionDays} (정책 한도 30일 이내)`,
    `MIN_BASE_SUBSCRIBERS: ${cfg.minBaseSubscribers}`,
    `MOCK_XSS: ${cfg.mockXss ? '켜짐 (테스트 채널 포함)' : '꺼짐'}`,
  ];
  if (Number(process.env.RETENTION_DAYS) > 30) warn.push('RETENTION_DAYS가 30을 넘어 30으로 제한되었습니다.');
  if (cfg.derivedMetrics) warn.push('승인 전에는 FEATURE_DERIVED_METRICS를 true로 공개하지 마세요.');
  return { id: 'settings', label: '앱 설정값', status: warn.length ? 'warn' : 'ok', summary: warn.length ? warn.join(' ') : '기본 설정', detail };
}

function dataItem() {
  const m = getIngestMeta();
  if (m.source !== 'youtube') {
    return { id: 'data', label: '수집 데이터', status: 'info', summary: '목업 데이터 사용 중', detail: ['data/youtube.json이 없습니다. `npm run check-channels` → `npm run ingest` 순서로 실행하면 실제 YouTube 데이터가 화면에 반영됩니다.'] };
  }
  const age = Math.round((Date.now() - Date.parse(m.updatedAt)) / 3_600_000);
  const detail = [`채널 ${m.channelCount}개, 기준일 ${m.snapshotDate}`, `마지막 수집: ${m.updatedAt} (${age}시간 전), 사용 쿼터 ${m.unitsUsed} units`];
  if (m.missing?.length) detail.push(`응답에 없던 채널 ID ${m.missing.length}개: ${m.missing.join(', ')}`);
  const stale = age >= 48;
  if (stale) detail.push('48시간 넘게 갱신되지 않았습니다. `npm run ingest`를 다시 실행하세요.');
  return { id: 'data', label: '수집 데이터', status: stale || m.missing?.length ? 'warn' : 'ok', summary: stale ? '실제 데이터 · 갱신 필요' : '실제 YouTube 데이터 사용 중', detail };
}

export async function runDiagnostics({ refresh = false } = {}) {
  const [youtube, database] = await Promise.all([youtubeItem(refresh), databaseItem()]);
  const items = [youtube, dataItem(), database, cronItem(), settingsItem()];
  const mode = getIngestMeta().source === 'youtube' ? '실제 YouTube 수집 데이터 (data/youtube.json)' : '목업 데이터';
  return { items, mode, checkedAt: new Date().toISOString() };
}
