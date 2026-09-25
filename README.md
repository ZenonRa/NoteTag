# NoteTag

Полный учебный проект для создания личных текстовых заметок и их организации с помощью тегов. React-интерфейс работает с NestJS REST API; клиент видит только свои данные, а администратор — список пользователей и общую статистику.

## Стек

- React, Vite, React Router, Axios
- Node.js, NestJS, TypeScript
- PostgreSQL, TypeORM и миграции
- JWT, Passport, bcrypt
- class-validator / class-transformer
- Swagger / OpenAPI
- Vitest, V8 Coverage, Docker и Docker Compose

## Структура

- `frontend/` — React/Vite приложение;
- `src/` — NestJS backend;
- `sql/` — учебные SQL-запросы;
- `docker-compose.yml` — PostgreSQL, backend и frontend.

## Требования

- Node.js 22+
- npm 10+
- PostgreSQL 16+ для локального запуска либо Docker с Docker Compose

## Локальная установка

```bash
npm ci
npm run frontend:install
```

Скопируйте корневой `.env.example` в `.env`, `frontend/.env.example` в `frontend/.env` и обязательно замените `JWT_SECRET`. Оба `.env` исключены из Git.

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notetag
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

Создайте базу `notetag` в PostgreSQL. Можно поднять только PostgreSQL из Compose:

```bash
docker compose up -d postgres
```

Примените миграции и запустите backend:

```bash
npm run migration:run
npm run seed
npm run start:dev
```

Во втором терминале запустите frontend:

```bash
npm run frontend:start
```

Frontend будет доступен на `http://localhost:5173`, backend — на `http://localhost:3000`.

Команда `npm run seed` добавляет небольшую демонстрационную выборку и безопасна для повторного запуска:

- `demo_admin` — роль `admin`;
- `demo_andrey` и `demo_maria` — роль `client`;
- три заметки, три тега и четыре связи между ними.

Пароли задаются через `SEED_ADMIN_PASSWORD` и `SEED_CLIENT_PASSWORD`. Значения из `.env.example` предназначены только для локальной разработки. Seed не удаляет и не перезаписывает существующие данные.

Production-сборка и запуск:

```bash
npm run build
npm run migration:run:prod
npm run start:prod
```

## Запуск через Docker

```bash
docker compose up --build
```

Compose поднимает весь проект:

- frontend — `http://localhost:5173`;
- backend — `http://localhost:3000`;
- Swagger — `http://localhost:3000/api/docs`;
- PostgreSQL — порт `5432`.

Backend ожидает готовности PostgreSQL и автоматически применяет миграции. Frontend собирается в production-режиме и раздаётся через Nginx.

После запуска контейнеров демонстрационные данные можно добавить командой:

```bash
docker compose exec backend npm run seed:prod
```

## API и Swagger

Swagger UI доступен по адресу [http://localhost:3000/api/docs](http://localhost:3000/api/docs). Для защищённых endpoint'ов нажмите **Authorize** и вставьте JWT из `POST /auth/login`.

Реализованы 14 endpoint'ов:

- `POST /auth/register`, `POST /auth/login`
- `GET /notes`, `GET /notes/:id`, `POST /notes`, `PATCH /notes/:id`, `DELETE /notes/:id`
- `GET /tags`, `POST /tags`, `DELETE /tags/:id`
- `POST /notes/:noteId/tags/:tagId`, `DELETE /notes/:noteId/tags/:tagId`
- `GET /admin/users`, `GET /admin/stats`

Роль нового пользователя всегда `client`. Endpoint'а изменения роли намеренно нет. Для учебного окружения администратора следует создать напрямую в БД с bcrypt-хешем пароля и значением `role = 'admin'`.

## Проверки

Подробные команды запуска проекта и тестов собраны в
[`docs/КОМАНДЫ_ЗАПУСКА.md`](docs/КОМАНДЫ_ЗАПУСКА.md).

```bash
npm run lint
npm run build
npm run test
npm run test:cov
npm run test:e2e
npm run test:db
npm run test:all
npm run frontend:lint
npm run frontend:build
```

`npm test` запускает быстрые изолированные unit-тесты backend и проверки чистых
frontend-функций. `npm run test:cov` дополнительно строит отчёт покрытия и
проверяет минимальные пороги: 95% statements, 80% branches, 95% functions и
95% lines. HTTP e2e-тесты вынесены в `npm run test:e2e`, потому что они
поднимают локальный NestJS-сервер.

Интеграционная проверка ограничений PostgreSQL запускается отдельно. Сначала
примените миграцию к изолированной тестовой базе, затем задайте при необходимости
переменные `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USERNAME`,
`TEST_DB_PASSWORD`, `TEST_DB_DATABASE` и выполните `npm run test:db`. По
умолчанию тест ожидает локальную базу `notetag_acceptance` и выполняет каждый
сценарий в транзакции с откатом.

## Миграции

```bash
npm run migration:run
npm run migration:revert
```

В конфигурации TypeORM установлено `synchronize: false`. Схема создаётся только миграцией: `users`, `notes`, `tags`, `note_tags`, включая уникальные ограничения, внешние ключи и `ON DELETE CASCADE`.

## Учебные SELECT-запросы

В файле `sql/select-queries.sql` находятся три самостоятельных запроса:

1. список пользователей без хешей паролей;
2. заметки демонстрационного пользователя вместе с тегами;
3. общая статистика количества пользователей, заметок и тегов.

После применения миграции и seed их можно выполнить локально через PostgreSQL:

```bash
psql -U postgres -d notetag -f sql/select-queries.sql
```

Из PowerShell при запущенном Docker Compose:

```powershell
Get-Content sql/select-queries.sql | docker compose exec -T postgres psql -U postgres -d notetag
```
