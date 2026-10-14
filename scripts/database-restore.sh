#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 || ! -f "$1" ]]; then
  printf 'Usage: %s <backup.sql.gz>\n' "$0" >&2
  exit 2
fi

: "${DB_HOST:?DB_HOST must be set in the environment.}"
: "${DB_PORT:?DB_PORT must be set in the environment.}"
: "${DB_USER:?DB_USER must be set in the environment.}"
: "${DB_NAME:?DB_NAME must be set in the environment.}"
if [[ ! "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
  printf 'DB_NAME may contain only letters, numbers and underscores.\n' >&2
  exit 1
fi

backup_file="$1"
gzip -t -- "$backup_file"
printf 'Checking destination database %s on %s. MariaDB may prompt for the database password.\n' \
  "$DB_NAME" "$DB_HOST"
table_count="$(
  mariadb \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password \
    --database="$DB_NAME" \
    --batch \
    --skip-column-names \
    --execute="SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"
)"
if [[ ! "$table_count" =~ ^0+$ ]]; then
  printf 'Refusing restore: destination database must be empty (found %s tables/views).\n' \
    "$table_count" >&2
  exit 1
fi

if [[ ! -r /dev/tty ]]; then
  printf 'Restore requires an interactive terminal for explicit confirmation.\n' >&2
  exit 1
fi
printf 'This will restore %s into the empty database %s on %s.\n' \
  "$backup_file" "$DB_NAME" "$DB_HOST" > /dev/tty
printf 'Type the exact database name to continue: ' > /dev/tty
IFS= read -r confirmation < /dev/tty
if [[ "$confirmation" != "$DB_NAME" ]]; then
  printf 'Confirmation did not match; restore cancelled.\n' >&2
  exit 1
fi

printf 'Restoring trusted backup. MariaDB may prompt for the database password.\n'
gzip -dc -- "$backup_file" | mariadb \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password \
  --database="$DB_NAME"
printf 'Restore completed. Verify application data and media before using this database.\n'
