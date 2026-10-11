import { html } from '../escape.js';
import { getConfig } from '../config.js';
import { breadcrumb, layout } from './layout.js';
import { breadcrumbLd } from '../seo.js';

export function renderAbout({ snapshotDate }) {
  const cfg = getConfig();
  const body = html`
    <section class="hero">
      ${breadcrumb([{ name: '홈', path: '/' }, { name: '서비스 소개', path: '/about' }])}
      <h1>서비스 소개</h1>
    </section>
    <article class="prose card card-pad">
      <h2>데이터 출처와 순위 기준</h2>
      <p>이 서비스는 수동으로 선별한 K-beauty 유튜브 채널의 공개 지표를 YouTube Data API v3로 하루 한 번 수집합니다. 순위는 API가 제공한 구독자 수와 누적 조회수를 내림차순으로 정렬한 결과이며, 가중치를 섞은 종합 점수는 사용하지 않습니다.</p>
      <ul>
        <li>기준일: 가장 최근 수집일 (${snapshotDate})</li>
        <li>동률은 같은 순위로 표시하며, 화면 순서는 채널명 순입니다.</li>
        <li>구독자 수는 YouTube가 반올림해 제공하므로 오차가 있을 수 있고, 구독자 수를 숨긴 채널은 구독자 순위에서 제외됩니다.</li>
        <li>YouTube에서 받은 수치는 최근 30일치만 보관하고 이후 삭제합니다.</li>
      </ul>
      <h2 id="ads">광고·제휴 표기</h2>
      <p>배너에는 "광고" 라벨을, 제휴 링크에는 "광고·제휴 링크" 표시와 rel="sponsored"를 붙입니다. 유료 노출 항목에는 "유료 등록" 라벨을 붙입니다. 광고가 있는 모든 페이지에는 직접 큐레이션한 제품·장소 정보가 함께 표시됩니다.</p>
      <h2>제품·장소 정보</h2>
      <p>제품·장소 정보는 영상에서 언급된 내용을 사람이 직접 정리한 것입니다. 설명은 효능·효과를 보증하지 않으며 가격은 확인일 기준입니다.</p>
      <h2>채널 제외 요청</h2>
      <p>채널 운영자는 <a href="/takedown">제외 요청 페이지</a>에서 요청할 수 있으며, 접수 후 7일 이내에 해당 채널의 데이터를 삭제합니다.</p>
      <h2>개인정보</h2>
      <p>받는 정보는 제외 요청과 광고 문의에 입력한 이메일뿐이며, 처리 완료 후 30일 안에 삭제합니다.</p>
      <h2>YouTube API 서비스</h2>
      <p>이 서비스는 YouTube API 서비스를 사용합니다. <a href="https://www.youtube.com/t/terms" rel="noopener noreferrer" target="_blank">YouTube 서비스 약관</a>, <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">Google 개인정보처리방침</a>을 참고하세요.</p>
    </article>`;
  return layout({
    path: '/about',
    title: '서비스 소개 — 데이터 출처와 순위 기준',
    description: '데이터 출처, 순위 기준, 기준일, 채널 제외 요청, 광고·제휴 표기 안내.',
    jsonld: [breadcrumbLd([{ name: '홈', path: '/' }, { name: '서비스 소개', path: '/about' }], cfg.siteUrl)],
    body,
    showCategories: false,
  });
}

export function renderTakedown({ received = false } = {}) {
  const cfg = getConfig();
  const body = html`
    <section class="hero">
      ${breadcrumb([{ name: '홈', path: '/' }, { name: '채널 제외 요청', path: '/takedown' }])}
      <h1>채널 제외 요청</h1>
      <p class="lede">채널 운영자 또는 소속사는 이 양식으로 랭킹 제외를 요청할 수 있습니다. 접수 후 7일 이내에 데이터를 삭제합니다.</p>
    </section>
    ${received ? html`<div class="notice" role="status"><span aria-hidden="true">✓</span><p>요청이 접수되었습니다. 접수 후 7일 이내에 처리됩니다.</p></div>` : ''}
    <div class="notice" role="status" data-takedown-result hidden></div>
    <form class="form card card-pad" method="post" action="/api/takedown" data-takedown-form>
      <label>채널 주소 또는 채널 ID
        <input type="text" name="channelId" maxlength="200" placeholder="https://www.youtube.com/channel/UC..." />
      </label>
      <label>연락 가능한 이메일 (필수)
        <input type="email" name="email" required maxlength="200" autocomplete="email" />
      </label>
      <label>요청 내용 (최대 500자)
        <textarea name="message" maxlength="500"></textarea>
      </label>
      <div class="hp" aria-hidden="true">
        <label>웹사이트 <input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
      </div>
      <p class="small muted">이메일은 처리 완료 후 30일 안에 삭제합니다.</p>
      <button class="btn btn-primary" type="submit">제외 요청 보내기</button>
    </form>`;
  return layout({
    path: '/takedown',
    title: '채널 제외 요청',
    description: 'K-beauty 채널 랭킹에서 채널을 제외하고 싶은 운영자를 위한 요청 양식. 접수 후 7일 이내 처리.',
    jsonld: [breadcrumbLd([{ name: '홈', path: '/' }, { name: '채널 제외 요청', path: '/takedown' }], cfg.siteUrl)],
    body,
    showCategories: false,
  });
}

export function renderError({ status, title, message }) {
  const body = html`<section class="empty card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a class="btn btn-primary" href="/">홈으로</a>
  </section>`;
  return layout({
    path: '/',
    title: `${status} ${title}`,
    description: message,
    noindex: true,
    body,
    showCategories: false,
  });
}
