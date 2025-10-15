% Отчет по лабораторной работе

# Управление ресурсами и использование хуков в мобильном приложении (React Native)

**Дата:** 10 октября 2025 г.

**Автор:** (Ваше имя)

**Репозиторий проекта:** https://github.com/KaRToSHoW/Tetris

---

## Оглавление

1. Введение
2. Цели и задачи
3. Архитектура решения — кратко
4. Реализованные ресурсы и стратегия управления
5. Примеры кода (с пояснениями)
   - 5.1. Хук useResourceLoader
   - 5.2. Хук useMultipleResources
   - 5.3. Хуки игрового слоя (useGameRecords, usePlayerSettings, usePlayerStats)
   - 5.4. Контекст аутентификации (AuthContext)
6. Тестирование и проверка работы
7. Инструкции по развёртыванию и сборке отчёта (PDF)
8. Заключение
9. Приложения (список файлов)

---

## 1. Введение

В данной лабораторной работе реализована демонстрационная часть — мини-приложение Tetris на базе React Native и Expo. Основное внимание уделено эффективному управлению ресурсами приложения (сеть, локальное хранилище, кэш), а также использованию React-хуков для управления состоянием и жизненным циклом компонентов.

## 2. Цели и задачи

Цель:
- Научиться эффективно управлять ресурсами мобильного приложения и использовать хуки для управления состоянием и жизненным циклом компонентов.

Задачи:
- Реализовать управление ресурсами приложения: получение и кэширование данных, повторные попытки запросов, локальное хранение сессии.
- Применить хуки (`useState`, `useEffect`, `useReducer`, `useCallback`, `useMemo`, `useRef`) для управления состоянием, эффектами и оптимизацией.

## 3. Архитектура решения — кратко

Структура приложения организована по принципу разделения ответственности:
- UI-компоненты находятся в `src/components`.
- Логика работы с удалённым API и базой данных — в `src/lib/supabase.ts`.
- Повторно используемые хуки и логика загрузки ресурсов — в `src/hooks`.
- Контекст аутентификации — `src/contexts/AuthContext.tsx`.

Такой подход позволяет выносить сложную логику (retry, кэш, тайминги) из компонентов в переиспользуемые хуки, что упрощает тестирование и поддержку.

## 4. Реализованные ресурсы и стратегия управления

Ресурсы, используемые приложением:
- Supabase (API + база данных) — профиль пользователя, рекорды, статистика и настройки.
- AsyncStorage — локальное сохранение сессии (используется Supabase при конфигурации).
- Временный кэш в хуках — для минимизации лишних сетевых запросов.

Стратегии управления:
- Кэширование с таймаутом (см. `useResourceLoader`).
- Повторные попытки с увеличением задержки (exponential backoff-подобный механизм).
- Отложенное выполнение операций (например, при скрытой вкладке в браузере — проверка `document.visibilityState`).
- Централизация сетевых вызовов в `src/lib/supabase.ts` и дополнительная обёртка `apiCall` с retry-логикой.

## 5. Примеры кода (с пояснениями)

Ниже приведены сокращённые, но содержательные фрагменты из основных хуков и контекстов. В отчёте приведены пояснения к ключевым частям.

### 5.1. Хук useResourceLoader (полный функционал — `src/hooks/useResourceManager.ts`)

Описание: Универсальный хук для загрузки одного ресурса. Включает кэширование, retry и возможность принудительного обновления.

Ключевые моменты:
- useReducer для управления состоянием ресурса (data, isLoading, error, lastUpdated, retryCount).
- useCallback для функции загрузки, useRef для хранения таймаутов.
- Встроенная логика повторных попыток и кэширования.

Фрагмент кода (с пояснениями):

```ts
// Инициализация состояния через useReducer
const [state, dispatch] = useReducer(resourceReducer<T>, {
  data: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  retryCount: 0,
});

// Мемоизированная функция загрузки ресурса
const load = useCallback(async (force = false) => {
  // 1) Проверка кэша: если данные свежи и не требуется принудительная загрузка
  if (!force && state.data && state.lastUpdated) {
    const timeSince = Date.now() - state.lastUpdated.getTime();
    if (timeSince < cacheTimeout) return; // используем кэш
  }

  dispatch({ type: 'LOADING_START' });

  try {
    const data = await loadFunctionRef.current(); // вызов внешнего API
    dispatch({ type: 'LOADING_SUCCESS', payload: data });
  } catch (err) {
    dispatch({ type: 'LOADING_ERROR', payload: (err as Error).message });
    // 2) Retry: если ошибки и попыток меньше заданного лимита — планируем повтор
    if (state.retryCount < retryAttempts) {
      retryTimeoutRef.current = setTimeout(() => {
        dispatch({ type: 'RETRY' });
        load(force);
      }, retryDelay * (state.retryCount + 1));
    }
  }
}, [state.data, state.lastUpdated, state.retryCount]);
```

Пояснение: Основной цикл — попытка загрузки, сохранение в состоянии или планирование повторной попытки при ошибке. Это покрывает случаи временных сбоев сети.

### 5.2. Хук useMultipleResources

Описание: Координирует загрузку нескольких ресурсов, предоставляет индикатор прогресса.

Ключевые моменты:
- Можно загружать параллельно (Promise.allSettled) или последовательно.
- Поддерживает стратегию failFast: останов при первой ошибке.

Фрагмент:

```ts
async function loadAll() {
  const keys = Object.keys(resources);
  if (loadInParallel) {
    const promises = keys.map(k => loadResource(k as keyof T));
    await Promise.allSettled(promises);
  } else {
    for (const k of keys) await loadResource(k as keyof T);
  }
}
```

### 5.3. Игровые хуки (useGameData.ts)

Описание: Набор хуков, управляющих рекордами, настройками и статистикой игрока. Показывают сочетание `useState`, `useEffect`, `useCallback`, `useMemo`.

Ключевые примеры:
- `useGameRecords` — загрузка топ-результатов и локальных записей, сохранение новых результатов и обновление списков.
- `usePlayerSettings` — загрузка, локальное редактирование и сохранение настроек игрока.
- `usePlayerStats` — загрузка аналитики и вычисление ранга игрока.

Фрагмент `useGameRecords`:

```ts
const [records, setRecords] = useState<GameRecord[]>([]);
const loadTopScores = useCallback(async (limit = 10) => {
  setIsLoading(true);
  try {
    const scores = await GameService.getTopScores(limit);
    setTopScores(scores);
  } finally { setIsLoading(false); }
}, []);

useEffect(() => { loadTopScores(); }, [loadTopScores]);
```

### 5.4. Контекст аутентификации (AuthContext.tsx)

Описание: Контекст предоставляет глобальную аутентификацию (signIn, signUp, signOut, refreshUserSession). Основные моменты:
- Получение сессии при старте: `supabase.auth.getSession()`.
- Подписка на события аутентификации: `supabase.auth.onAuthStateChange`.
- Автоматическое обновление токенов и безопасная работа с `document` (для web).

Фрагмент (важные места):

```ts
useEffect(() => {
  // Получаем текущую сессию
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session?.user) { const { data: profile } = await getUserProfile(session.user.id); setUser(profile); }
  };
  getSession();

  // Подписка на изменения состояния аутентификации
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    setSession(session);
    // загрузка профиля при входе
    if (session?.user) { const { data: profile } = await getUserProfile(session.user.id); setUser(profile || null); }
  });

  return () => subscription.unsubscribe();
}, []);
```

Пояснение: Контекст упрощает доступ к данным пользователя из любого компонента и централизует логику обновления сессии.

---

## 6. Тестирование и проверка работы

Проверки, проведённые в ходе разработки:
- Web bundling: исправлена проблема с зависимостью `text-encoding` — добавлен платформозависимый `polyfills` (файлы `src/polyfills.ts` и `src/polyfills.web.ts`).
- Native (Android/iOS): устранена ошибка `document is not defined` — все обращения к `document` обёрнуты в `typeof document !== 'undefined'`.
- База данных: добавлена миграция `supabase/migrations/001_init.sql` для создания таблиц `profiles`, `player_stats`, `game_settings`, `records`.

Ручная проверка:
- Запуск `npm run web` в локальной среде должен больше не выдавать ошибку про `text-encoding`.
- При успешном применении миграции в Supabase, регистрация пользователей и создание профилей должны работать корректно.

## 7. Инструкции по развёртыванию и сборке отчёта (PDF)

1. Установка зависимостей и запуск проекта:

```powershell
npm install
npm run web         # Запуск в браузере
npm run android     # Запуск на Android (требуется Android SDK / эмулятор)
```

2. Применение миграции к Supabase (вариант — через SQL Editor в панели Supabase):
- Откройте `supabase/migrations/001_init.sql` и выполните содержимое через SQL editor вашего проекта Supabase.

3. Экспорт отчёта в PDF:
- Через VSCode: открыть `REPORT.md` → Print → Save as PDF.
- Через pandoc (если установлен):

```powershell
pandoc REPORT.md -o REPORT.pdf --from markdown --pdf-engine=xelatex
```

## 8. Заключение

В ходе работы реализована надёжная и переиспользуемая система управления ресурсами в мобильном приложении на React Native. Основные достижения:
- Переиспользуемые хуки для загрузки и координации ресурсов.
- Централизованная обработка сетевых вызовов и retry-логика.
- Кросс-платформенная устойчивость (web/native) за счёт условных проверок и platform-specific polyfills.

Эти подходы улучшают стабильность приложения и упрощают поддержку и масштабирование.

## 9. Приложения (список файлов для изучения)

- `src/hooks/useResourceManager.ts`
- `src/hooks/useGameData.ts`
- `src/contexts/AuthContext.tsx`
- `src/lib/supabase.ts`
- `src/polyfills.ts`, `src/polyfills.web.ts`
- `supabase/migrations/001_init.sql`

---

Спасибо! Если хотите, я могу:
- добавить в отчёт полные (не усечённые) листинги конкретных файлов;
- сгенерировать PDF-версию здесь (если разрешите запуск pandoc/LaTeX);
- подготовить PR с добавлениями (README, REPORT.pdf и миграцией) и запушить его в ветку.

