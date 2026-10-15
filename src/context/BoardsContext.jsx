import { useEffect, useMemo } from 'react';
import { reducer } from '../utils/reducer';
import { initialState } from '../utils/factory';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { DispatchContext, HistoryContext, StateContext } from './contexts';

const KEY = 'taskflow:v1';

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : initialState;
  } catch {
    return initialState;
  }
}

// Провайдер данных: держит reducer с историей undo/redo
// и сохраняет present в localStorage.
export function BoardsProvider({ children }) {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useUndoRedo(
    reducer,
    loadState
  );

  // Сохраняем только present — историю в storage не пишем
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ігноруємо помилки запису */
    }
  }, [state]);

  // Ctrl+Z / Ctrl+Shift+Z, но не когда печатаем в поле ввода
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const history = useMemo(
    () => ({ undo, redo, canUndo, canRedo }),
    [undo, redo, canUndo, canRedo]
  );

  return (
    <DispatchContext.Provider value={dispatch}>
      <HistoryContext.Provider value={history}>
        <StateContext.Provider value={state}>{children}</StateContext.Provider>
      </HistoryContext.Provider>
    </DispatchContext.Provider>
  );
}
