#!/bin/bash

set -e

echo "=== Installing MariaDB ==="

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mariadb-server mariadb-client

echo "=== Starting MariaDB ==="

sudo service mariadb start

echo "=== Creating database and user ==="

sudo mariadb <<'SQL'
CREATE DATABASE IF NOT EXISTS digital_wardrobe;

CREATE USER IF NOT EXISTS 'digital_wardrobe_user'@'localhost'
IDENTIFIED BY 'DigitalWardrobe@123';

GRANT ALL PRIVILEGES ON digital_wardrobe.*
TO 'digital_wardrobe_user'@'localhost';

FLUSH PRIVILEGES;
SQL

echo "=== Importing database schema ==="

sudo mariadb digital_wardrobe < /workspaces/Digital-Wardrobe-Group/sql/digital_wardrobe.sql

echo "=== Database setup completed ==="