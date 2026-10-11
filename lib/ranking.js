// 보드별 조회. 순위는 원본 수치 정렬 결과만 쓴다(종합 점수 없음).
import { BOARDS, PAGE_SIZE, MAX_ITEMS, getConfig } from './config.js';
import { addDays } from './format.js';
import * as data from './data/mock.js';

const collator = new Intl.Collator('ko');

// 동률은 같은 순위(rank()), 화면 순서는 제목순으로 고정한다.
export function assignRanks(rows, valueOf) {
  const sorted = [...rows].sort((a, b) => {
    const diff = valueOf(b) - valueOf(a);
    return diff !== 0 ? diff : collator.compare(a.title ?? '', b.title ?? '');
  });
  let lastValue = null;
  let lastRank = 0;
  return sorted.map((row, i) => {
    const v = valueOf(row);
    if (v !== lastValue) {
      lastRank = i + 1;
      lastValue = v;
    }
    return { ...row, rank: lastRank };
  });
}

function filterRows(rows, { category, type }) {
  return rows.filter(
    (r) =>
      (!category || r.category === category) &&
      (!type || (type === 'brand' ? r.is_brand : !r.is_brand)),
  );
}

export function paginate(rows, page) {
  const capped = rows.slice(0, MAX_ITEMS);
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: capped.slice(start, start + PAGE_SIZE),
    total: capped.length,
    page,
    pageCount: Math.max(1, Math.ceil(capped.length / PAGE_SIZE)),
  };
}

// 원본 수치 보드 (구독자 / 누적 조회수)
export async function getRawBoard({ board, category, type, page = 1 }) {
  const metric = BOARDS[board].metric;
  let rows = await data.listActiveChannelLatest();
  // 구독자를 숨긴 채널은 구독자 보드에서 뺀다
  if (metric === 'subscriber_count') rows = rows.filter((r) => !r.hidden_subscribers && r.subscriber_count !== null);
  rows = filterRows(rows, { category, type });
  const ranked = assignRanks(rows, (r) => r[metric]);
  return { ...paginate(ranked, page), snapshotDate: await data.getLatestSnapshotDate() };
}

// 증가 보드 (FEATURE_DERIVED_METRICS=true일 때만 호출된다)
export async function getGainBoard({ board, category, type, period = 7, page = 1 }) {
  const cfg = getConfig();
  const metric = BOARDS[board].metric;
  const today = await data.getLatestSnapshotDate();
  // 7일 보드 k=7, 30일 보드는 보관 한도 때문에 k=29
  const k = period === 30 ? cfg.retentionDays - 1 : 7;
  const baseDate = addDays(today, -k);
  const [latest, base, base7] = await Promise.all([
    data.listActiveChannelLatest(),
    data.getBaseSnapshots(baseDate),
    data.getBaseSnapshots(addDays(today, -7)),
  ]);

  let pending = 0;
  const rows = [];
  for (const r of filterRows(latest, { category, type })) {
    const b = base.get(r.channel_id);
    if (!b || b.snapshot_date > baseDate) {
      pending++;
      continue;
    }
    if (metric === 'subscriber_count' && (r.hidden_subscribers || r.subscriber_count === null || b.subscriber_count === null)) continue;
    const baseValue = b[metric];
    if (metric === 'subscriber_count' && baseValue < cfg.minBaseSubscribers) continue;
    const delta = r[metric] - baseValue;
    rows.push({
      ...r,
      base_value: baseValue,
      base_date: b.snapshot_date,
      delta,
      delta_pct: baseValue ? Math.round((delta / baseValue) * 10000) / 100 : null,
    });
  }

  const ranked = assignRanks(rows, (r) => r.delta);

  // 순위 변동: 같은 필터의 원본 수치 순위를 오늘과 7일 전 스냅샷으로 각각 계산해 비교한다.
  // 양수면 순위가 오른 것이고, 7일 전에 없던 채널은 null(신규)이다.
  const scope = filterRows(latest, { category, type }).filter(
    (r) => metric !== 'subscriber_count' || (!r.hidden_subscribers && r.subscriber_count !== null),
  );
  const nowRank = new Map(assignRanks(scope, (r) => r[metric]).map((r) => [r.channel_id, r.rank]));
  const prevScope = scope
    .filter((r) => base7.get(r.channel_id)?.[metric] != null)
    .map((r) => ({ channel_id: r.channel_id, title: r.title, value: base7.get(r.channel_id)[metric] }));
  const prevRank = new Map(assignRanks(prevScope, (r) => r.value).map((r) => [r.channel_id, r.rank]));
  const withChange = ranked.map((r) => ({
    ...r,
    rank_change: prevRank.has(r.channel_id) ? prevRank.get(r.channel_id) - nowRank.get(r.channel_id) : null,
  }));

  return { ...paginate(withChange, page), snapshotDate: today, baseDays: k, pending };
}

export async function categoryCounts(type) {
  const rows = filterRows(await data.listActiveChannelLatest(), { type });
  const counts = { all: rows.length };
  for (const r of rows) counts[r.category] = (counts[r.category] ?? 0) + 1;
  return counts;
}
