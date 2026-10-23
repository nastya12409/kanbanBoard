import { useMemo } from 'react';
import { isOverdue, urgencyOf } from '../utils/filters';

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
        <div className="stats-progress-head">
          <strong>Прогрес:</strong>{' '}
          <span aria-live="polite">
            {stats.done}/{stats.total} виконано ({stats.percent}%)
          </span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={stats.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Відсоток виконаних задач"
        >
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
        <p className="stats-alert" role="status">
          🔥 Прострочено: {stats.overdue}
        </p>
      )}
      {stats.soon > 0 && (
        <p className="stats-warn" role="status">
          ⏰ Дедлайн найближчим часом: {stats.soon}
        </p>
      )}
    </section>
  );
}
