#!/usr/bin/env bash

set -euo pipefail
umask 077

require_database_config() {
  : "${DB_HOST:?DB_HOST must be set in the environment.}"
  : "${DB_PORT:?DB_PORT must be set in the environment.}"
  : "${DB_USER:?DB_USER must be set in the environment.}"
  : "${DB_NAME:?DB_NAME must be set in the environment.}"
  if [[ ! "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
    printf 'DB_NAME may contain only letters, numbers and underscores.\n' >&2
    exit 1
  fi
}

require_database_config

root_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${root_dir}/backups"
mkdir -p -- "$backup_dir"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${backup_dir}/${DB_NAME}_${timestamp}.sql.gz"
if [[ -e "$backup_file" ]]; then
  printf 'Refusing to overwrite existing backup: %s\n' "$backup_file" >&2
  exit 1
fi

temporary_file="$(mktemp "${backup_file}.tmp.XXXXXX")"
cleanup() {
  rm -f -- "$temporary_file"
}
trap cleanup EXIT

printf 'Creating backup of %s on %s. MariaDB may prompt for the database password.\n' \
  "$DB_NAME" "$DB_HOST"
mariadb-dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip -c > "$temporary_file"

gzip -t -- "$temporary_file"
mv -- "$temporary_file" "$backup_file"
trap - EXIT
printf 'Backup created: %s\n' "$backup_file"
