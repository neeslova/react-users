# Пользователи — ЛР №1

Лабораторная работа №1 по дисциплине «Разработка клиентских web-приложений».
Вариант 5 — предметная область **Users** (формат данных [dummyjson.com/docs/users](https://dummyjson.com/docs/users)).

Одностраничное приложение для просмотра и управления списком пользователей:

- карточки пользователей (20 русифицированных записей; аватар, имя, логин, возраст, роль, должность и компания, email, телефон, город);
- **добавление**, **редактирование** (модальное окно с формой и валидацией) и **удаление** (с подтверждением);
- поиск по имени, логину, email и компании (с задержкой — debounce);
- фильтр по роли с количеством пользователей во вкладках, сортировка по дате добавления, имени, возрасту;
- светлая/тёмная тема, сохранение данных в `localStorage`, сброс к исходным данным;
- адаптивная вёрстка (телефон / планшет / десктоп).

## Стек

React 19 · TypeScript · Vite · TailwindCSS 4 · DaisyUI 5 · lucide-react (иконки)

## Запуск

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # production-сборка в dist/
```

## Структура

```
src/
├── types/user.ts            # типы User, UsersResponse, UserDraft (как в dummyjson)
├── data/                    # мок-данные в формате GET /users
├── constants/user.ts        # подписи ролей/пола, ключи localStorage
├── utils/                   # чистые функции: фильтрация, сортировка, форма, форматирование
├── hooks/
│   ├── useUsers.ts          # CRUD над списком (add / update / delete / reset)
│   ├── useLocalStorage.ts   # useState + синхронизация с localStorage
│   ├── useDebounce.ts       # отложенное значение для поиска
│   ├── useToast.ts          # всплывающие уведомления
│   └── useTheme.ts          # светлая/тёмная тема
├── components/
│   ├── layout/Header.tsx
│   ├── ui/                  # переиспользуемые: Modal, ConfirmDialog, FormField, EmptyState, Toast
│   └── users/               # UserList, UserCard, UserAvatar, RoleBadge, UsersToolbar,
│                            # UserForm, UserFormModal, DeleteUserDialog
└── App.tsx                  # контейнер: состояние страницы + композиция компонентов
```

Данные пока локальные (в ЛР1 API не требуется), но типы и функции `useUsers`
повторяют эндпоинты dummyjson (`GET /users`, `POST /users/add`, `PUT /users/:id`,
`DELETE /users/:id`), поэтому подключение реального API затронет только хук.
