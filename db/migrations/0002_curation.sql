-- 0002: 직접 큐레이션하는 제품·장소와 영상 연결 (명세 5·7장)
create table products (
  product_id   uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  brand        text not null,
  name_ko      text not null,
  category     text not null,
  price_krw    numeric(12,0),
  price_checked_on date,
  description  text,
  buy_url      text,
  is_affiliate boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table places (
  place_id     uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name_ko      text not null,
  place_type   text not null,
  district     text,
  address      text,
  lat          numeric(9,6),
  lng          numeric(9,6),
  website_url  text,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table video_mentions (
  id           bigint generated always as identity primary key,
  video_id     text not null,
  channel_id   text not null references channels(channel_id) on delete cascade,
  product_id   uuid references products(product_id),
  place_id     uuid references places(place_id),
  start_sec    integer,
  source       text not null default 'manual' check (source in ('manual','ai_reviewed')),
  created_at   timestamptz not null default now(),
  check ((product_id is null) <> (place_id is null))
);
create unique index on video_mentions (video_id, product_id) where product_id is not null;
create unique index on video_mentions (video_id, place_id) where place_id is not null;
create index on video_mentions (channel_id);
