import { useState } from 'react';
import { Modal } from './Modal';
import { PRIORITIES } from '../utils/factory';


export function CardModal({ card, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    title: card.title,
    description: card.description,
    priority: card.priority,
    deadline: card.deadline ?? '',
    tags: card.tags.join(', '),
    assignee: card.assignee,
  });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Заголовок обовʼязковий');
      return;
    }
    onSave({
      title,
      description: form.description.trim(),
      priority: form.priority,
      deadline: form.deadline || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
      assignee: form.assignee.trim(),
    });
  };

  return (
    <Modal title="Редагування картки" onClose={onClose}>
      <form className="form" onSubmit={submit} noValidate>
        <label htmlFor="c-title">Заголовок *</label>
        <input
          id="c-title"
          value={form.title}
          onChange={set('title')}
          aria-invalid={!!error}
          aria-describedby={error ? 'c-title-err' : undefined}
        />
        {error && (
          <p id="c-title-err" role="alert" className="error">
            {error}
          </p>
        )}

        <label htmlFor="c-desc">Опис</label>
        <textarea id="c-desc" rows={3} value={form.description} onChange={set('description')} />

        <div className="row">
          <div>
            <label htmlFor="c-priority">Пріоритет</label>
            <select id="c-priority" value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="c-deadline">Дедлайн</label>
            <input id="c-deadline" type="date" value={form.deadline} onChange={set('deadline')} />
          </div>
        </div>

        <label htmlFor="c-tags">Теги (через кому)</label>
        <input
          id="c-tags"
          value={form.tags}
          onChange={set('tags')}
          placeholder="bug, design, urgent"
        />

        <label htmlFor="c-assignee">Виконавець</label>
        <input id="c-assignee" value={form.assignee} onChange={set('assignee')} />

        <div className="modal-actions">
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (window.confirm('Видалити картку?')) onDelete();
            }}
          >
            
          </button>
          <div className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>
            Скасувати
          </button>
          <button type="submit" className="btn primary">
            Зберегти
          </button>
        </div>
      </form>
    </Modal>
  );
}
