-- 미니홈피 방명록 주인장 모드(답글·숨김·비밀글 보기) — Supabase SQL Editor에서 실행한다.
-- 비밀번호는 해시로만 저장되고, 아래 함수 안에서만 확인한다. 사이트 코드에는 비밀번호가 없다.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.minihompy_owner (
  id        int primary key default 1 check (id = 1),
  pass_hash text not null
);
alter table public.minihompy_owner enable row level security;
revoke all on public.minihompy_owner from anon, authenticated;

create or replace function public.minihompy_owner_ok(p text) returns boolean
language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from public.minihompy_owner where pass_hash = extensions.crypt(p, pass_hash));
$$;

create or replace function public.minihompy_owner_list(p text) returns setof public.minihompy_guestbook
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.minihompy_owner_ok(p) then raise exception 'denied' using errcode = '42501'; end if;
  return query select * from public.minihompy_guestbook order by created_at desc;
end $$;

create or replace function public.minihompy_set_reply(p text, entry_id bigint, reply_text text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.minihompy_owner_ok(p) then raise exception 'denied' using errcode = '42501'; end if;
  update public.minihompy_guestbook set reply = nullif(left(trim(reply_text), 300), '') where id = entry_id;
end $$;

create or replace function public.minihompy_set_hidden(p text, entry_id bigint, is_hidden boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.minihompy_owner_ok(p) then raise exception 'denied' using errcode = '42501'; end if;
  update public.minihompy_guestbook set hidden = is_hidden where id = entry_id;
end $$;

revoke all on function public.minihompy_owner_ok(text) from public, anon, authenticated;
revoke all on function public.minihompy_owner_list(text) from public;
revoke all on function public.minihompy_set_reply(text, bigint, text) from public;
revoke all on function public.minihompy_set_hidden(text, bigint, boolean) from public;
grant execute on function public.minihompy_owner_list(text) to anon;
grant execute on function public.minihompy_set_reply(text, bigint, text) to anon;
grant execute on function public.minihompy_set_hidden(text, bigint, boolean) to anon;

-- ↓ 주인장 비밀번호 설정(사용자가 직접 바꿔서 실행). 12자 이상 권장.
-- insert into public.minihompy_owner (id, pass_hash)
--   values (1, extensions.crypt('여기에_비밀번호', extensions.gen_salt('bf')))
--   on conflict (id) do update set pass_hash = excluded.pass_hash;
