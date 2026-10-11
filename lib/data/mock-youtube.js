// 목업용 "YouTube 데이터". 실제 채널·인물과 무관한 가상 데이터다.
// 실제 연결 시 이 파일의 역할은 channels / channel_snapshots / videos 테이블이 대신한다.
import { addDays, todayKst } from '../format.js';

export const mockChannelId = (i) => `UC${'mockkbeauty'}${String(i).padStart(11, '0')}`;
export const mockVideoId = (ch, v) => `mockvid${String(ch).padStart(2, '0')}${String(v).padStart(2, '0')}`;

// [idx, title, handle, category, isBrand, subs, views, videoCount, extra]
const RAW = [
  [1, '하루결 스튜디오', '@harugyeol', 'makeup', false, 5920000, 420000000, 348],
  [2, '미아의 뷰티룸', '@miabeautyroom', 'makeup', false, 2280000, 380000000, 612],
  [3, '닥터 세린', '@dr_serin', 'skincare', false, 1850000, 240000000, 410],
  [4, '진하 메이크업', '@jinha_mu', 'makeup', false, 1510000, 290000000, 524],
  [5, '소이 클로젯', '@soicloset', 'makeup', false, 1320000, 190000000, 580],
  [6, '연두 리뷰', '@yeondoo_review', 'review', false, 1220000, 170000000, 710],
  [7, '아르벨 코스메틱', '@arbel_official', 'brand', true, 1060000, 140000000, 1120],
  [8, '보리 헤어룸', '@bori_hairroom', 'hair', false, 980000, 130000000, 394],
  [9, '서아 스킨랩', '@seoa_skinlab', 'skincare', false, 850000, 130000000, 360],
  [10, '모레 네일', '@more_nail', 'nail', false, 720000, 98000000, 330],
  [11, '향기 노트', '@hyanggi_note', 'fragrance', false, 640000, 82000000, 270],
  [12, '에이든 브랜드관', '@aiden_brand', 'brand', true, 560000, 76000000, 640],
  [13, '라온 쇼핑하울', '@raon_haul', 'shop', false, 480000, 60000000, 520],
  [14, '윤슬 스킨케어', '@yunseul_skin', 'skincare', false, 430000, 51000000, 300],
  [15, '하나의 솔직리뷰', '@hana_honest', 'review', false, 390000, 44000000, 460],
  [16, '리온 헤어', '@rion_hair', 'hair', false, 350000, 39000000, 280],
  [17, '비비안 뷰티', '@vivian_beauty', 'makeup', false, 310000, 33000000, 410],
  [18, '오월 네일아트', '@omwol_nail', 'nail', false, 270000, 28000000, 350],
  [19, '단비 피부진단', '@danbi_skin', 'skincare', false, 240000, 22000000, 220],
  [20, '세이지 공식 채널', '@sage_official', 'brand', true, 200000, 18000000, 380],
  [21, '로아 향수', '@loa_scent', 'fragrance', false, 170000, 15000000, 190],
  [22, '민트 메이크업', '@mint_mu', 'makeup', false, 140000, 12000000, 260],
  [23, '은하 리뷰', '@eunha_review', 'review', false, 110000, 9000000, 240],
  // 구독자 수를 숨긴 채널 (구독자 보드에서 빠지고 "비공개"로 표시)
  [24, '비밀노트 뷰티', '@secretnote_beauty', 'skincare', false, null, 31000000, 150, { hidden: true }],
  [25, '새싹 뷰티', '@saessak_beauty', 'skincare', false, 54000, 4000000, 120],
  // 제외 요청이 처리된 채널 (410 응답 확인용)
  [26, '제외된 채널', '@excluded_channel', 'makeup', false, 80000, 6000000, 90, { excluded: true }],
];

// 이스케이프 확인용 (MOCK_XSS=1일 때만 포함)
const XSS = [27, '테스트 <script>alert(1)</script> "채널"', '@xss_test', 'review', false, 20000, 1000000, 40];

const VIDEO_TITLES = {
  makeup: ['가을 웜톤 데일리 메이크업', '베이스 밀착 루틴 정리', '립 컬러 5종 비교', '아이 메이크업 입문 가이드', '파우치 속 베스트 아이템', '촬영장 메이크업 따라하기'],
  skincare: ['아침 저녁 스킨케어 루틴', '건성 피부 수분 관리법', '성분 읽는 법 기초', '선케어 제형별 비교', '진정 케어 일주일 기록', '토너 패드 사용 후기'],
  hair: ['손상 모발 홈케어 루틴', '볼륨 드라이 방법', '두피 케어 제품 비교', '헤어 오일 사용법', '여름철 헤어 스타일링', '염색 후 관리 팁'],
  nail: ['셀프 네일 기본 순서', '가을 컬러 네일 추천', '젤 네일 제거 방법', '큐티클 관리 가이드', '프렌치 네일 따라하기', '네일 케어 도구 정리'],
  fragrance: ['향수 레이어링 방법', '데일리 향수 추천', '계절별 향 고르는 법', '바디 미스트 비교', '향수 보관법', '입문자용 향 노트 설명'],
  review: ['한 달 사용 솔직 후기', '재구매 템 vs 정리 템', '신제품 첫인상 리뷰', '성분 위주 비교 리뷰', '가격대별 추천 정리', '파우치 정리 하는 날'],
  brand: ['신제품 소개 영상', '브랜드 스토리 인터뷰', '제품 사용법 안내', '시즌 컬렉션 소개', '촬영 비하인드', '팝업스토어 현장 스케치'],
  shop: ['이달의 구매 목록 공개', '세일 기간 쇼핑 팁', '하울 영상 모음', '가성비 아이템 정리', '선물용 세트 추천', '쇼핑 리스트 정리'],
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildMockYoutube({ today = todayKst(), includeXss = false } = {}) {
  const rows = includeXss ? [...RAW, XSS] : RAW;
  return rows.map(([idx, title, handle, category, isBrand, subs, views, videoCount, extra = {}]) => {
    const rnd = mulberry32(idx * 7919);
    const dailySubGrowth = 0.0004 + rnd() * 0.0022; // 일 0.04%~0.26%
    const dailyViewGrowth = 0.0006 + rnd() * 0.0020;
    const snapshots = [];
    for (let d = 0; d < 30; d++) {
      const back = 29 - d;
      const sf = Math.pow(1 + dailySubGrowth, -back);
      const vf = Math.pow(1 + dailyViewGrowth, -back);
      snapshots.push({
        snapshot_date: addDays(today, -back),
        subscriber_count: subs === null ? null : Math.round((subs * sf) / 100) * 100, // YouTube 반올림 흉내
        hidden_subscribers: Boolean(extra.hidden),
        view_count: Math.round(views * vf),
        video_count: videoCount - Math.floor(back / 9),
      });
    }
    const titles = VIDEO_TITLES[category];
    const videos = titles.map((t, v) => ({
      video_id: mockVideoId(idx, v + 1),
      channel_id: mockChannelId(idx),
      title: `${t}`,
      published_at: addDays(today, -(2 + v * 4 + Math.floor(rnd() * 3))),
      thumbnail_url: null,
      view_count: Math.round((views / videoCount) * (0.4 + rnd() * 2.2)),
    }));
    return {
      channel_id: mockChannelId(idx),
      title,
      handle,
      category,
      is_brand: isBrand,
      status: extra.excluded ? 'excluded' : 'active',
      snapshots,
      videos,
    };
  });
}
