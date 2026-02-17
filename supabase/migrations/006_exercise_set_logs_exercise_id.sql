alter table exercise_set_logs
  add column if not exists exercise_id text;

create index if not exists idx_exercise_set_logs_owner_exercise_id_server_updated
  on exercise_set_logs (owner_user_id, exercise_id, server_updated_at);
