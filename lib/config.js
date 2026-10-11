// 환경변수와 공용 상수. 비밀값은 여기서 읽되 어떤 응답에도 싣지 않는다.
export const CATEGORIES = [
  { key: 'skincare', label: '스킨케어', tone: 'skincare' },
  { key: 'makeup', label: '메이크업', tone: 'makeup' },
  { key: 'hair', label: '헤어', tone: 'neutral' },
  { key: 'nail', label: '네일', tone: 'neutral' },
  { key: 'fragrance', label: '향수', tone: 'neutral' },
  { key: 'review', label: '솔직리뷰', tone: 'neutral' },
  { key: 'brand', label: '브랜드 공식', tone: 'brand' },
  { key: 'shop', label: '쇼핑', tone: 'neutral' },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
export const categoryByKey = (key) => CATEGORIES.find((c) => c.key === key);

export const BOARDS = {
  subscribers: { label: '구독자 순위', metric: 'subscriber_count', derived: false },
  views: { label: '누적 조회수 순위', metric: 'view_count', derived: false },
  'subscribers-gain': { label: '구독자 증가', metric: 'subscriber_count', derived: true },
  'views-gain': { label: '조회수 증가', metric: 'view_count', derived: true },
};

export const PAGE_SIZE = 50;
export const MAX_ITEMS = 100;

export function getConfig(env = process.env) {
  return {
    siteUrl: (env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
    derivedMetrics: env.FEATURE_DERIVED_METRICS === 'true',
    minBaseSubscribers: Number(env.MIN_BASE_SUBSCRIBERS || 10000),
    retentionDays: Math.min(Number(env.RETENTION_DAYS || 30), 30),
    mockXss: env.MOCK_XSS === '1',
  };
}

export const SITE_NAME = 'K-beauty 채널 랭킹';
