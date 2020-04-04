SELECT
	query_table.date,
	query_table.id AS status_id,
	query_table.display_name AS STATUS,
	query_table.short_name AS short_status
	
FROM (

	SELECT
		schedule_table.date,
		schedule_table.establishment_id,
		schedule_table.sport_id,
		schedule_table.schedules_amount,
		available_vacancies.total_vacancies,
		establishment_status_table.id,
		establishment_status_table.display_name,
		establishment_status_table.short_name
	FROM (
	
		SELECT
			DATE_FORMAT(s.date, "%Y-%m-%d") AS date,
			b.establishment_id,
			b.sport_id,
			COUNT(*) AS schedules_amount
		FROM schedules s
		INNER JOIN batteries AS b 
			ON b.id = s.battery_id
		INNER JOIN battery_weekdays AS bw 
			ON bw.battery_id = b.id
		INNER JOIN weekday AS w 
			ON w.id = bw.weekday_id
		WHERE
			b.establishment_id = 25
			AND b.sport_id = 1
			AND s.status_id NOT IN (2)
			AND b.address_id = 16
			AND b.deleted = false
			AND w.day = LOWER(DATE_FORMAT(s.date, "%W"))
		GROUP BY 
			s.date, 
			b.establishment_id
	
	) AS schedule_table
	INNER JOIN 
	(
	
		SELECT
			b1.establishment_id,
			b1.sport_id,
			w1.day,
			SUM(b1.people_allowed) AS total_vacancies
		FROM batteries AS b1
		INNER JOIN battery_weekdays bw1 
			ON bw1.battery_id = b1.id
		INNER JOIN weekday w1 
			ON w1.id = bw1.weekday_id
		WHERE
			b1.deleted = FALSE
			AND b1.establishment_id = 25
			AND b1.sport_id = 1
			AND b1.address_id = 16
		GROUP BY w1.day
	
	) AS available_vacancies
		ON available_vacancies.day = LOWER(DATE_FORMAT(schedule_table.date, "%W"))
		
	INNER JOIN (
	
		SELECT
			id,
			display_name,
			short_name
		FROM establishment_status
		
	) AS establishment_status_table 
	ON establishment_status_table.id = IF (schedule_table.schedules_amount >= available_vacancies.total_vacancies, 4, 5)

) AS query_table

ORDER BY query_table.date