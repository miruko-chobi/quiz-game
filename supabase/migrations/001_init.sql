-- rooms table
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'waiting',
  current_question int not null default 0,
  created_at timestamp with time zone default now()
);

-- players table
create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade not null,
  nickname text not null,
  is_gm boolean not null default false,
  score int not null default 0,
  created_at timestamp with time zone default now()
);

-- answers table
create table answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  question_index int not null,
  selected_choice int not null,
  is_correct boolean not null,
  created_at timestamp with time zone default now(),
  unique(player_id, question_index)
);

-- Enable Row Level Security (open for now, lock down for production)
alter table rooms enable row level security;
alter table players enable row level security;
alter table answers enable row level security;

create policy "Allow all on rooms" on rooms for all using (true) with check (true);
create policy "Allow all on players" on players for all using (true) with check (true);
create policy "Allow all on answers" on answers for all using (true) with check (true);

-- Enable realtime
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table answers;
