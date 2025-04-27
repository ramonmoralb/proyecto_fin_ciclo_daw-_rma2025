#!/bin/bash

# Script para importar la base de datos si existe un dump

if [ -f "./mysql-dump/db.sql" ]; then
  echo "Importando base de datos desde db.sql..."
  docker-compose up -d db
  sleep 10
  docker exec -i mysql_db mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < ./mysql-dump/db.sql
  echo "Base de datos importada."
else
  echo "No se encontró db.sql, se usará una base vacía."
fi