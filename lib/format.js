// 숫자·날짜 포맷 (서버에서 ko-KR로 만든다)
const nf = new Intl.NumberFormat('ko-KR');

export function fullNumber(n) {
  return n === null || n === undefined ? '' : nf.format(n);
}

function trimZero(s) {
  return s.replace(/\.0$/, '');
}

// 12.3만, 592만, 1.8억 처럼 줄여 쓴다. 정확한 값은 호출 쪽에서 title/sr-only로 제공한다.
export function compactKo(n) {
  if (n === null || n === undefined) return '-';
  const abs = Math.abs(n);
  if (abs < 10000) return nf.format(n);
  if (abs < 1_000_000) return `${trimZero((n / 10000).toFixed(1))}만`;
  if (abs < 100_000_000) return `${nf.format(Math.round(n / 10000))}만`;
  return `${trimZero((n / 100_000_000).toFixed(1))}억`;
}

export function krw(n) {
  return n === null || n === undefined ? '' : `${nf.format(n)}원`;
}

// 한국 시간 기준 오늘 (YYYY-MM-DD)
export function todayKst(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDateKo(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

export function formatShortDate(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}월 ${d}일`;
}

// "3일 전" 같은 상대 표현
export function daysAgoKo(dateStr, today) {
  const diff = Math.round((Date.parse(today) - Date.parse(dateStr)) / 86_400_000);
  if (diff <= 0) return '오늘';
  if (diff < 7) return `${diff}일 전`;
  if (diff < 30) return `${Math.floor(diff / 7)}주 전`;
  return `${Math.floor(diff / 30)}개월 전`;
}

// 보관 기준일: 오늘 포함 최근 N개 날짜 → 이 날짜보다 이전 스냅샷은 삭제 대상
export function retentionCutoff(today, retentionDays = 30) {
  return addDays(today, -(retentionDays - 1));
}

// YouTube 주소에서 영상 ID 추출. 못 찾으면 null.
export function parseVideoId(input) {
  const s = String(input ?? '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).match(/^[\w-]{11}/)?.[0] ?? null;
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      const v = u.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {
    /* 주소 형식이 아님 */
  }
  return null;
}
