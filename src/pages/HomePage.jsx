import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBoardsState, useBoardsDispatch } from '../context/contexts';
import { exportBoard, parseBoard } from '../utils/exportImport';

export default function HomePage() {
  const { boards, boardOrder } = useBoardsState();
  const dispatch = useBoardsDispatch();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const create = (e) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    dispatch({ type: 'BOARD_ADD', title });
    setDraft('');
  };

  const rename = (id, current) => {
    const title = window.prompt('Нова назва дошки:', current);
    if (title?.trim()) dispatch({ type: 'BOARD_RENAME', boardId: id, title: title.trim() });
  };

  const remove = (id, title) => {
    if (window.confirm(`Видалити дошку «${title}» разом із картками?`)) {
      dispatch({ type: 'BOARD_DELETE', boardId: id });
    }
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const board = parseBoard(await file.text());
      dispatch({ type: 'BOARD_IMPORT', board });
      setError('');
    } catch (err) {
      setError(err.message);
    }
    e.target.value = ''; 
  };

  return (
    <div className="page">
      <h1>Мої дошки</h1>

      <form className="create-form" onSubmit={create}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Назва нової дошки…"
          aria-label="Назва нової дошки"
        />
        <button type="submit" className="btn primary">
          Створити
        </button>
      </form>

      <label className="btn ghost file-btn">
        Імпортувати JSON
        <input type="file" accept="application/json" onChange={importFile} hidden />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {boardOrder.length === 0 ? (
        <p className="empty">Дошок ще немає — створіть першу.</p>
      ) : (
        <ul className="board-list">
          {boardOrder.map((id) => {
            const board = boards[id];
            if (!board) return null;
            const cards = Object.keys(board.cards).length;
            return (
              <li key={id} className="board-item">
                <Link to={`/board/${id}`} className="board-link">
                  <span className="board-name">{board.title}</span>
                  <span className="board-meta">
                    {board.columnOrder.length} колонок · {cards} карток
                  </span>
                </Link>
                <div className="board-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => rename(id, board.title)}
                    aria-label={`Перейменувати ${board.title}`}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => exportBoard(board)}
                    aria-label={`Експортувати ${board.title} у JSON`}
                  >
                    ⬇
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => remove(id, board.title)}
                    aria-label={`Видалити ${board.title}`}
                  >
                    🗑
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
