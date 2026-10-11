import { html } from '../escape.js';
import { getConfig } from '../config.js';
import { formatDateKo, fullNumber } from '../format.js';
import { adSlot, layout } from './layout.js';
import { rankTable } from './board.js';
import { productCard } from './products.js';
import { placeCard } from './places.js';
import { breadcrumbLd, itemListLd } from '../seo.js';

export function renderHome({ top, snapshotDate, channelCount, products, places, sponsor }) {
  const cfg = getConfig();
  const dateKo = formatDateKo(snapshotDate);
  const body = html`
    ${sponsor ? adSlot(sponsor, 'home_top') : ''}

    <section class="hero">
      <h1>대한민국 K-뷰티 크리에이터 &amp; 브랜드 랭킹</h1>
      <p class="lede">매일 한 번 수집한 YouTube 공개 지표와 영상 속 제품·장소 정보를 한눈에 확인하세요.</p>
      <div class="hero-meta">
        <span class="meta-chip">기준일 ${dateKo}</span>
        <span class="meta-chip">수집 채널 ${fullNumber(channelCount)}개</span>
      </div>
    </section>

    <section aria-labelledby="top10">
      <div class="section-head">
        <h2 id="top10">구독자 순위 TOP 10</h2>
        <a class="more" href="/ranking/subscribers">전체 랭킹 보기 →</a>
      </div>
      ${rankTable({ rows: top, board: 'subscribers', caption: `${dateKo} 기준 구독자 순위 TOP 10`, snapshotDate })}
    </section>

    <section aria-labelledby="hot-products">
      <div class="section-head">
        <h2 id="hot-products">영상 속 언급된 화제의 뷰티템</h2>
        <a class="more" href="/products">뷰티템 전체보기 →</a>
      </div>
      <div class="grid cols-4">${products.map(productCard)}</div>
    </section>

    <section aria-labelledby="hot-places">
      <div class="section-head">
        <h2 id="hot-places">크리에이터가 방문한 K-뷰티 성지 스팟</h2>
        <a class="more" href="/places">뷰티스팟 전체보기 →</a>
      </div>
      <div class="grid cols-3">${places.map(placeCard)}</div>
    </section>

    <section class="card cta-band">
      <div>
        <h2>채널 운영자이신가요?</h2>
        <p class="small muted">채널 제외 요청은 접수 후 7일 이내에 처리됩니다.</p>
      </div>
      <a class="btn btn-primary" href="/takedown">채널 제외 요청</a>
    </section>`;

  return layout({
    path: '/',
    title: 'K-beauty 유튜브 채널 랭킹 — 구독자·조회수 순위와 제품·장소 정보',
    description: `${dateKo} 기준 K-beauty 유튜브 채널 구독자 순위. 1위 ${top[0]?.title ?? ''} 등 ${channelCount}개 채널과 영상 속 제품·장소를 확인하세요.`,
    jsonld: [
      breadcrumbLd([{ name: '홈', path: '/' }], cfg.siteUrl),
      itemListLd(top.map((r) => ({ name: r.title, path: `/channel/${r.channel_id}` })), cfg.siteUrl),
    ],
    body,
  });
}
