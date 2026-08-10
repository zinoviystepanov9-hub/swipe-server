# Swipe-Server

Backend для приложения "Свайп": аккаунты, поиск людей, контакты, сообщения с мгновенной доставкой (Socket.io) и заготовка сигналинга под будущие аудио/видео звонки (WebRTC).

Стек: Node.js + Express + MongoDB (Atlas) + Socket.io + JWT-авторизация.

---

## Шаг 1. База данных (MongoDB Atlas)

1. На cloud.mongodb.com создайте бесплатный кластер (Cluster0, тариф Free) — это уже сделано, если вы дошли до этого README.
2. Слева: **Database & Network Access** → вкладка **Database Access** → **Add New Database User** → способ Password → задайте username и сгенерируйте пароль → **обязательно сохраните пароль**, он покажется один раз → роль **Read and write to any database** → Add User.
3. Там же, вкладка **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0) → Confirm.
4. Вернитесь на **Clusters** → **Connect** у Cluster0 → **Drivers** → Node.js → скопируйте строку вида:
   ```
   mongodb+srv://swipe_server:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Замените `<password>` на пароль из шага 2 и добавьте название базы перед `?`, например `.../swipe?retryWrites=true...`. Эта строка — значение для `MONGODB_URI`.

## Шаг 2. Выложить код на GitHub

1. На github.com создайте аккаунт, если его нет.
2. New repository → назовите, например, `swipe-server` → Create repository.
3. На странице пустого репозитория нажмите **uploading an existing file** и перетащите туда все файлы и папки из этой папки `Swipe-Server` (включая `src`, `package.json`, `.gitignore`; файл `.env` не нужен).
4. Commit changes.

## Шаг 3. Развернуть на Render

1. На render.com зарегистрируйтесь (лучше через GitHub).
2. New + → **Web Service** → выберите репозиторий `swipe-server`.
3. Настройки:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. В **Environment Variables** добавьте:
   - `MONGODB_URI` = строка подключения из Шага 1
   - `JWT_SECRET` = любая длинная случайная строка
5. **Create Web Service**. Когда статус станет **Live**, откройте показанный адрес в браузере — должно показать `{"status":"ok","service":"swipe-server"}`.

**Важно про бесплатный тариф Render:** после 15 минут без запросов сервер "засыпает", первый запрос после этого выполняется 30-60 секунд — это нормально.

## Шаг 4. Передать мне адрес сервера

Пришлите ссылку вида `https://swipe-server-xxxx.onrender.com` — подключу приложение к серверу.

---

## Структура API (для справки)

- `POST /api/auth/register` — `{ login, password, phone?, email?, avatarRes? }`
- `POST /api/auth/login` — `{ loginOrPhone, password }`
- `GET /api/users/me` — данные текущего пользователя (заголовок `Authorization: Bearer <token>`)
- `GET /api/users/search?q=...` — поиск людей по логину/телефону
- `GET /api/contacts` — список контактов
- `POST /api/contacts` — `{ contactUserId }`
- `GET /api/messages/:contactUserId` — история переписки
- `POST /api/messages` — `{ toUserId, text }`

Socket.io: подключение с `auth: { token }`, событие `message:new`. События `call:offer` / `call:answer` / `call:ice-candidate` / `call:end` — заготовка под будущие звонки.
