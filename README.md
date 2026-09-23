# NoteTag Backend

REST API учебного приложения для личных текстовых заметок и их организации с помощью тегов. Клиент работает только со своими заметками и тегами; администратор видит список пользователей и общую статистику.

## Стек

- Node.js, NestJS, TypeScript
- PostgreSQL, TypeORM и миграции
- JWT, Passport, bcrypt
- class-validator / class-transformer
- Swagger / OpenAPI
- Jest, Docker и Docker Compose

## Требования

- Node.js 20+
- npm 10+
- PostgreSQL 16+ для локального запуска либо Docker с Docker Compose

## Локальная установка

```bash
npm install
```

Скопируйте `.env.example` в `.env` и обязательно замените `JWT_SECRET`. Файл `.env` исключён из Git.

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

Контейнер backend ожидает готовности PostgreSQL, автоматически применяет миграции и запускается на `http://localhost:3000`.

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

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

## Миграции

```bash
npm run migration:run
npm run migration:revert
```

В конфигурации TypeORM установлено `synchronize: false`. Схема создаётся только миграцией: `users`, `notes`, `tags`, `note_tags`, включая уникальные ограничения, внешние ключи и `ON DELETE CASCADE`.
