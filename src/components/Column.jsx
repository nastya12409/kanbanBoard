import { memo, useCallback, useMemo, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { EditableTitle } from './EditableTitle';
import SortableCard from './SortableCard';
import { matchesFilters } from '../utils/filters';

const Column = memo(function Column({
  board,
  column,
  filters,
  onOpen,
  onAddCard,
  onRenameColumn,
  onDeleteColumn,
}) {
  const [draft, setDraft] = useState('');
  const { setNodeRef } = useDroppable({ id: column.id });

  
  const visibleIds = useMemo(() => {
    const active = filters.q || filters.priority || filters.tag || filters.due;
    if (!active) return column.cardIds;
    return column.cardIds.filter((id) => matchesFilters(board.cards[id], filters));
  }, [column.cardIds, board.cards, filters]);

  const hasFilters = Boolean(filters.q || filters.priority || filters.tag || filters.due);

  const submit = (e) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onAddCard(title);
    setDraft('');
  };

  const remove = useCallback(() => {
    if (window.confirm(`Видалити колонку «${column.title}» з її картками?`)) {
      onDeleteColumn();
    }
  }, [column.title, onDeleteColumn]);

  return (
    <section className="column" aria-label={`Колонка ${column.title}`}>
      <header className="column-head">
        <EditableTitle value={column.title} className="column-title" onSave={onRenameColumn} />
        {/* МОЯ ФИЧА: счётчик карточек в колонке */}
        <span className="count" title="Кількість карток">
          {visibleIds.length}
          {hasFilters && visibleIds.length !== column.cardIds.length
            ? `/${column.cardIds.length}`
            : ''}
        </span>
        <button
          type="button"
          className="icon-btn danger"
          onClick={remove}
          aria-label={`Видалити колонку ${column.title}`}
        >
          🗑
        </button>
      </header>

      <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="cards">
          {visibleIds.map((id) => (
            <SortableCard
              key={id}
              card={board.cards[id]}
              onOpen={onOpen}
              disabled={hasFilters} 
            />
          ))}
        </ul>
      </SortableContext>

      {visibleIds.length === 0 && <p className="empty">Порожньо</p>}

      <form className="add-card" onSubmit={submit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Нова картка…"
          aria-label={`Нова картка у ${column.title}`}
        />
        <button type="submit" className="btn" aria-label="Додати картку">
          +
        </button>
      </form>
    </section>
  );
});

export default Column;
