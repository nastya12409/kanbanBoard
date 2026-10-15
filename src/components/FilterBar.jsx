import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { PRIORITIES } from '../utils/factory';

// Фильтры живут в query-параметрах URL: ссылку можно кинуть в чат.
// Текст по debounce (300 мс) не дёргает history на каждый символ.
export function FilterBar({ board }) {
  const [params, setParams] = useSearchParams();

  const filters = {
    q: params.get('q') ?? '',
    priority: params.get('priority') ?? '',
    tag: params.get('tag') ?? '',
    due: params.get('due') ?? '', // overdue | today | none
  };

  const setFilter = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }, // не мусорить в истории браузера
    );

  const [text, setText] = useState(filters.q);
  const debounced = useDebounce(text, 300);
  useEffect(() => {
    if (debounced !== filters.q) setFilter('q', debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Список тегов собирается со всех карточек доски
  const tags = useMemo(() => {
    const set = new Set();
    Object.values(board.cards).forEach((c) => c.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [board.cards]);

  const active = filters.q || filters.priority || filters.tag || filters.due;

  return (
    <div className="filterbar" role="search">
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Пошук за назвою та описом…"
        aria-label="Пошук карток"
      />

      <select
        value={filters.priority}
        onChange={(e) => setFilter('priority', e.target.value)}
        aria-label="Фільтр за пріоритетом"
      >
        <option value="">Пріоритет: всі</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={filters.tag}
        onChange={(e) => setFilter('tag', e.target.value)}
        aria-label="Фільтр за тегом"
      >
        <option value="">Тег: будь-який</option>
        {tags.map((t) => (
          <option key={t} value={t}>
            #{t}
          </option>
        ))}
      </select>

      <select
        value={filters.due}
        onChange={(e) => setFilter('due', e.target.value)}
        aria-label="Фільтр за дедлайном"
      >
        <option value="">Дедлайн: будь-який</option>
        <option value="overdue">Прострочені</option>
        <option value="today">На сьогодні</option>
        <option value="none">Без дедлайну</option>
      </select>

      {active && (
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setText('');
            setParams({}, { replace: true });
          }}
        >
          Скинути фільтри
        </button>
      )}
    </div>
  );
}
