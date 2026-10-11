import { html, raw, safeUrl } from '../escape.js';
import { getConfig } from '../config.js';
import { compactKo, fullNumber, formatDateKo, formatShortDate, daysAgoKo } from '../format.js';
import { adSlot, avatar, ytImage, breadcrumb, categoryPill, curatedBlock, layout, metricNumber } from './layout.js';
import { breadcrumbLd } from '../seo.js';
import { productCard } from './products.js';
import { placeCard } from './places.js';

// 서버에서 그리는 SVG 선 그래프. 증가수·증가율은 쓰지 않고 일별 원본 값만 이어 보여준다.
function lineChart({ points, label, unit }) {
  const W = 640;
  const H = 180;
  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 24;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i) => padL + (i * (W - padL - padR)) / (points.length - 1);
  const y = (v) => padT + (1 - (v - min) / span) * (H - padT - padB);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;
  const first = points[0];
  const last = points[points.length - 1];
  return html`<figure class="flush">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label} 일별 추이: ${formatShortDate(first.date)} ${fullNumber(first.value)}${unit}에서 ${formatShortDate(last.date)} ${fullNumber(last.value)}${unit}">
      <line class="chart-axis" x1="${padL}" x2="${W - padR}" y1="${H - padB}" y2="${H - padB}" />
      <path class="chart-area" d="${raw(area)}" />
      <path class="chart-line" d="${raw(line)}" />
      <text class="chart-label" x="${padL}" y="${H - 6}">${formatShortDate(first.date)}</text>
      <text class="chart-label" x="${W - padR}" y="${H - 6}" text-anchor="end">${formatShortDate(last.date)}</text>
      <text class="chart-label" x="${padL}" y="${padT + 8}">${compactKo(max)}${unit}</text>
    </svg>
    <table class="sr-only">
      <caption>${label} 일별 값</caption>
      <thead><tr><th scope="col">날짜</th><th scope="col">${label}</th></tr></thead>
      <tbody>${points.map((p) => html`<tr><th scope="row">${p.date}</th><td>${fullNumber(p.value)}${unit}</td></tr>`)}</tbody>
    </table>
  </figure>`;
}

function trendBlock(snapshots) {
  const subs = snapshots.filter((s) => s.subscriber_count !== null).map((s) => ({ date: s.snapshot_date, value: s.subscriber_count }));
  const views = snapshots.map((s) => ({ date: s.snapshot_date, value: s.view_count }));
  if (snapshots.length < 2) {
    return html`<div class="notice"><span aria-hidden="true">ⓘ</span><p>추이는 이틀 뒤부터 보여요. 스냅샷이 2개 이상 쌓이면 그래프가 표시됩니다.</p></div>`;
  }
  return html`<div class="grid cols-2">
    <section class="card chart-card" aria-labelledby="chart-subs">
      <h3 id="chart-subs">구독자 추이 (최근 ${snapshots.length}일)</h3>
      ${subs.length >= 2 ? lineChart({ points: subs, label: '구독자', unit: '명' }) : html`<p class="muted">구독자 수를 공개하지 않은 채널입니다.</p>`}
    </section>
    <section class="card chart-card" aria-labelledby="chart-views">
      <h3 id="chart-views">누적 조회수 추이 (최근 ${snapshots.length}일)</h3>
      ${lineChart({ points: views, label: '누적 조회수', unit: '회' })}
    </section>
  </div>`;
}

export function renderChannel({ channel, mentions, sponsor, curated, today }) {
  const cfg = getConfig();
  const c = channel;
  const s = c.latest;
  const ytUrl = `https://www.youtube.com/channel/${encodeURIComponent(c.channel_id)}`;
  const path = `/channel/${c.channel_id}`;
  const subsText = s.hidden_subscribers || s.subscriber_count === null ? '비공개' : `${fullNumber(s.subscriber_count)}명`;
  const body = html`
    <section class="hero">
      ${breadcrumb([{ name: '홈', path: '/' }, { name: '채널 랭킹', path: '/ranking/subscribers' }, { name: c.title, path }])}
      <div class="detail-head">
        ${avatar(c.title, c.channel_id, true, c.thumbnail_url)}
        <div>
          <h1>${c.title}</h1>
          <p class="muted">${c.handle} · ${c.is_brand ? '브랜드 공식 채널' : '크리에이터'} ${categoryPill(c.category)}</p>
        </div>
        <a class="btn btn-secondary push-right" href="${safeUrl(ytUrl)}" rel="noopener noreferrer" target="_blank">YouTube에서 보기</a>
      </div>
    </section>

    <div class="with-rail">
      <div class="grid">
        <dl class="stat-grid">
          <div class="card stat"><dt>구독자</dt><dd class="tnum">${s.hidden_subscribers || s.subscriber_count === null ? '비공개' : metricNumber(s.subscriber_count)}</dd></div>
          <div class="card stat"><dt>누적 조회수</dt><dd class="tnum">${metricNumber(s.view_count)}</dd></div>
          <div class="card stat"><dt>영상 수</dt><dd class="tnum">${fullNumber(s.video_count)}개</dd></div>
          <div class="card stat"><dt>기준일</dt><dd>${formatDateKo(s.snapshot_date)}</dd></div>
        </dl>

        ${trendBlock(c.snapshots)}
        <p class="small muted">그래프는 YouTube가 제공한 일별 원본 값을 이어 그린 것이며 최근 30일치만 보관합니다. 구독자 수는 YouTube가 반올림해 제공합니다.</p>

        ${
          c.videos.length
            ? html`<section class="card card-pad" aria-labelledby="recent">
                <div class="section-head"><h2 id="recent">최신 업로드 영상 3개</h2></div>
                <ul class="video-list">${[...c.videos]
                  .sort((a, b) => b.published_at.localeCompare(a.published_at))
                  .slice(0, 3)
                  .map(
                    (v) => html`<li>
                      ${ytImage(v.thumbnail_url) ? html`<img class="video-thumb" src="${ytImage(v.thumbnail_url)}" alt="" width="96" height="54" loading="lazy" referrerpolicy="no-referrer" />` : html`<span class="video-thumb" aria-hidden="true">▶</span>`}
                      <div>
                        <a href="https://www.youtube.com/watch?v=${encodeURIComponent(v.video_id)}" rel="noopener noreferrer" target="_blank">${v.title}</a>
                        <div class="small muted">${daysAgoKo(v.published_at, today)} · ${v.view_count === null || v.view_count === undefined ? '' : html`조회수 <span title="${fullNumber(v.view_count)}">${compactKo(v.view_count)}회</span>`}</div>
                      </div>
                    </li>`,
                  )}</ul>
              </section>`
            : ''
        }

        ${
          mentions.products.length || mentions.places.length
            ? html`<section aria-labelledby="mentioned">
                <div class="section-head"><h2 id="mentioned">이 채널에 나온 제품·장소</h2></div>
                <div class="grid cols-2">
                  ${mentions.products.slice(0, 4).map((p, i) => productCard({ ...p, mention_count: p.mention_count ?? 1 }, i))}
                  ${mentions.places.slice(0, 4).map((p, i) => placeCard({ ...p, mention_count: p.mention_count ?? 1 }, i))}
                </div>
              </section>`
            : ''
        }
      </div>

      <div class="rail">
        ${adSlot(sponsor, 'channel_side')}
        ${curated}
      </div>
    </div>`;

  return layout({
    path,
    title: `${c.title} 구독자·조회수 추이`,
    description: `${c.title}(${c.handle}) 유튜브 채널의 ${formatDateKo(s.snapshot_date)} 기준 구독자 ${subsText}, 누적 조회수 ${fullNumber(s.view_count)}회와 최근 30일 추이.`,
    jsonld: [breadcrumbLd([{ name: '홈', path: '/' }, { name: '채널 랭킹', path: '/ranking/subscribers' }, { name: c.title, path }], cfg.siteUrl)],
    body,
    showCategories: false,
  });
}
