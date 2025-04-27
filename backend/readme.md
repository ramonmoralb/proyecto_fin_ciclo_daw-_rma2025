# Proyecto WordPress con Docker entorno local

Este proyecto configura un entorno de desarrollo local para WordPress utilizando Docker, con MariaDB como base de datos y PHPMyAdmin para la gestión de la base de datos.

## Requisitos Previos

Asegúrate de tener instalado:
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Estructura del Proyecto

```
.
├── app/
│   └── wp-content/      # Contenido personalizado de WordPress
├── docker-compose.yml   # Configuración de servicios Docker
├── .env                 # Variables de entorno (crear a partir de .env.example)
├── init-db.sh           # Script de inicialización de la base de datos
└── mysql-dump/          # Directorio para backups de base de datos
    └── db.sql          # Archivo SQL para inicialización
```

## Configuración Inicial

1. Clona el repositorio:
```bash
git clone https://github.com/ramonmoralb/wordpress-docker-starter.git
cd wordpress-docker-starter
```

2. Crea un archivo `.env` en el directorio raíz con la siguiente configuración:
```env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=wordpress_db_name
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
WORDPRESS_DB_HOST=db:3306
WORDPRESS_DB_USER=your_db_user
WORDPRESS_DB_PASSWORD=your_db_password
WORDPRESS_DB_NAME=wordpress_db_name
```

## Servicios Disponibles

El proyecto incluye los siguientes servicios:

1. **WordPress**
   - URL: http://localhost:8000
   - Imagen: wordpress:latest
   - Volumen montado: ./app/wp-content

2. **Base de Datos MariaDB**
   - Contenedor: mysql_db
   - Volumen persistente para datos
   - Puerto: 3306
   - Inicialización mediante init-db.sh

3. **PHPMyAdmin**
   - URL: http://localhost:8080
   - Credenciales por defecto:
     - Servidor: db
     - Usuario: root
     - Contraseña: (la definida en MYSQL_ROOT_PASSWORD)

## Gestión de la Base de Datos

### Inicialización de la Base de Datos

El proyecto incluye un script de inicialización (`init-db.sh`) que se encarga de:

1. Verificar la existencia del archivo `mysql-dump/db.sql`
2. Iniciar el contenedor de la base de datos
3. Importar automáticamente el dump si existe

Para usar el script:

1. Copia tu archivo SQL en `mysql-dump/db.sql`
2. El script se ejecutará automáticamente al iniciar el contenedor
3. Si necesitas reiniciar la base de datos:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Backup y Restauración

Para hacer un backup de la base de datos:
```bash
docker exec mysql_db mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > backup.sql
```

Para restaurar desde un backup:
```bash
docker exec -i mysql_db mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < backup.sql
```

## Comandos Principales

### Iniciar el Entorno
```bash
docker-compose up -d
```

### Detener el Entorno
```bash
docker-compose down
```

### Ver Logs
```bash
docker-compose logs
```

### Acceder a los Contenedores

Acceso al contenedor de WordPress:
```bash
docker exec -it wordpress_app bash
```

Acceso al contenedor de MySQL:
```bash
docker exec -it mysql_db bash
```

## Gestión de Datos

### Persistencia
Los datos se mantienen en:
- Base de datos: Volumen `db_data`
- WordPress: Directorio `./app/wp-content`
- Scripts SQL: Directorio `./mysql-dump`

### Limpieza Total
Para eliminar todos los datos, incluyendo volúmenes:
```bash
docker-compose down -v
```

## Acceso a las Aplicaciones

- WordPress: http://localhost:8000
  - Panel de administración: http://localhost:8000/wp-admin

- PHPMyAdmin: http://localhost:8080
  - Servidor: db
  - Usuario: root
  - Contraseña: (la definida en MYSQL_ROOT_PASSWORD)

## Redes

El proyecto utiliza una red Docker dedicada llamada `wordpress_network` para la comunicación entre contenedores.

## Notas Importantes

1. Los cambios en wp-content persisten en el directorio local `./app/wp-content`
2. La base de datos se mantiene en un volumen Docker llamado `db_data`
3. El script `init-db.sh` se encarga de la inicialización de la base de datos
4. Asegúrate de no compartir las credenciales del archivo `.env` en control de versiones
5. Para importar una base de datos existente, copia tu dump.sql el archivo SQL en `mysql-dump/db.sql`
6. Cambia todas las contraseñas por defecto por razones de seguridad