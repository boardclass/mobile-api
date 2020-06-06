SET autocommit = 0;
SET FOREIGN_KEY_CHECKS=0;

# Dump database
START TRANSACTION;

# Batteries
DELETE FROM battery_weekdays;
DELETE FROM batteries;

# Establishments
DELETE FROM establishment_addresses;
DELETE FROM establishment_accounts;
DELETE FROM establishment_employees;
DELETE FROM establishments_indication;
DELETE FROM establishments_status;
DELETE FROM establishments;

# Schedules
DELETE FROM schedules;
DELETE FROM schedules_history;

# Users
DELETE FROM user_addresses;
DELETE FROM user_accounts;
DELETE FROM users_roles;
DELETE FROM users;

COMMIT;