-- ADICIONAR EMAIL DO ESTABELECIMENTO
SET @EMAIL = 'jonathalimax@gmail.com';

SET autocommit = 0;
START TRANSACTION;

-- Quering and setting establishment id
SET @ESTABLISHMENT_ID = (
    SELECT e.id
    FROM establishments e
    INNER JOIN establishment_accounts ec
        ON ec.establishment_id = e.id
    WHERE
        ec.email = @EMAIL
);

-- Deleting schedule history
DELETE 
FROM schedules_history
WHERE schedule_id IN (
    SELECT s.id
    FROM schedules s
    INNER JOIN batteries b
        ON s.battery_id = b.id
    WHERE b.establishment_id = @ESTABLISHMENT_ID
);

-- Deleting schedule equipments
DELETE 
FROM schedule_equipments
WHERE schedule_id IN (
    SELECT s.id
    FROM schedules s
    INNER JOIN batteries b
        ON s.battery_id = b.id
    WHERE b.establishment_id = @ESTABLISHMENT_ID
);

-- Deleting schedules
DELETE 
FROM schedules
WHERE battery_id IN (
    SELECT id 
    FROM batteries b
    WHERE b.establishment_id = @ESTABLISHMENT_ID
);

-- Deleting battery equipments
DELETE 
FROM battery_equipments
WHERE battery_id IN (
    SELECT b.id
    FROM batteries b
    WHERE b.establishment_id = @ESTABLISHMENT_ID
);

-- Deleting battery weekdays
DELETE
FROM battery_weekdays
WHERE battery_id IN (
    SELECT b.id
    FROM batteries b
    WHERE b.establishment_id = @ESTABLISHMENT_ID
);

-- Deleting batteries
DELETE 
FROM batteries
WHERE establishment_id = @ESTABLISHMENT_ID;

-- Deleting from favorites
DELETE
FROM establishments_favorites
WHERE establishment_id = @ESTABLISHMENT_ID;

-- Deleting employess
DELETE 
FROM establishment_employees
WHERE establishment_id = @ESTABLISHMENT_ID;

-- Deleting indication code
DELETE 
FROM establishments_indication
WHERE establishment_id = @ESTABLISHMENT_ID;

-- Deleting addresses
DELETE 
FROM establishment_addresses
WHERE establishment_id = @ESTABLISHMENT_ID;

-- Deleting account
DELETE 
FROM establishment_accounts
WHERE establishment_id = @ESTABLISHMENT_ID;

-- Deleting status
DELETE 
FROM establishments_status
WHERE establishment_id = @ESTABLISHMENT_ID;

-- Deleting establishment
DELETE 
FROM establishments 
WHERE id = @ESTABLISHMENT_ID;

COMMIT;