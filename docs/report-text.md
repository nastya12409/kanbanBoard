# Текст для звіту: робота №1 «Kanban-дошка TaskFlow»

Нижче — текст роботи по етапах (копіюється у Word). Код наведено з реального проєкту.

## Етап 1. Створення проєкту та встановлення залежностей

Для створення проєкту використала збірник Vite та офіційний шаблон React. У робочому каталозі виконала команди:

```
npm create vite@latest taskflow -- --template react
cd taskflow
npm install
npm install react-router-dom
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event prettier eslint-config-prettier
```

У `package.json` додала скрипти запуску тестів, лінтера та форматування:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "format": "prettier --write src",
  "test": "vitest run",
  "preview": "vite preview"
}
```

Також створила конфігураційні файли `vite.config.js`, `eslint.config.js`, `.prettierrc`. У `vite.config.js` налаштувала середовище тестів (jsdom) та файл початкового налаштування:

```js
// vite.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
```

## Етап 2. Розкладання коду за каталогами

Відповідно до вимог розклашла код за каталогами (компоненти лише відображають дані та викликають `dispatch`, логіка зміни стану міститься в чистому reducer, допоміжні функції — у `utils/`):

```
src/
  components/  Board, Column, Card, SortableCard, CardModal, Modal,
               FilterBar, EditableTitle, BoardStats
  pages/       HomePage, BoardPage, NotFoundPage
  context/     contexts.js, BoardsContext.jsx, ThemeContext.jsx
  hooks/       useLocalStorage.js, useDebounce.js, useUndoRedo.js
  utils/       reducer.js, factory.js, filters.js, exportImport.js
  test/        setup.js
  App.jsx
  main.jsx
```

Призначення основних файлів:

- `factory.js` — створення об'єктів даних (дошка, колонка, картка);
- `reducer.js` — чиста функція, що описує всі зміни стану;
- `filters.js` — чисті функції фільтрів та роботи з дедлайнами;
- `exportImport.js` — експорт дошки у JSON та імпорт з файлу;
- `hooks/` — три власні хуки (localStorage, debounce, undo/redo);
- `context/` — розподіл стану між компонентами без прокидання пропсів;
- `components/` — презентаційні компоненти;
- `pages/` — сторінки за маршрутом.

## Етап 3. Модель даних

Стан зберігаю у нормалізованому вигляді: картки лежать у словнику за ідентифікатором, а колонка містить лише масив ідентифікаторів своїх карток. Тоді перенесення картки зводиться до зміни двох масивів, а редагування — до заміни одного об'єкта. Файл `src/utils/factory.js`:

```js
export const uid = () => crypto.randomUUID();

export const PRIORITIES = ['low', 'medium', 'high'];

export const createCard = (title) => ({
  id: uid(),
  title,
  description: '',
  priority: 'medium', // low | medium | high
  deadline: null, // рядок 'YYYY-MM-DD' або null
  tags: [],
  assignee: '',
  createdAt: Date.now(),
});

export const createColumn = (title) => ({ id: uid(), title, cardIds: [] });

export const createBoard = (title) => {
  const columns = ['To Do', 'In Progress', 'Done'].map(createColumn);
  return {
    id: uid(),
    title,
    columnOrder: columns.map((c) => c.id),
    columns: Object.fromEntries(columns.map((c) => [c.id, c])),
    cards: {},
  };
};

export const initialState = { boards: {}, boardOrder: [] };
```

Стан застосунку має вигляд `{ boards: { [id]: board }, boardOrder: [] }`. Картки зберігаються всередині своєї дошки, тому під час імпорту їхні ідентифікатори не конфліктують з іншими дошками. Тема оформлення та фільтри в цей стан не входять: тема зберігається окремо в `localStorage`, а фільтри — в адресному рядку.

## Етап 4. Reducer

Reducer — чиста функція `(state, action) => newState`: вона не змінює вихідний стан і не звертається до `localStorage`. Для операцій над окремою дошкою використала допоміжну функцію `updateBoard`, що перестворює лише змінений шлях:

```js
// utils/reducer.js
const updateBoard = (state, boardId, fn) => {
  const board = state.boards[boardId];
  if (!board) return state; // невідома дошка: стан не змінюється
  return { ...state, boards: { ...state.boards, [boardId]: fn(board) } };
};

export function reducer(state, action) {
  switch (action.type) {
    case 'BOARD_ADD': {
      const board = createBoard(action.title);
      return {
        boards: { ...state.boards, [board.id]: board },
        boardOrder: [...state.boardOrder, board.id],
      };
    }
    // ... дії BOARD_RENAME, BOARD_DELETE, BOARD_IMPORT,
    //     COLUMN_ADD, COLUMN_RENAME, COLUMN_DELETE, CARD_ADD,
    //     CARD_UPDATE, CARD_DELETE — за тим самим зразком
    case 'CARD_MOVE':
      return updateBoard(state, action.boardId, (b) => {
        const { cardId, from, to, index } = action;
        if (!b.columns[from] || !b.columns[to]) return b;
        // видаляємо id з вихідної колонки і вставляємо в цільову
        const source = b.columns[from].cardIds.filter((id) => id !== cardId);
        const target = from === to ? source : [...b.columns[to].cardIds];
        target.splice(index, 0, cardId);
        return {
          ...b,
          columns: {
            ...b.columns,
            [from]: { ...b.columns[from], cardIds: source },
            [to]: { ...b.columns[to], cardIds: target },
          },
        };
      });
    default:
      return state;
  }
}
```

Дія `CARD_MOVE` працює і для перенесення між колонками, і для зміни порядку всередині однієї колонки: для руху в межах колонки `source` і `target` — це один і той самий масив, тому порядок після видалення та вставлення виходить правильним.

## Етап 5. Власні хуки

Створила три власні хуки.

`useLocalStorage` — читає значення під час першого рендера й записує його за кожної зміни; звернення до сховища обгорнуті в `try/catch` (приватний режим або вичерпана квота не ламають застосунок):

```js
// hooks/useLocalStorage.js
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* квоту вичерпано або сховище недоступне */
    }
  }, [key, value]);

  return [value, setValue];
}
```

`useDebounce` — затримує значення, щоб текст пошуку не потрапляв у URL на кожен символ:

```js
// hooks/useDebounce.js
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
```

`useUndoRedo` — обгортає reducer в історію зі структурою `{ past, present, future }`. Будь-яка дія, крім `UNDO` і `REDO`, поміщає поточний стан у `past`, обчислює новий стан і очищає `future`. Оскільки стан незмінний, в історії лежать лише посилання на старі об'єкти, копіювати їх не потрібно. Кількість кроків обмежена (вимога — щонайменше 10, взято 50):

```js
// hooks/useUndoRedo.js
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
```

## Етап 6. Розподіл стану через Context

Стану передаю через контексти. Два контексти розділені (дані та `dispatch`) — компоненти, які лише надсилають дії, не перемальовуються під час зміни даних. Окремо винесено контекст історії для undo/redo. Файл `src/context/contexts.js`:

```js
import { createContext, useContext } from 'react';

export const StateContext = createContext(null);
export const DispatchContext = createContext(null);
export const HistoryContext = createContext(null);
export const ThemeContext = createContext(null);

export const useBoardsState = () => useContext(StateContext);
export const useBoardsDispatch = () => useContext(DispatchContext);
export const useHistory = () => useContext(HistoryContext);
export const useTheme = () => useContext(ThemeContext);
```

Провайдер завантажує стан із `localStorage`, зберігає лише `present` та реєструє гарячі клавіші Ctrl+Z / Ctrl+Shift+Z (обробник не спрацьовує, коли фокус у полі введення, щоб не перехоплювати штатне скасування набору тексту):

```jsx
// context/BoardsContext.jsx
export function BoardsProvider({ children }) {
  const { state, dispatch, undo, redo, canUndo, canRedo } =
    useUndoRedo(reducer, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ігноруємо помилки запису */
    }
  }, [state]);

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

  return (
    <DispatchContext.Provider value={dispatch}>
      <HistoryContext.Provider value={history}>
        <StateContext.Provider value={state}>{children}</StateContext.Provider>
      </HistoryContext.Provider>
    </DispatchContext.Provider>
  );
}
```

## Етап 7. Маршрутизація та сторінки

Підключила React Router: головна сторінка `/`, сторінка дошки `/board/:id` та сторінка «не знайдено». Провайдери теми та дошок розміщені вище за маршрути, тому стан не втрачається під час переходів:

```jsx
// App.jsx (фрагмент)
<BrowserRouter>
  <ThemeProvider>
    <BoardsProvider>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/board/:id" element={<BoardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </BoardsProvider>
  </ThemeProvider>
</BrowserRouter>
```

Сторінка дошки отримує ідентифікатор із `useParams` і перенаправляє на головну, якщо такої дошки немає (наприклад, після видалення або очищення сховища). Фільтри читаються з query-параметрів URL, кнопки undo/redo вмикаються залежно від наявності історії:

```jsx
// pages/BoardPage.jsx (фрагмент)
export default function BoardPage() {
  const { id } = useParams();
  const { boards } = useBoardsState();
  const { undo, redo, canUndo, canRedo } = useHistory();
  const [params] = useSearchParams();

  const board = boards[id];
  if (!board) return <Navigate to="/" replace />;

  const filters = {
    q: params.get('q') ?? '',
    priority: params.get('priority') ?? '',
    tag: params.get('tag') ?? '',
    due: params.get('due') ?? '',
  };

  return (
    <div className="page board-page">
      <div className="toolbar">
        <h1 className="board-heading">{board.title}</h1>
        <div className="toolbar-actions">
          <button type="button" className="btn ghost" onClick={undo}
                  disabled={!canUndo} title="Ctrl+Z">↶ Скасувати</button>
          <button type="button" className="btn ghost" onClick={redo}
                  disabled={!canRedo} title="Ctrl+Shift+Z">↷ Повторити</button>
        </div>
      </div>
      <Board board={board} filters={filters} /* ... */ />
    </div>
  );
}
```

## Етап 8. Колонки, картки та drag-and-drop

Колонка реєструється через `useDroppable` (щоб у порожню колонку можна було кинути картку), картки обгорнуті в `SortableContext`. Список видимих карток обчислюється в `useMemo` за примітивними значеннями фільтрів:

```jsx
// components/Column.jsx (фрагмент)
const { setNodeRef } = useDroppable({ id: column.id });

const visibleIds = useMemo(() => {
  const active = filters.q || filters.priority || filters.tag || filters.due;
  if (!active) return column.cardIds;
  return column.cardIds.filter((id) => matchesFilters(board.cards[id], filters));
}, [column.cardIds, board.cards, filters]);

return (
  <section className="column">
    <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
      <ul ref={setNodeRef} className="cards">
        {visibleIds.map((id) => (
          <SortableCard key={id} card={board.cards[id]} onOpen={onOpen}
                        disabled={hasFilters} />
        ))}
      </ul>
    </SortableContext>
    {/* форма додавання картки */}
  </section>
);
```

У компоненті `Board` налаштувала датчики. Обмеження `distance` не дає кліку по картці перетворитися на перетягування, тому відкриття модального вікна продовжує працювати; датчик клавіатури робить перетягування доступним без миші:

```jsx
// components/Board.jsx (фрагмент)
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

const handleDragEnd = ({ active, over }) => {
  setActiveId(null);
  if (!over) return;
  const from = findColumnId(board, active.id);
  const to = findColumnId(board, over.id);
  if (!from || !to) return;
  const toIds = board.columns[to].cardIds;
  const index = board.columns[over.id]
    ? toIds.length // скинули на саму колонку — в кінець
    : toIds.indexOf(over.id);
  if (from === to && toIds.indexOf(active.id) === index) return;
  act({ type: 'CARD_MOVE', cardId: active.id, from, to, index });
};

return (
  <DndContext sensors={sensors} collisionDetection={closestCorners}
              onDragStart={(e) => setActiveId(e.active.id)}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}>
    <div className="board">
      {board.columnOrder.map((colId) => (
        <Column key={colId} column={board.columns[colId]} /* ... */ />
      ))}
      <DragOverlay>
        {activeId && board.cards[activeId] ? <Card card={board.cards[activeId]} /> : null}
      </DragOverlay>
    </div>
  </DndContext>
);
```

## Етап 9. Модальне вікно через React Portal

Модальне вікно рендериться через `createPortal` у `document.body`, щоб батьківські стилі не обрізали його. Вікно закривається клавішею Esc та кліком на затемнений фон; поки вікно відкрите, прокрутка сторінки заблокована, а фокус повертається на кнопку, з якої вікно відкрили (вимоги доступності):

```jsx
// components/Modal.jsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    ref.current?.querySelector('input, select, textarea, button')?.focus();

    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      opener?.focus?.(); // повертаємо фокус туди, звідки відкрили
    };
  }, [onClose]);

  return createPortal(
    <div className="overlay"
         onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="modal" role="dialog"
           aria-modal="true" aria-label={title}>
        {/* заголовок і вміст */}
      </div>
    </div>,
    document.body
  );
}
```

Форма всередині вікна містить поля: заголовок (обов'язковий), опис, пріоритет (`select`), дедлайн (`input type="date"`), теги (через кому) та виконавця. Кнопка «Зберегти» надсилає `CARD_UPDATE` з об'єктом `patch`, кнопка «Видалити» — `CARD_DELETE`.

## Етап 10. Пошук і фільтри в URL

Значення фільтрів зберігаються в query-параметрах URL (`?q=api&priority=high`), тому стан пошуку переживає перезавантаження сторінки, а посиланням на відфільтровану дошку можна поділитися. Для читання й запису параметрів використовується `useSearchParams`, а текстове поле оновлюється через `useDebounce` (300 мс):

```jsx
// components/FilterBar.jsx (фрагмент)
export function FilterBar({ board }) {
  const [params, setParams] = useSearchParams();

  const filters = {
    q: params.get('q') ?? '',
    priority: params.get('priority') ?? '',
    tag: params.get('tag') ?? '',
    due: params.get('due') ?? '',
  };

  const setFilter = (key, value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });

  const [text, setText] = useState(filters.q);
  const debounced = useDebounce(text, 300);
  useEffect(() => {
    if (debounced !== filters.q) setFilter('q', debounced);
  }, [debounced]);
  // ... випадаючі списки пріоритету, тега та дедлайну
}
```

Сама перевірка картки винесена в чисту функцію `matchesFilters` (`utils/filters.js`), яку легко тестувати без UI.

## Етап 11 (ВЛАСНЕ ВДОСКОНАЛЕННЯ). Статистика дошки та напоминання про дедлайни

Окрім базового функціоналу за варіантом реалізувала дві власні можливості.

**1) Напоминання про дедлайни.** У файл `utils/filters.js` додала функції, що обчислюють залишок днів, клас терміновості та підпис до дати:

```js
// utils/filters.js
export const today = () => new Date().toLocaleDateString('sv-SE');
export const isOverdue = (deadline) => Boolean(deadline) && deadline < today();

// скільки днів лишилось до дедлайну (0 — сьогодні, -N — прострочено)
export const daysLeft = (deadline) => {
  if (!deadline) return null;
  const now = new Date(today() + 'T00:00:00');
  const due = new Date(deadline + 'T00:00:00');
  return Math.round((due - now) / 86400000);
};

// клас терміновості: overdue | today | soon (<=3 дні) | ok | none
export const urgencyOf = (deadline) => {
  const d = daysLeft(deadline);
  if (d === null) return 'none';
  if (d < 0) return 'overdue';
  if (d === 0) return 'today';
  if (d <= 3) return 'soon';
  return 'ok';
};

// зрозумілий підпис до дедлайну
export const deadlineLabel = (deadline) => {
  const d = daysLeft(deadline);
  if (d === null) return '';
  if (d < 0) return `Прострочено ${Math.abs(d)} дн.`;
  if (d === 0) return 'Сьогодні дедлайн!';
  if (d === 1) return 'Залишився 1 день';
  if (d <= 4) return `Залишилось ${d} дні`;
  return `Залишилось ${d} днів`;
};
```

Компонент картки виводить підпис і фарбує блок за класом терміновості; атрибути `data-overdue` та `data-urgency` використовуються у стилях і в тестах:

```jsx
// components/Card.jsx (фрагмент)
const Card = memo(function Card({ card, onOpen }) {
  const urgency = urgencyOf(card.deadline);
  const overdue = isOverdue(card.deadline);

  return (
    <article className="card" onClick={() => onOpen?.(card.id)}
             data-overdue={overdue ? 'true' : 'false'}
             data-urgency={urgency}>
      {/* заголовок і пріоритет */}
      {card.deadline && (
        <div className={`deadline deadline-${urgency}`}>
          <span className="deadline-date">{card.deadline}</span>
          <span className="deadline-label">{deadlineLabel(card.deadline)}</span>
        </div>
      )}
      {/* теги і виконавець */}
    </article>
  );
});
```

**2) Панель статистики та прогресу дошки.** Компонент `BoardStats` рахує кількість карток у кожній колонці, відсоток виконаних задач (за колонкою «Done») та попереджує про «горящі» дедлайни. Обчислення загорнуте в `useMemo`, тому панель не перераховується без потреби:

```jsx
// components/BoardStats.jsx (фрагмент)
export default function BoardStats({ board }) {
  const stats = useMemo(() => {
    const cards = Object.values(board.cards);
    const total = cards.length;
    const overdue = cards.filter((c) => isOverdue(c.deadline)).length;
    const soon = cards.filter((c) => {
      const u = urgencyOf(c.deadline);
      return u === 'soon' || u === 'today';
    }).length;

    const perColumn = board.columnOrder.map((id) => ({
      id,
      title: board.columns[id].title,
      count: board.columns[id].cardIds.length,
    }));

    const doneCol = perColumn.find((c) => c.title.trim().toLowerCase() === 'done');
    const done = doneCol?.count ?? 0;
    const percent = total ? Math.round((done / total) * 100) : 0;

    return { total, overdue, soon, perColumn, done, percent };
  }, [board]);

  return (
    <section className="stats" aria-label="Статистика дошки">
      <div className="stats-progress">
        <strong>Прогрес:</strong>{' '}
        <span aria-live="polite">
          {stats.done}/{stats.total} виконано ({stats.percent}%)
        </span>
        <div className="progress" role="progressbar"
             aria-valuenow={stats.percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${stats.percent}%` }} />
        </div>
      </div>
      <ul className="stats-counts">
        {stats.perColumn.map((c) => (
          <li key={c.id}>
            <span className="stats-col-title">{c.title}</span>
            <span className="stats-num">{c.count}</span>
          </li>
        ))}
      </ul>
      {stats.overdue > 0 && (
        <p className="stats-alert" role="status">🔥 Прострочено: {stats.overdue}</p>
      )}
      {stats.soon > 0 && (
        <p className="stats-warn" role="status">
          ⏰ Дедлайн найближчим часом: {stats.soon}
        </p>
      )}
    </section>
  );
}
```

Крім того, у заголовку кожної колонки виведено лічильник карток (за наявності фільтрів — у форматі «видимі/усі»).

## Етап 12. Теми оформлення та адаптивна верстка

Тема реалізована через CSS-змінні: набір кольорів визначено один раз для світлої теми та перевизначено для атрибута `data-theme="dark"`. Усі компоненти використовують лише змінні, тому перемикання миттєво змінює весь інтерфейс:

```css
/* index.css */
:root {
  --bg: #f5f6f8;
  --surface: #ffffff;
  --text: #1c1e21;
  --muted: #5f6670;
  --border: #d0d4da;
  --accent: #2563eb;
  --danger: #dc2626;
}

[data-theme='dark'] {
  --bg: #15171a;
  --surface: #1f2226;
  --text: #e8eaed;
  --muted: #9aa0a6;
  --border: #3a3f45;
  --accent: #3b82f6;
  --danger: #f87171;
}

body { background: var(--bg); color: var(--text); }
```

Вибір теми зберігається в `localStorage`, а за його відсутності береться із системного налаштування `prefers-color-scheme`. Для адаптивності дошка виконана як горизонтально прокручуваний ряд колонок зі scroll-snap; на екранах вужчих за 480 px панелі переносяться на новий рядок, а колонка займає не більше 85% ширини — верстка коректна від 360 px.

## Етап 13. Тести

Налаштувала Vitest (середовище jsdom, файл `src/test/setup.js` з `@testing-library/jest-dom/vitest`). Написала 24 тести у шести файлах: reducer, історія undo/redo, фільтри та дедлайни, компоненти Modal, Card і BoardStats. Приклад тесту reducer — перевіряється і результат дії, і те, що вихідний стан не змінився:

```js
// utils/reducer.test.js (фрагмент)
describe('reducer: картки', () => {
  it('додає картку в колонку і не мутує вихідний стан', () => {
    const { state, boardId, todo } = setup();
    const next = reducer(state, {
      type: 'CARD_ADD', boardId, columnId: todo, title: 'Задача',
    });
    expect(next.boards[boardId].columns[todo].cardIds).toHaveLength(1);
    // вихідний стан не змінився (reducer чистий)
    expect(state.boards[boardId].columns[todo].cardIds).toHaveLength(0);
  });

  it('переносить картку між колонками', () => {
    const { state, boardId, todo, doing } = setup();
    const s1 = reducer(state, {
      type: 'CARD_ADD', boardId, columnId: todo, title: 'Задача',
    });
    const cardId = s1.boards[boardId].columns[todo].cardIds[0];
    const s2 = reducer(s1, {
      type: 'CARD_MOVE', boardId, cardId, from: todo, to: doing, index: 0,
    });
    expect(s2.boards[boardId].columns[todo].cardIds).toEqual([]);
    expect(s2.boards[boardId].columns[doing].cardIds).toEqual([cardId]);
  });
});
```

Тест компонентів перевіряє підсвічування простроченої картки через атрибут `data-overdue` (а не назву CSS-класу, яка під час використання модулів стає хешем):

```js
// components/Card.test.jsx (фрагмент)
it('підсвічує прострочену картку (data-overdue)', () => {
  render(<Card card={{ ...baseCard, deadline: '2000-01-01' }} onOpen={() => {}} />);
  const article = screen.getByText('Зробити макет').closest('article');
  expect(article).toHaveAttribute('data-overdue', 'true');
  expect(article).toHaveAttribute('data-urgency', 'overdue');
});
```

## Етап 14. Перевірка якості коду та збірка

Перед здаванням перевірила інструменти:

```
npm run lint    → ESLint: 0 помилок, 0 попереджень
npm test        → Vitest: 6 файлів, 24 тести — усі пройшли
npm run build   → збірка Vite успішна, результат у каталозі dist/
```

## Висновки

У ході роботи реалізовано односторінковий застосунок-канбан із кількома дошками, колонками та картками: CRUD-операції, перетягування карток, пошук і фільтри зі збереженням у URL, історія дій undo/redo, збереження стану в `localStorage`, експорт та імпорт дошки у JSON, світла і темна теми, адаптивна верстка від 360 px. Додатково (варіант студента) реалізовано панель статистики з прогрес-баром виконаних задач та напоминання про дедлайни з кольоровою індикацією терміновості. Код розкладено за каталогами, логіка зміни стану винесена в чистий reducer, написано 24 автоматичні тести, перевірено лінтером і зібрано в продакшн-версію.
