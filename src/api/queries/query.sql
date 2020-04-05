SELECT
    SUM(b.people_allowed) AS total
FROM batteries b
    INNER JOIN battery_weekdays bw
    ON bw.battery_id = b.id
    INNER JOIN weekday w
    ON w.id = bw.weekday_id
WHERE 
	b.establishment_id = 25
    AND w.day = LOWER(DATE_FORMAT('2020-03-18', "%W"))
    AND b.deleted = false
GROUP BY b.establishment_id