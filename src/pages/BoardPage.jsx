import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useBoardsState, useBoardsDispatch, useHistory } from '../context/contexts';
import Board from '../components/Board';

export default function BoardPage() {
  const { id } = useParams();
  const { boards } = useBoardsState();
  const dispatch = useBoardsDispatch();
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
          <button
            type="button"
            className="btn ghost"
            onClick={undo}
            disabled={!canUndo}
            title="Ctrl+Z"
          >
            ↶ Скасувати
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={redo}
            disabled={!canRedo}
            title="Ctrl+Shift+Z"
          >
            ↷ Повторити
          </button>
        </div>
      </div>

      <Board board={board} filters={filters} onRename={(title) =>
        dispatch({ type: 'BOARD_RENAME', boardId: board.id, title })
      } />
    </div>
  );
}
