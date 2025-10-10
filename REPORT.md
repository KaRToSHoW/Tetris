Отчет по лабораторной работе: Управление ресурсами и использование хуков в мобильном приложении (React Native)

Дата: 10 октября 2025 г.

Автор: (Ваше имя)

Ссылка на репозиторий: https://github.com/KaRToSHoW/Tetris

## Введение

Цель: Научиться эффективно управлять ресурсами мобильного приложения и использовать хуки для управления состоянием и жизненным циклом компонентов.

Задачи:
- Управление ресурсами приложения (данные, API, локальное хранилище и т.д.).
- Использование хуков (`useState`, `useEffect`, `useReducer`, `useCallback` и др.) для управления состоянием и жизненным циклом компонентов.

В этой работе реализовано мини-приложение (Tetris) на React Native / Expo. В проекте используются собственные хуки для управления ресурсами и игровыми данными, а также контекст для аутентификации.

---

## 1. Описание реализованных ресурсов и стратегий управления

В проекте используются следующие ресурсы:

1. Удаленный API (Supabase) — хранение профилей, рекордов, статистики, настроек.
2. Локальное хранилище (AsyncStorage) — для хранения сессии и некоторых настроек на устройстве.
3. Временные ресурсы и кэш — храним кэшированные ответы с меткой времени и используем их при повторных запросах.
4. Повторные попытки и отложенные операции — при сетевых ошибках выполняются экспоненциальные повторные попытки.

Ключевые механизмы управления ресурсами:
- useResourceLoader (хуки) — универсальный загрузчик с кэшем, retry и тайм-аутами.
- useMultipleResources — координация параллельной или последовательной загрузки нескольких источников.
- useDebounceCallback — для предотвращения частых вызовов API (дебаунс).
- Сервис `src/lib/supabase.ts` — обёртки для вызовов API и помощь в обновлении сессии.

---

## 2. Листинги кода с комментариями

Ниже приведены ключевые фрагменты кода из проекта с комментариями, объясняющими принцип работы.

### 2.1. Хук `useResourceLoader` (файл: `src/hooks/useResourceManager.ts`)

// Сокращённый листинг

```ts
// useResourceLoader: универсальный хук для загрузки ресурсов
export function useResourceLoader<T>(loadFunction: () => Promise<T>, options = {}) {
  // useReducer для управления комплексным состоянием ресурса
  const [state, dispatch] = useReducer(resourceReducer<T>, {
    data: null, isLoading: false, error: null, lastUpdated: null, retryCount: 0
  });

  // load: загружает ресурс, учитывает кэш, обрабатывает ошибки и выполняет повторные попытки
  const load = useCallback(async (force = false) => {
    // проверка кэша: если данные свежие и force = false — использовать кэш
    if (!force && state.data && state.lastUpdated) { ... }

    dispatch({ type: 'LOADING_START' });

    try {
      const data = await loadFunction();
      dispatch({ type: 'LOADING_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'LOADING_ERROR', payload: error.message });
      // логика повторных попыток с увеличением задержки
    }
  }, [state.data, state.lastUpdated, state.retryCount]);

  useEffect(() => { if (autoLoad) load(); return cleanup; }, [autoLoad, load]);

  return { ...state, load, refresh, reset, canRetry, isStale };
}
```

Комментарий: Этот хук демонстрирует использование `useReducer` для сложного локального состояния ресурса, `useCallback` для мемоизации функций, `useRef` для хранения таймаутов, и `useEffect` для автоматической загрузки при монтировании.

---

### 2.2. Координация нескольких ресурсов — `useMultipleResources` (файл: `src/hooks/useResourceManager.ts`)

```ts
export function useMultipleResources(resources, options = {}) {
  // Загрузка в параллели или последовательно, обработка ошибок (failFast)
  const loadAll = useCallback(async () => {
    if (loadInParallel) {
      const promises = resourceKeys.map(key => loadResource(key));
      await Promise.allSettled(promises);
    } else {
      for (const key of resourceKeys) { await loadResource(key); }
    }
  }, [resources, loadInParallel]);
}
```

Комментарий: Используется для загрузки нескольких API-ресурсов одновременно, а также для получения прогресса и статуса загрузки.

---

### 2.3. Использование хуков в игровом домене — `useGameRecords`, `usePlayerSettings`, `usePlayerStats` (файл: `src/hooks/useGameData.ts`)

```ts
// Пример: useGameRecords
export function useGameRecords(playerName) {
  const [records, setRecords] = useState([]);
  const [topScores, setTopScores] = useState([]);

  const loadTopScores = useCallback(async (limit = 10) => {
    setIsLoading(true);
    try { const scores = await GameService.getTopScores(limit); setTopScores(scores); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadTopScores(); }, [loadTopScores]);
}
```

Комментарий: `useEffect` отвечает за загрузку при монтировании, `useCallback` используется для стабилизации API-вызовов между рендерами, `useMemo` для вычисления агрегированных значений (например, средний счёт).

---

### 2.4. Контекст аутентификации (файл: `src/contexts/AuthContext.tsx`)

Ключевые аспекты:
- Инициализация сессии при старте через `supabase.auth.getSession()`.
- Подписка на изменения состояния аутентификации с помощью `supabase.auth.onAuthStateChange`.
- Автоматическое обновление сессии с использованием `setInterval` (при видимости вкладки — проверка `document.visibilityState` для web).
- Безопасное использование `document` с проверкой `typeof document !== 'undefined'` для нативных платформ.

Комментарий: Контекст предоставляет глобальные методы `signIn`, `signUp`, `signOut`, `refreshUserSession`, которые используют Supabase-сервис; подобная организация упрощает доступ к аутентификации из любого компонента.

---

## 3. Пояснение использования хуков для управления состоянием и жизненным циклом

1. useState
   - Простой локальный state управления UI и представлением данных (например, списки рекордов, индикаторы загрузки, ошибки).
2. useEffect
   - Выполнение побочных эффектов: загрузка данных при монтировании, подписка/отписка от событий, очистка таймеров.
3. useReducer
   - Подходит для сложных состояний, где много частных флагов (использован в `useResourceLoader` для управления состоянием загрузок).
4. useCallback / useMemo
   - Меморизация функций и вычислений для оптимизации рендеров и предотвращения лишних вызовов эффектов.
5. useRef
   - Для хранения таймеров и mutable-значений, которые не должны инициировать перерендеры.

---

## 4. Примеры управления ресурсами в приложении

1. Кэширование и проверка времени жизни данных (см. `useResourceLoader`) — предотвращает лишние сетевые запросы.
2. Повторные попытки при сетевых ошибках — экспоненциальная задержка между попытками.
3. Отложенные операции при скрытой вкладке (для web) — проверка `document.visibilityState` и откладывание выполнения запроса до момента видимости.
4. Локальное хранение сессии (AsyncStorage) используется Supabase для сохранения токенов на устройстве.

---

## 5. Как собрать PDF-отчет

1. Вариант 1 — использовать pandoc (если установлен):

```bash
pandoc REPORT.md -o REPORT.pdf --from markdown --pdf-engine=xelatex
```

2. Вариант 2 — открыть `REPORT.md` в VSCode и выбрать Print → Save as PDF.
3. Вариант 3 — использовать GitHub: создать `REPORT.md` в репозитории, открыть в браузере и распечатать страницу в PDF.

---

## 6. Выводы

В ходе лабораторной работы были реализованы методы эффективного управления ресурсами приложения и продемонстрировано использование хуков React Native для управления состоянием и жизненным циклом компонентов. Основные принципы:
- Разделение ответственности: отделить логику загрузки данных от UI-компонентов (хуки, сервисы).
- Безопасный кроссплатформенный код: проверять наличие Web-API (`document`) на нативных платформах.
- Кэширование, retry и дедупликация запросов повышают стабильность работы при плохом соединении.

---

## 7. Приложение: полезные ссылки

- Репозиторий проекта: https://github.com/KaRToSHoW/Tetris
- Файлы в проекте для изучения:
  - `src/hooks/useResourceManager.ts`
  - `src/hooks/useGameData.ts`
  - `src/contexts/AuthContext.tsx`
  - `src/lib/supabase.ts`

---

Отчёт сгенерирован автоматически на основе исходного кода проекта. Для получения PDF используйте предложенные способы экспорта.
