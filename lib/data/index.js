// 데이터 원천 선택: DATABASE_URL이 있고 DB에 수집 데이터가 있으면 Neon, 아니면 기존(JSON/목업).
// DB 오류나 빈 DB에서도 화면이 죽지 않도록 폴백하고, 이유를 로그에 남긴다.
import * as mock from './mock.js';
import * as db from './db.js';
import { hasDatabaseUrl } from './neon.js';

let cached = { at: 0, impl: mock, mode: 'mock' };
let lastNote = '';

function note(msg) {
  if (msg !== lastNote) console.warn(`[data] ${msg}`);
  lastNote = msg;
}

async function pick() {
  if (!hasDatabaseUrl()) {
    cached = { at: Date.now(), impl: mock, mode: mock.dataMode() };
    return mock;
  }
  if (cached.at && Date.now() - cached.at < 60_000) return cached.impl;
  try {
    if (await db.hasData()) {
      cached = { at: Date.now(), impl: db, mode: 'db' };
    } else {
      note('DB에 수집 데이터가 없어 JSON/목업 데이터를 사용합니다. (npm run seed → npm run ingest)');
      cached = { at: Date.now(), impl: mock, mode: mock.dataMode() };
    }
  } catch (err) {
    note(`DB 조회 실패로 JSON/목업 데이터를 사용합니다: ${err.message}`);
    cached = { at: Date.now(), impl: mock, mode: mock.dataMode() };
  }
  return cached.impl;
}

const wrap = (name) => async (...args) => (await pick())[name](...args);

export const getLatestSnapshotDate = wrap('getLatestSnapshotDate');
export const listActiveChannelLatest = wrap('listActiveChannelLatest');
export const getBaseSnapshots = wrap('getBaseSnapshots');
export const getChannel = wrap('getChannel');
export const listPublicChannelIds = wrap('listPublicChannelIds');
export const listProducts = wrap('listProducts');
export const listProductCategories = wrap('listProductCategories');
export const getProduct = wrap('getProduct');
export const listPlaces = wrap('listPlaces');
export const listPlaceFacets = wrap('listPlaceFacets');
export const getPlace = wrap('getPlace');
export const getChannelMentions = wrap('getChannelMentions');
export const listSponsors = wrap('listSponsors');
export const highlightProducts = wrap('highlightProducts');
export const highlightPlaces = wrap('highlightPlaces');
export const saveTakedown = wrap('saveTakedown');
export const countTakedownsToday = wrap('countTakedownsToday');
export const getIngestMeta = wrap('getIngestMeta');

// 상태 점검·health: 실제 DB 연결 여부를 그대로 보여 준다
export async function dbStatus() {
  if (!hasDatabaseUrl()) return mock.dbStatus();
  try {
    return await db.dbStatus();
  } catch {
    return { connected: false, mode: 'neon-error' };
  }
}

// 동기 조회(푸터 문구용): 마지막으로 확인된 모드. DB 데이터를 쓰면 'youtube'로 취급한다.
export function dataMode() {
  if (!hasDatabaseUrl()) return mock.dataMode();
  return cached.mode === 'db' ? 'youtube' : cached.mode;
}
