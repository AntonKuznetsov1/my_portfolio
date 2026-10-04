-- Portfolio content: blog posts, projects, images and likes.
--
-- Run this in the Supabase SQL Editor. It is idempotent, so it is safe to re-run.
--
-- Access model
--   visitors  (anon)     read published posts/projects/images, and nothing else
--   admin     (server)   everything, through the service role key, which bypasses RLS
--   likes     (anon)     only through toggle_post_like / get_post_like_status
--   views     (anon)     read freely, incremented only through bump_page_view
--
-- The admin area never talks to the database from the browser. Every write goes
-- through a Server Function holding SUPABASE_SERVICE_ROLE_KEY.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text,
  description text,
  body text,
  published_at timestamptz not null default now(),
  like_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  url text not null,
  path text,
  alt text,
  is_cover boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text,
  description text,
  project_url text not null,
  github_url text,
  price text,
  published_at timestamptz not null default now(),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  url text not null,
  path text,
  alt text,
  is_cover boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- `path` is the storage object key ("posts/<uuid>/<name>.webp") that `url` is a
-- public URL for. Storing it means deleting an image never has to re-derive the
-- key by string-splitting the URL, which silently does nothing if a project ever
-- uses a different host or a CDN in front of the bucket.
--
-- create table if not exists will not add the column to a table that already
-- exists, so these two statements carry the schema forward on its own. Both are
-- no-ops once the column is present.
alter table public.post_images add column if not exists path text;
alter table public.project_images add column if not exists path text;

-- Backs the view counter that src/lib/supabase.js already reads and writes.
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  view_count integer not null default 0,
  view_count_updated_at timestamptz
);

-- One row per visitor per post. The composite primary key is what guarantees a
-- visitor can never hold two likes on the same post.
create table if not exists public.post_likes (
  post_id uuid not null references public.posts on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, visitor_id)
);

create index if not exists post_images_post_id_idx on public.post_images (post_id, position);
create index if not exists project_images_project_id_idx on public.project_images (project_id, position);
create index if not exists posts_published_at_idx on public.posts (published_at desc);
create index if not exists projects_published_at_idx on public.projects (published_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.posts enable row level security;
alter table public.post_images enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.pages enable row level security;
alter table public.post_likes enable row level security;

revoke all on public.posts from anon, authenticated;
revoke all on public.post_images from anon, authenticated;
revoke all on public.projects from anon, authenticated;
revoke all on public.project_images from anon, authenticated;
revoke all on public.pages from anon, authenticated;
revoke all on public.post_likes from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.posts to anon;
grant select on public.post_images to anon;
grant select on public.projects to anon;
grant select on public.project_images to anon;
grant select on public.pages to anon;
-- Note there is deliberately no write grant on `pages` for anon. The counter is
-- incremented through bump_page_view() below, which is the only path in.
grant select on public.posts to authenticated;
grant select on public.post_images to authenticated;
grant select on public.projects to authenticated;
grant select on public.project_images to authenticated;
grant select on public.pages to authenticated;

drop policy if exists "Anyone can read published posts" on public.posts;
create policy "Anyone can read published posts"
  on public.posts
  for select
  to anon
  using (published_at <= now());

drop policy if exists "Anyone can read images of published posts" on public.post_images;
create policy "Anyone can read images of published posts"
  on public.post_images
  for select
  to anon
  using (exists (select 1 from public.posts where posts.id = post_images.post_id));

drop policy if exists "Anyone can read published projects" on public.projects;
create policy "Anyone can read published projects"
  on public.projects
  for select
  to anon
  using (published_at <= now());

drop policy if exists "Anyone can read images of published projects" on public.project_images;
create policy "Anyone can read images of published projects"
  on public.project_images
  for select
  to anon
  using (exists (select 1 from public.projects where projects.id = project_images.project_id));

drop policy if exists "Anyone can read page view counts" on public.pages;
create policy "Anyone can read page view counts"
  on public.pages
  for select
  to anon
  using (true);

-- The anon role has no INSERT or UPDATE policy on `pages` at all. Writes go
-- through bump_page_view() further down, which keeps the counter correct and
-- stops a visitor from setting an arbitrary view_count on an arbitrary slug.
--
-- These two drops exist so that re-running this file also removes the policies
-- an earlier version of this migration granted directly.
drop policy if exists "Anyone can create page view counts" on public.pages;
drop policy if exists "Anyone can bump page view counts" on public.pages;

-- The authenticated role is only used by the service key path, which bypasses RLS
-- entirely. These policies exist so a logged-in Supabase session is not silently
-- blind if you ever inspect the tables from the dashboard.
drop policy if exists "Admins can read all posts" on public.posts;
create policy "Admins can read all posts"
  on public.posts
  for select
  to authenticated
  using (true);

drop policy if exists "Admins can read all post images" on public.post_images;
create policy "Admins can read all post images"
  on public.post_images
  for select
  to authenticated
  using (true);

drop policy if exists "Admins can read all projects" on public.projects;
create policy "Admins can read all projects"
  on public.projects
  for select
  to authenticated
  using (true);

drop policy if exists "Admins can read all project images" on public.project_images;
create policy "Admins can read all project images"
  on public.project_images
  for select
  to authenticated
  using (true);

drop policy if exists "Admins can read all page view counts" on public.pages;
create policy "Admins can read all page view counts"
  on public.pages
  for select
  to authenticated
  using (true);

-- post_likes deliberately gets no policies. Anonymous clients cannot read or write
-- it directly; the two functions below are the only way in.

-- ---------------------------------------------------------------------------
-- Like toggle
-- ---------------------------------------------------------------------------

-- Flips the visitor's like on a post and returns the authoritative result.
-- Delete-then-insert makes a second call remove the like. The unique primary key
-- makes two simultaneous calls from the same visitor collapse into one.
create or replace function public.toggle_post_like(p_post_id uuid, p_visitor_id text)
returns table (liked boolean, like_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_liked boolean;
  v_count bigint;
begin
  if p_post_id is null or p_visitor_id is null or char_length(p_visitor_id) < 8 then
    raise exception 'invalid like request';
  end if;

  -- The post can be deleted while the reader has it open. Its images cascade, but
  -- the visitor may still click the heart, and the insert below would fail on the
  -- foreign key. Treat that as "nothing to like" instead of surfacing an error.
  if not exists (select 1 from public.posts where id = p_post_id) then
    return query select false, 0::bigint;
    return;
  end if;

  delete from public.post_likes
    where post_id = p_post_id and visitor_id = p_visitor_id
  returning true into v_liked;

  if v_liked is null then
    insert into public.post_likes (post_id, visitor_id)
      values (p_post_id, p_visitor_id)
      on conflict do nothing;
    v_liked := true;
  else
    v_liked := false;
  end if;

  select count(*) into v_count
    from public.post_likes
    where post_id = p_post_id;

  update public.posts
    set like_count = v_count
    where id = p_post_id;

  return query select v_liked, v_count;
end;
$$;

-- Reads the current state without changing it, so a reload keeps the filled heart.
create or replace function public.get_post_like_status(p_post_id uuid, p_visitor_id text)
returns table (liked boolean, like_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count bigint;
begin
  select coalesce(p.like_count, 0) into v_count
    from public.posts p
   where p.id = p_post_id;

  if not found then
    return query select false, 0::bigint;
    return;
  end if;

  return query select exists (
    select 1 from public.post_likes l where l.post_id = p_post_id and l.visitor_id = p_visitor_id
  ), v_count;
end;
$$;

revoke all on function public.toggle_post_like(uuid, text) from public;
revoke all on function public.get_post_like_status(uuid, text) from public;
grant execute on function public.toggle_post_like(uuid, text) to anon, authenticated;
grant execute on function public.get_post_like_status(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- View counter
-- ---------------------------------------------------------------------------

-- Increments the counter for a slug and returns the new total.
--
-- This replaced a browser-side read-then-upsert. Two reasons: an upsert has to
-- send `id` in its insert column list, and a column-scoped INSERT grant that
-- omits `id` makes Postgres reject the whole statement, so the second visitor to
-- a page could never be counted. Doing the increment server-side also closes the
-- read-modify-write race between concurrent visitors and means the anon key
-- cannot set a counter to an arbitrary value.
create or replace function public.bump_page_view(p_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_slug is null or char_length(p_slug) > 200 then
    raise exception 'invalid page slug';
  end if;

  insert into public.pages as p (slug, view_count, view_count_updated_at)
    values (p_slug, 1, now())
    on conflict (slug) do update
      set view_count = p.view_count + 1,
          view_count_updated_at = now()
    returning view_count into v_count;

  return v_count;
end;
$$;

revoke all on function public.bump_page_view(text) from public;
grant execute on function public.bump_page_view(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
--
-- Create a PUBLIC bucket named "portfolio" in Supabase → Storage → New bucket.
-- Then run the statements below. Reads are public so that cached HTML keeps
-- working; writes are only possible with the service role key.

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read portfolio media" on storage.objects;
create policy "Anyone can read portfolio media"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'portfolio');

drop policy if exists "Anyone can read portfolio media (authenticated)" on storage.objects;
create policy "Anyone can read portfolio media (authenticated)"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'portfolio');

-- No insert/update/delete policies: uploads go through the service role key only.