import { useState } from 'react';

// Заголовок с редактированием по двойному клику + кнопка с клавиатуры.
// Enter сохраняет, Esc отменяет, blur сохраняет.
export function EditableTitle({ value, as: Tag = 'h3', className, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const finish = (save) => {
    setEditing(false);
    const title = draft.trim();
    if (save && title && title !== value) onSave(title);
    else setDraft(value);
  };

  if (!editing) {
    return (
      <div className="title-wrap">
        <Tag
          className={className}
          onDoubleClick={() => setEditing(true)}
          title="Подвійний клік, щоб змінити"
        >
          {value}
        </Tag>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Змінити «${value}»`}
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
        >
          ✎
        </button>
      </div>
    );
  }

  return (
    <input
      className={`title-input ${className ?? ''}`}
      autoFocus
      value={draft}
      aria-label="Нова назва"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
      }}
    />
  );
}
