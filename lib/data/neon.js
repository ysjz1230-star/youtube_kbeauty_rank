// Neon(PostgreSQL) HTTP 쿼리 헬퍼. 모든 SQL은 파라미터 바인딩($1, $2 …)만 쓴다.
import { neon } from '@neondatabase/serverless';

let client = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL) && process.env.DATA_SOURCE !== 'mock';
}

export function sql() {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL이 설정되지 않았습니다.');
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

export async function q(text, params = []) {
  return sql().query(text, params);
}

export const num = (v) => (v === null || v === undefined ? null : Number(v));
