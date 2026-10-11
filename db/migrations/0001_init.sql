-- 0001: YouTube 수집 데이터와 운영 테이블 (명세 5장). 적용은 후속 단계(scripts/migrate.js)에서 한다.
create table channels (
  channel_id          text primary key check (channel_id ~ '^UC[\w-]{22}$'),
  title               text,
  handle              text,
  thumbnail_url       text,
  country             text,
  uploads_playlist_id text,
  category            text not null check (category in
                        ('skincare','makeup','hair','nail','fragrance','review','brand','shop')),
  is_brand            boolean not null default false,
  note                text,
  status              text not null default 'active'
                        check (status in ('active','missing','excluded')),
  last_refreshed_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table channel_snapshots (
  channel_id         text not null references channels(channel_id) on delete cascade,
  snapshot_date      date not null,
  subscriber_count   bigint,
  hidden_subscribers boolean not null default false,
  view_count         bigint not null,
  video_count        integer not null,
  created_at         timestamptz not null default now(),
  primary key (channel_id, snapshot_date)
);
create index on channel_snapshots (snapshot_date, subscriber_count desc);
create index on channel_snapshots (snapshot_date, view_count desc);

create table videos (
  video_id      text primary key,
  channel_id    text not null references channels(channel_id) on delete cascade,
  title         text,
  published_at  timestamptz,
  thumbnail_url text,
  view_count    bigint,
  fetched_at    timestamptz not null default now()
);
create index on videos (channel_id, published_at desc);

create table sponsors (
  id          bigint generated always as identity primary key,
  name        text not null,
  image_path  text not null,
  link_url    text not null,
  placement   text not null check (placement in ('home_top','board_side','channel_side')),
  starts_on   date not null,
  ends_on     date not null,
  is_active   boolean not null default true
);

create table takedown_requests (
  id            bigint generated always as identity primary key,
  channel_id    text,
  contact_email text not null,
  message       text,
  status        text not null default 'received'
                  check (status in ('received','done','rejected')),
  received_at   timestamptz not null default now(),
  due_at        timestamptz not null default now() + interval '7 days',
  resolved_at   timestamptz
);

create table ingest_runs (
  id                 bigint generated always as identity primary key,
  stage              text not null,
  chunk              integer,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  status             text not null default 'running'
                       check (status in ('running','ok','partial','failed')),
  units_used         integer not null default 0,
  channels_processed integer not null default 0,
  error              text
);
