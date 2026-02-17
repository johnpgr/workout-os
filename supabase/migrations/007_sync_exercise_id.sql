-- Recreate sync functions to include exercise_id in exercise set payloads

create or replace function sync_push(payload jsonb)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_now timestamptz := timezone('utc', now());
  rec jsonb;
  v_id text;

  synced_sessions text[] := '{}';
  synced_exercise_sets text[] := '{}';
  synced_readiness_logs text[] := '{}';
  synced_weight_logs text[] := '{}';
  synced_recommendations text[] := '{}';
  synced_app_settings text[] := '{}';
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  for rec in
    select value from jsonb_array_elements(coalesce(payload->'sessions', '[]'::jsonb))
  loop
    v_id := null;

    insert into training_sessions (
      id, owner_user_id, created_at, updated_at, deleted_at, version, server_updated_at,
      date, split_type, workout_type, workout_label, duration_min, notes
    )
    values (
      rec->>'id',
      auth.uid(),
      (rec->>'createdAt')::timestamptz,
      (rec->>'updatedAt')::timestamptz,
      nullif(rec->>'deletedAt', '')::timestamptz,
      (rec->>'version')::integer,
      v_now,
      (rec->>'date')::date,
      rec->>'splitType',
      rec->>'workoutType',
      rec->>'workoutLabel',
      (rec->>'durationMin')::integer,
      coalesce(rec->>'notes', '')
    )
    on conflict (id) do update
      set
        owner_user_id = auth.uid(),
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        version = excluded.version,
        server_updated_at = v_now,
        date = excluded.date,
        split_type = excluded.split_type,
        workout_type = excluded.workout_type,
        workout_label = excluded.workout_label,
        duration_min = excluded.duration_min,
        notes = excluded.notes
    where excluded.version > training_sessions.version
      or (
        excluded.version = training_sessions.version
        and excluded.updated_at > training_sessions.updated_at
      )
    returning id into v_id;

    if v_id is not null then
      synced_sessions := array_append(synced_sessions, v_id);
    end if;
  end loop;

  for rec in
    select value from jsonb_array_elements(coalesce(payload->'exerciseSets', '[]'::jsonb))
  loop
    v_id := null;

    insert into exercise_set_logs (
      id, owner_user_id, created_at, updated_at, deleted_at, version, server_updated_at,
      session_id, date, split_type, workout_type, exercise_id, exercise_name, exercise_order,
      set_order, weight_kg, reps, rpe, rir, technique
    )
    values (
      rec->>'id',
      auth.uid(),
      (rec->>'createdAt')::timestamptz,
      (rec->>'updatedAt')::timestamptz,
      nullif(rec->>'deletedAt', '')::timestamptz,
      (rec->>'version')::integer,
      v_now,
      rec->>'sessionId',
      (rec->>'date')::date,
      rec->>'splitType',
      rec->>'workoutType',
      nullif(rec->>'exerciseId', ''),
      rec->>'exerciseName',
      (rec->>'exerciseOrder')::integer,
      (rec->>'setOrder')::integer,
      (rec->>'weightKg')::numeric,
      (rec->>'reps')::integer,
      nullif(rec->>'rpe', '')::numeric,
      nullif(rec->>'rir', '')::numeric,
      nullif(rec->>'technique', '')
    )
    on conflict (id) do update
      set
        owner_user_id = auth.uid(),
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        version = excluded.version,
        server_updated_at = v_now,
        session_id = excluded.session_id,
        date = excluded.date,
        split_type = excluded.split_type,
        workout_type = excluded.workout_type,
        exercise_id = excluded.exercise_id,
        exercise_name = excluded.exercise_name,
        exercise_order = excluded.exercise_order,
        set_order = excluded.set_order,
        weight_kg = excluded.weight_kg,
        reps = excluded.reps,
        rpe = excluded.rpe,
        rir = excluded.rir,
        technique = excluded.technique
    where excluded.version > exercise_set_logs.version
      or (
        excluded.version = exercise_set_logs.version
        and excluded.updated_at > exercise_set_logs.updated_at
      )
    returning id into v_id;

    if v_id is not null then
      synced_exercise_sets := array_append(synced_exercise_sets, v_id);
    end if;
  end loop;

  for rec in
    select value from jsonb_array_elements(coalesce(payload->'readinessLogs', '[]'::jsonb))
  loop
    v_id := null;

    insert into readiness_logs (
      id, owner_user_id, created_at, updated_at, deleted_at, version, server_updated_at,
      date, sleep_hours, sleep_quality, stress, pain, readiness_score, notes
    )
    values (
      rec->>'id',
      auth.uid(),
      (rec->>'createdAt')::timestamptz,
      (rec->>'updatedAt')::timestamptz,
      nullif(rec->>'deletedAt', '')::timestamptz,
      (rec->>'version')::integer,
      v_now,
      (rec->>'date')::date,
      (rec->>'sleepHours')::numeric,
      (rec->>'sleepQuality')::integer,
      (rec->>'stress')::integer,
      (rec->>'pain')::integer,
      (rec->>'readinessScore')::integer,
      coalesce(rec->>'notes', '')
    )
    on conflict (id) do update
      set
        owner_user_id = auth.uid(),
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        version = excluded.version,
        server_updated_at = v_now,
        date = excluded.date,
        sleep_hours = excluded.sleep_hours,
        sleep_quality = excluded.sleep_quality,
        stress = excluded.stress,
        pain = excluded.pain,
        readiness_score = excluded.readiness_score,
        notes = excluded.notes
    where excluded.version > readiness_logs.version
      or (
        excluded.version = readiness_logs.version
        and excluded.updated_at > readiness_logs.updated_at
      )
    returning id into v_id;

    if v_id is not null then
      synced_readiness_logs := array_append(synced_readiness_logs, v_id);
    end if;
  end loop;

  for rec in
    select value from jsonb_array_elements(coalesce(payload->'weightLogs', '[]'::jsonb))
  loop
    v_id := null;

    insert into weight_logs (
      id, owner_user_id, created_at, updated_at, deleted_at, version, server_updated_at,
      date, weight_kg, notes
    )
    values (
      rec->>'id',
      auth.uid(),
      (rec->>'createdAt')::timestamptz,
      (rec->>'updatedAt')::timestamptz,
      nullif(rec->>'deletedAt', '')::timestamptz,
      (rec->>'version')::integer,
      v_now,
      (rec->>'date')::date,
      (rec->>'weightKg')::numeric,
      coalesce(rec->>'notes', '')
    )
    on conflict (id) do update
      set
        owner_user_id = auth.uid(),
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        version = excluded.version,
        server_updated_at = v_now,
        date = excluded.date,
        weight_kg = excluded.weight_kg,
        notes = excluded.notes
    where excluded.version > weight_logs.version
      or (
        excluded.version = weight_logs.version
        and excluded.updated_at > weight_logs.updated_at
      )
    returning id into v_id;

    if v_id is not null then
      synced_weight_logs := array_append(synced_weight_logs, v_id);
    end if;
  end loop;

  for rec in
    select value from jsonb_array_elements(coalesce(payload->'recommendations', '[]'::jsonb))
  loop
    v_id := null;

    insert into recommendations (
      id, owner_user_id, created_at, updated_at, deleted_at, version, server_updated_at,
      date, split_type, workout_type, kind, status, message, reason
    )
    values (
      rec->>'id',
      auth.uid(),
      (rec->>'createdAt')::timestamptz,
      (rec->>'updatedAt')::timestamptz,
      nullif(rec->>'deletedAt', '')::timestamptz,
      (rec->>'version')::integer,
      v_now,
      (rec->>'date')::date,
      nullif(rec->>'splitType', ''),
      nullif(rec->>'workoutType', ''),
      rec->>'kind',
      rec->>'status',
      rec->>'message',
      rec->>'reason'
    )
    on conflict (id) do update
      set
        owner_user_id = auth.uid(),
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        version = excluded.version,
        server_updated_at = v_now,
        date = excluded.date,
        split_type = excluded.split_type,
        workout_type = excluded.workout_type,
        kind = excluded.kind,
        status = excluded.status,
        message = excluded.message,
        reason = excluded.reason
    where excluded.version > recommendations.version
      or (
        excluded.version = recommendations.version
        and excluded.updated_at > recommendations.updated_at
      )
    returning id into v_id;

    if v_id is not null then
      synced_recommendations := array_append(synced_recommendations, v_id);
    end if;
  end loop;

  for rec in
    select value from jsonb_array_elements(coalesce(payload->'appSettings', '[]'::jsonb))
  loop
    v_id := null;

    insert into app_settings (
      id, owner_user_id, created_at, updated_at, deleted_at, version, server_updated_at,
      key, value
    )
    values (
      rec->>'id',
      auth.uid(),
      (rec->>'createdAt')::timestamptz,
      (rec->>'updatedAt')::timestamptz,
      nullif(rec->>'deletedAt', '')::timestamptz,
      (rec->>'version')::integer,
      v_now,
      rec->>'key',
      coalesce(rec->>'value', '')
    )
    on conflict (owner_user_id, key) do update
      set
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        version = excluded.version,
        server_updated_at = v_now,
        value = excluded.value
    where excluded.version > app_settings.version
      or (
        excluded.version = app_settings.version
        and excluded.updated_at > app_settings.updated_at
      )
    returning id into v_id;

    if v_id is not null then
      synced_app_settings := array_append(synced_app_settings, v_id);
    end if;
  end loop;

  return jsonb_build_object(
    'server_time', v_now,
    'pushed_counts', jsonb_build_object(
      'sessions', cardinality(synced_sessions),
      'exercise_sets', cardinality(synced_exercise_sets),
      'readiness_logs', cardinality(synced_readiness_logs),
      'weight_logs', cardinality(synced_weight_logs),
      'recommendations', cardinality(synced_recommendations),
      'app_settings', cardinality(synced_app_settings)
    ),
    'synced_ids', jsonb_build_object(
      'sessions', to_jsonb(synced_sessions),
      'exercise_sets', to_jsonb(synced_exercise_sets),
      'readiness_logs', to_jsonb(synced_readiness_logs),
      'weight_logs', to_jsonb(synced_weight_logs),
      'recommendations', to_jsonb(synced_recommendations),
      'app_settings', to_jsonb(synced_app_settings)
    )
  );
end;
$$;

create or replace function sync_pull(since_server_time timestamptz)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_since timestamptz := coalesce(since_server_time, '1970-01-01T00:00:00Z'::timestamptz);
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  return jsonb_build_object(
    'sessions', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'ownerUserId', owner_user_id,
            'createdAt', created_at,
            'updatedAt', updated_at,
            'deletedAt', deleted_at,
            'version', version,
            'serverUpdatedAt', server_updated_at,
            'isDirty', false,
            'lastSyncedAt', server_updated_at,
            'date', date,
            'splitType', split_type,
            'workoutType', workout_type,
            'workoutLabel', workout_label,
            'durationMin', duration_min,
            'notes', notes
          )
        )
        from training_sessions
        where owner_user_id = auth.uid()
          and server_updated_at > v_since
      ),
      '[]'::jsonb
    ),
    'exercise_sets', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'ownerUserId', owner_user_id,
            'createdAt', created_at,
            'updatedAt', updated_at,
            'deletedAt', deleted_at,
            'version', version,
            'serverUpdatedAt', server_updated_at,
            'isDirty', false,
            'lastSyncedAt', server_updated_at,
            'sessionId', session_id,
            'date', date,
            'splitType', split_type,
            'workoutType', workout_type,
            'exerciseId', exercise_id,
            'exerciseName', exercise_name,
            'exerciseOrder', exercise_order,
            'setOrder', set_order,
            'weightKg', weight_kg,
            'reps', reps,
            'rpe', rpe,
            'rir', rir,
            'technique', technique
          )
        )
        from exercise_set_logs
        where owner_user_id = auth.uid()
          and server_updated_at > v_since
      ),
      '[]'::jsonb
    ),
    'readiness_logs', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'ownerUserId', owner_user_id,
            'createdAt', created_at,
            'updatedAt', updated_at,
            'deletedAt', deleted_at,
            'version', version,
            'serverUpdatedAt', server_updated_at,
            'isDirty', false,
            'lastSyncedAt', server_updated_at,
            'date', date,
            'sleepHours', sleep_hours,
            'sleepQuality', sleep_quality,
            'stress', stress,
            'pain', pain,
            'readinessScore', readiness_score,
            'notes', notes
          )
        )
        from readiness_logs
        where owner_user_id = auth.uid()
          and server_updated_at > v_since
      ),
      '[]'::jsonb
    ),
    'weight_logs', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'ownerUserId', owner_user_id,
            'createdAt', created_at,
            'updatedAt', updated_at,
            'deletedAt', deleted_at,
            'version', version,
            'serverUpdatedAt', server_updated_at,
            'isDirty', false,
            'lastSyncedAt', server_updated_at,
            'date', date,
            'weightKg', weight_kg,
            'notes', notes
          )
        )
        from weight_logs
        where owner_user_id = auth.uid()
          and server_updated_at > v_since
      ),
      '[]'::jsonb
    ),
    'recommendations', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'ownerUserId', owner_user_id,
            'createdAt', created_at,
            'updatedAt', updated_at,
            'deletedAt', deleted_at,
            'version', version,
            'serverUpdatedAt', server_updated_at,
            'isDirty', false,
            'lastSyncedAt', server_updated_at,
            'date', date,
            'splitType', split_type,
            'workoutType', workout_type,
            'kind', kind,
            'status', status,
            'message', message,
            'reason', reason
          )
        )
        from recommendations
        where owner_user_id = auth.uid()
          and server_updated_at > v_since
      ),
      '[]'::jsonb
    ),
    'app_settings', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'ownerUserId', owner_user_id,
            'createdAt', created_at,
            'updatedAt', updated_at,
            'deletedAt', deleted_at,
            'version', version,
            'serverUpdatedAt', server_updated_at,
            'isDirty', false,
            'lastSyncedAt', server_updated_at,
            'key', key,
            'value', value
          )
        )
        from app_settings
        where owner_user_id = auth.uid()
          and server_updated_at > v_since
      ),
      '[]'::jsonb
    ),
    'server_time', v_now
  );
end;
$$;
