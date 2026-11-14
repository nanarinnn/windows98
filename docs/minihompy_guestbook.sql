-- 미니홈피(데뷔 1000일) 방명록 테이블 — Supabase SQL Editor에서 한 번 실행한다.
-- yuyeon-special의 guestbook 테이블과 섞이지 않도록 전용 테이블을 쓴다.

create table if not exists public.minihompy_guestbook (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nickname   text not null check (char_length(nickname) between 1 and 12),
  message    text not null check (char_length(message) between 1 and 300),
  hair       text not null default '갈색' check (hair in ('갈색','분홍','금발','파랑','검정')),
  sticker    text not null default 'heart' check (sticker in ('heart','cake','star','flower')),
  secret     boolean not null default false,
  reply      text,                       -- 주인장 답글: 대시보드에서만 입력
  hidden     boolean not null default false  -- true로 바꾸면 사이트에서 숨김(도배·악플 정리용)
);

-- 방문자(anon)는 원본 테이블을 읽지 못하고, 정해진 칸에만 새 글을 쓸 수 있다.
alter table public.minihompy_guestbook enable row level security;
revoke all on public.minihompy_guestbook from anon, authenticated;
grant insert (nickname, message, hair, sticker, secret) on public.minihompy_guestbook to anon;
drop policy if exists "minihompy anyone can write" on public.minihompy_guestbook;
create policy "minihompy anyone can write" on public.minihompy_guestbook
  for insert to anon with check (reply is null and hidden = false);

-- 공개 조회용 뷰: 숨긴 글 제외, 비밀글은 내용을 비워서 내보낸다.
create or replace view public.minihompy_guestbook_public as
  select id, created_at, nickname, hair, sticker, secret, reply,
         case when secret then '' else message end as message
  from public.minihompy_guestbook
  where hidden = false
  order by created_at desc;
revoke all on public.minihompy_guestbook_public from anon, authenticated;
grant select on public.minihompy_guestbook_public to anon;
