FROM mysql:8.0

# el dump y el script al contenedor
COPY ./mysql-dump/db.sql /docker-entrypoint-initdb.d/db.sql
COPY init-db.sh /init-db.sh
RUN chmod +x /init-db.sh
