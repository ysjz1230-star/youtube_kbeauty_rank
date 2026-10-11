import { getConfig, BOARDS, CATEGORY_KEYS } from '../lib/config.js';
import { escapeHtml } from '../lib/escape.js';
import * as data from '../lib/data/mock.js';

export default async function handler(req, res) {
  const cfg = getConfig();
  const lastmod = await data.getLatestSnapshotDate();
  const paths = ['/', '/products', '/places', '/about', '/takedown'];
  const boards = Object.keys(BOARDS).filter((b) => !BOARDS[b].derived || cfg.derivedMetrics);
  for (const b of boards) {
    paths.push(`/ranking/${b}`);
    for (const c of CATEGORY_KEYS) paths.push(`/ranking/${b}/${c}`);
  }
  for (const id of await data.listPublicChannelIds()) paths.push(`/channel/${id}`);
  for (const p of await data.listProducts()) paths.push(`/product/${p.slug}`);
  for (const p of await data.listPlaces()) paths.push(`/place/${p.slug}`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${escapeHtml(cfg.siteUrl + p)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  res.end(xml);
}
