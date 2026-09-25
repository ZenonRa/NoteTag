-- 1. Список зарегистрированных пользователей без password_hash.
SELECT
  id,
  login,
  role,
  created_at AS "createdAt"
FROM users
ORDER BY created_at DESC, id DESC;

-- 2. Заметки demo_andrey вместе со всеми прикреплёнными тегами.
SELECT
  n.id,
  n.content,
  n.created_at AS "createdAt",
  n.updated_at AS "updatedAt",
  COALESCE(
    jsonb_agg(
      jsonb_build_object('id', t.id, 'name', t.name)
      ORDER BY t.name
    ) FILTER (WHERE t.id IS NOT NULL),
    '[]'::jsonb
  ) AS tags
FROM notes AS n
INNER JOIN users AS u ON u.id = n.user_id
LEFT JOIN note_tags AS nt ON nt.note_id = n.id
LEFT JOIN tags AS t ON t.id = nt.tag_id
WHERE u.login = 'demo_andrey'
GROUP BY n.id
ORDER BY n.created_at DESC, n.id DESC;

-- 3. Общая статистика системы для административного экрана.
SELECT
  COUNT(DISTINCT u.id)::integer AS "usersCount",
  COUNT(DISTINCT n.id)::integer AS "notesCount",
  COUNT(DISTINCT t.id)::integer AS "tagsCount"
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
LEFT JOIN tags AS t ON t.user_id = u.id;
