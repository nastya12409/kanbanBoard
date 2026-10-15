import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import Column from './Column';
import Card from './Card';
import { CardModal } from './CardModal';
import { FilterBar } from './FilterBar';
import BoardStats from './BoardStats';
import { useBoardsDispatch } from '../context/contexts';

// Какой колонке принадлежит id (колонка или карточка)
const findColumnId = (board, id) =>
  board.columns[id] ? id : board.columnOrder.find((c) => board.columns[c].cardIds.includes(id));

export default function Board({ board, filters }) {
  const dispatch = useBoardsDispatch();
  const [openCardId, setOpenCardId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    // distance не даёт клику по карточке стать перетаскиванием
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const act = useCallback(
    (action) => dispatch({ boardId: board.id, ...action }),
    [dispatch, board.id],
  );

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const from = findColumnId(board, active.id);
    const to = findColumnId(board, over.id);
    if (!from || !to) return;
    const toIds = board.columns[to].cardIds;
    const index = board.columns[over.id]
      ? toIds.length // скинули на саму колонку — в конец
      : toIds.indexOf(over.id);
    if (from === to && toIds.indexOf(active.id) === index) return;
    act({ type: 'CARD_MOVE', cardId: active.id, from, to, index });
  };

  const openCard = openCardId ? board.cards[openCardId] : null;

  // Закрытие обёрнуто в useCallback — иначе эффект Modal переподписывается каждый рендер
  const onClose = useCallback(() => setOpenCardId(null), []);

  const filtersKey = useMemo(
    () => JSON.stringify(filters) === JSON.stringify({ q: '', priority: '', tag: '', due: '' }),
    [filters],
  );

  return (
    <>
      <FilterBar board={board} />

      {/* МОЯ ФИЧА: статистика и прогресс доски */}
      <BoardStats board={board} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="board" data-empty-filters={filtersKey ? 'true' : 'false'}>
          {board.columnOrder.map((colId) => (
            <Column
              key={colId}
              board={board}
              column={board.columns[colId]}
              filters={filters}
              onOpen={setOpenCardId}
              onAddCard={(title) => act({ type: 'CARD_ADD', columnId: colId, title })}
              onRenameColumn={(title) => act({ type: 'COLUMN_RENAME', columnId: colId, title })}
              onDeleteColumn={() => act({ type: 'COLUMN_DELETE', columnId: colId })}
            />
          ))}

          <button
            type="button"
            className="column add-column"
            onClick={() => {
              const title = window.prompt('Назва нової колонки:');
              if (title?.trim()) act({ type: 'COLUMN_ADD', title: title.trim() });
            }}
          >
            + Додати колонку
          </button>

          <DragOverlay>
            {activeId && board.cards[activeId] ? <Card card={board.cards[activeId]} /> : null}
          </DragOverlay>
        </div>
      </DndContext>

      {openCard && (
        <CardModal
          card={openCard}
          onClose={onClose}
          onSave={(patch) => {
            act({ type: 'CARD_UPDATE', cardId: openCard.id, patch });
            onClose();
          }}
          onDelete={() => {
            act({ type: 'CARD_DELETE', cardId: openCard.id });
            onClose();
          }}
        />
      )}
    </>
  );
}
