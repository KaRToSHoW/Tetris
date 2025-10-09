import { useState, useEffect, useCallback, useRef, useReducer, useMemo } from 'react';

/**
 * Хук для управления состоянием загрузки ресурсов
 * Демонстрирует useReducer для сложного управления состоянием
 */

interface ResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  retryCount: number;
}

type ResourceAction<T> = 
  | { type: 'LOADING_START' }
  | { type: 'LOADING_SUCCESS'; payload: T }
  | { type: 'LOADING_ERROR'; payload: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

function resourceReducer<T>(state: ResourceState<T>, action: ResourceAction<T>): ResourceState<T> {
  switch (action.type) {
    case 'LOADING_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOADING_SUCCESS':
      return {
        ...state,
        isLoading: false,
        data: action.payload,
        error: null,
        lastUpdated: new Date(),
        retryCount: 0,
      };
    case 'LOADING_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        retryCount: state.retryCount + 1,
      };
    case 'RETRY':
      return {
        ...state,
        error: null,
        retryCount: 0,
      };
    case 'RESET':
      return {
        data: null,
        isLoading: false,
        error: null,
        lastUpdated: null,
        retryCount: 0,
      };
    default:
      return state;
  }
}

/**
 * Универсальный хук для загрузки ресурсов с автоматическими повторными попытками
 * Демонстрирует useReducer, useCallback, useRef, useEffect
 */
export function useResourceLoader<T>(
  loadFunction: () => Promise<T>,
  options: {
    autoLoad?: boolean;
    retryAttempts?: number;
    retryDelay?: number;
    cacheTimeout?: number;
  } = {}
) {
  const {
    autoLoad = true,
    retryAttempts = 3,
    retryDelay = 1000,
    cacheTimeout = 5 * 60 * 1000, // 5 минут
  } = options;

  const [state, dispatch] = useReducer(resourceReducer<T>, {
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    retryCount: 0,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadFunctionRef = useRef(loadFunction);

  // Обновляем ссылку на функцию загрузки
  useEffect(() => {
    loadFunctionRef.current = loadFunction;
  }, [loadFunction]);

  // Функция загрузки с обработкой ошибок и повторными попытками
  const load = useCallback(async (force: boolean = false) => {
    // Проверяем кэш
    if (!force && state.data && state.lastUpdated) {
      const timeSinceUpdate = Date.now() - state.lastUpdated.getTime();
      if (timeSinceUpdate < cacheTimeout) {
        console.log('Using cached data');
        return;
      }
    }

    dispatch({ type: 'LOADING_START' });

    try {
      const data = await loadFunctionRef.current();
      dispatch({ type: 'LOADING_SUCCESS', payload: data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'LOADING_ERROR', payload: errorMessage });

      // Автоматическая повторная попытка если не превышен лимит
      if (state.retryCount < retryAttempts) {
        console.log(`Retrying in ${retryDelay}ms... (attempt ${state.retryCount + 1}/${retryAttempts})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          dispatch({ type: 'RETRY' });
          load(force);
        }, retryDelay * (state.retryCount + 1)); // Увеличиваем задержку с каждой попыткой
      }
    }
  }, [state.data, state.lastUpdated, state.retryCount, cacheTimeout, retryAttempts, retryDelay]);

  // Функция для принудительного обновления
  const refresh = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    load(true);
  }, [load]);

  // Функция для сброса состояния
  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    dispatch({ type: 'RESET' });
  }, []);

  // Автоматическая загрузка при монтировании
  useEffect(() => {
    if (autoLoad) {
      load();
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [autoLoad, load]);

  // Вычисляемые значения
  const canRetry = useMemo(() => {
    return state.error && state.retryCount < retryAttempts;
  }, [state.error, state.retryCount, retryAttempts]);

  const isStale = useMemo(() => {
    if (!state.lastUpdated) return false;
    const timeSinceUpdate = Date.now() - state.lastUpdated.getTime();
    return timeSinceUpdate > cacheTimeout;
  }, [state.lastUpdated, cacheTimeout]);

  return {
    ...state,
    load,
    refresh,
    reset,
    canRetry,
    isStale,
  };
}

/**
 * Хук для управления множественными ресурсами
 * Демонстрирует координацию нескольких источников данных
 */
export function useMultipleResources<T extends Record<string, any>>(
  resources: { [K in keyof T]: () => Promise<T[K]> },
  options: {
    loadInParallel?: boolean;
    failFast?: boolean;
  } = {}
) {
  const { loadInParallel = true, failFast = false } = options;
  
  const [loadingStates, setLoadingStates] = useState<{ [K in keyof T]: boolean }>(() => {
    const initial = {} as { [K in keyof T]: boolean };
    Object.keys(resources).forEach(key => {
      initial[key as keyof T] = false;
    });
    return initial;
  });

  const [data, setData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<{ [K in keyof T]?: string }>({});

  // Функция для загрузки одного ресурса
  const loadResource = useCallback(async <K extends keyof T>(key: K) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: undefined }));

    try {
      const result = await resources[key]();
      setData(prev => ({ ...prev, [key]: result }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({ ...prev, [key]: errorMessage }));
      
      if (failFast) {
        throw error;
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }, [resources, failFast]);

  // Функция для загрузки всех ресурсов
  const loadAll = useCallback(async () => {
    const resourceKeys = Object.keys(resources) as (keyof T)[];
    
    if (loadInParallel) {
      // Параллельная загрузка
      const promises = resourceKeys.map(key => loadResource(key));
      
      if (failFast) {
        await Promise.all(promises);
      } else {
        await Promise.allSettled(promises);
      }
    } else {
      // Последовательная загрузка
      for (const key of resourceKeys) {
        try {
          await loadResource(key);
        } catch (error) {
          if (failFast) {
            throw error;
          }
        }
      }
    }
  }, [resources, loadInParallel, loadResource, failFast]);

  // Вычисляемые значения
  const isLoading = useMemo(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error !== undefined);
  }, [errors]);

  const allLoaded = useMemo(() => {
    const resourceKeys = Object.keys(resources);
    return resourceKeys.every(key => data[key as keyof T] !== undefined);
  }, [data, resources]);

  const progress = useMemo(() => {
    const total = Object.keys(resources).length;
    const loaded = Object.keys(data).length;
    return total > 0 ? (loaded / total) * 100 : 0;
  }, [data, resources]);

  return {
    data,
    errors,
    loadingStates,
    isLoading,
    hasErrors,
    allLoaded,
    progress,
    loadResource,
    loadAll,
    reset: () => {
      setData({});
      setErrors({});
      setLoadingStates(() => {
        const initial = {} as { [K in keyof T]: boolean };
        Object.keys(resources).forEach(key => {
          initial[key as keyof T] = false;
        });
        return initial;
      });
    },
  };
}

/**
 * Хук для дебаунсинга операций с ресурсами
 * Демонстрирует useRef и useCallback для оптимизации
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);

  // Обновляем ссылку на callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}