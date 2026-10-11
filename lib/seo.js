import { SITE_NAME } from './config.js';
import { html, raw, jsonForScript } from './escape.js';

// <head>에 들어갈 메타·OG·JSON-LD 조각을 만든다.
export function headTags({ title, description, path, noindex = false, jsonld = [], siteUrl }) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonical = `${siteUrl}${path}`;
  return html`
    <title>${fullTitle}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    ${noindex ? raw('<meta name="robots" content="noindex,follow" />') : ''}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${siteUrl}/og.png" />
    <meta name="twitter:card" content="summary" />
    ${jsonld.map((o) => raw(`<script type="application/ld+json">${jsonForScript(o)}</script>`))}
  `;
}

export function breadcrumbLd(items, siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${siteUrl}${it.path}`,
    })),
  };
}

export function itemListLd(items, siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: `${siteUrl}${it.path}`,
    })),
  };
}
