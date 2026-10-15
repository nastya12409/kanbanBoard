import { useCallback, useMemo, useReducer } from 'react';

// Оборачивает reducer в "историю": { past, present, future }.
// Любая действие кладёт текущий стан в past и чистит future.
// Ограничение — LIMIT шагов (вимога: щонайменше 10, взято 50).
const LIMIT = 50;

export function withHistory(reducer, limit = LIMIT) {
  return function historyReducer(history, action) {
    const { past, present, future } = history;
    switch (action.type) {
      case 'UNDO':
        if (past.length === 0) return history;
        return {
          past: past.slice(0, -1),
          present: past[past.length - 1],
          future: [present, ...future],
        };
      case 'REDO':
        if (future.length === 0) return history;
        return {
          past: [...past, present],
          present: future[0],
          future: future.slice(1),
        };
      default: {
        const next = reducer(present, action);
        if (next === present) return history; // дія нічого не змінила
        return {
          past: [...past, present].slice(-limit),
          present: next,
          future: [],
        };
      }
    }
  };
}

export function useUndoRedo(reducer, init) {
  const historyReducer = useMemo(() => withHistory(reducer), [reducer]);
  const [history, dispatch] = useReducer(historyReducer, null, () => ({
    past: [],
    present: init(),
    future: [],
  }));
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  return {
    state: history.present,
    dispatch,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
