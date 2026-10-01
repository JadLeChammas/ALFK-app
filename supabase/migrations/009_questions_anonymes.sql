-- 009 — Questions anonymes : les élèves posent, les admins valident, les alumni répondent.
-- L'auteur d'une question n'est jamais stocké dans la table des questions : il est dans
-- question_authors, que seuls l'auteur lui-même et les admins peuvent lire.

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 5 and 1000),
  topic text not null default 'autre' check (topic in ('etudes', 'orientation', 'pays', 'metier', 'vie', 'autre')),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.question_authors (
  question_id uuid primary key references public.questions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  text text not null check (char_length(text) between 1 and 3000),
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;
alter table public.question_authors enable row level security;
alter table public.answers enable row level security;

create or replace function public.is_question_author(q uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.question_authors where question_id = q and user_id = auth.uid())
$$;

-- Questions : publiées → tous les membres approuvés ; en attente/refusées → l'auteur et les admins.
drop policy if exists "questions read" on public.questions;
create policy "questions read" on public.questions for select to authenticated
  using ((status = 'published' and public.is_approved()) or public.is_admin() or public.is_question_author(id));
drop policy if exists "questions admin update" on public.questions;
create policy "questions admin update" on public.questions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "questions admin delete" on public.questions;
create policy "questions admin delete" on public.questions for delete to authenticated using (public.is_admin());
-- Pas d'insert direct : on passe par ask_question() pour enregistrer l'auteur à part.

drop policy if exists "question authors read" on public.question_authors;
create policy "question authors read" on public.question_authors for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Réponses : visibles avec leur question publiée ; écrites par les alumni (et admins), signées.
drop policy if exists "answers read" on public.answers;
create policy "answers read" on public.answers for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.questions q where q.id = question_id
      and ((q.status = 'published' and public.is_approved()) or public.is_question_author(q.id))));
drop policy if exists "answers write" on public.answers;
create policy "answers write" on public.answers for insert to authenticated
  with check (author_id = auth.uid() and coalesce(public.my_role() in ('alumni', 'admin'), false)
    and exists (select 1 from public.questions q where q.id = question_id and q.status = 'published'));
drop policy if exists "answers delete" on public.answers;
create policy "answers delete" on public.answers for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

grant select, update, delete on public.questions to authenticated;
grant select on public.question_authors to authenticated;
grant select, insert, delete on public.answers to authenticated;

-- Poser une question (élèves, et admins pour tester) : la question et son auteur en une fois.
create or replace function public.ask_question(p_id uuid, p_text text, p_topic text) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.my_role() in ('eleve', 'admin'), false) is not true then
    raise exception 'not allowed';
  end if;
  insert into public.questions (id, text, topic) values (coalesce(p_id, gen_random_uuid()), p_text, p_topic) returning id into p_id;
  insert into public.question_authors (question_id, user_id) values (p_id, auth.uid());
  return p_id;
end $$;
revoke all on function public.ask_question(uuid, text, text) from public;
grant execute on function public.ask_question(uuid, text, text) to authenticated;

-- Notifications : admins à chaque nouvelle question ; l'auteur à la décision et aux réponses ;
-- les alumni quand une question est publiée.
create or replace function public.notify_question() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  author uuid;
  excerpt text := left(new.text, 80);
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, template, params, href)
      select id, 'question', 'questionToReview', jsonb_build_object('title', excerpt), '/admin/questions'
      from public.profiles where role = 'admin' and approved;
  elsif old.status = 'pending' and new.status <> 'pending' then
    select user_id into author from public.question_authors where question_id = new.id;
    if author is not null then
      insert into public.notifications (user_id, kind, template, params, href)
        values (author, 'question', case when new.status = 'published' then 'questionPublished' else 'questionRejected' end,
                jsonb_build_object('title', excerpt), '/questions/' || new.id);
    end if;
    if new.status = 'published' then
      insert into public.notifications (user_id, kind, template, params, href)
        select id, 'question', 'questionNew', jsonb_build_object('title', excerpt), '/questions/' || new.id
        from public.profiles where role = 'alumni' and approved;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists notify_question on public.questions;
create trigger notify_question after insert or update of status on public.questions
  for each row execute function public.notify_question();

create or replace function public.notify_answer() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  author uuid;
  q text;
begin
  select qa.user_id, left(qs.text, 80) into author, q
    from public.questions qs left join public.question_authors qa on qa.question_id = qs.id
    where qs.id = new.question_id;
  if author is not null and author <> new.author_id then
    insert into public.notifications (user_id, kind, template, params, href)
      values (author, 'question', 'questionAnswered', jsonb_build_object('title', q), '/questions/' || new.question_id);
  end if;
  return new;
end $$;

drop trigger if exists notify_answer on public.answers;
create trigger notify_answer after insert on public.answers
  for each row execute function public.notify_answer();
