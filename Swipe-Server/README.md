# Swipe-Server

Backend для приложения "Свайп": аккаунты, поиск людей, контакты, сообщения с мгновенной доставкой (Socket.io), реакции на сообщения и заготовка сигналинга под будущие аудио/видео звонки (WebRTC).

Стек: Node.js + Express + MongoDB (Atlas) + Socket.io + JWT-авторизация.

Хостинг: **Zeabur** — зарубежная платформа, не заблокирована в России, деплой из GitHub без банковской карты (бесплатные $5/мес в виде кредитов на использование).

---

## Шаг 1. База данных (MongoDB Atlas)

Уже настроена в прошлый раз — ничего менять не нужно, база остаётся той же. Просто убедитесь, что строка подключения (`MONGODB_URI`) у вас сохранена — она понадобится в шаге 3.

## Шаг 2. Выложить код на GitHub

Если репозиторий `swipe-server` уже есть — обновите в нём файлы (перетащите новые через "Add file" → "Upload files", подтвердите замену старых). Если создаёте заново — как раньше: New repository → перетащить все файлы и папки из этого архива (`Swipe-Server`) прямо в корень репозитория.

**Важно:** файлы должны лежать прямо в корне репозитория (`package.json`, `server.js`, `src/...`), а не во вложенной папке.

## Шаг 3. Развернуть на Zeabur

1. Зайдите на **zeabur.com** → **Sign in with GitHub** (проще всего войти через GitHub-аккаунт).
2. Нажмите **New Project** → в открывшемся окне "What do you want to deploy?" выберите **GitHub** (Deploy from GitHub repo).
3. Если репозиторий `swipe-server` не появился в списке — нажмите "Configure GitHub App" и разрешите Zeabur доступ к нему.
4. Выберите репозиторий `swipe-server` → Zeabur сам определит, что это Node.js-проект, и начнёт сборку.
5. Откройте созданный сервис → вкладка **Variables** → добавьте:
   - `MONGODB_URI` = ваша строка подключения к MongoDB Atlas
   - `JWT_SECRET` = та же случайная строка, что использовалась раньше (или новая длинная случайная строка)
6. Во вкладке **Networking** (или "Domains") сгенерируйте бесплатный домен — будет что-то вроде:
   ```
   https://swipe-server.zeabur.app
   ```
7. Откройте этот адрес в браузере — должно показать `{"status":"ok","service":"swipe-server"}`.

Каждый пуш в GitHub будет автоматически передеплоивать сервис.

## Шаг 4. Передать мне новый адрес сервера

Пришлите новую ссылку (вида `https://....zeabur.app`) — обновлю адрес в приложении и пересоберу архив.

---

## Структура API (для справки)

- `POST /api/auth/register` — `{ login, password, phone?, email?, avatarRes? }`
- `POST /api/auth/login` — `{ loginOrPhone, password }`
- `GET /api/users/me` — данные текущего пользователя (заголовок `Authorization: Bearer <token>`)
- `DELETE /api/users/me` — удалить аккаунт безвозвратно
- `GET /api/users/search?q=...` — поиск людей по логину/телефону
- `GET /api/users/:id` — публичный профиль по id
- `GET /api/contacts` — список контактов
- `POST /api/contacts` — `{ contactUserId }`
- `GET /api/messages` — список бесед с непрочитанными
- `GET /api/messages/:contactUserId` — история переписки
- `POST /api/messages` — `{ toUserId, text }`
- `POST /api/messages/:contactUserId/read` — отметить прочитанным
- `POST /api/messages/:messageId/react` — `{ emoji }` — поставить/снять реакцию

Socket.io: подключение с `auth: { token }`, события `message:new`, `message:reaction`. События `call:offer` / `call:answer` / `call:ice-candidate` / `call:end` — заготовка под будущие звонки.
