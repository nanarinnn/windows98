-- 미니홈피 다이어리 — Supabase SQL Editor에서 실행한다(주인장 SQL을 먼저 실행해 minihompy_owner_ok가 있어야 한다).
-- 방문자는 공개 뷰만 읽고, 쓰기·수정·삭제는 주인장 비밀번호를 확인하는 함수로만 한다.

create table if not exists public.minihompy_diary (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title      text not null check (char_length(title) between 1 and 60),
  body       text not null check (char_length(body) between 1 and 2000)
);
alter table public.minihompy_diary enable row level security;
revoke all on public.minihompy_diary from anon, authenticated;

create or replace view public.minihompy_diary_public as
  select id, created_at, updated_at, title, body from public.minihompy_diary order by created_at desc;
revoke all on public.minihompy_diary_public from anon, authenticated;
grant select on public.minihompy_diary_public to anon;

-- entry_id가 null이면 새 글, 있으면 수정
create or replace function public.minihompy_diary_save(p text, entry_id bigint, title_text text, body_text text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.minihompy_owner_ok(p) then raise exception 'denied' using errcode = '42501'; end if;
  if entry_id is null then
    insert into public.minihompy_diary (title, body) values (left(trim(title_text), 60), left(trim(body_text), 2000));
  else
    update public.minihompy_diary set title = left(trim(title_text), 60), body = left(trim(body_text), 2000), updated_at = now() where id = entry_id;
  end if;
end $$;

create or replace function public.minihompy_diary_delete(p text, entry_id bigint) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.minihompy_owner_ok(p) then raise exception 'denied' using errcode = '42501'; end if;
  delete from public.minihompy_diary where id = entry_id;
end $$;

revoke all on function public.minihompy_diary_save(text, bigint, text, text) from public;
revoke all on function public.minihompy_diary_delete(text, bigint) from public;
grant execute on function public.minihompy_diary_save(text, bigint, text, text) to anon;
grant execute on function public.minihompy_diary_delete(text, bigint) to anon;
