#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
BACKEND_ENV_FILE="${ROOT_DIR}/backend/.env"

read_env_value() {
	local requested_key="$1"

	if [[ ! -f "$ENV_FILE" ]]; then
		return 0
	fi

	awk -v requested_key="$requested_key" '
		BEGIN { single_quote = sprintf("%c", 39) }
		/^[[:space:]]*#/ { next }
		{
			separator = index($0, "=")
			if (!separator) next

			key = substr($0, 1, separator - 1)
			gsub(/^[[:space:]]+|[[:space:]]+$/, "", key)
			if (key != requested_key) next

			value = substr($0, separator + 1)
			sub(/\r$/, "", value)
			gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
			first = substr(value, 1, 1)
			last = substr(value, length(value), 1)
			if ((first == "\"" && last == "\"") || (first == single_quote && last == single_quote)) {
				value = substr(value, 2, length(value) - 2)
			}
			print value
			exit
		}
	' "$ENV_FILE"
}

if [[ ! -f "$ENV_FILE" ]]; then
	DB_HOST="${DB_HOST:-127.0.0.1}"
	DB_PORT="${DB_PORT:-3306}"
	DB_NAME="${DB_NAME:-digital_wardrobe}"
	DB_USER="${DB_USER:-dw_$(openssl rand -hex 8)}"
	DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 32)}"

	umask 077
	printf 'DB_HOST=%s\nDB_PORT=%s\nDB_USER=%s\nDB_PASSWORD=%s\nDB_NAME=%s\nDB_SSL=false\n' \
		"$DB_HOST" "$DB_PORT" "$DB_USER" "$DB_PASSWORD" "$DB_NAME" > "$ENV_FILE"
else
	DB_HOST="$(read_env_value DB_HOST)"
	DB_PORT="$(read_env_value DB_PORT)"
	DB_USER="$(read_env_value DB_USER)"
	DB_PASSWORD="$(read_env_value DB_PASSWORD)"
	DB_NAME="$(read_env_value DB_NAME)"
fi

chmod 600 "$ENV_FILE"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-digital_wardrobe}"

if [[ -z "$DB_USER" || -z "$DB_PASSWORD" || -z "$DB_NAME" ]]; then
	printf 'Set DB_USER, DB_PASSWORD and DB_NAME in the ignored .env file before database setup.\n' >&2
	exit 1
fi

if [[ ! "$DB_USER" =~ ^[A-Za-z0-9_]+$ || ! "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
	printf 'DB_USER and DB_NAME may contain only letters, numbers and underscores.\n' >&2
	exit 1
fi

if [[ ! "$DB_PORT" =~ ^[0-9]+$ ]]; then
	printf 'DB_PORT must be a numeric TCP port.\n' >&2
	exit 1
fi

if [[ "$DB_USER" == "replace_with_local_user" || "$DB_PASSWORD" == "replace_with_a_unique_local_password" ]]; then
	printf 'Replace the placeholder values in .env before database setup.\n' >&2
	exit 1
fi

if [[ ! -f "$BACKEND_ENV_FILE" ]]; then
	JWT_SECRET="$(openssl rand -base64 48)"
	umask 077
	printf 'DB_HOST=%s\nDB_PORT=%s\nDB_USER=%s\nDB_PASSWORD=%s\nDB_NAME=%s\nPORT=3000\nJWT_SECRET=%s\n' \
		"$DB_HOST" "$DB_PORT" "$DB_USER" "$DB_PASSWORD" "$DB_NAME" "$JWT_SECRET" > "$BACKEND_ENV_FILE"
	unset JWT_SECRET
fi
chmod 600 "$BACKEND_ENV_FILE"

sql_quote() {
	local value="$1"
	value="${value//\\/\\\\}"
	value="${value//\'/\'\'}"
	printf "'%s'" "$value"
}

DB_NAME_SQL="\`${DB_NAME}\`"
DB_USER_SQL="$(sql_quote "$DB_USER")"
DB_PASSWORD_SQL="$(sql_quote "$DB_PASSWORD")"

echo "=== Installing MariaDB ==="
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mariadb-server mariadb-client

echo "=== Starting MariaDB ==="
sudo service mariadb start

echo "=== Configuring local database access ==="
sudo mariadb <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME_SQL};
CREATE USER IF NOT EXISTS ${DB_USER_SQL}@'localhost' IDENTIFIED BY ${DB_PASSWORD_SQL};
ALTER USER ${DB_USER_SQL}@'localhost' IDENTIFIED BY ${DB_PASSWORD_SQL};
GRANT ALL PRIVILEGES ON ${DB_NAME_SQL}.* TO ${DB_USER_SQL}@'localhost';
FLUSH PRIVILEGES;
SQL

if sudo mariadb "$DB_NAME" --batch --skip-column-names -e "SHOW TABLES LIKE 'users';" | grep -qx 'users'; then
	echo "=== Existing schema detected ==="
	CASCADE_COUNT="$(sudo mariadb "$DB_NAME" --batch --skip-column-names -e "
		SELECT COUNT(*)
		FROM information_schema.REFERENTIAL_CONSTRAINTS
		WHERE CONSTRAINT_SCHEMA = DATABASE()
			AND DELETE_RULE = 'CASCADE'
			AND CONSTRAINT_NAME IN (
				'fk_clothing_user',
				'fk_outfits_user',
				'fk_outfit_items_outfit',
				'fk_outfit_items_clothing'
			);")"
	if [[ "$CASCADE_COUNT" == "0" ]]; then
		echo "=== Adding foreign-key cascades and categories ==="
		sudo mariadb "$DB_NAME" < "${ROOT_DIR}/sql/migrations/20261014_add_delete_cascades.sql"
	elif [[ "$CASCADE_COUNT" != "4" ]]; then
		printf 'The database has a partial cascade migration. Back it up and inspect its foreign keys before continuing.\n' >&2
		exit 1
	fi
	ROLE_COLUMN_COUNT="$(sudo mariadb "$DB_NAME" --batch --skip-column-names -e "
		SELECT COUNT(*)
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = 'users'
			AND COLUMN_NAME = 'role';")"
	SESSION_TABLE_COUNT="$(sudo mariadb "$DB_NAME" --batch --skip-column-names -e "
		SELECT COUNT(*)
		FROM information_schema.TABLES
		WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = 'sessions';")"
	if [[ "$ROLE_COLUMN_COUNT" == "0" && "$SESSION_TABLE_COUNT" == "0" ]]; then
		echo "=== Adding roles and revocable sessions ==="
		sudo mariadb "$DB_NAME" < "${ROOT_DIR}/sql/migrations/20261014_add_sessions_and_roles.sql"
	elif [[ "$ROLE_COLUMN_COUNT" != "1" || "$SESSION_TABLE_COUNT" != "1" ]]; then
		printf 'The database has a partial roles/session migration. Back it up and inspect its schema before continuing.\n' >&2
		exit 1
	fi
	PASSWORD_RESET_TABLE_COUNT="$(sudo mariadb "$DB_NAME" --batch --skip-column-names -e "
		SELECT COUNT(*)
		FROM information_schema.TABLES
		WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = 'password_reset_tokens';")"
	if [[ "$PASSWORD_RESET_TABLE_COUNT" == "0" ]]; then
		echo "=== Adding password reset tokens ==="
		sudo mariadb "$DB_NAME" < "${ROOT_DIR}/sql/migrations/20261014_add_password_reset_tokens.sql"
	fi
	CLOTHING_FILTER_COLUMN_COUNT="$(sudo mariadb "$DB_NAME" --batch --skip-column-names -e "
		SELECT COUNT(*)
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = 'clothing'
			AND COLUMN_NAME IN ('season', 'clothing_type');")"
	if [[ "$CLOTHING_FILTER_COLUMN_COUNT" == "0" ]]; then
		echo "=== Adding clothing season and type fields ==="
		sudo mariadb "$DB_NAME" < "${ROOT_DIR}/sql/migrations/20261014_add_clothing_filters.sql"
	elif [[ "$CLOTHING_FILTER_COLUMN_COUNT" != "2" ]]; then
		printf 'The database has a partial clothing filter migration. Back it up and inspect its columns before continuing.\n' >&2
		exit 1
	fi
	DRESSES_CATEGORY_COUNT="$(sudo mariadb "$DB_NAME" --batch --skip-column-names -e "
		SELECT COUNT(*)
		FROM categories
		WHERE LOWER(TRIM(name)) IN ('dress', 'dresses');")"
	if [[ "$DRESSES_CATEGORY_COUNT" == "0" ]]; then
		echo "=== Adding the Dresses category ==="
		sudo mariadb "$DB_NAME" < "${ROOT_DIR}/sql/migrations/20261014_add_dresses_category.sql"
	fi
	CARE_COLUMN_COUNT="$(sudo mariadb "$DB_NAME" --batch --skip-column-names -e "
		SELECT COUNT(*)
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = 'clothing'
			AND COLUMN_NAME IN ('care_instructions', 'last_washed_at', 'wash_after_wears');")"
	ACTIVITY_TABLE_COUNT="$(sudo mariadb "$DB_NAME" --batch --skip-column-names -e "
		SELECT COUNT(*)
		FROM information_schema.TABLES
		WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME IN ('wear_logs', 'wear_log_items', 'outfit_plans');")"
	if [[ "$CARE_COLUMN_COUNT" == "0" && "$ACTIVITY_TABLE_COUNT" == "0" ]]; then
		echo "=== Adding clothing care, wear logs and outfit calendar ==="
		sudo mariadb "$DB_NAME" < "${ROOT_DIR}/sql/migrations/20261014_add_wardrobe_activity.sql"
	elif [[ "$CARE_COLUMN_COUNT" != "3" || "$ACTIVITY_TABLE_COUNT" != "3" ]]; then
		printf 'The database has a partial wardrobe activity migration. Back it up and inspect its schema before continuing.\n' >&2
		exit 1
	fi
else
	echo "=== Importing database schema ==="
	sudo mariadb "$DB_NAME" < "${ROOT_DIR}/sql/digital_wardrobe.sql"
fi

unset DB_PASSWORD DB_PASSWORD_SQL
echo "=== Database setup completed ==="