SELECT
    s.id AS schedule_id,
    s.created_at,
    ss.display_name AS status,
    s.battery_id,
    s.user_id,
    u.name AS user_name,
    s.date,
    e.id AS establishment_id,
    e.name AS establishment_name
FROM schedules s
    INNER JOIN batteries b ON b.id = s.battery_id
    INNER JOIN establishments e ON e.id = b.establishment_id
    INNER JOIN users u ON u.id = s.user_id
    INNER JOIN schedule_status ss ON ss.id = s.status_id
WHERE s.user_id = 24
ORDER BY date DESC, e.name, status